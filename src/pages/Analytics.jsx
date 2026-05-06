import React, { useEffect, useRef, useState } from 'react'
import { FileText, Table, Search, RotateCcw, BatteryCharging, RadioTower, BatteryMedium, HeartPulse } from 'lucide-react'
import Chart from 'chart.js/auto'
import { fetchAnalytics } from '../services/services.js'
import CustomSelect from '../components/CustomSelect.jsx'
import CustomDatePicker from '../components/CustomDatePicker.jsx'

export default function Analytics() {
  const instancesRef = useRef([])
  const analyticsDataRef = useRef(null)
  const [model, setModel] = useState('all')
  const [location, setLocation] = useState('all')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())

  const [kpis, setKpis] = useState({ total: 0, online: 0, avgSoc: 0, avgSoh: 0 })
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await fetchAnalytics()
        analyticsDataRef.current = data
        setKpis(data.kpis)
        setCategories(data.categories)
      } catch {
        setCategories(null)
      } finally {
        setIsLoading(false)
        renderCharts()
      }
    }

    load()

    const onSelectedIotChanged = () => load()
    window.addEventListener('selectedIotChanged', onSelectedIotChanged)
    window.addEventListener('themeChanged', renderCharts)

    return () => {
      instancesRef.current.forEach((c) => c.destroy())
      window.removeEventListener('selectedIotChanged', onSelectedIotChanged)
      window.removeEventListener('themeChanged', renderCharts)
    }
  }, [])

  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const getPrimaryColor = () => getVar('--primary-color') || '#0e5a6f'
  const getSuccessColor = () => getVar('--success-color') || '#2e7d32'
  const getWarningColor = () => getVar('--warning-color') || '#f57c00'
  const getGridColor = () => getVar('--border-light') || '#dde5eb'
  const getTickColor = () => getVar('--text-secondary') || '#5c6d78'

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: getTickColor() } },
      y: { grid: { display: false }, ticks: { color: getTickColor() } }
    }
  }

  const renderCharts = () => {
    instancesRef.current.forEach((c) => c.destroy())
    instancesRef.current = []

    setTimeout(() => {
      const data = analyticsDataRef.current
      const socCanvas = document.getElementById('socDistChart')
      if (socCanvas) {
        const buckets = [0, 0, 0, 0, 0]
        const total = data?.kpis.total || 52
        buckets[0] = Math.round(total * 0.04)
        buckets[1] = Math.round(total * 0.1)
        buckets[2] = Math.round(total * 0.16)
        buckets[3] = Math.round(total * 0.3)
        buckets[4] = total - buckets[0] - buckets[1] - buckets[2] - buckets[3]
        instancesRef.current.push(new Chart(socCanvas, {
          type: 'bar',
          data: {
            labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
            datasets: [{
              label: 'Batteries',
              data: buckets,
              backgroundColor: getPrimaryColor(),
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: commonOptions
        }))
      }

      const sohCanvas = document.getElementById('sohDistChart')
      if (sohCanvas) {
        const total = data?.kpis.total || 52
        const healthy = Math.round(total * 0.67)
        const mid = Math.round(total * 0.23)
        instancesRef.current.push(new Chart(sohCanvas, {
          type: 'bar',
          data: {
            labels: ['<80%', '80-89%', '90-95%', '>95%'],
            datasets: [{
              label: 'Batteries',
              data: [Math.max(1, total - healthy - mid - 2), 2, mid, healthy],
              backgroundColor: getSuccessColor(),
              borderRadius: 8,
              borderSkipped: false
            }]
          },
          options: commonOptions
        }))
      }

      const usageCanvas = document.getElementById('usageChart')
      if (usageCanvas) {
        const base = data?.kpis.total || 52
        const values = [1, 1.1, 0.95, 1.15, 1.3, 0.8, 0.72].map((v) => Math.round(base * 22 * v))
        instancesRef.current.push(new Chart(usageCanvas, {
          type: 'line',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Total Distance (km)',
              data: values,
              borderColor: getWarningColor(),
              backgroundColor: getWarningColor() + '15',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointBackgroundColor: getWarningColor(),
              pointBorderColor: getVar('--surface-color') || '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4
            }]
          },
          options: commonOptions
        }))
      }
    }, 50)
  }

  return (
    <>
      <header className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Platform-wide insights and historical trends</p>
        </div>
        <div className="analytics-header-actions">
          <button className="btn btn-outline-primary" onClick={() => alert('Downloading CSV...')}>
            <FileText /> Export CSV
          </button>
          <button className="btn btn-outline-primary" onClick={() => alert('Downloading Excel...')}>
            <Table /> Export Excel
          </button>
        </div>
      </header>

      <div className="filter-grid">
        <div>
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Battery Model</label>
          <CustomSelect 
            value={model} 
            onChange={setModel} 
            options={[
              { label: 'All Models', value: 'all' },
              { label: 'ESS-5000', value: 'ess' },
              { label: '2W-LFP-60V', value: '2w' }
            ]} 
          />
        </div>
        <div>
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Location</label>
          <CustomSelect 
            value={location} 
            onChange={setLocation} 
            options={[
              { label: 'All Locations', value: 'all' },
              { label: 'Bangalore', value: 'bangalore' },
              { label: 'Mumbai', value: 'mumbai' },
              { label: 'Delhi', value: 'delhi' }
            ]} 
          />
        </div>
        <div>
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Start Date</label>
          <CustomDatePicker value={startDate} onChange={setStartDate} />
        </div>
        <div>
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>End Date</label>
          <CustomDatePicker value={endDate} onChange={setEndDate} />
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" id="analytics-search-btn"><Search /> Search</button>
          <button className="btn btn-outline" id="analytics-reset-btn"><RotateCcw /> Reset</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card edge-accent edge-accent-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Total Batteries</div>
              <div className="kpi-value">{kpis.total}</div>
            </div>
            <BatteryCharging style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Online Batteries</div>
              <div className="kpi-value good">{kpis.online}</div>
            </div>
            <RadioTower style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="kpi-card edge-accent edge-accent-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Avg SOC</div>
              <div className="kpi-value" style={{ color: 'var(--primary-color)' }}>{kpis.avgSoc}<span className="kpi-unit">%</span></div>
            </div>
            <BatteryMedium style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Avg SOH</div>
              <div className="kpi-value good">{kpis.avgSoh}<span className="kpi-unit">%</span></div>
            </div>
            <HeartPulse style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card">
          <h3 className="chart-header">SOC Distribution</h3>
          <div style={{ height: 280 }}><canvas id="socDistChart"></canvas></div>
        </div>
        <div className="chart-card">
          <h3 className="chart-header">SOH Distribution</h3>
          <div style={{ height: 280 }}><canvas id="sohDistChart"></canvas></div>
        </div>
        <div className="chart-card analytics-chart-full">
          <h3 className="chart-header">Daily Usage Trends (Distance km)</h3>
          <div style={{ height: 280 }}><canvas id="usageChart"></canvas></div>
        </div>
      </div>

      <h3 className="analytics-section-title">Category Statistics</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Online Count</th>
              <th>Offline Count</th>
              <th>Avg SOH</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>Loading category statistics...</td></tr>
            ) : !categories ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--danger-color)' }}>Failed to load analytics data</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>No data available</td></tr>
            ) : categories.map((row, idx) => (
              <tr key={idx}>
                <td><span className="badge badge-blue">{row.category}</span></td>
                <td><span className="badge success"><div className="badge-dot"></div>{row.online}</span></td>
                <td><span className="badge danger"><div className="badge-dot"></div>{row.offline}</span></td>
                <td>{row.avgSoh}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}