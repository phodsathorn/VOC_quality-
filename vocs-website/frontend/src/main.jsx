import React from 'react'
import ReactDOM from 'react-dom/client'
import './mockApi.js'   // 🟡 Mock API — intercept fetch ก่อน component โหลด
import App from './App.jsx'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
