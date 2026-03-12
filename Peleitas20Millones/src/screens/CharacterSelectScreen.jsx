import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHARACTERS } from '../data/characters';
import styles from './CharacterSelectScreen.module.css';
import { Star, Swords } from 'lucide-react';

const ControlKeys = ({ player }) => {
    const keys = player === 'p1' ? ['W', 'A', 'S', 'D', 'SPACE'] : ['I', 'J', 'K', 'L', 'ENTER'];
    return (
        <div className={`${styles.playerLabel} ${player === 'p1' ? styles.p1Label : styles.p2Label}`}>
            <span style={{ marginBottom: '10px', display: 'block' }}>PLAYER {player === 'p1' ? '1' : '2'}</span>
            <div className={styles.controlsGrid}>
                <div className={`${styles.keycap} ${styles[`key${keys[0]}`]}`}>{keys[0]}</div>
                <div className={`${styles.keycap} ${styles[`key${keys[1]}`]}`}>{keys[1]}</div>
                <div className={`${styles.keycap} ${styles[`key${keys[2]}`]}`}>{keys[2]}</div>
                <div className={`${styles.keycap} ${styles[`key${keys[3]}`]}`}>{keys[3]}</div>
            </div>
            <div className={styles.actionKey}>{keys[4]} SELECT</div>
        </div>
    );
};

const CharacterSelectScreen = ({ onBack, onComplete }) => {
    const [p1Idx, setP1Idx] = useState(0);
    const [p2Idx, setP2Idx] = useState(9);
    const [p1Selected, setP1Selected] = useState(null);
    const [p2Selected, setP2Selected] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            // P1 Controls: A, D, W, S, Space
            if (!p1Selected) {
                if (key === 'a') setP1Idx(prev => (prev % 2 === 1 ? prev - 1 : prev + 1)); // Toggle column
                if (key === 'd') setP1Idx(prev => (prev % 2 === 0 ? prev + 1 : prev - 1)); // Toggle column
                if (key === 'w') setP1Idx(prev => (prev >= 2 ? prev - 2 : prev + 8)); // Up (wrap around)
                if (key === 's') setP1Idx(prev => (prev <= 7 ? prev + 2 : prev - 8)); // Down (wrap around)
                if (key === ' ') setP1Selected(CHARACTERS[p1Idx]);
            }

            // P2 Controls: J, L, I, K, Enter
            if (!p2Selected) {
                if (key === 'j') setP2Idx(prev => (prev % 2 === 1 ? prev - 1 : prev + 1)); // Toggle column
                if (key === 'l') setP2Idx(prev => (prev % 2 === 0 ? prev + 1 : prev - 1)); // Toggle column
                if (key === 'i') setP2Idx(prev => (prev >= 2 ? prev - 2 : prev + 8)); // Up (wrap around)
                if (key === 'k') setP2Idx(prev => (prev <= 7 ? prev + 2 : prev - 8)); // Down (wrap around)
                if (key === 'enter') setP2Selected(CHARACTERS[p2Idx]);
            }

            // Reset selection (Optional: Backspace or Esc)
            if (key === 'escape') onBack();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [p1Idx, p2Idx, p1Selected, p2Selected, onBack]);

    useEffect(() => {
        if (p1Selected && p2Selected) {
            const timer = setTimeout(() => {
                onComplete(p1Selected, p2Selected);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [p1Selected, p2Selected, onComplete]);

    const renderStats = (stats) => (
        <div className={styles.statsGrid}>
            {Object.entries(stats).map(([name, value]) => (
                <div key={name} className={styles.statRow}>
                    <span className={styles.statName}>{name}</span>
                    <div className={styles.statBarContainer}>
                        <motion.div
                            className={styles.statBar}
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / 5) * 100}%` }}
                            style={{ backgroundColor: 'var(--accent-color)' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStars = (rating) => (
        <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(rating) ? 'gold' : 'transparent'}
                    stroke={i < Math.floor(rating) ? 'gold' : '#444'}
                    className={i === Math.floor(rating) && rating % 1 !== 0 ? styles.halfStar : ''}
                />
            ))}
            <span className={styles.ratingText}>{rating}</span>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <motion.h1
                    className={styles.title}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    SELECT CHARACTER
                </motion.h1>
            </div>

            <div className={styles.mainArea}>
                {/* P1 Preview */}
                <div className={`${styles.preview} ${styles.p1Preview}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={CHARACTERS[p1Idx].id}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            className={styles.previewContent}
                        >
                            <h2 style={{ color: CHARACTERS[p1Idx].color }}>
                                <i className={`${CHARACTERS[p1Idx].icon} ${styles.previewIcon}`}></i>
                                {CHARACTERS[p1Idx].name}
                            </h2>
                            {renderStars(CHARACTERS[p1Idx].stars)}
                            {renderStats(CHARACTERS[p1Idx].stats)}
                            {p1Selected && <motion.div className={styles.readyBadge} initial={{ scale: 0 }} animate={{ scale: 1 }}>READY</motion.div>}
                        </motion.div>
                    </AnimatePresence>
                    <ControlKeys player="p1" />
                </div>

                {/* Grid */}
                <div className={styles.gridContainer}>
                    <div className={styles.grid}>
                        {CHARACTERS.map((char, idx) => (
                            <div
                                key={char.id}
                                className={`
                  ${styles.gridItem} 
                  ${p1Idx === idx ? styles.p1Hover : ''} 
                  ${p2Idx === idx ? styles.p2Hover : ''}
                  ${p1Selected?.id === char.id ? styles.p1Locked : ''}
                  ${p2Selected?.id === char.id ? styles.p2Locked : ''}
                `}
                                style={{ '--char-color': char.color }}
                            >
                                <i className={`${char.icon} ${styles.gridIcon}`}></i>
                                <span className={styles.charName}>{char.name}</span>
                                {p1Idx === idx && <div className={styles.p1Pointer}>P1</div>}
                                {p2Idx === idx && <div className={styles.p2Pointer}>P2</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* P2 Preview */}
                <div className={`${styles.preview} ${styles.p2Preview}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={CHARACTERS[p2Idx].id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 50, opacity: 0 }}
                            className={styles.previewContent}
                        >
                            <h2 style={{ color: CHARACTERS[p2Idx].color }}>
                                <i className={`${CHARACTERS[p2Idx].icon} ${styles.previewIcon}`}></i>
                                {CHARACTERS[p2Idx].name}
                            </h2>
                            {renderStars(CHARACTERS[p2Idx].stars)}
                            {renderStats(CHARACTERS[p2Idx].stats)}
                            {p2Selected && <motion.div className={styles.readyBadge} initial={{ scale: 0 }} animate={{ scale: 1 }}>READY</motion.div>}
                        </motion.div>
                    </AnimatePresence>
                    <ControlKeys player="p2" />
                </div>
            </div>

            {p1Selected && p2Selected && (
                <motion.div
                    className={styles.vsOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Swords size={120} color="var(--accent-color)" />
                    <h2 className={styles.vsText}>INITIALIZING BATTLE...</h2>
                </motion.div>
            )}

            {/* Visual Overlays */}
            <div className={styles.overlay}></div>
        </div>
    );
};

export default CharacterSelectScreen;
