import React, { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import Chart from 'chart.js/auto'
import MMD from '../data/mmd.js'
import { getSelectedBattery, setSelectedIot } from '../services/services.js'

export default function Cells() {
  const [cellData, setCellData] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const chartsRef = useRef({
    overviewV: null,
    overviewC: null,
    overviewT: null,
    modalV: null,
    modalC: null,
    modalT: null
  })

  useEffect(() => {
    const data = Array.from({ length: 16 }, (_, idx) => {
      const i = idx + 1
      const voltage = parseFloat((Math.random() * (4.2 - 3.2) + 3.2).toFixed(2))
      const current = parseFloat((Math.random() * 5.5).toFixed(2))
      const temp = parseFloat((Math.random() * (40 - 22) + 22).toFixed(1))

      let status = 'good'
      if (voltage < 3.3 || voltage > 4.1 || temp > 37.5) status = 'critical'
      else if (voltage < 3.6 || voltage > 3.9 || temp > 33.5) status = 'warning'

      return { i, voltage, current, temp, status }
    })
    setCellData(data)
  }, [])

  useEffect(() => {
    if (!cellData.length) return

    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    const tickColor = () => getVar('--text-secondary') || '#5c6d78'

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor() } },
        y: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor() } }
      }
    }

    const labels = cellData.map((d) => `Cell ${d.i}`)
    const voltageValues = cellData.map((d) => d.voltage)
    const currentValues = cellData.map((d) => d.current)
    const tempValues = cellData.map((d) => d.temp)

    const destroyOverview = () => {
      Object.values(chartsRef.current).forEach((chart) => chart && chart.destroy())
      chartsRef.current = { overviewV: null, overviewC: null, overviewT: null, modalV: null, modalC: null, modalT: null }
    }

    destroyOverview()

    chartsRef.current.overviewV = new Chart(document.getElementById('cellVoltageChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Voltage (V)',
          data: voltageValues,
          borderColor: getVar('--primary-color') || '#0e5a6f',
          backgroundColor: 'rgba(168, 147, 255, 0.28)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 7
        }]
      },
      options: commonOptions
    })

    chartsRef.current.overviewT = new Chart(document.getElementById('cellTempChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: tempValues,
          backgroundColor: getVar('--success-color') || '#2e7d32',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: commonOptions
    })

    chartsRef.current.overviewC = new Chart(document.getElementById('cellCurrentChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Current (A)',
          data: currentValues,
          borderColor: getVar('--warning-color') || '#f57c00',
          backgroundColor: 'rgba(255, 196, 112, 0.30)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 7
        }]
      },
      options: commonOptions
    })

    return () => destroyOverview()
  }, [cellData])

  useEffect(() => {
    const syncSelectedBattery = async () => {
      const selected = await getSelectedBattery()
      if (!selected) return
      const iotInput = document.getElementById('cells-iot-input')
      const batteryTitle = document.getElementById('cells-battery-title')
      if (iotInput) iotInput.value = selected.iot
      if (batteryTitle) batteryTitle.textContent = `Battery: ${selected.name} (${selected.id})`
    }

    const onSelectedIotChanged = () => syncSelectedBattery()
    window.addEventListener('selectedIotChanged', onSelectedIotChanged)
    syncSelectedBattery()
    return () => window.removeEventListener('selectedIotChanged', onSelectedIotChanged)
  }, [])

  const applyIotSelection = async () => {
    const iotInput = document.getElementById('cells-iot-input')
    const batteryTitle = document.getElementById('cells-battery-title')
    const iot = (iotInput?.value || '').trim()
    if (!iot) return
    const selected = await setSelectedIot(iot)
    if (!selected) {
      alert('IOT ID not found. Please use a valid IOT ID from Fleet Overview.')
      return
    }
    if (batteryTitle) batteryTitle.textContent = `Battery: ${selected.name} (${selected.id})`
  }

  const findMinMaxIndices = (data) => {
    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    return {
      minIdx: data.indexOf(minVal),
      maxIdx: data.indexOf(maxVal)
    }
  }

  const gridColor = () => getComputedStyle(document.documentElement).getPropertyValue('--border-light') || '#dde5eb'
  const tickColor = () => getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#5c6d78'

  const createModalChart = (ctxId, data, label, baseColor) => {
    const extremes = findMinMaxIndices(data)
    const pointColors = data.map((_, i) => {
      if (i === extremes.minIdx) return getComputedStyle(document.documentElement).getPropertyValue('--info-color') || '#3a7185'
      if (i === extremes.maxIdx) return getComputedStyle(document.documentElement).getPropertyValue('--danger-color') || '#d32f2f'
      return baseColor
    })
    const pointRadii = data.map((_, i) => (i === extremes.minIdx || i === extremes.maxIdx ? 6 : 3))

    return new Chart(document.getElementById(ctxId), {
      type: 'line',
      data: {
        labels: MMD.generateTimeSeriesData(24, 0, 1).labels,
        datasets: [{
          label,
          data,
          borderColor: baseColor,
          backgroundColor: 'transparent',
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: pointRadii,
          pointHoverRadius: 8,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor(), drawBorder: false }, ticks: { color: tickColor() } },
          y: { grid: { color: gridColor(), drawBorder: false }, ticks: { color: tickColor() } }
        }
      }
    })
  }

  const openModal = (cell) => {
    setSelectedCell(cell)
    setTimeout(() => {
      const { data: volData } = MMD.generateTimeSeriesData(24, Math.max(3.1, cell.voltage - 0.25), Math.min(4.2, cell.voltage + 0.2))
      const { data: curData } = MMD.generateTimeSeriesData(24, Math.max(0, cell.current - 1.2), Math.min(7.5, cell.current + 1.6))
      const { data: tempData } = MMD.generateTimeSeriesData(24, Math.max(18, cell.temp - 4), Math.min(48, cell.temp + 5))

      if (chartsRef.current.modalV) chartsRef.current.modalV.destroy()
      if (chartsRef.current.modalC) chartsRef.current.modalC.destroy()
      if (chartsRef.current.modalT) chartsRef.current.modalT.destroy()

      chartsRef.current.modalV = createModalChart('modalVolChart', volData, 'Voltage (V)', getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0e5a6f')
      chartsRef.current.modalC = createModalChart('modalCurChart', curData, 'Current (A)', getComputedStyle(document.documentElement).getPropertyValue('--warning-color') || '#f57c00')
      chartsRef.current.modalT = createModalChart('modalTempChart', tempData, 'Temp (°C)', getComputedStyle(document.documentElement).getPropertyValue('--danger-color') || '#d32f2f')
    }, 50)
  }

  const closeModal = () => {
    setSelectedCell(null)
    if (chartsRef.current.modalV) chartsRef.current.modalV.destroy()
    if (chartsRef.current.modalC) chartsRef.current.modalC.destroy()
    if (chartsRef.current.modalT) chartsRef.current.modalT.destroy()
    chartsRef.current.modalV = null
    chartsRef.current.modalC = null
    chartsRef.current.modalT = null
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Cell Diagnostics</h1>
          <p className="page-subtitle">Monitor individual cell performance and health</p>
        </div>
      </header>

      <div className="controls-bar card cell-controls">
        <div className="cell-search-group">
          <label className="info-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>IOT ID</label>
          <div className="search-wrapper cell-search-wrapper">
            <Search />
            <input type="text" className="input-field" id="cells-iot-input" placeholder="Enter IOT ID" />
          </div>
        </div>
        <div className="cell-actions">
          <button className="btn btn-primary" id="cells-iot-search-btn" onClick={applyIotSelection}><Search size={18} /> Search</button>
        </div>
      </div>

      <h3 className="cell-page-title" id="cells-battery-title">Battery: -</h3>

      <div className="cell-analytics-grid">
        <div className="chart-card cell-chart-card">
          <h4 className="chart-header">Cell Voltage Overview</h4>
          <div className="cell-chart-wrap"><canvas id="cellVoltageChart"></canvas></div>
        </div>
        <div className="chart-card cell-chart-card">
          <h4 className="chart-header">Cell Temperature Overview</h4>
          <div className="cell-chart-wrap"><canvas id="cellTempChart"></canvas></div>
        </div>
        <div className="chart-card cell-chart-card cell-chart-card-full">
          <h4 className="chart-header">Cell Current Overview</h4>
          <div className="cell-chart-wrap"><canvas id="cellCurrentChart"></canvas></div>
        </div>
      </div>

      <div className="battery-pack">
        <div className="cells-grid" id="cells-container">
          {cellData.map((cell) => (
            <div key={cell.i} className={`cell-box ${cell.status}`} onClick={() => openModal(cell)}>
              <div className="cell-number">Cell {cell.i}</div>
              <div className="cell-voltage">{cell.voltage.toFixed(2)}V</div>
              <div className="cell-status">{cell.status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`modal-overlay ${selectedCell ? 'active' : ''}`} id="cellModal">
        <div className="modal-content">
          <button className="modal-close" id="close-modal-btn" onClick={closeModal}><X size={18} /></button>
          <h2 id="modal-title" style={{ marginBottom: '1.5rem' }}>Cell Details</h2>

          <div className="kpi-grid cell-modal-kpi-grid">
            <div className="card kpi-card" style={{ padding: '1rem' }}>
              <div className="kpi-title">Voltage</div>
              <div className="kpi-value" style={{ color: 'var(--primary-color)' }} id="modal-v">{selectedCell ? selectedCell.voltage.toFixed(2) : '-'}<span className="kpi-unit">V</span></div>
            </div>
            <div className="card kpi-card" style={{ padding: '1rem' }}>
              <div className="kpi-title">Current</div>
              <div className="kpi-value" style={{ color: 'var(--warning-color)' }} id="modal-c">{selectedCell ? selectedCell.current.toFixed(2) : '-'}<span className="kpi-unit">A</span></div>
            </div>
            <div className="card kpi-card" style={{ padding: '1rem' }}>
              <div className="kpi-title">Temperature</div>
              <div className="kpi-value critical" id="modal-t">{selectedCell ? selectedCell.temp.toFixed(1) : '-'}<span className="kpi-unit">°C</span></div>
            </div>
          </div>

          <div className="modal-body-grid">
            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Voltage Over Time</h4>
              <div style={{ height: 200 }}><canvas id="modalVolChart"></canvas></div>
            </div>
            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Current Over Time</h4>
              <div style={{ height: 200 }}><canvas id="modalCurChart"></canvas></div>
            </div>
            <div>
              <h4 style={{ marginBottom: '0.5rem' }}>Temperature Over Time</h4>
              <div style={{ height: 200 }}><canvas id="modalTempChart"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}