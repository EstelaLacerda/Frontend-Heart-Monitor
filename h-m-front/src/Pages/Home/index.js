import Footer from "../../Components/Footer";
import Header from "../../Components/Header";
import HeartRateChart from "../../Components/HeartRateChart";
import styles from "./Home.module.css";
import "../../index.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <div>
        <HeartRateChart />
      </div>
      <Footer />
    </div>
  );
}
