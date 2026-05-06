import React, { useEffect, useState, useMemo } from 'react'
import { Search, Filter, MessageSquareWarning, CircleAlert, OctagonAlert, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchAlerts } from '../services/services.js'
import CustomSelect from '../components/CustomSelect.jsx'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAlerts()
        setAlerts(data)
      } catch {
        setAlerts([])
      }
    }

    load()
    const onSelectedIotChanged = () => load()
    window.addEventListener('selectedIotChanged', onSelectedIotChanged)
    return () => window.removeEventListener('selectedIotChanged', onSelectedIotChanged)
  }, [])

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase()
    const sev = a.sev.toLowerCase()
    const st = a.status.toLowerCase()
    const matchQuery = !q || a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    const matchSev = severity === 'all' || sev === severity
    const matchStatus = status === 'all' || st === status
    return matchQuery && matchSev && matchStatus
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [search, severity, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const start = (currentPage - 1) * pageSize
  const pageData = filtered.slice(start, start + pageSize)

  const paginationNumbers = useMemo(() => {
    const maxPages = Math.min(5, totalPages)
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, startPage + maxPages - 1)
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1)
    }
    const pages = []
    for (let i = startPage; i <= endPage; i++) pages.push(i)
    return pages
  }, [currentPage, totalPages])

  const totalActive = filtered.filter((a) => a.status === 'Active').length
  const high = filtered.filter((a) => a.sev === 'High').length
  const medium = filtered.filter((a) => a.sev === 'Medium').length
  const resolved = filtered.filter((a) => a.status === 'Resolved').length

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Alerts & Notifications</h1>
          <p className="page-subtitle">Manage system alerts and critical battery events</p>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="card kpi-card edge-accent edge-accent-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Total Active Alerts</div>
              <div className="kpi-value" id="alerts-kpi-total">{totalActive}</div>
            </div>
            <MessageSquareWarning style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">High Severity</div>
              <div className="kpi-value critical" id="alerts-kpi-high">{high}</div>
            </div>
            <CircleAlert style={{ color: 'var(--danger-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-warning">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Medium Severity</div>
              <div className="kpi-value warning" id="alerts-kpi-medium">{medium}</div>
            </div>
            <OctagonAlert style={{ color: 'var(--warning-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Resolved (Today)</div>
              <div className="kpi-value good" id="alerts-kpi-resolved">{resolved}</div>
            </div>
            <ThumbsUp style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
        </div>
      </div>

      <div className="controls-bar card">
        <div className="search-wrapper" style={{ flexGrow: 2 }}>
          <Search />
          <input type="text" className="input-field" placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <CustomSelect 
          value={severity} 
          onChange={setSeverity} 
          options={[
            { label: 'All Severities', value: 'all' },
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' }
          ]} 
        />
        <CustomSelect 
          value={status} 
          onChange={setStatus} 
          options={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Resolved', value: 'resolved' }
          ]} 
        />
        <button className="btn btn-primary" id="alerts-filter-btn"><Filter size={18} /> Filter</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Battery</th>
              <th>Alert Type</th>
              <th>Severity</th>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No alerts found</td></tr>
            ) : (
              pageData.map((alert) => {
                let sevClass = ''
                if (alert.sev === 'High') sevClass = 'danger'
                if (alert.sev === 'Medium') sevClass = 'warning'
                if (alert.sev === 'Low') sevClass = 'success'

                return (
                  <tr key={`${alert.id}-${alert.time}`}>
                    <td style={{ fontWeight: 500 }}>{alert.id}</td>
                    <td>{alert.type}</td>
                    <td>
                      <span className={`badge ${sevClass}`}>
                        <div className="badge-dot"></div>
                        {alert.sev}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{alert.time}</td>
                    <td>{alert.status}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={alert.desc}>{alert.desc}</td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Acknowledge</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="pagination-controls">
              <button className="page-btn" title="Previous page" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft />
              </button>
              <span style={{ display: 'flex', gap: '0.25rem' }}>
                {paginationNumbers.map((page) => (
                  <button key={page} className={`page-btn ${page === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
              </span>
              <button className="page-btn" title="Next page" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card alerts-legend-card">
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Legend</h4>
        <div className="alerts-legend-items">
          <span className="badge danger"><div className="badge-dot"></div> High</span>
          <span className="badge warning"><div className="badge-dot"></div> Medium</span>
          <span className="badge success"><div className="badge-dot"></div> Low</span>
        </div>
      </div>
    </>
  )
}