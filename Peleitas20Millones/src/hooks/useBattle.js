import { useState, useCallback } from 'react';

export const useBattle = (p1, p2) => {
    const [gameState, setGameState] = useState({
        p1HP: p1.hp,
        p2HP: p2.hp,
        p1History: [], // Track last 2 move indices for P1
        p2History: [], // Track last 2 move indices for P2
        currentTurn: Math.random() < 0.5 ? 'p1' : 'p2',
        logs: [`Battle Start: ${p1.name} VS ${p2.name}!`],
        isGameOver: false,
        winner: null,
        isAnimating: false,
        lastDamage: 0,
        lastAttacker: null
    });

    const attack = useCallback((attackIdx) => {
        if (gameState.isGameOver || gameState.isAnimating) return;

        const playerKey = gameState.currentTurn;
        const historyKey = `${playerKey}History`;

        // Check if move is on cooldown (cannot repeat until 2 other moves selected)
        if (gameState[historyKey].includes(attackIdx)) return;

        const attacker = playerKey === 'p1' ? p1 : p2;
        const target = playerKey === 'p1' ? 'p2' : 'p1';
        const move = attacker.attacks[attackIdx];

        // Calculate hidden damage
        const damage = Math.floor(
            Math.random() * (move.damageRange[1] - move.damageRange[0] + 1) + move.damageRange[0]
        );

        setGameState(prev => {
            const newHP = prev[`${target}HP`] - damage;
            const actualHP = Math.max(0, newHP);
            const isOver = actualHP === 0;

            // Update history: keep only last 3 used moves to block repetition
            const newHistory = [attackIdx, ...prev[historyKey]].slice(0, 3);

            return {
                ...prev,
                [`${target}HP`]: actualHP,
                [historyKey]: newHistory,
                logs: [`${attacker.name} used ${move.name}!`, ...prev.logs].slice(0, 5),
                isAnimating: true,
                lastDamage: damage,
                lastAttacker: prev.currentTurn,
                isGameOver: isOver,
                winner: isOver ? attacker : null
            };
        });

        // Reset animation state and change turn
        setTimeout(() => {
            setGameState(prev => {
                if (prev.isGameOver) return { ...prev, isAnimating: false };
                return {
                    ...prev,
                    isAnimating: false,
                    currentTurn: prev.currentTurn === 'p1' ? 'p2' : 'p1'
                };
            });
        }, 2000);
    }, [gameState, p1, p2]);

    return {
        ...gameState,
        attack,
        setGameState
    };
};
