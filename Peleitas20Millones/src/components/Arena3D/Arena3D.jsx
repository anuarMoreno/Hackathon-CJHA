import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, CameraShake } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Glitch } from '@react-three/postprocessing';
import { Monolith } from './Monolith';
import { GalaxyBackground } from './GalaxyBackground';
import { AttackVFX } from './AttackVFX';
import { FloatingParticles } from './FloatingParticles';
import * as THREE from 'three';

export const Arena3D = ({ p1, p2, lastAttacker, isAnimating }) => {
    // Randomly pick a VFX type when an animation starts
    const vfxType = useMemo(() => Math.floor(Math.random() * 3), [isAnimating, lastAttacker]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <Canvas shadows gl={{ antialias: false, stencil: false, alpha: false }}>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={50} />

                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 5, 5]} intensity={5} color={p1.color} />
                    <pointLight position={[-10, 5, 5]} intensity={5} color={p2.color} />

                    {/* Environment */}
                    <GalaxyBackground isAnimating={isAnimating} />
                    <FloatingParticles isAnimating={isAnimating} />
                    <Environment preset="night" />

                    {/* Impact Feel (Toned down) */}
                    {isAnimating && (
                        <CameraShake
                            maxYaw={0.02}
                            maxPitch={0.02}
                            maxRoll={0.02}
                            yawFrequency={10}
                            pitchFrequency={10}
                            rollFrequency={10}
                        />
                    )}

                    {/* Fighters */}
                    <Monolith
                        character={p1}
                        position={[-4, 1.75, 0]}
                        isAttacking={lastAttacker === 'p1' && isAnimating}
                        isBeingHit={lastAttacker === 'p2' && isAnimating}
                        side="p1"
                    />

                    <Monolith
                        character={p2}
                        position={[4, 1.75, 0]}
                        isAttacking={lastAttacker === 'p2' && isAnimating}
                        isBeingHit={lastAttacker === 'p1' && isAnimating}
                        side="p2"
                    />

                    {/* Dynamic VFX */}
                    {isAnimating && (
                        <AttackVFX
                            attacker={lastAttacker}
                            type={vfxType}
                            color={lastAttacker === 'p1' ? p1.color : p2.color}
                        />
                    )}

                    {/* Post Processing for Spectacular Effects */}
                    <EffectComposer disableNormalPass>
                        <Bloom
                            luminanceThreshold={0.2}
                            mipmapBlur
                            intensity={1.5}
                            radius={0.4}
                        />
                        <Noise opacity={0.05} />
                        {isAnimating && (
                            <>
                                <ChromaticAberration offset={[0.005, 0.005]} />
                                <Glitch
                                    delay={[0, 0]}
                                    duration={[0.1, 0.3]}
                                    strength={[0.1, 0.3]}
                                    active={isAnimating}
                                    ratio={0.1}
                                />
                            </>
                        )}
                    </EffectComposer>
                </Suspense>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    minDistance={8}
                    maxDistance={20}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>
        </div>
    );
};

export default Arena3D;
