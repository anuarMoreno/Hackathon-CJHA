import React, { useRef } from 'react';
import { Stars, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const GalaxyBackground = ({ isAnimating }) => {
    const nebulaRef = useRef();

    useFrame((state, delta) => {
        if (nebulaRef.current) {
            const targetOpacity = isAnimating ? 0.6 : 0.2;
            nebulaRef.current.opacity = THREE.MathUtils.lerp(nebulaRef.current.opacity, targetOpacity, delta * 5);
            nebulaRef.current.distort = isAnimating ? 0.8 : 0.4;
        }
    });

    return (
        <>
            <Stars radius={100} depth={50} count={7000} factor={6} saturation={1} fade speed={2} />

            {/* Outer Nebula */}
            <Sphere args={[60, 32, 32]}>
                <meshBasicMaterial
                    color="#050515"
                    side={THREE.BackSide}
                    transparent
                    opacity={0.5}
                />
            </Sphere>

            {/* Reactive Nebula */}
            <Sphere args={[55, 64, 64]}>
                <MeshDistortMaterial
                    ref={nebulaRef}
                    color="#2a004a"
                    side={THREE.BackSide}
                    speed={1.5}
                    distort={0.4}
                    transparent
                    opacity={0.2}
                    blending={THREE.AdditiveBlending}
                />
            </Sphere>

            {/* Cosmic Dust */}
            <Stars radius={50} depth={20} count={1000} factor={2} saturation={0} fade speed={5} />
        </>
    );
};
