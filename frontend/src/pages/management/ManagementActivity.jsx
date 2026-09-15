import React, { useState, useEffect } from 'react';
import { managementApi } from '../../services/api';
import LiveActivity from '../../components/management/LiveActivity';
import { Activity, Clock } from 'lucide-react';

const ManagementActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const res = await managementApi.getActivity(50);
        if (res.data?.success) {
          setActivities(res.data.activity || []);
        }
      } catch (err) {
        console.error('Failed to load activity logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-slate-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} color="var(--color-brand-600)" />
            Real-Time Operations Live Activity Audit Log
          </h1>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '0.9rem' }}>
            Audit history log of recent status changes, maintenance assignments, and grievance resolutions.
          </p>
        </div>
      </div>

      <LiveActivity activities={activities} />
    </div>
  );
};

export default ManagementActivity;
