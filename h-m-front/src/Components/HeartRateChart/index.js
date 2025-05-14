import { useEffect, useState, useCallback } from "react";
import styles from "./HeartRateChart.module.css";
import Api from "../../Services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const MAX_DATA_POINTS = 10;

export default function HeartRateChart() {
  // Inicializar com dados nulos para mostrar a estrutura do gráfico
  const initialEmptyData = Array(MAX_DATA_POINTS)
    .fill(null)
    .map((_, index) => ({
      time: `--:--`,
      bpm: null,
    }));

  const [heartRateData, setHeartRateData] = useState(initialEmptyData);
  const isLive = true;
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, alerts: 0 });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstMount, setFirstMount] = useState(true);
  // Flag para controlar se estamos usando dados reais ou os iniciais vazios
  const [hasRealData, setHasRealData] = useState(false);

  const limitDataPoints = useCallback((data) => {
    if (!data || data.length <= MAX_DATA_POINTS) return data;
    return data.slice(data.length - MAX_DATA_POINTS);
  }, []);

  const calculateStats = useCallback(
    (data) => {
      // Filtramos valores nulos antes de calcular estatísticas
      const validData = data.filter((item) => item.bpm !== null);

      if (!validData || validData.length === 0)
        return { min: 0, max: 0, avg: 0, alerts: stats.alerts };

      const bpmValues = validData.map((item) => item.bpm);
      const min = Math.min(...bpmValues);
      const max = Math.max(...bpmValues);
      const avg = Math.round(
        bpmValues.reduce((sum, val) => sum + val, 0) / bpmValues.length
      );

      return { min, max, avg, alerts: stats.alerts };
    },
    [stats.alerts]
  );

  const checkAlerts = useCallback((newReading, prevData) => {
    if (!prevData || prevData.length === 0) return null;

    // Encontrar a última leitura válida não nula
    const validPrevData = prevData.filter((item) => item.bpm !== null);
    if (validPrevData.length === 0) return null;

    const lastReading = validPrevData[validPrevData.length - 1];
    const change = Math.abs(newReading.bpm - lastReading.bpm);

    if (newReading.bpm < 40) {
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      return {
        type: "low",
        message: `Batimentos baixos detectados: ${newReading.bpm} BPM`,
        time: newReading.time,
      };
    }

    if (newReading.bpm > 100) {
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      return {
        type: "high",
        message: `Batimentos elevados detectados: ${newReading.bpm} BPM`,
        time: newReading.time,
      };
    }

    if (change > 30) {
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      return {
        type: "change",
        message: `Variação súbita: ${lastReading.bpm} → ${newReading.bpm} BPM (${change} BPM)`,
        time: newReading.time,
      };
    }

    return null;
  }, []);

  // Inicialização do componente
  useEffect(() => {
    // Inicializar com dados vazios, mas estruturados
    setHeartRateData(initialEmptyData);
    setStats({ min: 0, max: 0, avg: 0, alerts: 0 });
    setLoading(false);
    setFirstMount(true);
    setHasRealData(false);

    return () => {
      setHeartRateData([]);
    };
  }, []);

  // Este useEffect configura a conexão SSE
  useEffect(() => {
    let eventSource = null;

    console.log("Iniciando conexão SSE...");

    const handleNewReading = (reading) => {
      console.log("Recebido:", reading);

      // Se for o evento 'initial_reading' e estamos na primeira montagem, ignoramos
      if (firstMount && reading && reading.type === "initial_reading") {
        console.log("Ignorando leitura inicial durante primeira montagem");
        setFirstMount(false);
        return;
      }

      let newReading;

      if (reading && reading.data && reading.data.timestamp) {
        newReading = {
          time: reading.data.timestamp,
          bpm: reading.data.bpm,
        };
      } else if (reading && reading.timestamp) {
        newReading = {
          time: reading.timestamp,
          bpm: reading.bpm,
        };
      } else if (typeof reading === "string") {
        try {
          const parsed = JSON.parse(reading);

          // Se for um evento de leitura inicial e estamos na primeira montagem, ignoramos
          if (firstMount && parsed && parsed.type === "initial_reading") {
            console.log(
              "Ignorando leitura inicial (string) durante primeira montagem"
            );
            setFirstMount(false);
            return;
          }

          if (parsed.data) {
            newReading = {
              time: parsed.data.timestamp || "00:00:00",
              bpm: parsed.data.bpm || 0,
            };
          } else {
            newReading = {
              time: parsed.timestamp || "00:00:00",
              bpm: parsed.bpm || 0,
            };
          }
        } catch (e) {
          console.error("Erro ao analisar a string:", e);
          return;
        }
      } else {
        console.warn("Formato de dados desconhecido:", reading);
        newReading = {
          time: new Date().toLocaleTimeString(),
          bpm: reading.bpm || 0,
        };
      }

      // Não somos mais a primeira montagem depois de processar o primeiro evento
      setFirstMount(false);

      console.log("Leitura formatada:", newReading);
      setHeartRateData((prevData) => {
        // Na primeira leitura real, descartamos os dados nulos iniciais
        if (!hasRealData) {
          setHasRealData(true);
          return [newReading];
        }

        if (!prevData || !Array.isArray(prevData)) {
          console.warn("prevData não é um array:", prevData);
          return [newReading];
        }

        const newAlert = checkAlerts(newReading, prevData);
        if (newAlert) {
          setAlert(newAlert);
          setTimeout(() => setAlert(null), 3000);
        }

        const newData = [...prevData, newReading];
        const limitedData = limitDataPoints(newData);
        setStats(calculateStats(limitedData));

        return limitedData;
      });
    };

    try {
      eventSource = Api.streamHeartRate(
        // Para eventos initial_reading, vamos ignorá-los
        (initialData) => {
          console.log("Evento inicial recebido, ignorando:", initialData);
          setFirstMount(false);
        },
        // Para eventos new_reading, processamos normalmente
        handleNewReading,
        (error) => {
          console.error("Erro na conexão SSE:", error);
          setError(
            "Erro na conexão com o servidor. Tente recarregar a página."
          );
        },
        () => {
          console.log("Conexão SSE estabelecida");
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Falha ao inicializar conexão SSE:", error);
      setError(
        "Não foi possível conectar ao servidor. Tente recarregar a página."
      );
    }

    return () => {
      if (eventSource) {
        console.log("Fechando conexão SSE");
        eventSource.close();
      }
    };
  }, [
    calculateStats,
    checkAlerts,
    limitDataPoints,
    firstMount,
    hasRealData,
    initialEmptyData,
  ]);

  const getBpmColor = (bpm) => {
    if (bpm === null) return "#d1d5db"; // Cor cinza para valores nulos
    if (bpm <= 40) return "#3b82f6";
    if (bpm <= 100) return "#10b981";
    return "#ef4444";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === "--:--") return "";
    return timestamp.split(":").slice(0, 2).join(":");
  };

  const getAlertStyles = () => {
    if (!alert) return "";

    switch (alert.type) {
      case "low":
        return "bg-blue-100 border-blue-500 text-blue-700";
      case "high":
        return "bg-red-100 border-red-500 text-red-700";
      case "change":
        return "bg-amber-100 border-amber-500 text-amber-700";
      default:
        return "bg-gray-100 border-gray-500 text-gray-700";
    }
  };

  const dataForChart = heartRateData;

  // Consideramos que temos dados reais se a flag hasRealData estiver ativa
  const hasData = hasRealData;

  return (
    <div className={styles.foot}>
      <div className="w-full p-4 bg-white rounded-lg shadow-lg">
        {/* Cabeçalho com título */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Monitoramento Cardíaco
          </h2>
          <div className="text-sm text-gray-600">
            {hasData
              ? `Mostrando últimos ${Math.min(
                  MAX_DATA_POINTS,
                  dataForChart.filter((item) => item.bpm !== null).length
                )} registros`
              : "Aguardando dados..."}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="p-3 mb-4 rounded-md border bg-red-100 border-red-500 text-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Área de alerta */}
        {alert && (
          <div className={`p-3 mb-4 rounded-md border ${getAlertStyles()}`}>
            <p className="font-medium">{alert.message}</p>
            <p className="text-sm">{alert.time}</p>
          </div>
        )}

        {/* Indicador de carregamento */}
        {loading && (
          <div className="flex justify-center items-center py-2 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="ml-2 text-blue-600">Iniciando monitoramento...</p>
          </div>
        )}

        {/* Gráfico */}
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Frequência Cardíaca
        </h3>
        <div
          className="h-64 w-full border border-gray-200 rounded-md overflow-hidden"
          style={{ height: "300px" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dataForChart}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTimestamp}
                label={{
                  value: "Hora",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                domain={[0, 150]}
                label={{ value: "BPM", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value) =>
                  value === null
                    ? ["Aguardando...", ""]
                    : [`${value} BPM`, "Frequência"]
                }
                labelFormatter={(value) =>
                  value === "--:--" ? "Aguardando..." : `Hora: ${value}`
                }
                isAnimationActive={true}
              />
              <Legend />

              {/* Linhas de referência para bradicardia e taquicardia */}
              <ReferenceLine
                y={40}
                stroke="#3b82f6"
                strokeDasharray="3 3"
                label={{
                  value: "Bradicardia",
                  position: "left",
                  fill: "#3b82f6",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={100}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: "Taquicardia",
                  position: "left",
                  fill: "#ef4444",
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="bpm"
                name="Frequência Cardíaca"
                stroke="#8884d8"
                strokeWidth={2}
                dot={(props) => {
                  // Não mostrar pontos para valores nulos
                  if (props.payload.bpm === null) return null;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="#8884d8"
                      stroke="none"
                    />
                  );
                }}
                activeDot={(props) => {
                  // Não mostrar pontos ativos para valores nulos
                  if (props.payload.bpm === null) return null;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={8}
                      fill="#8884d8"
                      stroke="none"
                    />
                  );
                }}
                isAnimationActive={true}
                connectNulls={true} // Não conectar valores nulos
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cartões de estatísticas com estilos inline */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          {/* BPM Mínimo */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              border: "1px solid #dbeafe",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#dbeafe",
                  borderRadius: "9999px",
                  padding: "0.75rem",
                  marginRight: "1rem",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    height: "1.5rem",
                    width: "1.5rem",
                    color: "#2563eb",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  BPM Mínimo
                </p>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#2563eb",
                    }}
                  >
                    {hasData ? stats.min : "-"}
                  </p>
                  <p
                    style={{
                      marginLeft: "0.25rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    {hasData ? "bpm" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "#eff6ff", padding: "0.5rem 1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#2563eb" }}>
                {!hasData
                  ? "Aguardando dados..."
                  : stats.min < 40
                  ? "Abaixo do normal"
                  : "Dentro do esperado"}
              </p>
            </div>
          </div>

          {/* BPM Médio */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              border: "1px solid #dcfce7",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#dcfce7",
                  borderRadius: "9999px",
                  padding: "0.75rem",
                  marginRight: "1rem",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    height: "1.5rem",
                    width: "1.5rem",
                    color: "#10b981",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.25 10.511c.5 1.874.5 3.104 0 4.978m-1.917-8.432A12.819 12.819 0 0 0 12 4.5a12.819 12.819 0 0 0-6.333 2.557M19.5 10.511v.001m-1.917 4.433c-1.551 1.323-3.637 2.554-5.583 2.555-1.946 0-4.032-1.232-5.583-2.555M6.75 15.489C6.25 13.615 6.25 12.385 6.75 10.511m1.917 8.432A12.819 12.819 0 0 0 12 19.5a12.819 12.819 0 0 0 6.333-2.557M4.5 10.511v.001"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  BPM Médio
                </p>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#10b981",
                    }}
                  >
                    {hasData ? stats.avg : "-"}
                  </p>
                  <p
                    style={{
                      marginLeft: "0.25rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    {hasData ? "bpm" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "#ecfdf5", padding: "0.5rem 1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#10b981" }}>
                {!hasData
                  ? "Aguardando dados..."
                  : stats.avg < 60
                  ? "Abaixo do normal"
                  : stats.avg > 100
                  ? "Acima do normal"
                  : "Ritmo normal"}
              </p>
            </div>
          </div>

          {/* BPM Máximo */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
              border: "1px solid #fee2e2",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  borderRadius: "9999px",
                  padding: "0.75rem",
                  marginRight: "1rem",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    height: "1.5rem",
                    width: "1.5rem",
                    color: "#ef4444",
                  }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#6b7280",
                  }}
                >
                  BPM Máximo
                </p>
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <p
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#ef4444",
                    }}
                  >
                    {hasData ? stats.max : "-"}
                  </p>
                  <p
                    style={{
                      marginLeft: "0.25rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    {hasData ? "bpm" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "#fef2f2", padding: "0.5rem 1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>
                {!hasData
                  ? "Aguardando dados..."
                  : stats.max > 100
                  ? "Acima do normal"
                  : "Dentro do esperado"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
