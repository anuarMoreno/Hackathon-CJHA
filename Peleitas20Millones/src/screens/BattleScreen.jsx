import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBattle } from '../hooks/useBattle';
import Arena3D from '../components/Arena3D/Arena3D';
import styles from './BattleScreen.module.css';

const HealthBar = ({ current, max, color }) => {
    const percentage = (current / max) * 100;
    const barColor = percentage > 50 ? 'var(--hp-green)' : percentage > 20 ? 'var(--hp-yellow)' : 'var(--hp-red)';

    return (
        <div className={styles.hpContainer}>
            <div className={styles.hpLabel}>HP: {current} / {max}</div>
            <div className={styles.hpBar}>
                <motion.div
                    className={styles.hpFill}
                    initial={{ width: '100%' }}
                    animate={{ width: `${percentage}%` }}
                    style={{ backgroundColor: barColor, color: barColor }}
                />
            </div>
        </div>
    );
};

const BattleScreen = ({ p1, p2, onGameOver }) => {
    const {
        p1HP, p2HP,
        p1History, p2History,
        currentTurn,
        logs,
        isGameOver,
        winner,
        isAnimating,
        lastDamage,
        lastAttacker,
        attack
    } = useBattle(p1, p2);

    useEffect(() => {
        if (isGameOver && winner) {
            const timer = setTimeout(() => {
                onGameOver(winner);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isGameOver, winner, onGameOver]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isAnimating || isGameOver) return;
            const key = e.key;

            // Map numbers 1-8 to indices 0-7
            const val = parseInt(key);
            if (!isNaN(val) && val >= 1 && val <= 8) {
                const idx = val - 1;
                const history = currentTurn === 'p1' ? p1History : p2History;
                if (!history.includes(idx)) attack(idx);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [attack, currentTurn, isAnimating, isGameOver, p1History, p2History]);

    return (
        <div className={styles.container}>
            {/* Top Bar - Health */}
            <header className={styles.header}>
                <div className={styles.playerInfo} style={{ color: p1.color }}>
                    <div className={styles.charName}>{p1.name}</div>
                    <HealthBar current={p1HP} max={p1.hp} color={p1.color} />
                </div>
                <div className={styles.playerInfo} style={{ color: p2.color, textAlign: 'right' }}>
                    <div className={styles.charName}>{p2.name}</div>
                    <HealthBar current={p2HP} max={p2.hp} color={p2.color} />
                </div>
            </header>

            {/* Battle Arena 3D */}
            <div className={styles.arena}>
                <Arena3D
                    p1={p1}
                    p2={p2}
                    lastAttacker={lastAttacker}
                    isAnimating={isAnimating}
                />

                <AnimatePresence>
                    {isAnimating && lastDamage > 0 && (
                        <motion.div
                            initial={{ y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ y: -100, opacity: 1, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            className={styles.damagePopup}
                            style={{
                                left: lastAttacker === 'p1' ? '70%' : '30%',
                                top: '40%'
                            }}
                        >
                            -{lastDamage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom UI - Controls & Logs */}
            <div className={styles.controlsPanel}>
                {!isGameOver && (
                    <motion.div
                        className={styles.turnIndicatorWrapper}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={currentTurn}
                    >
                        <div className={styles.turnLabel}>CURRENT TURN</div>
                        <div className={`${styles.turnName} ${currentTurn === 'p1' ? styles.p1Text : styles.p2Text}`}>
                            {currentTurn === 'p1' ? p1.name : p2.name}
                        </div>
                    </motion.div>
                )}

                <div className={styles.attackGrid}>
                    {(currentTurn === 'p1' ? p1 : p2).attacks.map((move, idx) => {
                        const isCooldowned = (currentTurn === 'p1' ? p1History : p2History).includes(idx);

                        return (
                            <button
                                key={idx}
                                className={`
                                    ${styles.attackBtn} 
                                    ${isCooldowned ? styles.cooldown : ''}
                                    ${currentTurn === 'p1' ? styles.p1Btn : styles.p2Btn}
                                `}
                                onClick={() => attack(idx)}
                                disabled={isAnimating || isCooldowned}
                            >
                                <div className={styles.keycap}>{idx + 1}</div>
                                <div className={styles.moveInfo}>
                                    <span className={styles.moveName}>{move.name}</span>
                                    {isCooldowned && <span className={styles.cooldownLabel}>COOLING DOWN...</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={styles.logContainer}>
                {logs.map((log, i) => (
                    <div key={i} className={styles.logEntry}>{log}</div>
                ))}
            </div>

            {/* Overlays */}
            <div className={styles.scanline}></div>
        </div>
    );
};

export default BattleScreen;
