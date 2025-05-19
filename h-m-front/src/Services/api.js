class HttpHelper {
  constructor() {
    this.baseUrl = "http://localhost:8080/";
  }
  async get(url) {
    const response = await fetch(`${this.baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post(url, data) {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

export default class ApiService {
  static httpHelper = new HttpHelper();

  static getAllReadings() {
    return this.httpHelper.get("heartrate");
  }

  static getReadingById(readingId) {
    return this.httpHelper.get(`heartrate/${readingId}`);
  }

  static getLatestReadings(count) {
    return this.httpHelper.get(`heartrate/latest/${count}`);
  }
  // No ApiService.js, modifique o método streamHeartRate:
  static streamHeartRate(
    onInitialReading,
    onNewReading,
    onError,
    onOpen = null
  ) {
    const eventSource = new EventSource(
      `${this.httpHelper.baseUrl}heartrate/stream`
    );

    // Manipular a abertura da conexão
    eventSource.onopen = () => {
      console.log("Conexão SSE aberta");
      if (onOpen) {
        onOpen();
      }
    };

    // Escutar o evento 'initial_reading'
    eventSource.addEventListener("initial_reading", (event) => {
      console.log("Evento initial_reading recebido:", event.data);

      try {
        // Tente analisar o JSON e verificar a estrutura dos dados
        const parsedData = JSON.parse(event.data);
        console.log("Dados analisados:", parsedData);

        if (onInitialReading) {
          onInitialReading(parsedData);
        }
      } catch (error) {
        console.error("Erro ao processar initial_reading:", error, event.data);
      }
    });

    // Escutar o evento 'new_reading'
    eventSource.addEventListener("new_reading", (event) => {
      console.log("Evento new_reading recebido:", event.data);

      try {
        // Tente analisar o JSON e verificar a estrutura dos dados
        const parsedData = JSON.parse(event.data);
        console.log("Dados analisados:", parsedData);

        if (onNewReading) {
          onNewReading(parsedData);
        }
      } catch (error) {
        console.error("Erro ao processar new_reading:", error, event.data);
      }
    });

    // Manipular erros
    eventSource.onerror = (event) => {
      console.error("Erro no EventSource:", event);
      if (onError) {
        onError(event);
      }
    };

    // Retornar o objeto eventSource para permitir fechamento posterior
    return eventSource;
  }
    static getStatus() {
      return this.httpHelper.get("measurement/status");
    }
    static toggle(){
      return this.httpHelper.post("measurement/toggle");
    }
}
