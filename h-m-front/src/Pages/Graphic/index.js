import HeartRateChart from "../../Components/HeartRateChart";

export default function Graphic() {
  return (
    <div className="text-4xl">
      <h1 className="text-center">Heart Rate Chart</h1>
      <div className="flex flex-col items-center">
        <HeartRateChart />
      </div>
    </div>
  );
}
