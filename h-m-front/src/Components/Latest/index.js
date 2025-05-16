"use client"

import Api from "../../Services/api"
import { useState } from "react"
import { Heart, ArrowRight, RefreshCw } from "lucide-react"

export default function Latest() {
  const [response, setResponse] = useState([])
  const [input, setInput] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  const handleGet = async () => {
    setIsLoading(true)
    try {
      const data = await Api.getLatestReadings(input)
      setResponse(data)
    } catch (error) {
      console.error("Failed to fetch readings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBpmColor = (bpm) => {
    if (bpm === 0) return "#9CA3AF" // gray-400
    if (bpm < 10) return "#3B82F6" // blue-500
    if (bpm < 20) return "#10B981" // green-500
    if (bpm < 40) return "#F59E0B" // yellow-500
    return "#EF4444" // red-500
  }

  // Container styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  }

  const headerStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "24px",
    color: "white",
  }

  const controlsContainerStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "32px",
    gap: "16px",
    flexWrap: "wrap",
  }

  const labelStyle = {
    fontSize: "16px",
    fontWeight: "500",
    marginRight: "8px",
    color: "white",
  }

  const inputStyle = {
    padding: "10px 16px",
    fontSize: "16px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    width: "120px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  }

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 20px",
    backgroundColor: buttonHover ? "#2563EB" : "#3B82F6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  }

  const loadingContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "200px",
  }

  const spinnerStyle = {
    animation: "spin 1s linear infinite",
  }

  // Grid of cards styles
  const gridContainerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  }

  const getCardStyle = (id) => ({
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow:
      hoveredCard === id
        ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
    transition: "box-shadow 0.3s, transform 0.2s",
    transform: hoveredCard === id ? "translateY(-4px)" : "translateY(0)",
    cursor: "pointer",
  })

  const cardHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "#F9FAFB",
  }

  const cardTitleStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  }

  const cardIdStyle = {
    fontSize: "14px",
    color: "#6B7280",
    fontFamily: "monospace",
  }

  const cardBodyStyle = {
    padding: "16px",
  }

  const readingRowStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
  }

  const readingLabelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#4B5563",
    width: "90px",
  }

  const readingValueStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  }

  const bpmContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }

  const noDataStyle = {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    color: "#6B7280",
    fontSize: "16px",
  }

  const statusContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }

  const statusTextStyle = {
    fontSize: "14px",
    color: "#6B7280",
  }

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Latest BPM Readings</h1>

      <div style={controlsContainerStyle}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={labelStyle}>Number of readings:</label>
          <input type="number" value={input} onChange={(e) => setInput(e.target.value)} style={inputStyle} min="1" />
        </div>

        <button
          onClick={handleGet}
          style={buttonStyle}
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} style={{ ...spinnerStyle, marginRight: "8px" }} />
              Loading...
            </>
          ) : (
            <>
              Get Readings
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div style={loadingContainerStyle}>
          <RefreshCw size={40} style={{ ...spinnerStyle, color: "#3B82F6" }} />
        </div>
      ) : response.length > 0 ? (
        <>
          <div style={gridContainerStyle}>
            {response.map((reading) => (
              <div
                key={reading.id}
                style={getCardStyle(reading.id)}
                onMouseEnter={() => setHoveredCard(reading.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={cardHeaderStyle}>
                  <div style={cardTitleStyle}>Reading</div>
                  <div style={cardIdStyle}>ID: {reading.id}</div>
                </div>
                <div style={cardBodyStyle}>
                  <div style={readingRowStyle}>
                    <div style={readingLabelStyle}>Timestamp:</div>
                    <div style={readingValueStyle}>{reading.data.timestamp}</div>
                  </div>
                  <div style={readingRowStyle}>
                    <div style={readingLabelStyle}>BPM:</div>
                    <div style={bpmContainerStyle}>
                      <Heart size={20} style={{ color: getBpmColor(reading.data.bpm) }} />
                      <span
                        style={{
                          ...readingValueStyle,
                          color: getBpmColor(reading.data.bpm),
                          fontSize: "18px",
                        }}
                      >
                        {reading.data.bpm}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={statusContainerStyle}>
            <div style={statusTextStyle}>Showing {response.length} readings</div>
          </div>
        </>
      ) : (
        <div style={noDataStyle}>No readings to display. Enter a number and click "Get Readings" to fetch data.</div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
