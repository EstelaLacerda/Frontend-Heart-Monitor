import Footer from "../../Components/Footer";
import Header from "../../Components/Header";
import styles from "./About.module.css";

export default function About() {
    return (
        <>
            <div className={styles.container}>
                <Header />
                <div className={styles.content}>
                    <div className={styles.title}>Sobre</div>
                    <div className={styles.blocks}>
                        <div className={styles.block}>
                            <div className={styles.blockTitle}>Quem somos</div>
                            <p className={styles.blockText}>
                                Somos uma equipe formada por sete estudantes de
                                Ciência da Computação e, durante a disciplina de
                                Sistemas Embarcados, desenvolvemos um monitor
                                de batimentos cardíacos. O projeto é composto
                                por duas partes: o hardware, construído com MDF e
                                baseado em um microcontrolador ESP, e o software,
                                um site conectado ao Firebase, responsável por
                                monitorar em tempo real os batimentos cardíacos do usuário.
                            </p>
                        </div>
                        <div className={styles.block}>
                            <div className={styles.blockTitle}>Nossa equipe</div>
                            <p className={styles.blockText}>
                                Nossa equipe é composta dos seguintes desenvolvedores:
                                <ul>
                                    <li><a href="https://github.com/ArthurPaixaoTelles" target="_blank">Arthur Paixão</a></li>
                                    <li><a href="https://github.com/CarlosAugustoP" target="_blank">Carlos Augusto</a></li>
                                    <li><a href="https://github.com/EstelaLacerda" target="_blank">Estela Lacerda</a></li>
                                    <li><a href="https://github.com/grossiter04" target="_blank">Gabriel Rossiter</a></li>
                                    <li><a href="https://github.com/gabrielpires-1" target="_blank">Gabriel Pires</a></li>
                                    <li><a href="https://github.com/MatheusGom" target="_blank">Matheus Gomes</a></li>
                                    <li><a href="https://github.com/paulo-campos-57" target="_blank">Paulo Campos</a></li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
}