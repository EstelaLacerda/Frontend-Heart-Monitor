import styles from './Footer.module.css';

export default function Footer () {
    return(
        <>
            <div className={styles.foot}>
                <img className={styles.logo} src='/images/HMlogo.png' alt='Logo do site' />
            </div>
        </>
    );
}
