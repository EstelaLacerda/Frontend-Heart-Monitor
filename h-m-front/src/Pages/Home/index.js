import AllReadings from "../../Components/AllReadings";
import Footer from "../../Components/Footer";
import Header from "../../Components/Header";
import Latest from "../../Components/Latest";
import styles from "./Home.module.css";

export default function Home() {
    return (
        <>
            <div className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <AllReadings/>
                </div>
                <div className={styles.content}>
                    <Latest/>
                </div>
                <Footer />
            </div>
        </>
    );
}
