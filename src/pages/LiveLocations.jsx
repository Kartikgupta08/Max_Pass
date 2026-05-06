import React, { useEffect, useRef, useState } from 'react'
import { MapPin, BatteryCharging, RadioTower, WifiOff } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchMapBatteries } from '../services/services.js'

export default function LiveLocations() {
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [panelBattery, setPanelBattery] = useState(null)
  const [kpis, setKpis] = useState({ total: 0, online: 0, offline: 0 })

  useEffect(() => {
    const initMap = () => {
      if (mapRef.current) return mapRef.current
      if (!mapContainerRef.current) return null
      const instance = L.map(mapContainerRef.current).setView([19.0760, 72.8777], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(instance)
      mapRef.current = instance
      markerLayerRef.current = L.layerGroup().addTo(instance)
      return instance
    }

    const createIcon = (color) => {
      return L.divIcon({
        className: 'custom-pin',
        iconAnchor: [0, 24],
        labelAnchor: [-6, 0],
        popupAnchor: [0, -36],
        html: `<span style="background-color:${color}; width: 1.5rem; height: 1.5rem; display: block; left: -0.75rem; top: -0.75rem; position: relative; border-radius: 3rem 3rem 0; transform: rotate(45deg); border: 2px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.3)"></span>`
      })
    }

    const loadMap = async () => {
      const batteries = await fetchMapBatteries()
      const onlineCount = batteries.filter((b) => b.online).length
      setKpis({ total: batteries.length, online: onlineCount, offline: batteries.length - onlineCount })

      const mapInstance = initMap()
      if (!mapInstance) return
      markerLayerRef.current.clearLayers()

      const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      const onlineIcon = createIcon(getVar('--danger-color') || '#d32f2f')
      const offlineIcon = createIcon('#94a3b8')

      batteries.forEach((b) => {
        const marker = L.marker([b.lat, b.lng], { icon: b.online ? onlineIcon : offlineIcon })
        marker.bindTooltip(`<b>${b.id}</b><br/>SOC: ${b.soc}%`, { direction: 'top', offset: [0, -30] })
        marker.on('click', () => setPanelBattery(b))
        marker.addTo(markerLayerRef.current)
      })

      setTimeout(() => mapInstance.invalidateSize(), 80)
    }

    loadMap()
    const onSelectedIotChanged = () => loadMap()
    window.addEventListener('selectedIotChanged', onSelectedIotChanged)

    return () => {
      window.removeEventListener('selectedIotChanged', onSelectedIotChanged)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markerLayerRef.current = null
    }
  }, [])

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Live Locations</h1>
          <p className="page-subtitle">Track battery positions and live operating status</p>
        </div>
      </header>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card kpi-card edge-accent edge-accent-primary flex justify-between items-center" style={{ flexDirection: 'row' }}>
          <div>
            <div className="kpi-title">Total Batteries</div>
            <div className="kpi-value" id="map-kpi-total">{kpis.total}</div>
          </div>
          <BatteryCharging style={{ color: 'var(--primary-color)', width: 32, height: 32 }} />
        </div>
        <div className="card kpi-card edge-accent edge-accent-success flex justify-between items-center" style={{ flexDirection: 'row' }}>
          <div>
            <div className="kpi-title">Online Batteries</div>
            <div className="kpi-value good" id="map-kpi-online">{kpis.online}</div>
          </div>
          <RadioTower style={{ color: 'var(--success-color)', width: 28, height: 28 }} />
        </div>
        <div className="card kpi-card edge-accent edge-accent-danger flex justify-between items-center" style={{ flexDirection: 'row' }}>
          <div>
            <div className="kpi-title">Offline Batteries</div>
            <div className="kpi-value critical" id="map-kpi-offline">{kpis.offline}</div>
          </div>
          <WifiOff style={{ color: 'var(--danger-color)', width: 28, height: 28 }} />
        </div>
      </div>

      <div className="map-layout">
        <div className="map-container">
          <div id="map" ref={mapContainerRef}></div>
          <div className="map-legend">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger-color)' }}></div> Battery Location</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: '#94a3b8' }}></div> Offline Battery</span>
          </div>
        </div>

        <div className="side-panel" id="sidePanel">
          {!panelBattery ? (
            <div className="side-panel-empty" id="sidePanelEmpty">
              <MapPin style={{ width: 48, height: 48 }} />
              <p>Click on a marker to view battery details</p>
            </div>
          ) : (
            <div className="side-panel-content" id="sidePanelContent" style={{ display: 'block' }}>
              <h3 style={{ marginBottom: '2rem' }}>Battery Details</h3>
              <div className="battery-header" id="panelBotId">{panelBattery.id}</div>
              <div className="battery-status-badge">
                <span className={`badge ${panelBattery.online ? 'success' : 'danger'}`} id="panelStatus">
                  <div className="badge-dot"></div> {panelBattery.online ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="metric-grid">
                <div className="metric-box">
                  <div className="kpi-title">SOC</div>
                  <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }} id="panelSoc">{panelBattery.soc}<span className="kpi-unit">%</span></div>
                </div>
                <div className="metric-box">
                  <div className="kpi-title">SOH</div>
                  <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--success-color)' }} id="panelSoh">{panelBattery.soh}<span className="kpi-unit">%</span></div>
                </div>
                <div className="metric-box">
                  <div className="kpi-title">Voltage</div>
                  <div className="kpi-value" style={{ fontSize: '1.5rem', color: 'var(--warning-color)' }} id="panelVol">{panelBattery.v}<span className="kpi-unit">V</span></div>
                </div>
                <div className="metric-box">
                  <div className="kpi-title">Current</div>
                  <div className="kpi-value" style={{ fontSize: '1.5rem' }} id="panelCur">{panelBattery.c}<span className="kpi-unit">A</span></div>
                </div>
                <div className="metric-box" style={{ gridColumn: '1 / -1' }}>
                  <div className="kpi-title">Temperature</div>
                  <div className="kpi-value critical" style={{ fontSize: '1.5rem' }} id="panelTemp">{panelBattery.t}<span className="kpi-unit">°C</span></div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => { window.location.href = '/battery' }}>View Full Analytics</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}