import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import './design-system.jsx'
import './phone-app.jsx'
import './screen-overview.jsx'
import './screen-trends.jsx'
import './screen-profile.jsx'
import './glass-ui.jsx'
import './ios-frame.jsx'

// Expose React globally (JSX files use React.useState)
window.React = React

const { THEMES } = window
const { PhoneApp } = window

const themeKey = 'sky'
const theme = THEMES[themeKey]

// Wrapper component with proper state management
function App() {
  const [proMode, setProMode] = React.useState(false)
  const [textScale, setTextScale] = React.useState(1)
  const [enabledMetrics, setEnabledMetrics] = React.useState({
    pm25: true,
    no2: true,
    temp: true,
    gas: true
  })
  const [statusLvl, setStatusLvl] = React.useState(2)
  // Real sensor data from Pico
  const [sensorData, setSensorData] = React.useState({
    pm25: 0,
    pm10: 0,
    temp: 0,
    gas: 0  // Gas sensor value in ppm
  })

  // Calculate status level from PM2.5 value
  const pm25ToStatusLvl = (pm25) => {
    if (pm25 < 15) return 1  // Uitstekend
    if (pm25 < 25) return 2  // Goed
    if (pm25 < 50) return 3  // Voorzichtig
    return 4  // Blijf binnen
  }

  // Fetch sensor data from Pico every 5 seconds
  React.useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Try to fetch from Pico's /status endpoint
        // The Pico runs on its own WiFi AP, typically at 192.168.4.1
        const response = await fetch('http://192.168.4.1/status', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        if (response.ok) {
          const data = await response.json()
          setSensorData({
            pm25: data.pm25 || 0,
            pm10: data.pm10 || 0,
            temp: data.temp || 0,
            gas: data.gas || 0  // Gas sensor value from Pico
          })
          // Update status based on PM2.5
          if (data.pm25) {
            setStatusLvl(pm25ToStatusLvl(data.pm25))
          }
        }
      } catch (err) {
        // Pico not reachable (not connected to its WiFi) - that's ok, use defaults
        console.log('Pico not reachable, using demo data')
      }
    }

    // Fetch immediately
    fetchSensorData()
    // Then every 5 seconds
    const interval = setInterval(fetchSensorData, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: `linear-gradient(135deg, ${theme.bgA}, ${theme.bgB}, ${theme.bgC})`
    }}>
      <PhoneApp
        theme={theme}
        themeKey={themeKey}
        setThemeKey={() => {}}
        statusLvl={statusLvl}
        setStatusLvl={setStatusLvl}
        proMode={proMode}
        setProMode={setProMode}
        textScale={textScale}
        setTextScale={setTextScale}
        enabledMetrics={enabledMetrics}
        setEnabledMetrics={setEnabledMetrics}
        sensorData={sensorData}
        initialTab="home"
      />
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
