import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Sandbox from './Sandbox.jsx'

const useSandbox = new URLSearchParams(window.location.search).has('sandbox')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {useSandbox ? <Sandbox /> : <App />}
  </StrictMode>,
)
