import React, { useEffect, useRef } from 'react'
import { Search, BatteryMedium, HeartPulse, BatteryCharging, Zap } from 'lucide-react'
import { setSelectedImei, getSelectedBattery } from '../services/services.js'
import MMD from '../data/mmd.js'
import Chart from 'chart.js/auto'

export default function Battery() {
  const instancesRef = useRef([])

  useEffect(() => {
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    const tickColor = () => getVar('--text-secondary') || '#5c6d78'

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor() } },
        y: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor() } }
      },
      elements: {
        line: { tension: 0.4 },
        point: { radius: 3, hoverRadius: 6 }
      },
      interaction: { intersect: false, mode: 'index' }
    }

    const { labels, data: socData } = MMD.generateTimeSeriesData(24, 75, 100)
    const { data: sohData } = MMD.generateTimeSeriesData(24, 94, 100)
    const { data: volData } = MMD.generateTimeSeriesData(24, 48, 54)
    const { data: curData } = MMD.generateTimeSeriesData(24, 0, 30)
    const { data: tempData } = MMD.generateTimeSeriesData(24, 25, 45)

    setTimeout(() => {
      const primary = getVar('--primary-color') || '#0e5a6f'
      const primaryLight = getVar('--primary-light') || 'rgba(14, 90, 111, 0.16)'
      const success = getVar('--success-color') || '#2e7d32'
      const danger = getVar('--danger-color') || '#d32f2f'
      const warning = getVar('--warning-color') || '#f57c00'

      const socCanvas = document.getElementById('socChart')
      const sohCanvas = document.getElementById('sohChart')
      const voltageCanvas = document.getElementById('voltageChart')
      const currentCanvas = document.getElementById('currentChart')
      const tempCanvas = document.getElementById('tempChart')

      if (socCanvas) instancesRef.current.push(new Chart(socCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'SOC (%)', data: socData, borderColor: primary, backgroundColor: primaryLight, fill: true }] },
        options: commonOptions
      }))
      if (sohCanvas) instancesRef.current.push(new Chart(sohCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'SOH (%)', data: sohData, borderColor: success, backgroundColor: getVar('--success-light') || 'rgba(46, 125, 50, 0.16)', fill: true }] },
        options: commonOptions
      }))
      if (voltageCanvas) instancesRef.current.push(new Chart(voltageCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Voltage (V)', data: volData, borderColor: primary, backgroundColor: primaryLight, fill: true }] },
        options: commonOptions
      }))
      if (currentCanvas) instancesRef.current.push(new Chart(currentCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Current (A)', data: curData, borderColor: warning, backgroundColor: getVar('--warning-light') || 'rgba(245, 124, 0, 0.16)', fill: true }] },
        options: commonOptions
      }))
      if (tempCanvas) instancesRef.current.push(new Chart(tempCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Temperature (°C)', data: tempData, borderColor: danger, backgroundColor: getVar('--danger-light') || 'rgba(211, 47, 47, 0.16)', fill: true }] },
        options: commonOptions
      }))
    }, 50)

    return () => {
      instancesRef.current.forEach((chart) => chart.destroy())
      instancesRef.current = []
    }
  }, [])

  useEffect(() => {
    const syncSelectedBattery = async () => {
      const selected = await getSelectedBattery()
      if (!selected) return
      const searchInput = document.getElementById('bat-search')
      const specId = document.getElementById('battery-spec-id')
      const specImei = document.getElementById('battery-spec-imei')
      if (searchInput) searchInput.value = selected.imei
      if (specId) specId.textContent = selected.id
      if (specImei) specImei.textContent = selected.imei
    }

    const onSelectedImeiChanged = () => syncSelectedBattery()
    window.addEventListener('selectedImeiChanged', onSelectedImeiChanged)
    syncSelectedBattery()

    return () => window.removeEventListener('selectedImeiChanged', onSelectedImeiChanged)
  }, [])

  const applyImeiSelection = async () => {
    const searchInput = document.getElementById('bat-search')
    const specId = document.getElementById('battery-spec-id')
    const specImei = document.getElementById('battery-spec-imei')
    const imei = (searchInput?.value || '').trim()
    if (!imei) return
    const selected = await setSelectedImei(imei)
    if (!selected) {
      alert('IMEI not found. Please use a valid IMEI from Fleet Overview.')
      return
    }
    if (specId) specId.textContent = selected.id
    if (specImei) specImei.textContent = selected.imei
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Battery Insights</h1>
          <p className="page-subtitle">View detailed battery metrics and performance</p>
        </div>
      </header>

      <div className="controls-bar card battery-controls">
        <div className="battery-search-group">
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem' }}>IMEI ID</label>
          <div className="search-wrapper battery-search-wrapper">
            <Search />
            <input type="text" className="input-field" id="bat-search" placeholder="Enter IMEI ID" />
          </div>
        </div>
        <div className="battery-actions">
          <button className="btn btn-primary" id="battery-imei-search-btn" onClick={applyImeiSelection}><Search size={18} /> Search</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card edge-accent edge-accent-primary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">State of Charge</div>
              <div className="kpi-value" style={{ color: 'var(--primary-color)' }}>90.7<span className="kpi-unit">%</span></div>
            </div>
            <BatteryMedium style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-success">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">State of Health</div>
              <div className="kpi-value good">95.0<span className="kpi-unit">%</span></div>
            </div>
            <HeartPulse style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Voltage</div>
              <div className="kpi-value" style={{ color: 'var(--primary-color)' }}>51.3<span className="kpi-unit">V</span></div>
            </div>
            <BatteryCharging style={{ color: 'var(--primary-color)', width: 28, height: 28 }} />
          </div>
        </div>
        <div className="card kpi-card edge-accent edge-accent-danger">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <div className="kpi-title">Current</div>
              <div className="kpi-value critical">24.8<span className="kpi-unit">A</span></div>
            </div>
            <Zap style={{ color: 'var(--danger-color)', width: 28, height: 28 }} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">State of Charge (SOC)</div>
          <div className="chart-canvas-wrap">
            <canvas id="socChart"></canvas>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">State of Health (SOH)</div>
          <div className="chart-canvas-wrap">
            <canvas id="sohChart"></canvas>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">Voltage</div>
          <div className="chart-canvas-wrap">
            <canvas id="voltageChart"></canvas>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">Current</div>
          <div className="chart-canvas-wrap">
            <canvas id="currentChart"></canvas>
          </div>
        </div>
        <div className="chart-card chart-card-full">
          <div className="chart-header">Temperature</div>
          <div className="chart-canvas-wrap chart-canvas-wrap-lg">
            <canvas id="tempChart"></canvas>
          </div>
        </div>
      </div>

      <div className="card battery-spec-card">
        <h3 className="chart-header page-section-title">Battery Specifications</h3>
        <div className="info-panel">
          <div className="info-item"><span className="info-label">Battery ID</span><span className="info-value" id="battery-spec-id">-</span></div>
          <div className="info-item"><span className="info-label">IMEI</span><span className="info-value" id="battery-spec-imei">-</span></div>
          <div className="info-item"><span className="info-label">Power</span><span className="info-value">1.27 kW</span></div>
          <div className="info-item"><span className="info-label">Cycles</span><span className="info-value">245</span></div>
          <div className="info-item"><span className="info-label">Temperature</span><span className="info-value">28°C</span></div>
          <div className="info-item"><span className="info-label">Cell Count</span><span className="info-value">16 Series</span></div>
        </div>
      </div>
    </>
  )
}