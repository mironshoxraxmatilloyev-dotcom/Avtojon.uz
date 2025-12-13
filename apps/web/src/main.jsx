import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { SocketProvider } from './contexts/SocketContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SocketProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'transparent',
              boxShadow: 'none',
              padding: 0,
            },
          }}
          containerStyle={{
            top: 20,
            right: 20,
          }}
        />
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
