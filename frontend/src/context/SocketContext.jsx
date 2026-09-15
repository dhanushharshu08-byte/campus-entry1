import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket, { initializeSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [latency, setLatency] = useState(null);

  const joinUserRoom = useCallback((user) => {
    if (!user) return;
    initializeSocket(typeof user === 'object' ? user : { id: user });
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
      setLatency(null);
    }

    function onPong(data) {
      if (data && data.timestamp) {
        const pingTime = Date.now() - data.timestamp;
        setLatency(pingTime);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('pong_server', onPong);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('pong_server', onPong);
    };
  }, []);

  const pingServer = () => {
    if (socket.connected) {
      socket.emit('ping_server', { timestamp: Date.now() });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latency,
        pingServer,
        joinUserRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
