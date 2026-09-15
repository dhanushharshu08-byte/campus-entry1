import React, { useState, useEffect, useCallback } from 'react';
import { managementApi } from '../../services/api';
import { 
  Building2, 
  Plus, 
  Edit, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Users, 
  FileText,
  Power
} from 'lucide-react';

const ManagementDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal States
  const [createModal, setCreateModal] = useState({ open: false, name: '', description: '' });
  const [editModal, setEditModal] = useState({ open: false, dept: null, name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managementApi.getDepartments();
      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createModal.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await managementApi.createDepartment({
        name: createModal.name.trim(),
        description: createModal.description.trim()
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setCreateModal({ open: false, name: '', description: '' });
        fetchDepartments();
      }
    } catch (err) {
      alert(err.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editModal.dept || !editModal.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await managementApi.updateDepartment(editModal.dept.id, {
        name: editModal.name.trim(),
        description: editModal.description.trim(),
        is_active: editModal.is_active
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        setEditModal({ open: false, dept: null, name: '', description: '', is_active: true });
        fetchDepartments();
      }
    } catch (err) {
      alert(err.message || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (dept) => {
    const action = dept.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} the '${dept.name}' department?`)) {
      return;
    }

    try {
      const res = await managementApi.updateDepartment(dept.id, {
        is_active: !dept.is_active
      });
      if (res.data?.success) {
        setFeedback(res.data.message);
        fetchDepartments();
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} department.`);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Maintenance Departments</h1>
          <p className="page-subtitle">
            Configure campus maintenance departments, routing categories, and service activation states.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDepartments} className="btn btn-secondary" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setCreateModal({ open: true, name: '', description: '' })} className="btn btn-primary">
            <Plus size={14} />
            <span>New Department</span>
          </button>
        </div>
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
        </div>
      )}

      {loading && departments.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <RefreshCw size={24} className="spin" color="var(--color-blue-600)" />
          <p style={{ marginTop: '0.75rem', color: 'var(--color-slate-500)' }}>Loading departments...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {departments.map((dept) => (
            <div key={dept.id} className={`card ${!dept.is_active ? 'card-inactive' : ''}`} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="dept-icon-box">
                    <Building2 size={18} color="var(--color-brand-600)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
                      {dept.name}
                    </h3>
                    <span className={`status-pill ${dept.is_active ? 'status-active' : 'status-disabled'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditModal({
                    open: true,
                    dept,
                    name: dept.name,
                    description: dept.description || '',
                    is_active: dept.is_active
                  })}
                  className="btn btn-icon"
                  title="Edit Department"
                >
                  <Edit size={14} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', minHeight: '40px', marginBottom: '1rem' }}>
                {dept.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--color-slate-100)' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} />
                    <span><strong>{dept.staff_count || 0}</strong> Staff</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={13} />
                    <span><strong>{dept.total_complaints || 0}</strong> Complaints</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(dept)}
                  className={`btn ${dept.is_active ? 'btn-danger-outline' : 'btn-success-outline'}`}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                >
                  <Power size={11} /> {dept.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Department Modal */}
      {createModal.open && (
        <div className="modal-overlay" onClick={() => setCreateModal({ open: false, name: '', description: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Maintenance Department</h3>
              <button className="modal-close" onClick={() => setCreateModal({ open: false, name: '', description: '' })}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Department Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. HVAC / Air Conditioning"
                    value={createModal.name}
                    onChange={(e) => setCreateModal({ ...createModal, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Description & Scope:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Describe maintenance scope and responsibilities..."
                    value={createModal.description}
                    onChange={(e) => setCreateModal({ ...createModal, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateModal({ open: false, name: '', description: '' })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !createModal.name.trim()}>
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editModal.open && (
        <div className="modal-overlay" onClick={() => setEditModal({ open: false, dept: null, name: '', description: '', is_active: true })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Department: {editModal.dept?.name}</h3>
              <button className="modal-close" onClick={() => setEditModal({ open: false, dept: null, name: '', description: '', is_active: true })}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Department Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editModal.name}
                    onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Description & Scope:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editModal.description}
                    onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="checkbox"
                    id="dept-active-toggle"
                    checked={editModal.is_active}
                    onChange={(e) => setEditModal({ ...editModal, is_active: e.target.checked })}
                  />
                  <label htmlFor="dept-active-toggle" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                    Active (Accepting new grievance submissions)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal({ open: false, dept: null, name: '', description: '', is_active: true })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !editModal.name.trim()}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDepartments;
