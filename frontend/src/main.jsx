import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0e1520',
            border:     '1px solid #1c2d40',
            color:      '#cdd9e5',
            fontSize:   '0.85rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#0e1520' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0e1520' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
