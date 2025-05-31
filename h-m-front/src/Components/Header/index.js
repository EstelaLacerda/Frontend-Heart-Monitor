import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";

export default function Header() {
    const navigate = useNavigate();

    return (
        <div className={styles.head}>
            <div className={styles.innerContent}>
                <div className={styles.leftSide}>
                    <img className={styles.logo} src='/images/HMlogo.png' alt='Logo do site' />
                    <div className={styles.title}>Heart Monitor</div>
                </div>
                <div className={styles.rightSide}>
                    <span className={styles.links} onClick={() => navigate('/')}>Início</span>
                    <span className={styles.links} onClick={() => navigate('/about')}>Sobre</span>
                </div>
            </div>
        </div>
    );
}
