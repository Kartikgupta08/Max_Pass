import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Battery from './pages/Battery.jsx'
import Cells from './pages/Cells.jsx'
import Analytics from './pages/Analytics.jsx'
import Alerts from './pages/Alerts.jsx'
import LiveLocations from './pages/LiveLocations.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/battery" element={<Battery />} />
          <Route path="/cells" element={<Cells />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/map" element={<LiveLocations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}