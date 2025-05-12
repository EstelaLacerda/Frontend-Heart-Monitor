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

export default function HeartRateChart() {
  const [heartRateData, setHeartRateData] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0, alerts: 0 });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calcula estatísticas dos dados de batimentos cardíacos
  const calculateStats = useCallback(
    (data) => {
      if (!data || data.length === 0)
        return { min: 0, max: 0, avg: 0, alerts: stats.alerts };

      const bpmValues = data.map((item) => item.bpm);
      const min = Math.min(...bpmValues);
      const max = Math.max(...bpmValues);
      const avg = Math.round(
        bpmValues.reduce((sum, val) => sum + val, 0) / bpmValues.length
      );

      return { min, max, avg, alerts: stats.alerts };
    },
    [stats.alerts]
  );

  // Verifica alertas baseados em mudanças significativas ou valores anormais
  const checkAlerts = useCallback((newReading, prevData) => {
    // Sem dados anteriores, não pode comparar
    if (!prevData || prevData.length === 0) return null;

    const lastReading = prevData[prevData.length - 1];
    const change = Math.abs(newReading.bpm - lastReading.bpm);

    // Alerta para BPM muito baixo (bradicardia)
    if (newReading.bpm < 40) {
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      return {
        type: "low",
        message: `Batimentos baixos detectados: ${newReading.bpm} BPM`,
        time: newReading.time,
      };
    }

    // Alerta para BPM muito alto (taquicardia)
    if (newReading.bpm > 100) {
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
      return {
        type: "high",
        message: `Batimentos elevados detectados: ${newReading.bpm} BPM`,
        time: newReading.time,
      };
    }

    // Alerta para variação súbita (mais de 30 BPM)
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

  // Inicializa com dados de teste para garantir que o gráfico seja renderizado
  // mesmo antes da chamada API ser concluída
  useEffect(() => {
    // Dados iniciais temporários para garantir a renderização do gráfico
    const tempData = [
      { time: "11:53:00", bpm: 42 },
      { time: "11:53:10", bpm: 42 },
      { time: "11:53:20", bpm: 24 },
      { time: "11:53:30", bpm: 24 },
      { time: "11:53:40", bpm: 60 },
      { time: "11:53:50", bpm: 78 },
      { time: "11:54:00", bpm: 60 },
      { time: "11:54:10", bpm: 48 },
      { time: "11:54:20", bpm: 36 },
      { time: "11:54:30", bpm: 72 },
    ];

    setHeartRateData(tempData);
    setStats(calculateStats(tempData));

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const latestReadings = await Api.getLatestReadings(60);

        // Verificar se a resposta é um array válido
        if (Array.isArray(latestReadings) && latestReadings.length > 0) {
          // Organizando os dados para o gráfico
          const formattedData = latestReadings
            .map((reading) => ({
              time: reading.data.timestamp,
              bpm: reading.data.bpm,
            }))
            .reverse(); // Inverter para mostrar do mais antigo ao mais recente

          setHeartRateData(formattedData);
          setStats(calculateStats(formattedData));
        } else {
          console.warn(
            "A API retornou dados vazios ou em formato inesperado:",
            latestReadings
          );
          // Mantém os dados temporários
        }
      } catch (error) {
        console.error("Erro ao obter leituras iniciais:", error);
        setError("Falha ao carregar os dados. Usando dados temporários.");
        // Já usamos os dados temporários, então não fazemos nada aqui
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [calculateStats]);

  // Configura o SSE para atualizações em tempo real
  useEffect(() => {
    let eventSource = null;

    if (isLive) {
      console.log("Iniciando conexão SSE...");

      // Função para lidar com novas mensagens
      const handleNewReading = (event) => {
        try {
          console.log("Nova leitura recebida:", event.data);
          const reading = JSON.parse(event.data);
          const newReading = {
            time: reading.data.timestamp,
            bpm: reading.data.bpm,
          };

          debugger;

          // Verifica por situações de alerta antes de atualizar o estado
          setHeartRateData((prevData) => {
            if (!prevData || !Array.isArray(prevData)) {
              console.warn("prevData não é um array:", prevData);
              return [newReading];
            }

            // Verifica alertas
            const newAlert = checkAlerts(newReading, prevData);
            if (newAlert) {
              setAlert(newAlert);
              // Limpa o alerta após 3 segundos
              setTimeout(() => setAlert(null), 3000);
            }

            // Cria uma cópia dos dados, adiciona o novo e mantém apenas os últimos 10
            const newData = [...prevData, newReading];

            // Mantém apenas os últimos 10 elementos
            if (newData.length > 10) {
              const result = newData.slice(newData.length - 10);
              // Atualiza as estatísticas
              setStats(calculateStats(result));
              return result;
            }

            // Atualiza as estatísticas
            setStats(calculateStats(newData));
            return newData;
          });
        } catch (error) {
          console.error("Erro ao processar nova leitura:", error);
        }
      };

      // Função para lidar com erros
      const handleError = (error) => {
        console.error("Erro na conexão SSE:", error);
        setIsLive(false);
      };

      // Inicializa a conexão SSE
      try {
        eventSource = Api.streamHeartRate(handleNewReading, handleError);
        console.log("Conexão SSE estabelecida");
      } catch (error) {
        console.error("Falha ao inicializar conexão SSE:", error);
      }
    }

    // Limpa a conexão SSE quando o componente for desmontado ou quando isLive mudar
    return () => {
      if (eventSource) {
        console.log("Fechando conexão SSE");
        eventSource.close();
      }
    };
  }, [isLive, calculateStats, checkAlerts]);

  // Determina a cor do BPM baseado no valor
  const getBpmColor = (bpm) => {
    if (bpm <= 40) return "#3b82f6"; // Azul - Baixo
    if (bpm <= 100) return "#10b981"; // Verde - Normal
    return "#ef4444"; // Vermelho - Alto
  };

  // Formata o timestamp para exibição
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.split(":").slice(0, 2).join(":");
  };

  // Define a cor do alerta baseado no tipo
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

  return (
    <div className={styles.foot}>
      <div className="w-full p-4 bg-white rounded-lg shadow-lg">
        {/* Cabeçalho com título e botão de live/pause */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Monitoramento Cardíaco
          </h2>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-md ${
              isLive
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } text-white font-medium transition-colors`}
          >
            {isLive ? "Ao Vivo" : "Pausado"}
          </button>
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
            <p className="ml-2 text-blue-600">Carregando dados...</p>
          </div>
        )}

        {/* Gráfico */}
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Frequência Cardíaca
        </h3>
        <div
          className="h-64 w-full border border-gray-200 rounded-md"
          style={{ minHeight: "250px" }}
        >
          <div
            className="w-full"
            style={{ aspectRatio: "16/9", minHeight: "250px" }}
          >
            <ResponsiveContainer width="50%" height="50%">
              <br />
              <LineChart
                width={500}
                height={300}
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
                  domain={[0, (dataMax) => Math.max(dataMax, 150)]}
                  label={{ value: "BPM", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} BPM`, "Frequência"]}
                  labelFormatter={(value) => `Hora: ${value}`}
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
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cartões de estatísticas */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">BPM Mínimo</p>
            <p className="text-2xl font-bold text-blue-600">{stats.min}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">BPM Médio</p>
            <p className="text-2xl font-bold text-green-600">{stats.avg}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">BPM Máximo</p>
            <p className="text-2xl font-bold text-red-600">{stats.max}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-gray-600">Alertas</p>
            <p className="text-2xl font-bold text-amber-600">{stats.alerts}</p>
          </div>
        </div>

        {/* Informação da última leitura */}
        {heartRateData.length > 0 && (
          <div className="mt-4 flex items-center">
            <p className="text-sm text-gray-600 mr-2">
              Última medição:{" "}
              {heartRateData[heartRateData.length - 1]?.time || ""}
            </p>
            <div className="flex items-center">
              <span
                className="px-3 py-1 rounded-full font-bold"
                style={{
                  backgroundColor: `${getBpmColor(
                    heartRateData[heartRateData.length - 1]?.bpm
                  )}20`,
                  color: getBpmColor(
                    heartRateData[heartRateData.length - 1]?.bpm
                  ),
                }}
              >
                {heartRateData[heartRateData.length - 1]?.bpm || 0} BPM
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
