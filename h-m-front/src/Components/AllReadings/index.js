import Api from "../../Services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AllReadings() {
  const [response, setResponse] = useState([]);
  const get = async () => {
    setResponse(await Api.getAllReadings());
  };
  useEffect(() => {
    get();
  }, []);
  return (
    <div className="text-4xl">
      <h1 className="text-center">All Readings</h1>
      <div className="flex flex-col items-center">
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    </div>
  );
}
