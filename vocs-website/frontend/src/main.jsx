import React from 'react'
import ReactDOM from 'react-dom/client'
// import './mockApi.js'   // 🟡 Mock API — ปิดเพื่อให้ต่อ API จริง
import App from './App.jsx'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
