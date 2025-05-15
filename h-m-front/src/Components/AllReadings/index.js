"use client"

import Api from "../../Services/api"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUpDown, Clock, Heart } from "lucide-react"
import '../../index.css'

export default function AllReadings() {
  const [readings, setReadings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState("desc")
  const [hoveredRow, setHoveredRow] = useState(null)
  const navigate = useNavigate()

  const fetchReadings = async () => {
    setIsLoading(true)
    try {
      const data = await Api.getAllReadings()
      setReadings(data)
    } catch (error) {
      console.error("Failed to fetch readings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReadings()
  }, [])

  const sortedReadings = [...readings].sort((a, b) => {
    const timeA = new Date(`1970/01/01 ${a.data.timestamp}`).getTime()
    const timeB = new Date(`1970/01/01 ${b.data.timestamp}`).getTime()
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA
  })

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const getBpmColor = (bpm) => {
    if (bpm === 0) return "#9CA3AF" // gray-400
    if (bpm < 10) return "#3B82F6" // blue-500
    if (bpm < 20) return "#10B981" // green-500
    if (bpm < 40) return "#F59E0B" // yellow-500
    return "#EF4444" // red-500
  }

  const chartData = sortedReadings.map((reading) => ({
    timestamp: reading.data.timestamp,
    bpm: reading.data.bpm,
  }))

  // Container styles
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 16px",
  }

  const headingStyle = {
    fontSize: "30px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "32px",
  }

  const loadingContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "256px",
  }

  const spinnerStyle = {
    height: "48px",
    width: "48px",
    borderRadius: "50%",
    border: "2px solid transparent",
    borderTopColor: "#3B82F6",
    borderBottomColor: "#3B82F6",
    animation: "spin 1s linear infinite",
  }

  const chartContainerStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    padding: "16px",
    marginBottom: "32px",
  }

  const chartTitleStyle = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
  }

  const chartWrapperStyle = {
    height: "256px",
  }

  const tableContainerStyle = {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    overflow: "hidden",
  }

  const tableHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
  }

  const tableTitleStyle = {
    fontSize: "20px",
    fontWeight: "600",
  }

  const refreshButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#3B82F6",
    color: "white",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
  }

  const refreshButtonHoverStyle = {
    ...refreshButtonStyle,
    backgroundColor: "#2563EB",
  }

  const tableWrapperStyle = {
    overflowX: "auto",
  }

  const tableStyle = {
    minWidth: "100%",
    borderCollapse: "collapse",
  }

  const tableHeadStyle = {
    backgroundColor: "#F9FAFB",
  }

  const tableHeaderCellStyle = {
    padding: "12px 24px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  }

  const sortableHeaderCellStyle = {
    ...tableHeaderCellStyle,
    cursor: "pointer",
  }

  const headerContentStyle = {
    display: "flex",
    alignItems: "center",
  }

  const iconStyle = {
    height: "16px",
    width: "16px",
    marginRight: "4px",
  }

  const arrowIconStyle = {
    height: "16px",
    width: "16px",
    marginLeft: "4px",
  }

  const tableBodyStyle = {
    backgroundColor: "white",
  }

  const getRowStyle = (id) => ({
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: hoveredRow === id ? "#F9FAFB" : "white",
    cursor: "pointer",
    transition: "background-color 0.2s",
  })

  const tableCellStyle = {
    padding: "16px 24px",
    whiteSpace: "nowrap",
    fontSize: "14px",
    color: "#6B7280",
  }

  const getBpmCellStyle = (bpm) => ({
    ...tableCellStyle,
    fontWeight: "500",
    color: getBpmColor(bpm),
  })

  const footerStyle = {
    padding: "16px",
    borderTop: "1px solid #E5E7EB",
    fontSize: "14px",
    color: "#6B7280",
  }

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>All BPM Readings</h1>

      {isLoading ? (
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle}></div>
        </div>
      ) : (
        <>
          <div style={chartContainerStyle}>
            <h2 style={chartTitleStyle}>BPM Trend</h2>
            <div style={chartWrapperStyle}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, "dataMax + 10"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={tableContainerStyle}>
            <div style={tableHeaderStyle}>
              <h2 style={tableTitleStyle}>Detailed Readings</h2>
              <button
                onClick={fetchReadings}
                style={hoveredRow === "refresh" ? refreshButtonHoverStyle : refreshButtonStyle}
                onMouseEnter={() => setHoveredRow("refresh")}
                onMouseLeave={() => setHoveredRow(null)}
              >
                Refresh
              </button>
            </div>

            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead style={tableHeadStyle}>
                  <tr>
                    <th style={tableHeaderCellStyle}>ID</th>
                    <th style={sortableHeaderCellStyle} onClick={toggleSortOrder}>
                      <div style={headerContentStyle}>
                        <Clock style={iconStyle} />
                        Timestamp
                        <ArrowUpDown style={arrowIconStyle} />
                      </div>
                    </th>
                    <th style={tableHeaderCellStyle}>
                      <div style={headerContentStyle}>
                        <Heart style={iconStyle} />
                        BPM
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody style={tableBodyStyle}>
                  {sortedReadings.map((reading) => (
                    <tr
                      key={reading.id}
                      style={getRowStyle(reading.id)}
                      onClick={() => navigate(`/reading/${reading.id}`)}
                      onMouseEnter={() => setHoveredRow(reading.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={tableCellStyle}>{reading.id}</td>
                      <td style={tableCellStyle}>{reading.data.timestamp}</td>
                      <td style={getBpmCellStyle(reading.data.bpm)}>{reading.data.bpm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={footerStyle}>Showing {readings.length} readings</div>
          </div>
        </>
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
