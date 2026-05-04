import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/styles.css'
import './styles/battery.css'
import './styles/cells.css'
import './styles/analytics.css'
import './styles/map.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)