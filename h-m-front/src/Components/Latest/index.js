import Api from "../../Services/api";
import { useState } from "react";

export default function Latest() {
    const [response, setResponse] = useState([]);
    const [input, setInput] = useState(0);

    const handleGet = async () => {
        const data = await Api.getLatestReadings(input);
        setResponse(data);
    };

    return (
        <div className="text-4xl">
            <h1>Write count</h1>
            <input type="number" value={input} onChange={(e) => setInput(e.target.value)} />
            <button onClick={handleGet}>Get</button>
            <div className="flex flex-col items-center">
                <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
        </div>
    );
}
