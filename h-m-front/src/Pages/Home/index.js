import AllReadings from "../../Components/AllReadings";
import Footer from "../../Components/Footer";
import Header from "../../Components/Header";
import HeartRateChart from "../../Components/HeartRateChart";
import Latest from "../../Components/Latest";
import styles from "./Home.module.css";
import '../../index.css';

export default function Home() {
  return (
    <>
      <div className={styles.container}>
        <Header />
        <div style={ {padding: "30px",} }>
            <HeartRateChart />
          <Latest />
          <AllReadings />
          <Footer />
                </div>
        </div>
    </>
  );
}
