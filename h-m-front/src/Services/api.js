class HttpHelper { 
    constructor() {
        this.baseUrl = 'http://localhost:8080/';
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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
        return this.httpHelper.get('heartrate');
    }

    static getReadingById(readingId) {
        return this.httpHelper.get(`heartrate/${readingId}`);
    }

    static getLatestReadings(count) {
        return this.httpHelper.get(`heartrate/latest/${count}`);
    }

    static streamHeartRate(onMessage, onError) {
        const eventSource = new EventSource(`${this.httpHelper.baseUrl}heartrate/stream`);
        eventSource.onmessage = (event) => {
            if (onMessage) onMessage(event);
        };
        eventSource.onerror = (event) => {
            if (onError) onError(event);
            eventSource.close();
        };
        return eventSource;
    }
}