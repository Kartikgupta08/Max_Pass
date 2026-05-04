import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Moon, Sun, LayoutDashboard, BatteryCharging, Grid3x3, BarChart2, AlertTriangle, MapPin, Menu } from 'lucide-react'
import logoUrl from '../assets/logo.svg'

export default function Layout() {
  const [theme, setTheme] = useState('light')
  const [sidebarActive, setSidebarActive] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    let currentTheme = localStorage.getItem('theme')
    if (!currentTheme) {
      currentTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    setTheme(currentTheme)
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [])

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    if (window.innerWidth > 768) setSidebarCollapsed(savedCollapsed)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    window.dispatchEvent(new Event('themeChanged'))
  }, [theme])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setSidebarActive(false)
      }
    }

    const onDocClick = (e) => {
      const sidebar = document.querySelector('.sidebar')
      if (!sidebar) return
      if (sidebar.contains(e.target)) return
      if (e.target?.id === 'sidebar-brand-menu-btn') return
      setSidebarActive(false)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('click', onDocClick)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('click', onDocClick)
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleSidebar = (e) => {
    if (e) e.stopPropagation()
    if (window.innerWidth > 768) {
      const next = !sidebarCollapsed
      setSidebarCollapsed(next)
      localStorage.setItem('sidebarCollapsed', String(next))
      return
    }
    setSidebarActive((prev) => !prev)
  }

  const closeSidebar = () => setSidebarActive(false)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <button className="brand-menu-btn" id="sidebar-brand-menu-btn" aria-label="Toggle menu" onClick={toggleSidebar}>
            <Menu size={18} />
          </button>
          <img src={logoUrl} alt="MaxPass" className="brand-logo" />
          <span className="brand-label">MaxPass</span>
        </div>
      </header>

      <div className="app-container">
        <aside className={`sidebar ${sidebarActive ? 'active' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <ul className="nav-links">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <LayoutDashboard size={20} /> <span className="nav-label">Fleet Overview</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/battery" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <BatteryCharging size={20} /> <span className="nav-label">Battery Insights</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/cells" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <Grid3x3 size={20} /> <span className="nav-label">Cell Diagnostics</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <BarChart2 size={20} /> <span className="nav-label">Analytics</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/alerts" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <AlertTriangle size={20} /> <span className="nav-label">Alerts</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={closeSidebar}>
              <MapPin size={20} /> <span className="nav-label">Live Locations</span>
            </NavLink>
          </li>
          </ul>
          <div className="sidebar-footer">
            <button type="button" className="theme-toggle" id="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span className="theme-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </aside>

        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="app-content" onClick={() => setSidebarActive(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
