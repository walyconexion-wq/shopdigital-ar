import React, { useState, useEffect, useRef } from 'react';

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
                background: '#cda488', // Fondo caramelo unificado
                transition: 'opacity 260ms ease-out',
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? 'all' : 'none',
                overflow: 'hidden',
                fontFamily: "system-ui, -apple-system, sans-serif" // Tipografía sans-serif moderna
            }}
        >
            {/* 1. Botón/Cápsula Superior "ShopDigital" (Estilo Glass Esmerilado) */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    borderRadius: '2rem',
                    padding: '0.7rem 2.8rem',
                    boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.7), 0 4px 12px rgba(88, 70, 50, 0.06)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <span
                    style={{
                        color: '#000000', // Letra negra premium
                        fontSize: '1.8rem',
                        fontWeight: 1000,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}
                >
                    SHOPDIGITAL
                </span>
            </div>

            {/* 2. Personaje 3D de Ari Cuerpo Completo */}
            <div
                style={{
                    position: 'relative',
                    width: '180px',
                    height: '270px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '2.5rem'
                }}
            >
                {/* Sombra de pie para dar profundidad 3D */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-5px',
                        width: '100px',
                        height: '10px',
                        borderRadius: '50%',
                        background: 'rgba(88, 70, 50, 0.25)',
                        filter: 'blur(5px)',
                        pointerEvents: 'none'
                    }}
                />
                
                <img
                    src="/ari-fullbody.png?v=4"
                    alt="Ari Asistente IA"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 6px 12px rgba(88, 70, 50, 0.15))',
                        position: 'relative',
                        zIndex: 1
                    }}
                />
            </div>

            {/* 3. Texto descriptivo "cargando sistema" */}
            <p
                style={{
                    color: '#000000',
                    fontSize: '10px',
                    margin: '0 0 1rem 0',
                    fontWeight: 1000,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    letterSpacing: '0.25em',
                    opacity: 0.85
                }}
            >
                cargando sistema
            </p>

            {/* 4. Barra de Progreso Segmentada (Efecto Glass Esmerilado Fina e Hipersutil) */}
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    width: '180px',
                    height: '18px', // Barra de carga muy fina y delicada
                    borderRadius: '1rem',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 4px 10px rgba(88,70,50,0.04)'
                }}
            >
                {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: '32px',
                            height: '100%',
                            background: idx < progressSegments ? '#c98858' : 'transparent', // Color caramelo de progreso
                            borderRadius: '0.8rem',
                            marginRight: idx < 4 ? '3px' : '0px',
                            transition: 'background-color 150ms ease-in-out',
                            boxShadow: idx < progressSegments ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default LoadingScreen;

