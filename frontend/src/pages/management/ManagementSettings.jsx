import React, { useState, useEffect, useCallback } from 'react';
import { managementApi } from '../../services/api';
import { 
  Sliders, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  UploadCloud, 
  Database, 
  Save, 
  RefreshCw, 
  CheckCircle2,
  PlayCircle
} from 'lucide-react';

const ManagementSettings = () => {
  const [settings, setSettings] = useState({
    high_sla_hours: 4,
    medium_sla_hours: 24,
    low_sla_hours: 72,
    approaching_threshold_pct: 25,
    critical_multiplier: 2.0,
    max_upload_size_mb: 5
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managementApi.getSettings();
      if (res.data?.success && res.data?.settings) {
        const s = res.data.settings;
        setSettings({
          high_sla_hours: parseFloat(s.high_sla_hours?.value || 4),
          medium_sla_hours: parseFloat(s.medium_sla_hours?.value || 24),
          low_sla_hours: parseFloat(s.low_sla_hours?.value || 72),
          approaching_threshold_pct: parseFloat(s.approaching_threshold_pct?.value || 25),
          critical_multiplier: parseFloat(s.critical_multiplier?.value || 2.0),
          max_upload_size_mb: parseFloat(s.max_upload_size_mb?.value || 5),
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    // Validate
    if (settings.high_sla_hours <= 0 || settings.medium_sla_hours <= 0 || settings.low_sla_hours <= 0) {
      setError('SLA durations must be positive numbers.');
      return;
    }
    if (settings.approaching_threshold_pct <= 0 || settings.approaching_threshold_pct >= 100) {
      setError('Approaching threshold must be between 1% and 99%.');
      return;
    }
    if (settings.critical_multiplier < 1.0) {
      setError('Critical escalation multiplier must be at least 1.0.');
      return;
    }

    try {
      setSaving(true);
      const res = await managementApi.updateSettings({ settings });
      if (res.data?.success) {
        setFeedback(res.data.message || 'System settings saved successfully and logged to Audit Trail.');
        fetchSettings();
      }
    } catch (err) {
      setError(err.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSlaEvaluation = async () => {
    try {
      setEvaluating(true);
      const res = await managementApi.triggerSlaEvaluation();
      if (res.data?.success) {
        setFeedback(`SLA Evaluation Cycle Executed. Checked ${res.data.result?.active_evaluated} active complaints.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to trigger SLA evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleBackupDatabase = async () => {
    if (!window.confirm('Create a system database snapshot backup now?')) return;
    try {
      setBackingUp(true);
      const res = await managementApi.createBackup();
      if (res.data?.success) {
        setFeedback(`Database snapshot '${res.data.backup_filename}' created successfully in backend/backups/!`);
      }
    } catch (err) {
      setError(err.message || 'Backup failed.');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">SLA & System Configuration</h1>
          <p className="page-subtitle">
            Configure dynamic SLA deadlines, multi-tier escalation parameters, and administrative system maintenance.
          </p>
        </div>
        <button onClick={fetchSettings} className="btn btn-secondary" title="Reload Settings">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
          <button className="alert-close-btn" onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button className="alert-close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Priority SLA Durations Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Clock size={20} color="var(--color-brand-600)" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                  Service Level Agreement (SLA) Targets
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  Resolution time allowed before ticket is marked as breached.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">
                  High Priority SLA (Hours):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="form-control"
                  value={settings.high_sla_hours}
                  onChange={(e) => setSettings({ ...settings, high_sla_hours: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>Default: 4 hours</span>
              </div>

              <div>
                <label className="form-label">
                  Medium Priority SLA (Hours):
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  className="form-control"
                  value={settings.medium_sla_hours}
                  onChange={(e) => setSettings({ ...settings, medium_sla_hours: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>Default: 24 hours</span>
              </div>

              <div>
                <label className="form-label">
                  Low Priority SLA (Hours):
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-control"
                  value={settings.low_sla_hours}
                  onChange={(e) => setSettings({ ...settings, low_sla_hours: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>Default: 72 hours</span>
              </div>
            </div>
          </div>

          {/* Escalation & Upload Configuration Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <ShieldAlert size={20} color="#d97706" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                  Escalation Thresholds & File Limits
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  Automated warnings and system storage constraints.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">
                  Approaching SLA Threshold (%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="90"
                  className="form-control"
                  value={settings.approaching_threshold_pct}
                  onChange={(e) => setSettings({ ...settings, approaching_threshold_pct: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
                  Triggers Level 1 Warning when remaining time &le; X% of total duration (Default: 25%)
                </span>
              </div>

              <div>
                <label className="form-label">
                  Critical Escalation Multiplier:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="10"
                  className="form-control"
                  value={settings.critical_multiplier}
                  onChange={(e) => setSettings({ ...settings, critical_multiplier: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
                  Triggers Level 3 Critical Escalation when overdue exceeds X &times; SLA duration (Default: 2.0&times;)
                </span>
              </div>

              <div>
                <label className="form-label">
                  Maximum Upload Size (MB):
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="25"
                  className="form-control"
                  value={settings.max_upload_size_mb}
                  onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseFloat(e.target.value) || 0 })}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-slate-500)' }}>
                  Allowed image size for issue and resolution photos (Default: 5 MB)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }} disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Maintenance Operations Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)', marginBottom: '0.5rem' }}>
          Maintenance & Operations Toolkit
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '1.25rem' }}>
          Execute administrative tasks, trigger live SLA evaluations, and generate database backups.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualSlaEvaluation}
            disabled={evaluating}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
            <PlayCircle size={16} color="var(--color-brand-600)" />
            <span>{evaluating ? 'Evaluating...' : 'Run SLA Check Cycle Now'}</span>
          </button>

          <button
            onClick={handleBackupDatabase}
            disabled={backingUp}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
            <Database size={16} color="#16a34a" />
            <span>{backingUp ? 'Creating Backup...' : 'Create System Data Backup'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagementSettings;
