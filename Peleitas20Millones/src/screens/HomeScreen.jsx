import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { GalaxyBackground } from '../components/Arena3D/GalaxyBackground';
import { FloatingParticles } from '../components/Arena3D/FloatingParticles';
import styles from './HomeScreen.module.css';

const HomeScreen = ({ onStart }) => {
    return (
        <div className={styles.container}>
            {/* 3D Background */}
            <div className={styles.canvasContainer}>
                <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                    <Suspense fallback={null}>
                        <GalaxyBackground isAnimating={false} />
                        <FloatingParticles isAnimating={true} />
                    </Suspense>
                </Canvas>
            </div>

            <motion.div
                className={styles.content}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className={styles.titleWrapper}>
                    <motion.h1
                        className={styles.title}
                        animate={{
                            textShadow: [
                                "0 0 10px #fff, 0 0 20px var(--accent-color)",
                                "0 0 5px #fff, 0 0 10px var(--accent-color)",
                                "0 0 10px #fff, 0 0 20px var(--accent-color)"
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        CODE <span className={styles.vs}>VS</span> CODE
                    </motion.h1>
                    <div className={styles.glitchLayer}>CODE VS CODE</div>
                </div>

                <p className={styles.subtitle}>20 MILLION PELEITAS CHALLENGE</p>

                <div className={styles.btnWrapper}>
                    <motion.button
                        className={styles.playButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onStart}
                    >
                        <span className={styles.btnText}>INITIALIZE BATTLE</span>
                        <div className={styles.btnGlitch}></div>
                        <div className={styles.btnBorder}></div>
                    </motion.button>
                </div>

                <div className={styles.footer}>
                    &gt; SYSTEM LOADED: 100%<br />
                    &gt; PLAYER_1: READY | PLAYER_2: READY
                </div>
            </motion.div>

            {/* Visual Overlays */}
            <div className={styles.scanline}></div>
            <div className={styles.crtNoise}></div>
        </div>
    );
};

export default HomeScreen;
