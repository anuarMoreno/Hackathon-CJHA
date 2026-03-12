import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const Monolith = ({ character, position, isAttacking, isBeingHit, side }) => {
    const groupRef = useRef();
    const meshRef = useRef();
    const targetX = useRef(position[0]);
    const currentX = useRef(position[0]);
    const recoilY = useRef(0);

    useEffect(() => {
        if (isAttacking) {
            // Smoother lunge
            targetX.current = side === 'p1' ? position[0] + 2 : position[0] - 2;
        } else {
            targetX.current = position[0];
        }
    }, [isAttacking, position, side]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Slower LERP for smoother movement
            currentX.current = THREE.MathUtils.lerp(currentX.current, targetX.current, delta * 8);

            let shake = 0;
            let rotationZ = 0;

            if (isBeingHit) {
                // Softened shake
                shake = Math.sin(state.clock.elapsedTime * 40) * 0.15;
                rotationZ = side === 'p1' ? -0.15 : 0.15;
                recoilY.current = THREE.MathUtils.lerp(recoilY.current, 0.4, delta * 15);
            } else {
                recoilY.current = THREE.MathUtils.lerp(recoilY.current, 0, delta * 5);
            }

            groupRef.current.position.x = currentX.current + shake;
            groupRef.current.position.y = position[1] + recoilY.current;
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, rotationZ, delta * 10);

            if (meshRef.current) {
                const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
                meshRef.current.material.emissiveIntensity = (isAttacking || isBeingHit ? 3 : 1.5) * pulse;
            }
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            <group ref={groupRef} position={[position[0], position[1], position[2]]}>
                {/* The Monolith Body */}
                <mesh ref={meshRef}>
                    <boxGeometry args={[1.5, 3.5, 0.5]} />
                    <MeshDistortMaterial
                        color={character.color}
                        speed={isBeingHit ? 8 : 2}
                        distort={isBeingHit ? 0.3 : 0.1}
                        metalness={1}
                        roughness={0.1}
                        transparent
                        opacity={0.9}
                        emissive={character.color}
                        emissiveIntensity={1}
                    />
                </mesh>

                {/* Aura / Shield (Reduced intensity) */}
                <mesh scale={[1.1, 1.05, 1.1]}>
                    <boxGeometry args={[1.5, 3.5, 0.5]} />
                    <meshBasicMaterial
                        color={character.color}
                        wireframe
                        transparent
                        opacity={isAttacking || isBeingHit ? 0.4 : 0.05}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Floating Logo */}
                <Html position={[0, 0, 0.4]} center transform distanceFactor={5}>
                    <div style={{
                        color: '#fff',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        filter: `drop-shadow(0 0 15px ${character.color})`
                    }}>
                        <i className={character.icon} style={{
                            fontSize: '80px',
                            opacity: isBeingHit ? 0.6 : 1,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}></i>
                    </div>
                </Html>
            </group>
        </Float>
    );
};
