import React, { useState, useEffect, useCallback } from 'react';
import { 
  managementApi, 
  departmentsApi 
} from '../../services/api';
import { 
  BarChart3, 
  Download, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Building2, 
  Users,
  ArrowUpDown
} from 'lucide-react';

const ManagementReports = () => {
  const [reportType, setReportType] = useState('summary'); // summary, departments, staff, sla, resolution
  const [summaryData, setSummaryData] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [slaData, setSlaData] = useState(null);
  const [resolutionData, setResolutionData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department_id: '',
    priority: '',
    status: '',
    staff_id: ''
  });

  // Sorting for Department Ranking Table
  const [deptSortBy, setDeptSortBy] = useState('sla_desc'); // sla_desc, sla_asc, complaints_desc, overdue_desc

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, deptRes, staffRes, slaRes, resPerfRes, deptListRes] = await Promise.all([
        managementApi.getReports(filters),
        managementApi.getDepartmentPerformance(),
        managementApi.getStaffPerformance(),
        managementApi.getSlaAnalytics(),
        managementApi.getResolutionPerformance(),
        departmentsApi.list()
      ]);

      if (summaryRes.data?.success) setSummaryData(summaryRes.data.summary);
      if (deptRes.data?.success) setDeptData(deptRes.data.departments || []);
      if (staffRes.data?.success) setStaffData(staffRes.data.staff || []);
      if (slaRes.data?.success) setSlaData(slaRes.data.sla_performance);
      if (resPerfRes.data?.success) setResolutionData(resPerfRes.data);
      if (deptListRes.data?.success) setDepartments(deptListRes.data.departments || []);
    } catch (err) {
      setError(err.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownloadCsv = (type) => {
    let url = '';
    switch (type) {
      case 'complaints':
        url = managementApi.getComplaintsCsvUrl();
        break;
      case 'departments':
        url = managementApi.getDepartmentsCsvUrl();
        break;
      case 'staff':
        url = managementApi.getStaffCsvUrl();
        break;
      case 'sla':
        url = managementApi.getSlaCsvUrl();
        break;
      default:
        url = managementApi.getComplaintsCsvUrl();
    }
    window.open(url, '_blank');
  };

  const getSortedDepartments = () => {
    const list = [...deptData];
    switch (deptSortBy) {
      case 'sla_desc':
        return list.sort((a, b) => (b.sla_compliance_pct || 0) - (a.sla_compliance_pct || 0));
      case 'sla_asc':
        return list.sort((a, b) => (a.sla_compliance_pct || 0) - (b.sla_compliance_pct || 0));
      case 'complaints_desc':
        return list.sort((a, b) => (b.total || 0) - (a.total || 0));
      case 'overdue_desc':
        return list.sort((a, b) => (b.overdue || 0) - (a.overdue || 0));
      default:
        return list;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Executive Reports & CSV Analytics</h1>
          <p className="page-subtitle">
            Generate audit-ready reports, department performance scorecards, technician SLA metrics, and raw data exports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={fetchReports} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={() => handleDownloadCsv('complaints')} className="btn btn-primary" title="Export Complaints CSV">
            <Download size={14} />
            <span>Export Complaints CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* CSV Export Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-slate-700)', fontWeight: 600, fontSize: '0.85rem' }}>
            <FileSpreadsheet size={18} color="#16a34a" />
            <span>Instant CSV Data Exports:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => handleDownloadCsv('complaints')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              Complaints CSV
            </button>
            <button onClick={() => handleDownloadCsv('departments')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              Departments CSV
            </button>
            <button onClick={() => handleDownloadCsv('staff')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              Staff Performance CSV
            </button>
            <button onClick={() => handleDownloadCsv('sla')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
              SLA Analytics CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date From:</label>
            <input
              type="date"
              className="form-control"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Date To:</label>
            <input
              type="date"
              className="form-control"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Department:</label>
            <select
              className="form-control"
              value={filters.department_id}
              onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Priority:</label>
            <select
              className="form-control"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Status:</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => setFilters({ date_from: '', date_to: '', department_id: '', priority: '', status: '', staff_id: '' })}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card kpi-card" style={{ padding: '1.25rem' }}>
          <span className="kpi-label">Total Grievances</span>
          <span className="kpi-value">{summaryData?.total_complaints ?? 0}</span>
          <span className="kpi-sub">Across all campus departments</span>
        </div>

        <div className="card kpi-card" style={{ padding: '1.25rem' }}>
          <span className="kpi-label">SLA Compliance Rate</span>
          <span className="kpi-value" style={{ color: (summaryData?.sla_compliance_pct ?? 100) >= 80 ? '#16a34a' : '#dc2626' }}>
            {summaryData?.sla_compliance_pct ?? 100}%
          </span>
          <span className="kpi-sub">Resolved within deadline</span>
        </div>

        <div className="card kpi-card" style={{ padding: '1.25rem' }}>
          <span className="kpi-label">Average Resolution Time</span>
          <span className="kpi-value" style={{ color: 'var(--color-brand-600)' }}>
            {summaryData?.avg_resolution_time_minutes ? `${(summaryData.avg_resolution_time_minutes / 60).toFixed(1)}h` : '0h'}
          </span>
          <span className="kpi-sub">{summaryData?.avg_resolution_time_minutes ?? 0} minutes average</span>
        </div>

        <div className="card kpi-card" style={{ padding: '1.25rem' }}>
          <span className="kpi-label">Currently Overdue</span>
          <span className="kpi-value" style={{ color: (summaryData?.overdue ?? 0) > 0 ? '#dc2626' : '#16a34a' }}>
            {summaryData?.overdue ?? 0}
          </span>
          <span className="kpi-sub">Breached SLA threshold</span>
        </div>
      </div>

      {/* Department Ranking & Performance Table */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={18} color="var(--color-brand-600)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
              Department Performance Scorecard
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={14} color="var(--color-slate-500)" />
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              value={deptSortBy}
              onChange={(e) => setDeptSortBy(e.target.value)}
            >
              <option value="sla_desc">Best SLA Compliance</option>
              <option value="sla_asc">Lowest SLA Compliance</option>
              <option value="complaints_desc">Most Grievances</option>
              <option value="overdue_desc">Most Overdue</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total</th>
                <th>Resolved</th>
                <th>Closed</th>
                <th>Overdue</th>
                <th>SLA Compliance</th>
                <th>Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody>
              {getSortedDepartments().map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{d.name}</td>
                  <td>{d.total}</td>
                  <td>{d.resolved}</td>
                  <td>{d.closed}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: d.overdue > 0 ? '#dc2626' : '#16a34a' }}>
                      {d.overdue}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar-bg" style={{ width: '80px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
                        <div
                          style={{
                            width: `${Math.min(100, d.sla_compliance_pct || 100)}%`,
                            height: '100%',
                            backgroundColor: (d.sla_compliance_pct || 100) >= 80 ? '#16a34a' : '#dc2626',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {d.sla_compliance_pct || 100}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                    {d.avg_resolution_time_minutes ? `${(d.avg_resolution_time_minutes / 60).toFixed(1)} hrs (${d.avg_resolution_time_minutes}m)` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Performance Breakdown Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Users size={18} color="var(--color-brand-600)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-slate-900)' }}>
            Maintenance Staff SLA Compliance & Workload
          </h3>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Department</th>
                <th>Assigned</th>
                <th>In Progress</th>
                <th>Resolved</th>
                <th>Closed</th>
                <th>Overdue</th>
                <th>SLA Compliance</th>
                <th>Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{s.email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{s.department}</td>
                  <td>{s.assigned || s.active_complaints || 0}</td>
                  <td>{s.in_progress || 0}</td>
                  <td>{s.resolved || 0}</td>
                  <td>{s.closed || 0}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: s.overdue > 0 ? '#dc2626' : '#16a34a' }}>
                      {s.overdue || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: (s.sla_compliance_pct || 100) >= 80 ? '#16a34a' : '#dc2626' }}>
                      {s.sla_compliance_pct || 100}%
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-slate-600)' }}>
                    {s.avg_resolution_time_minutes ? `${(s.avg_resolution_time_minutes / 60).toFixed(1)} hrs` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagementReports;
