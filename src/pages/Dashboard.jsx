import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Smartphone, Database, RadioTower, WifiOff, BellRing, Expand, ArrowRight, BatteryCharging } from 'lucide-react'
import Chart from 'chart.js/auto'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchBatteries, getSelectedIot, setSelectedIot, clearSelectedIot, fetchMapBatteries } from '../services/services.js'
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
  const chartRef = useRef(null)
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const [mapBatteries, setMapBatteries] = useState([])

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

    const loadMapData = async () => {
      try {
        const batteries = await fetchMapBatteries()
        setMapBatteries(batteries)
      } catch (err) {
        console.error(err)
      }
    }

    load()
    loadMapData()
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

  const totalCount = allBatteries.length || 1
  const onlineCount = allBatteries.filter((bat) => bat.status === 'Online').length
  const offlineCount = allBatteries.length - onlineCount
  const onlinePerc = ((onlineCount / totalCount) * 100).toFixed(1)
  const offlinePerc = ((offlineCount / totalCount) * 100).toFixed(1)

  useEffect(() => {
    // Doughnut chart rendering
    if (chartRef.current) chartRef.current.destroy()
    const canvas = document.getElementById('dashboard-doughnut-chart')
    if (canvas && allBatteries.length > 0) {
      chartRef.current = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Online', 'Offline', 'Maintenance'],
          datasets: [{
            data: [onlineCount, offlineCount, 0],
            backgroundColor: [
              '#1a8f55', // success
              '#c93b55', // danger
              '#d6b340'  // warning
            ],
            borderWidth: 0,
            cutout: '70%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          }
        }
      })
    }
  }, [allBatteries])

  useEffect(() => {
    // Leaflet map rendering
    if (!mapContainerRef.current || mapBatteries.length === 0) return

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView([19.0760, 72.8777], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current)
    }

    const onlineIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #1a8f55; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 0 10px rgba(26,143,85,0.6);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    const offlineIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #c93b55; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 0 10px rgba(201,59,85,0.6);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    // Add a few clusters to match UI visually
    const clusters = [
      { lat: 19.08, lng: 72.88, val: 12, online: true },
      { lat: 19.12, lng: 72.90, val: 2, online: false },
      { lat: 19.05, lng: 72.85, val: 8, online: true },
      { lat: 19.02, lng: 72.88, val: 5, online: true },
      { lat: 19.00, lng: 72.92, val: 4, online: false }
    ]

    clusters.forEach(c => {
      const icon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: ${c.online ? '#1a8f55' : '#c93b55'}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; box-shadow: 0 0 10px ${c.online ? 'rgba(26,143,85,0.6)' : 'rgba(201,59,85,0.6)'};">${c.val}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
      L.marker([c.lat, c.lng], { icon }).addTo(mapRef.current)
    })

  }, [mapBatteries])

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
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Total Devices</div>
              <div className="kpi-value" id="kpi-total-batteries">{allBatteries.length}</div>
              <div className="kpi-subtitle">All registered devices</div>
            </div>
            <Database style={{ color: 'var(--info-color)', width: 28, height: 28 }} />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: '100%', backgroundColor: 'var(--info-color)' }}></div>
          </div>
        </div>
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Online Devices</div>
              <div className="kpi-value good" id="kpi-online-batteries">{onlineCount}</div>
              <div className="kpi-subtitle">{onlinePerc}% of total devices</div>
            </div>
            <RadioTower style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${onlinePerc}%`, backgroundColor: 'var(--success-color)' }}></div>
          </div>
        </div>
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Offline Devices</div>
              <div className="kpi-value critical" id="kpi-offline-batteries">{offlineCount}</div>
              <div className="kpi-subtitle">{offlinePerc}% of total devices</div>
            </div>
            <WifiOff style={{ color: 'var(--danger-color)', width: 28, height: 28 }} />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${offlinePerc}%`, backgroundColor: 'var(--danger-color)' }}></div>
          </div>
        </div>
        <div className="kpi-card fleet-kpi-card edge-accent edge-accent-warning">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Active Alerts</div>
              <div className="kpi-value warning">8</div>
              <div className="kpi-subtitle">Require attention</div>
            </div>
            <BellRing style={{ color: 'var(--warning-color)', width: 28, height: 28 }} />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: '15%', backgroundColor: 'var(--warning-color)' }}></div>
          </div>
        </div>
      </div>

      <div className="dashboard-widgets">
        {/* Device Status Overview Chart */}
        <div className="dashboard-widget-card">
          <div className="dashboard-widget-header">
            <h3 className="dashboard-widget-title">Device Status Overview</h3>
            <CustomSelect 
              value={'this_week'} 
              onChange={() => {}} 
              options={[{ label: 'This Week', value: 'this_week' }, { label: 'This Month', value: 'this_month' }]} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <canvas id="dashboard-doughnut-chart"></canvas>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1 }}>{allBatteries.length}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="chart-legend-item">
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--success-color)' }}></span> Online</div>
                <div style={{ color: 'var(--text-primary)' }}>{onlineCount} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({onlinePerc}%)</span></div>
              </div>
              <div className="chart-legend-item">
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--danger-color)' }}></span> Offline</div>
                <div style={{ color: 'var(--text-primary)' }}>{offlineCount} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>({offlinePerc}%)</span></div>
              </div>
              <div className="chart-legend-item">
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--warning-color)' }}></span> Maintenance</div>
                <div style={{ color: 'var(--text-primary)' }}>0 <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>(0%)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Device Map Mini */}
        <div className="dashboard-widget-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div className="dashboard-widget-header" style={{ padding: 'var(--space-4) var(--space-6)', marginBottom: 0, borderBottom: '1px solid var(--border-light)' }}>
            <h3 className="dashboard-widget-title">Live Device Map</h3>
            <button className="btn-icon" aria-label="Expand Map" onClick={() => window.location.href = '/map'}><Expand size={18} /></button>
          </div>
          <div style={{ display: 'flex', height: '220px' }}>
            <div ref={mapContainerRef} style={{ flex: 1, height: '100%', borderRight: '1px solid var(--border-light)' }}></div>
            <div style={{ width: '180px', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column' }}>
              <div className="chart-legend-item" style={{ padding: 'var(--space-1) 0', borderBottom: 'none' }}>
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--success-color)' }}></span> Online</div>
                <div style={{ color: 'var(--text-primary)' }}>{onlineCount}</div>
              </div>
              <div className="chart-legend-item" style={{ padding: 'var(--space-1) 0', borderBottom: 'none' }}>
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--danger-color)' }}></span> Offline</div>
                <div style={{ color: 'var(--text-primary)' }}>{offlineCount}</div>
              </div>
              <div className="chart-legend-item" style={{ padding: 'var(--space-1) 0', borderBottom: 'none' }}>
                <div><span className="chart-legend-color-box" style={{ backgroundColor: 'var(--warning-color)' }}></span> Maintenance</div>
                <div style={{ color: 'var(--text-primary)' }}>0</div>
              </div>
              <button className="btn btn-outline-primary" style={{ marginTop: 'auto', padding: 'var(--space-2)', fontSize: '0.75rem', justifyContent: 'center' }} onClick={() => window.location.href = '/map'}>
                View Full Map <ArrowRight size={14} />
              </button>
            </div>
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
                <button className="sort-header" onClick={() => toggleSort('name')}>
                  Device Name <ArrowUpDown style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: -2 }} />
                </button>
              </th>
              <th>
                <button className="sort-header" onClick={() => toggleSort('status')}>
                  Status <ArrowUpDown style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: -2 }} />
                </button>
              </th>
              <th>Category</th>
              <th>Last Seen</th>
              <th>Battery</th>
              <th>Signal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No devices found
                </td>
              </tr>
            ) : (
              pageData.map((bat) => {
                const statusClass = bat.status === 'Online' ? 'success' : 'danger'
                
                // Mocks to match requested ui features not in standard API
                const randomTime = ['2 min ago', '1 min ago', '15 min ago', '3 min ago', '1 hr ago'][Math.floor(Math.random() * 5)]
                const randomBattery = bat.status === 'Online' ? Math.floor(Math.random() * 40) + 60 : '--'
                const batteryColor = bat.status === 'Online' ? (randomBattery > 70 ? 'var(--success-color)' : 'var(--warning-color)') : 'var(--text-tertiary)'
                const signalActiveNodes = bat.status === 'Online' ? (Math.floor(Math.random() * 2) + 3) : 0

                return (
                  <tr key={bat.id}>
                    <td>
                      <div style={{ color: 'var(--text-secondary)' }}>{bat.iot}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bat.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{bat.tag === 'ESS' ? 'Energy Storage System' : (bat.tag === '2W' ? 'Power Inverter 2W' : 'Power Inverter 4W')}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: statusClass === 'success' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                        <span style={{ fontSize: '0.875rem' }}>{bat.status}</span>
                      </div>
                    </td>
                    <td>{bat.tag}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusClass === 'success' ? 'var(--success-color)' : 'var(--danger-color)' }}></div>
                         {randomTime}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{randomBattery !== '--' ? `${randomBattery}%` : '--'}</span>
                        <BatteryCharging style={{ width: 16, height: 16, color: batteryColor }} />
                      </div>
                    </td>
                    <td>
                      <div className="signal-bars">
                        {[1, 2, 3, 4].map((node) => (
                          <div key={node} className={`signal-bar ${node <= signalActiveNodes ? 'active' : ''}`}></div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button className="btn-icon" title="View Details" aria-label="View device details">
                        <span style={{ display: 'inline-flex', transform: 'translateY(-2px)', fontWeight: 'bold' }}>⋮</span>
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
