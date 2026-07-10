import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { playNeonClick } from '../utils/audio';
import { subscribeToGlobalConfig } from '../firebase';
import { useLanguage } from './LanguageContext';

const Logo: React.FC = () => {
    const { townId = 'esteban-echeverria' } = useParams<{ townId: string }>();
    const [clickCount, setClickCount] = useState(0);
    const [isChristmas, setIsChristmas] = useState(false);
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Theme Mode Resolver (sincronizado con GlobalHomePage)
    const [isDayMode, setIsDayMode] = useState(() => {
        const themeMode = localStorage.getItem('global_home_theme_mode') || 'dark';
        if (themeMode === 'light') return true;
        if (themeMode === 'dark') return false;
        const hour = new Date().getHours();
        return hour >= 8 && hour < 20;
    });

    useEffect(() => {
        const handleThemeChange = () => {
            const themeMode = localStorage.getItem('global_home_theme_mode') || 'dark';
            if (themeMode === 'light') {
                setIsDayMode(true);
            } else if (themeMode === 'dark') {
                setIsDayMode(false);
            } else {
                const hour = new Date().getHours();
                setIsDayMode(hour >= 8 && hour < 20);
            }
        };

        window.addEventListener('theme-changed', handleThemeChange);
        return () => window.removeEventListener('theme-changed', handleThemeChange);
    }, []);

    useEffect(() => {
        const unsub = subscribeToGlobalConfig((config) => {
            if (config && config.isChristmasMode) {
                setIsChristmas(true);
            } else {
                setIsChristmas(false);
            }
        }, townId);
        return () => unsub();
    }, [townId]);

    const handleLogoClick = () => {
        playNeonClick();
        setClickCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 5) {
                navigate(`/${townId}/tablero-maestro`);
                return 0;
            }
            return newCount;
        });
    };

    const getTownTitle = (id: string): string => {
        if (!id) return 'ShopDigital';
        if (id === 'san-martin-de-los-andes') return 'San Martín de los Andes';
        if (id === 'villa-la-angostura') return 'Villa La Angostura';
        if (id === 'bariloche') return 'Bariloche';
        if (id === 'esteban-echeverria') return 'Esteban Echeverría';
        return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div 
            onClick={handleLogoClick}
            className="flex flex-col items-center justify-center pt-1 pb-1 px-5 select-none text-center relative cursor-pointer"
        >
            {/* Luz Ambiental de Fondo del Logo */}
            {!isDayMode && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-12 bg-cyan-500/10 blur-xl rounded-full pointer-events-none" />
            )}

            {/* Nombre de la App */}
            <h1 className="text-[36px] font-[900] tracking-tighter leading-none mb-1.5 relative z-10">
                {isChristmas && (
                    <svg className="absolute -top-3 left-[28px] w-9 h-9 z-20 pointer-events-none drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] rotate-[-10deg]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 14C18 10 16 5 11 3C10.5 4 9 6.5 9 8C9 9 9.5 9.5 9 10C8 11 6.5 12 5.5 14C4 17 6.5 18 11 18C15.5 18 18 17 18 14Z" fill="#ef4444"/>
                        <path d="M4 17C4 16 5 15.5 11 15.5C17 15.5 18 16 18 17C18 18 16.5 19 11 19C5.5 19 4 18 4 17Z" fill="#ffffff"/>
                        <circle cx="10" cy="3.5" r="2.5" fill="#ffffff"/>
                    </svg>
                )}
                {isDayMode ? (
                    <span 
                        className="text-black font-[1000] select-none transition-all duration-300"
                        style={{ 
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.15), 0 1px 0px rgba(255, 255, 255, 0.8)' 
                        }}
                    >
                        {getTownTitle(townId)}
                    </span>
                ) : (
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] text-shadow-premium transition-all duration-300">
                        {getTownTitle(townId)}
                    </span>
                )}
            </h1>

            {/* Identificación de Zona */}
            <div className="flex flex-col items-center gap-0.5 relative z-10">
                <p 
                    className={`text-[7.5px] font-black tracking-[0.3em] uppercase transition-all duration-300 ${
                        isDayMode ? 'text-black/80' : 'text-white/50 drop-shadow-md'
                    }`}
                    style={isDayMode ? { textShadow: '0 1px 0px rgba(255, 255, 255, 0.5)' } : {}}
                >
                    {t('RED COMERCIAL DIGITAL')}
                </p>
            </div>
        </div>
    );
};

export default Logo;