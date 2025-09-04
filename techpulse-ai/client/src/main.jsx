import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import TechPulseDashboard from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TechPulseDashboard />
  </StrictMode>,
)
