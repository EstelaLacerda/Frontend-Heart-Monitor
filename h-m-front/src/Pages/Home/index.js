import Footer from "../../Components/Footer";
import Header from "../../Components/Header";
import styles from "./Home.module.css";

export default function Home() {
    return (
        <>
            <div className={styles.container}>
                <Header />
                <div className={styles.content}>

                </div>
                <Footer />
            </div>
        </>
    );
}
