import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Ring, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';

export const AttackVFX = ({ attacker, type, color }) => {
    const beamRef = useRef();
    const ringRef = useRef();
    const side = attacker === 'p1' ? 1 : -1;

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        if (beamRef.current) {
            // Slower flickering and fading
            beamRef.current.scale.x = 1.2 + Math.sin(time * 30) * 0.2;
            beamRef.current.scale.z = 1.2 + Math.sin(time * 30) * 0.2;
            if (beamRef.current.material) {
                beamRef.current.material.opacity = THREE.MathUtils.lerp(beamRef.current.material.opacity, 0, delta * 1.5);
            }
        }

        if (ringRef.current) {
            // Smoother expansion
            ringRef.current.scale.x += delta * 15;
            ringRef.current.scale.y += delta * 15;
            ringRef.current.scale.z += delta * 15;
            if (ringRef.current.material) {
                ringRef.current.material.opacity -= delta * 1.5;
            }
        }
    });

    return (
        <group position={[side * 2, 1.75, 0]} rotation={[0, 0, side * Math.PI / 2]}>
            {type === 0 && ( // Smooth CyberBeam
                <group>
                    <mesh ref={beamRef}>
                        <cylinderGeometry args={[0.5, 0.5, 12, 16]} />
                        <meshBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
                    </mesh>
                    <Sparkles count={150} scale={[4, 12, 4]} size={4} speed={2} color={color} />
                    <pointLight intensity={10} distance={15} color={color} />
                </group>
            )}

            {type === 1 && ( // Elegant Shockwave
                <group ref={ringRef}>
                    <Ring args={[0.6, 0.9, 64]} rotation={[0, side * Math.PI / 2, 0]}>
                        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
                    </Ring>
                    <Torus args={[1.2, 0.03, 16, 100]} rotation={[0, side * Math.PI / 2, 0]}>
                        <meshBasicMaterial color="#fff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
                    </Torus>
                    <Sparkles count={100} scale={8} size={2} speed={1} color={color} />
                </group>
            )}

            {type === 2 && ( // Ethereal BinaryBurst (Lingering)
                <group>
                    <Sparkles
                        count={300}
                        scale={12}
                        size={6}
                        speed={2}
                        color={color}
                        noise={0.5}
                    />
                    <Sparkles
                        count={50}
                        scale={6}
                        size={10}
                        speed={0.5}
                        color="#fff"
                    />
                    <pointLight intensity={15} distance={20} color={color} />
                </group>
            )}
        </group>
    );
};
