import React, { useState, useEffect, useRef } from 'react';
import { CyberCircuitBackground } from './CyberCircuitBackground';

interface LoadingScreenProps {
    /**
     * When true, the loader triggers its fade-out and calls onDone after the
     * CSS transition completes. While false, it stays fully visible.
     */
    ready: boolean;
    /** Called when the fade-out animation finishes — parent should unmount this component */
    onDone: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ ready, onDone }) => {
    const [visible, setVisible] = useState(true);
    const [progressSegments, setProgressSegments] = useState(1);
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useEffect(() => {
        if (!ready) return;
        // Fade out
        setVisible(false);
        // Unmount after transition (260ms) + buffer
        const timer = setTimeout(() => onDoneRef.current(), 320);
        return () => clearTimeout(timer);
    }, [ready]);

    // Animate the segmented progress bar (cycles from 1 to 5 segments)
    useEffect(() => {
        const interval = setInterval(() => {
            setProgressSegments((prev) => (prev >= 5 ? 1 : prev + 1));
        }, 320);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(155deg, #9b7fc7 0%, #7B5EA7 45%, #5a3d8a 100%)',
                transition: 'opacity 260ms ease-out',
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'all' : 'none',
                overflow: 'hidden',
                fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"
            }}
        >
            {/* Fondo Ciber-Digital de Circuitos Animados */}
            <CyberCircuitBackground />

            {/* 1. Placa de Título Neumórfica Crema HD (Inset) */}
            <div className="neu-inset-title py-3 px-8 text-center mb-8 relative z-10 flex flex-col items-center justify-center">
                <span
                    style={{
                        color: '#2c2440',
                        fontSize: '1.7rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        lineHeight: 1
                    }}
                >
                    SHOPDIGITAL
                </span>
                <span
                    style={{
                        color: '#4a3d6a',
                        fontSize: '8.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.22em',
                        marginTop: '5px'
                    }}
                >
                    CARGANDO SISTEMA
                </span>
            </div>

            {/* 2. Personaje 3D de Ari con Flotación y Sombra Dinámica */}
            <div
                style={{
                    position: 'relative',
                    width: '180px',
                    height: '240px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2rem'
                }}
                className="relative z-10"
            >
                <div className="ari-3d-avatar-container flex flex-col items-center justify-center h-full">
                    <img
                        src="/ari-pointing.png"
                        alt="Ari Asistente IA"
                        style={{
                            maxHeight: '220px',
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 8px 20px rgba(40,10,80,0.35))',
                            position: 'relative',
                            zIndex: 1
                        }}
                    />
                    <div className="ari-3d-shadow mt-1" />
                </div>
            </div>

            {/* 3. Barra de Progreso Neumórfica Crema Segmentada */}
            <div className="neu-plate relative z-10 py-2 px-3 flex items-center justify-center">
                <div
                    style={{
                        width: '180px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start'
                    }}
                >
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                width: '32px',
                                height: '100%',
                                background: idx < progressSegments ? '#ff6b6b' : 'rgba(200, 185, 170, 0.35)',
                                borderRadius: '0.6rem',
                                marginRight: idx < 4 ? '4px' : '0px',
                                transition: 'background-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
                                boxShadow: idx < progressSegments 
                                    ? '0 0 10px rgba(255,107,107,0.6), inset 0 1px 2px rgba(255,255,255,0.4)' 
                                    : 'inset 0 1px 2px rgba(0,0,0,0.1)'
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
