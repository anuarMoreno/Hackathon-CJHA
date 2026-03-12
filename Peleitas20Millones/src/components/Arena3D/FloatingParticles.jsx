import React from 'react';
import { Sparkles } from '@react-three/drei';

export const FloatingParticles = ({ isAnimating }) => {
    return (
        <group>
            {/* Persistant ambient dust */}
            <Sparkles
                count={200}
                speed={0.3}
                opacity={0.4}
                color="#ffffff"
                size={2}
                scale={[20, 10, 20]}
            />

            {/* Intense burst dust when attacking */}
            {isAnimating && (
                <Sparkles
                    count={150}
                    speed={1.5}
                    opacity={0.6}
                    color="#8888ff"
                    size={4}
                    scale={[15, 8, 15]}
                />
            )}
        </group>
    );
};
