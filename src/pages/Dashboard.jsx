import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Smartphone, BatteryCharging, RadioTower, WifiOff, AlertTriangle } from 'lucide-react'
import { fetchBatteries, getSelectedIot, setSelectedIot, clearSelectedIot } from '../services/services.js'
import CustomSelect from '../components/CustomSelect.jsx'

export default function Dashboard() {
  const [allBatteries, setAllBatteries] = useState([])
  const [filteredBatteries, setFilteredBatteries] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [countLabel, setCountLabel] = useState('Loading devices...')
  const [globalIot, setGlobalIot] = useState('')

  const pageSize = 10

  useEffect(() => {
    const load = async () => {
      setCountLabel('Loading devices...')
      try {
        const batteries = await fetchBatteries()
        setAllBatteries(batteries)
        setFilteredBatteries(batteries)
        const selected = getSelectedIot()
        if (selected) setGlobalIot(selected)
      } catch {
        setCountLabel('Unable to fetch devices')
      }
    }

    load()
  }, [])

  useEffect(() => {
    const handler = () => {
      const selected = getSelectedIot()
      setGlobalIot(selected || '')
    }
    window.addEventListener('selectedIotChanged', handler)
    return () => window.removeEventListener('selectedIotChanged', handler)
  }, [])

  useEffect(() => {
    let next = allBatteries.filter((bat) => {
      const matchSearch = !searchTerm ||
        bat.name.toLowerCase().includes(searchTerm) ||
        bat.id.toLowerCase().includes(searchTerm) ||
        bat.iot.toLowerCase().includes(searchTerm)

      const tag = bat.tag.toLowerCase()
      const matchCategory = category === 'all' ||
        tag === category.toLowerCase() ||
        (category === 'other' && !['ess', '2w', '3w'].includes(tag))

      const matchStatus = status === 'all' || bat.status === status

      return matchSearch && matchCategory && matchStatus
    })

    if (sortColumn) {
      next = [...next].sort((a, b) => {
        let aVal = a[sortColumn]
        let bVal = b[sortColumn]

        if (typeof aVal === 'string' && !isNaN(aVal)) {
          aVal = parseFloat(aVal)
          bVal = parseFloat(bVal)
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (sortDirection === 'asc') return aVal > bVal ? 1 : -1
        return aVal < bVal ? 1 : -1
      })
    }

    setFilteredBatteries(next)
    setCurrentPage(1)

    const showing = Math.min(pageSize, next.length)
    setCountLabel(`Showing ${showing} of ${next.length} devices`)
  }, [allBatteries, searchTerm, category, status, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredBatteries.length / pageSize))
  const start = (currentPage - 1) * pageSize
  const pageData = filteredBatteries.slice(start, start + pageSize)

  const totalCount = allBatteries.length
  const onlineCount = allBatteries.filter((bat) => bat.status === 'Online').length
  const offlineCount = totalCount - onlineCount

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

  const applyGlobalIot = async () => {
    const iot = globalIot.trim()
    if (!iot) return
    const selected = await setSelectedIot(iot)
    if (!selected) {
      alert('IOT ID not found. Please enter a valid IOT ID from fleet records.')
      return
    }
    setSearchTerm(selected.iot.toLowerCase())
    setCountLabel(`Global IOT ID selected: ${selected.iot} (${selected.id})`)
  }

  const clearGlobal = () => {
    clearSelectedIot()
    setGlobalIot('')
  }

  const toggleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Fleet Overview</h1>
          <p className="page-subtitle">Monitor and manage all registered devices</p>
        </div>
      </header>

      <div className="kpi-grid fleet-kpi-grid">
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Total Devices</div>
              <div className="kpi-value" id="kpi-total-batteries">{totalCount}</div>
            </div>
            <BatteryCharging style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Online Devices</div>
              <div className="kpi-value good" id="kpi-online-batteries">{onlineCount}</div>
            </div>
            <RadioTower style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Offline Devices</div>
              <div className="kpi-value critical" id="kpi-offline-batteries">{offlineCount}</div>
            </div>
            <WifiOff style={{ color: 'var(--danger-color)', width: 28, height: 28 }} />
          </div>
        </div>
      </div>

      <div className="controls-bar card">
        <div className="search-wrapper">
          <Search />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, device ID, or IOT ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
        <CustomSelect 
          value={category} 
          onChange={setCategory} 
          options={[
            { label: 'All Categories', value: 'all' },
            { label: 'ESS', value: 'ess' },
            { label: '2-Wheeler', value: '2w' },
            { label: '3-Wheeler', value: '3w' },
            { label: 'Other', value: 'other' }
          ]} 
        />
        <CustomSelect 
          value={status} 
          onChange={setStatus} 
          options={[
            { label: 'All Status', value: 'all' },
            { label: 'Online', value: 'Online' },
            { label: 'Offline', value: 'Offline' }
          ]} 
        />
        <div className="search-wrapper" style={{ maxWidth: 320 }}>
          <Smartphone />
          <input
            type="text"
            className="input-field"
            placeholder="Set global IOT ID..."
            value={globalIot}
            onChange={(e) => setGlobalIot(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyGlobalIot()
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={applyGlobalIot}>Apply IOT ID</button>
        <button className="btn btn-outline" id="global-iot-clear" onClick={clearGlobal}>Clear IOT ID</button>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.875rem', padding: '0 var(--space-2)' }}>
        {countLabel}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <button className="sort-header" onClick={() => toggleSort('iot')}>
                  Device ID <ArrowUpDown style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: -2 }} />
                </button>
              </th>
              <th>
                <button className="sort-header" onClick={() => toggleSort('status')}>
                  Status <ArrowUpDown style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: -2 }} />
                </button>
              </th>
              <th>Tag</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No devices found
                </td>
              </tr>
            ) : (
              pageData.map((bat) => {
                const statusClass = bat.status === 'Online' ? 'success' : 'danger'
                return (
                  <tr key={bat.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{bat.iot}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>
                        <div className="badge-dot"></div>
                        {bat.status}
                      </span>
                    </td>
                    <td><span className="badge badge-blue">{bat.tag}</span></td>
                    <td>
                      <button className="btn-icon" title="View Details" aria-label="View device details">
                        <span style={{ display: 'inline-flex', transform: 'translateY(1px)' }}>⋮</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
      </div>
    </>
  )
}
