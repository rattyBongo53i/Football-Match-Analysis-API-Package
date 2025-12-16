import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BetslipProvider } from './contexts/BetslipContext';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BetslipProvider>
      <App />
    </BetslipProvider>
  </StrictMode>,
)
