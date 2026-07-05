import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AriMerchantAssistant } from './AriMerchantAssistant';
import { Shop } from '../types';
import { useLanguage } from './LanguageContext';

interface LayoutProps {
    allShops?: Shop[];
    globalConfig?: any;
}

const Layout: React.FC<LayoutProps> = ({ allShops = [], globalConfig }) => {
    const location = useLocation();
    const themeColor = globalConfig?.primaryColor || '#22d3ee';
    const bgColor = globalConfig?.bgColor || '#000000';
    const themeMode = globalConfig?.themeMode || 'auto';
    
    // Helper to check if it is currently day mode
    const checkIsDayMode = (mode: string) => {
        const saved = localStorage.getItem('global_home_theme_mode');
        const effectiveMode = saved || 'light'; // Por defecto es light
        if (effectiveMode === 'light') return true;
        if (effectiveMode === 'dark') return false;
        return true;
    };

    const [isDayMode, setIsDayMode] = React.useState(() => checkIsDayMode(themeMode));
    const [scrollTop, setScrollTop] = React.useState(0);

    const isManagementPage = React.useMemo(() => {
        const path = location.pathname;
        return (
            path.includes('/tablero-maestro') || 
            path.includes('/embajador') || 
            path.includes('/marketing-inteligente') ||
            path.includes('/bunker') ||
            path.includes('/posnet') ||
            path.includes('/mi-comercio') ||
            path.includes('/reclutamiento') ||
            path.includes('/relevamiento') ||
            path.includes('/academia-embajadores') ||
            path.includes('/factura') ||
            path.includes('/panel-autogestion') ||
            path.includes('/subscripcion') ||
            path.includes('/inscripcion') ||
            path.includes('/cliente-subscripcion')
        );
    }, [location.pathname]);

    const shouldApplyDayMode = isDayMode && !isManagementPage;

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    React.useEffect(() => {
        const syncTheme = () => {
            setIsDayMode(checkIsDayMode(themeMode));
        };
        syncTheme();
        
        window.addEventListener('storage', syncTheme);
        window.addEventListener('theme-changed', syncTheme);
        
        let interval: ReturnType<typeof setInterval> | null = null;
        if (themeMode === 'auto') {
            interval = setInterval(syncTheme, 60000);
        }
        
        return () => {
            window.removeEventListener('storage', syncTheme);
            window.removeEventListener('theme-changed', syncTheme);
            if (interval) clearInterval(interval);
        };
    }, [themeMode]);
    
    // Ocultar ARI en páginas de edición, paneles y formularios de suscripción que tienen su propio ARI o no lo requieren flotante
    const isEditPage = 
        location.pathname.includes('/editar') || 
        location.pathname.includes('/mi-catalogo') || 
        location.pathname.includes('/embajador') ||
        location.pathname.includes('/subscripcion') ||
        location.pathname.includes('/inscripcion') ||
        location.pathname.includes('/cliente-subscripcion') ||
        location.pathname.includes('/beneficios-vip') ||
        location.pathname.includes('/beneficios-comercios');

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const containerStyle = {
        '--theme-primary': themeColor,
        '--theme-glow': hexToRgba(themeColor, 0.5),
        '--theme-bg-glow': hexToRgba(themeColor, 0.08),
    } as React.CSSProperties;

    // Dummy shop para el contexto de ARI en modo cliente/baquiana
    const ariContextShop: Shop = {
        id: 'ari-global',
        name: 'ShopDigital',
        category: 'Red Comercial',
        slug: 'shopdigital',
        address: 'Argentina',
        phone: '',
        description: 'Red Comercial Digital de Argentina',
        rating: 5,
        isActive: true,
        offers: [],
        visits: 0,
        subscribers: 0,
        tags: [],
    } as unknown as Shop;

    // Sistema de Fondos Tecnológicos
    const techBg = globalConfig?.techBg || 'none';
    const getTechBgStyles = () => {
        switch (techBg) {
            case 'stardust':
                return { texture: "url('https://www.transparenttextures.com/patterns/stardust.png')", opacity: shouldApplyDayMode ? 0.08 : 0.35, grid: true, glow: 0.12 };
            case 'circuit':
                return { texture: "url('https://www.transparenttextures.com/patterns/circuits.png')", opacity: shouldApplyDayMode ? 0.06 : 0.25, grid: false, glow: 0.1 };
            case 'matrix':
                return { texture: "url('https://www.transparenttextures.com/patterns/dark-mosaic.png')", opacity: shouldApplyDayMode ? 0.06 : 0.3, grid: true, glow: 0.1 };
            case 'nebula':
                return { texture: "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')", opacity: shouldApplyDayMode ? 0.08 : 0.4, grid: false, glow: 0.15 };
            case 'hex':
                return { texture: "url('https://www.transparenttextures.com/patterns/hexellence.png')", opacity: shouldApplyDayMode ? 0.06 : 0.25, grid: true, glow: 0.1 };
            case 'cyber':
                return { texture: "url('https://www.transparenttextures.com/patterns/carbon-fibre-v2.png')", opacity: shouldApplyDayMode ? 0.06 : 0.3, grid: false, glow: 0.12 };
            
            // Nuevos fondos de la Fase 2 (vectoriales SVG dinámicos):
            case 'hex-glow':
                const hexGlowSvg = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="100" viewBox="0 0 56 100">
                        <path d="M28 66L0 50L0 16L28 0L56 16L56 50Z M0 100L28 84L56 100 M56 0L28 16L0 0" 
                               fill="none" stroke="${themeColor}" stroke-width="1.2" opacity="${shouldApplyDayMode ? 0.25 : 0.4}" />
                    </svg>
                `)}`;
                return { texture: `url("${hexGlowSvg}")`, opacity: 1, grid: false, glow: 0.15 };
                
            case 'cube-depth':
                const cubeDepthSvg = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                        <path d="M0 30 L30 0 L60 30 L30 60 Z" fill="none" stroke="${themeColor}" stroke-width="1.2" opacity="${shouldApplyDayMode ? 0.25 : 0.4}" />
                        <path d="M30 30 L60 0 M30 30 L0 0 M30 30 L30 60" fill="none" stroke="${themeColor}" stroke-width="0.8" opacity="${shouldApplyDayMode ? 0.15 : 0.25}" />
                    </svg>
                `)}`;
                return { texture: `url("${cubeDepthSvg}")`, opacity: 1, grid: false, glow: 0.12 };
                
            case 'rounded-rects':
                const roundedRectsSvg = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
                        <rect x="5" y="5" width="30" height="30" rx="8" fill="none" stroke="${themeColor}" stroke-width="1" opacity="${shouldApplyDayMode ? 0.12 : 0.2}" />
                        <rect x="45" y="15" width="25" height="45" rx="8" fill="none" stroke="${themeColor}" stroke-width="1.2" opacity="${shouldApplyDayMode ? 0.18 : 0.3}" />
                        <rect x="15" y="45" width="25" height="25" rx="6" fill="none" stroke="${themeColor}" stroke-width="1" opacity="${shouldApplyDayMode ? 0.15 : 0.15}" />
                    </svg>
                `)}`;
                return { texture: `url("${roundedRectsSvg}")`, opacity: 1, grid: false, glow: 0.1 };
                
            case 'wave-flow':
                const waveFlowSvg = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40">
                        <path d="M0 20 Q25 40 50 20 T100 20" fill="none" stroke="${themeColor}" stroke-width="1.2" opacity="${shouldApplyDayMode ? 0.2 : 0.3}" />
                        <path d="M0 10 Q25 30 50 10 T100 10" fill="none" stroke="${themeColor}" stroke-width="0.8" opacity="${shouldApplyDayMode ? 0.1 : 0.15}" />
                    </svg>
                `)}`;
                return { texture: `url("${waveFlowSvg}")`, opacity: 1, grid: false, glow: 0.1 };
                
            case 'hex-3d-height':
                const hex3dHeightSvg = `data:image/svg+xml,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="104" viewBox="0 0 60 104">
                        <path d="M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z" fill="none" stroke="${themeColor}" stroke-width="1.2" opacity="${shouldApplyDayMode ? 0.25 : 0.4}" />
                        <path d="M0 17.32 L30 34.64 L60 17.32 M30 34.64 L30 69.28" fill="none" stroke="${themeColor}" stroke-width="1" opacity="${shouldApplyDayMode ? 0.2 : 0.3}" />
                    </svg>
                `)}`;
                return { texture: `url("${hex3dHeightSvg}")`, opacity: 1, grid: false, glow: 0.15 };
                
            default:
                return null;
        }
    };
    const techStyle = getTechBgStyles();
    const { language, setLanguage } = useLanguage();

    const isEnterprisePath = location.pathname.startsWith('/empresas');

    return (
        <div 
            className={`w-full max-w-md mx-auto h-screen flex flex-col overflow-hidden relative shadow-2xl ${shouldApplyDayMode ? 'day-mode' : ''}`}
            style={{ 
                ...containerStyle, 
                backgroundColor: shouldApplyDayMode 
                    ? (isEnterprisePath ? '#f8fafc' : '#cda488') 
                    : bgColor 
            }}
        >
            {/* Selector de Idioma (Operación Babel) - Deshabilitado */}
            {false && (
                <div className={`absolute top-3.5 right-3.5 z-[100] flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-md transition-all duration-300 ${
                    shouldApplyDayMode 
                        ? 'bg-white/70 border-slate-200/50 text-slate-800' 
                        : 'bg-slate-950/60 border-white/10 text-white'
                }`}>
                    <button 
                        onClick={() => setLanguage('es')} 
                        className={`text-[9.5px] font-[1000] tracking-wider transition-colors duration-200`}
                        style={{ color: language === 'es' ? themeColor : 'inherit', opacity: language === 'es' ? 1 : 0.5 }}
                    >
                        ES
                    </button>
                    <span className="text-[9px] opacity-20">|</span>
                    <button 
                        onClick={() => setLanguage('en')} 
                        className={`text-[9.5px] font-[1000] tracking-wider transition-colors duration-200`}
                        style={{ color: language === 'en' ? themeColor : 'inherit', opacity: language === 'en' ? 1 : 0.5 }}
                    >
                        EN
                    </button>
                    <span className="text-[9px] opacity-20">|</span>
                    <button 
                        onClick={() => setLanguage('pt')} 
                        className={`text-[9.5px] font-[1000] tracking-wider transition-colors duration-200`}
                        style={{ color: language === 'pt' ? themeColor : 'inherit', opacity: language === 'pt' ? 1 : 0.5 }}
                    >
                        PT
                    </button>
                </div>
            )}
            {/* Modo Navidad: Nieve Cayendo en CSS Puro */}
            {globalConfig?.isChristmasMode && (
                <div className="absolute inset-0 pointer-events-none z-[999] overflow-hidden">
                    <style>{`
                        @keyframes globalSnowfall {
                            0% { transform: translateY(-10px) translateX(0); opacity: 0; }
                            10% { opacity: 0.8; }
                            90% { opacity: 0.8; }
                            100% { transform: translateY(105vh) translateX(55px); opacity: 0; }
                        }
                        .snowflake-global {
                            position: absolute;
                            color: #fff;
                            font-size: 1.2em;
                            user-select: none;
                            pointer-events: none;
                            z-index: 999;
                            opacity: 0;
                            text-shadow: 0 0 3px rgba(255,255,255,0.8), 0 0 10px rgba(6,182,212,0.4);
                        }
                    `}</style>
                    {[...Array(15)].map((_, i) => {
                        const left = (i * 7) + Math.sin(i) * 2;
                        const delay = (i * 0.7).toFixed(1);
                        const duration = (6 + (i % 5) * 1.5).toFixed(1);
                        const scale = (0.5 + (i % 3) * 0.25).toFixed(2);
                        return (
                            <span 
                                key={i} 
                                className="snowflake-global"
                                style={{
                                    left: `${left}%`,
                                    animation: `globalSnowfall ${duration}s linear ${delay}s infinite`,
                                    transform: `scale(${scale})`
                                }}
                            >
                                ❄️
                            </span>
                        );
                    })}
                </div>
            )}
            {/* Background Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: shouldApplyDayMode 
                            ? (isEnterprisePath 
                                ? `radial-gradient(ellipse at 50% 30%, ${hexToRgba(themeColor, 0.05)} 0%, transparent 65%), linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)`
                                : `radial-gradient(ellipse at 50% 30%, ${hexToRgba(themeColor, 0.07)} 0%, transparent 65%), linear-gradient(180deg, #ebd7c8 0%, #cda488 50%, #b68d71 100%)`)
                            : `radial-gradient(ellipse at 50% 30%, ${hexToRgba(themeColor, 0.08)} 0%, transparent 60%), linear-gradient(180deg, ${bgColor} 0%, ${bgColor} 50%, ${bgColor} 100%)`,
                    }}
                />
                {/* Fondo Tecnológico Dinámico */}
                {techStyle && (
                    <>
                        <div 
                            className="absolute inset-0 transition-transform duration-75 ease-out" 
                            style={{ 
                                backgroundImage: techStyle.texture, 
                                opacity: techStyle.opacity,
                                transform: `translateY(${scrollTop * 0.15}px) translateZ(0)`
                            }} 
                        />
                        {techStyle.grid && !shouldApplyDayMode && (
                            <div 
                                className="absolute inset-0 transition-transform duration-75 ease-out" 
                                style={{
                                     backgroundImage: `linear-gradient(${hexToRgba(themeColor, 0.07)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(themeColor, 0.07)} 1px, transparent 1px)`,
                                     backgroundSize: '35px 35px',
                                     transform: `translateY(${scrollTop * 0.08}px) translateZ(0)`
                                }} 
                            />
                        )}
                        {!shouldApplyDayMode && (
                            <>
                                <div className="absolute top-0 right-0 w-[70%] h-[70%] rounded-full blur-[120px]" style={{ backgroundColor: hexToRgba(themeColor, techStyle.glow) }} />
                                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full blur-[100px]" style={{ backgroundColor: hexToRgba(themeColor, techStyle.glow * 0.6) }} />
                            </>
                        )}
                    </>
                )}
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent ${shouldApplyDayMode ? 'to-[#b68d71]/25' : 'to-black/40'}`} />
            </div>

            <main 
                onScroll={handleScroll}
                className="flex-grow overflow-y-auto no-scrollbar relative z-10"
            >
                <Outlet />
            </main>

            {/* ARI - Asistente Baquiana Global (visible en todas las zonas) */}
            {!isEditPage && (
                <AriMerchantAssistant 
                    shop={ariContextShop} 
                    role="baquiana" 
                    townId={themeMode}
                    isDayMode={shouldApplyDayMode}
                    globalConfig={globalConfig}
                />
            )}
        </div>
    );
};

export default Layout;
