import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, User, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { managementApi } from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ complaints: [], users: [], departments: [] });
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults({ complaints: [], users: [], departments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ complaints: [], users: [], departments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await managementApi.search(query.trim());
        if (res.data?.success) {
          setResults(res.data.results || { complaints: [], users: [], departments: [] });
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results.complaints?.length || 0) +
    (results.users?.length || 0) +
    (results.departments?.length || 0);

  const handleSelectComplaint = (id) => {
    navigate(`/management/complaints/${id}`);
    onClose();
  };

  const handleSelectUser = (user) => {
    navigate(`/management/users?search=${encodeURIComponent(user.email)}`);
    onClose();
  };

  const handleSelectDepartment = (dept) => {
    navigate(`/management/departments`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} color="var(--color-slate-400)" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search complaints (e.g. CH-2026, title, location), users, or departments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 size={18} className="spinner" color="var(--color-blue-600)" />}
          <button className="search-modal-close" onClick={onClose} title="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="search-modal-body">
          {query.length >= 2 && !loading && totalResults === 0 && (
            <div className="empty-state-search">
              <Search size={36} color="var(--color-slate-300)" />
              <p>No results found matching "{query}"</p>
            </div>
          )}

          {results.complaints?.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <FileText size={14} /> Complaints ({results.complaints.length})
              </div>
              {results.complaints.map((c) => (
                <div
                  key={c.id}
                  className="search-item"
                  onClick={() => handleSelectComplaint(c.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="search-item-id">{c.complaint_number}</span>
                      <span className="search-item-title">{c.title}</span>
                    </div>
                    <div className="search-item-sub">
                      {c.department} &bull; {c.location} &bull; <span style={{ textTransform: 'uppercase' }}>{c.status}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--color-slate-400)" />
                </div>
              ))}
            </div>
          )}

          {results.users?.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <User size={14} /> Users & Staff ({results.users.length})
              </div>
              {results.users.map((u) => (
                <div
                  key={u.id}
                  className="search-item"
                  onClick={() => handleSelectUser(u)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {u.name}
                    </div>
                    <div className="search-item-sub">
                      {u.email} &bull; Role: <strong style={{ textTransform: 'capitalize' }}>{u.role}</strong> {u.department && `(${u.department})`}
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--color-slate-400)" />
                </div>
              ))}
            </div>
          )}

          {results.departments?.length > 0 && (
            <div className="search-group">
              <div className="search-group-title">
                <Building2 size={14} /> Departments ({results.departments.length})
              </div>
              {results.departments.map((d) => (
                <div
                  key={d.id}
                  className="search-item"
                  onClick={() => handleSelectDepartment(d)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {d.name}
                    </div>
                    <div className="search-item-sub">{d.description || 'Maintenance department'}</div>
                  </div>
                  <ChevronRight size={16} color="var(--color-slate-400)" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="search-modal-footer">
          <span>Press ESC to close</span>
          <span>Tip: Search by complaint ID (e.g. CH-2026) or user email</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
