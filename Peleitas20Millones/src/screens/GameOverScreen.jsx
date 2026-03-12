import React from 'react';
import { motion } from 'framer-motion';
import styles from './GameOverScreen.module.css';
import { Trophy, RefreshCw, Home } from 'lucide-react';

const GameOverScreen = ({ winner, onRestart, onHome }) => {
    return (
        <div className={styles.container}>
            <div className={styles.overlay}></div>

            <motion.div
                className={styles.content}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.winnerTitle}>
                    <Trophy className={styles.trophyIcon} size={80} color="gold" />
                    <h1>VICTORY!</h1>
                </div>

                <motion.div
                    className={styles.winnerCard}
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    style={{ '--char-color': winner.color }}
                >
                    <i className={`${winner.icon} ${styles.winnerIcon}`}></i>
                    <h2 className={styles.winnerName}>{winner.name.toUpperCase()}</h2>
                    <p className={styles.winnerSub}>HAS TERMINATED THE OPPOSITION</p>
                </motion.div>

                <div className={styles.btnGroup}>
                    <motion.button
                        className={styles.actionBtn}
                        onClick={onRestart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RefreshCw size={24} />
                        REMATCH
                    </motion.button>

                    <motion.button
                        className={`${styles.actionBtn} ${styles.homeBtn}`}
                        onClick={onHome}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Home size={24} />
                        MAIN MENU
                    </motion.button>
                </div>
            </motion.div>

            <div className={styles.scanline}></div>
        </div>
    );
};

export default GameOverScreen;
