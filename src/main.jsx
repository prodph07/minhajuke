import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed to improve YouTube Player stability in Dev
createRoot(document.getElementById('root')).render(
  <App />
)
