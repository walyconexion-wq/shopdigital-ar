import React from 'react';
import { CATEGORIES } from '../constants';
import Logo from '../components/Logo';
import { Share2, Store, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { playNeonClick } from '../utils/audio';
import { resolveIcon } from '../utils/iconResolver';
import { useAuth } from '../components/AuthContext';
import { TRASLASIERRA_REGION } from '../data/regionalTemplates/traslasierraConfig';
import { PATAGONIA_7_LAGOS_REGION } from '../data/regionalTemplates/patagonia7LagosConfig';
import { useLanguage } from '../components/LanguageContext';

interface HomeProps {
    globalConfig?: any;
}

interface Coordinates {
    lat: number;
    lon: number;
}

const TOWN_COORDINATES: Record<string, Coordinates> = {
    'esteban-echeverria': { lat: -34.82, lon: -58.47 },
    'ezeiza': { lat: -34.85, lon: -58.52 },
    'lomas-de-zamora': { lat: -34.76, lon: -58.40 },
    'traslasierra': { lat: -31.72, lon: -65.01 },
    'mina-clavero': { lat: -31.72, lon: -65.01 },
    'villa-cura-brochero': { lat: -31.72, lon: -65.01 },
    'nono': { lat: -31.79, lon: -65.00 },
    'san-lorenzo': { lat: -31.66, lon: -65.01 },
    'las-rabonas': { lat: -31.85, lon: -64.97 },
    'los-hornillos': { lat: -31.90, lon: -64.95 },
    'villa-de-las-rosas': { lat: -31.95, lon: -65.01 },
    'las-tapias': { lat: -31.97, lon: -65.09 },
    'san-javier': { lat: -32.03, lon: -65.03 },
    'yacanto': { lat: -32.05, lon: -65.03 },
    'la-poblacion': { lat: -32.10, lon: -65.01 },
    'luyaba': { lat: -32.17, lon: -65.07 },
    'la-paz': { lat: -32.22, lon: -65.05 },
    'bariloche': { lat: -41.134, lon: -71.308 },
    'san-martin-de-los-andes': { lat: -40.155, lon: -71.353 },
    'villa-la-angostura': { lat: -40.763, lon: -71.643 }
};

const getCoordinates = (id: string): Coordinates => {
    if (TOWN_COORDINATES[id]) return TOWN_COORDINATES[id];
    if (id.includes('ezeiza')) return TOWN_COORDINATES['ezeiza'];
    if (id.includes('traslasierra')) return TOWN_COORDINATES['traslasierra'];
    if (id.includes('bariloche') || id.includes('san-martin') || id.includes('villa-la-angostura')) {
        return TOWN_COORDINATES[id.includes('bariloche') ? 'bariloche' : id.includes('san-martin') ? 'san-martin-de-los-andes' : 'villa-la-angostura'];
    }
    return TOWN_COORDINATES['esteban-echeverria'];
};

const getWeatherEmoji = (code: number | null): string => {
    if (code === null) return '🌡️';
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌡️';
};

const Home: React.FC<HomeProps> = ({ globalConfig }) => {
    const { townId = 'esteban-echeverria' } = useParams<{ townId: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const themeColor = globalConfig?.primaryColor || globalConfig?.themeColor || '#22d3ee';
    const isInTraslasierra = TRASLASIERRA_REGION.towns.some(t => t.id === townId);
    const isInPatagonia = PATAGONIA_7_LAGOS_REGION.towns.some(t => t.id === townId);
    const BUENOS_AIRES_SUR_TOWNS = ['esteban-echeverria', 'ezeiza', 'lomas-de-zamora'];
    const isInBuenosAires = BUENOS_AIRES_SUR_TOWNS.includes(townId);
    const activeTheme = globalConfig?.isChristmasMode ? 'christmas' : (globalConfig?.theme || 'default');
    const mainSubtitle = globalConfig?.mainSubtitle || `${t('Tu guía de ofertas locales')} - ${townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    const townName = globalConfig?.townName || 'Esteban Echeverría';
    const themeMode = globalConfig?.themeMode || 'auto';
    const isDayMode = themeMode === 'light' 
        ? true 
        : themeMode === 'dark' 
            ? false 
            : new Date().getHours() >= 8 && new Date().getHours() < 20;

    const [logoClicks, setLogoClicks] = React.useState(0);
    const [walyClicks, setWalyClicks] = React.useState(0);

    // --- Telemetría y Clima ---
    const [time, setTime] = React.useState(new Date());
    const [temp, setTemp] = React.useState<number | null>(null);
    const [weatherCode, setWeatherCode] = React.useState<number | null>(null);
    const [weatherError, setWeatherError] = React.useState(false);
    const loggedRef = React.useRef<string | null>(null);

    // Incrementar visitas de zona de manera atómica
    React.useEffect(() => {
        if (townId) {
            import('../firebase').then(({ incrementarVisitasZona }) => {
                incrementarVisitasZona(townId);
            });
        }
    }, [townId]);

    // Timer de Reloj Local
    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Consulta Meteorológica y Registro de Telemetría
    React.useEffect(() => {
        setTemp(null);
        setWeatherCode(null);
        setWeatherError(false);

        const coords = getCoordinates(townId);
        const fetchWeather = async () => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`);
                if (res.ok) {
                    const data = await res.json();
                    const currentTemp = data.current?.temperature_2m;
                    const currentCode = data.current?.weather_code;
                    if (typeof currentTemp === 'number') {
                        const roundedTemp = Math.round(currentTemp);
                        setTemp(roundedTemp);
                        setWeatherCode(typeof currentCode === 'number' ? currentCode : null);

                        // Registrar telemetría de visita una única vez por zona resuelta
                        if (loggedRef.current !== townId) {
                            loggedRef.current = townId;
                            const { registrarVisitaConTelemetria } = await import('../firebase');
                            registrarVisitaConTelemetria(townId, roundedTemp, currentCode);
                        }
                    }
                } else {
                    setWeatherError(true);
                }
            } catch (err) {
                console.error("Error fetching weather:", err);
                setWeatherError(true);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 600000); // 10 min
        return () => clearInterval(interval);
    }, [townId]);

    // Formateadores de Reloj y Fecha
    const currentTimeStr = time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const currentDateStr = time.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Seasonal Decoration Component
    const SeasonalDecoration = () => {
        if (activeTheme === 'default') return null;

        const items = [];
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 5;
            const duration = 5 + Math.random() * 10;
            const size = 15 + Math.random() * 20;
            
            let char = '❄️';
            if (activeTheme === 'christmas') char = '🎄';
            if (activeTheme === 'summer') char = '☀️';
            if (activeTheme === 'spring') char = '🌸';
            if (activeTheme === 'winter') char = '❄️';

            items.push(
                <div 
                    key={i}
                    className="fixed pointer-events-none z-0 transition-opacity duration-1000"
                    style={{
                        left: `${left}%`,
                        top: `-50px`,
                        fontSize: `${size}px`,
                        opacity: 0.1,
                        animation: `seasonalFall ${duration}s linear ${delay}s infinite`,
                    }}
                >
                    {char}
                </div>
            );
        }
        return <>{items}</>;
    };

    // Reset clicks logic
    React.useEffect(() => {
        if (logoClicks === 0) return;
        const timer = setTimeout(() => setLogoClicks(0), 1000);
        return () => clearTimeout(timer);
    }, [logoClicks]);

    React.useEffect(() => {
        if (walyClicks === 0) return;
        const timer = setTimeout(() => setWalyClicks(0), 1000);
        return () => clearTimeout(timer);
    }, [walyClicks]);

    const handleLogoClick = () => {
        playNeonClick();
        const nextClicks = logoClicks + 1;
        if (nextClicks >= 3) { navigate(`/${townId}/nosotros`); setLogoClicks(0); }
        else setLogoClicks(nextClicks);
    };

    const handleWalyClick = () => {
        playNeonClick();
        const nextClicks = walyClicks + 1;
        if (nextClicks >= 5) { navigate(`/${townId}/tablero-maestro`); setWalyClicks(0); }
        else setWalyClicks(nextClicks);
    };

    const handleShare = () => {
        playNeonClick();
        const appUrl = window.location.origin;
        const shareText = language === 'en' 
            ? `Check out the shops in ${townName} on Waly's App! 🚀\n\n👉 ${appUrl}`
            : language === 'pt'
                ? `Veja as lojas de ${townName} no aplicativo do Waly! 🚀\n\n👉 ${appUrl}`
                : `¡Mirá los comercios de ${townName} en la App de Waly! 🚀\n\n👉 ${appUrl}`;
        if (navigator.share) {
            navigator.share({ title: 'ShopDigital', text: shareText, url: appUrl }).catch(console.error);
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        }
    };

    return (
        <div className="flex flex-col pt-8 pb-12 animate-in fade-in duration-700 relative overflow-hidden min-h-screen bg-transparent">
            <style>
                {`
                @keyframes seasonalFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.2; }
                    90% { opacity: 0.2; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
                @keyframes bounceSlow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-slow {
                    animation: bounceSlow 3s ease-in-out infinite;
                }
                `}
            </style>
            
            <SeasonalDecoration />

            <div className="absolute top-20 left-[-10%] w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: hexToRgba(themeColor, 0.1) }} />
            <div className="absolute bottom-20 right-[-10%] w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: hexToRgba(themeColor, 0.1) }} />
            
            {/* Botón de retroceso premium con estilo 3D y sombreado celeste de navegación */}
            <button
                onClick={() => {
                    playNeonClick();
                    navigate('/');
                }}
                className="absolute left-4 top-6 z-30 p-3.5 rounded-2xl cursor-pointer flex items-center justify-center btn-3d-celeste"
            >
                <ArrowLeft 
                    size={16} 
                    style={
                        isDayMode 
                            ? { color: '#083344' } 
                            : { color: themeColor, filter: `drop-shadow(0 0 6px ${themeColor})` }
                    } 
                />
            </button>

            <header className="flex-shrink-0 w-full max-w-[340px] mx-auto relative z-20 transition-all duration-700 bg-transparent pt-0 px-4 mb-2.5">
                <div 
                    onClick={handleLogoClick}
                    className="glass-header rounded-3xl p-5 border backdrop-blur-md cursor-pointer active:scale-95 transition-all w-full"
                    style={{ 
                        borderColor: hexToRgba(themeColor, 0.5),
                        boxShadow: `0 15px 40px ${hexToRgba(themeColor, 0.4)}`,
                        background: `linear-gradient(135deg, ${hexToRgba(themeColor, 0.2)} 0%, rgba(15,23,42,0.6) 100%)`
                    }}
                >
                    <Logo />
                </div>
            </header>

            <div className="flex flex-col items-center mb-10 mt-3 fade-up-item relative z-10 px-6">
                <div className="h-[1px] w-20 mb-5" style={{ background: `linear-gradient(90deg, transparent, ${hexToRgba(themeColor, 0.5)}, transparent)` }}></div>
                
                {/* Panel de Telemetría (Subido arriba del título de la guía) */}
                <div 
                    className="telemetry-widget mb-6 flex items-center justify-between w-full max-w-[340px] px-4 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-widest relative overflow-hidden backdrop-blur-md shadow-lg"
                >
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-white/40 text-[6.5px] tracking-[0.25em] mb-0.5">{t('HORA')}</span>
                        <span className="telemetry-widget-value text-white font-mono text-[10px] tracking-wider">
                            {currentTimeStr}
                        </span>
                    </div>
                    <div className="w-[1px] h-5 bg-white/10" />
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-white/40 text-[6.5px] tracking-[0.25em] mb-0.5">{t('FECHA')}</span>
                        <span className="telemetry-widget-value text-white text-[10px] tracking-wider">
                            {currentDateStr}
                        </span>
                    </div>
                    <div className="w-[1px] h-5 bg-white/10" />
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-white/40 text-[6.5px] tracking-[0.25em] mb-0.5">{t('VISITAS')}</span>
                        <span className="telemetry-widget-value text-white text-[10px] tracking-wider">
                            👁️ {globalConfig?.visits || 1}
                        </span>
                    </div>
                    <div className="w-[1px] h-5 bg-white/10" />
                    <div className="flex flex-col items-center flex-1">
                        <span className="text-white/40 text-[6.5px] tracking-[0.25em] mb-0.5">{t('CLIMA')}</span>
                        <span className="telemetry-widget-value text-white text-[10px] tracking-wider">
                            {getWeatherEmoji(weatherCode)} {temp !== null ? `${temp}°C` : (weatherError ? '18°C' : '...')}
                        </span>
                    </div>
                </div>

                <h2 className="text-[12px] font-[1000] text-white/90 text-shadow-premium uppercase tracking-[0.35em] text-center leading-none">
                    {mainSubtitle}
                </h2>
                <div className="flex items-center gap-3 mt-4">
                    <div className="h-[1px] w-6" style={{ background: `linear-gradient(90deg, transparent, ${hexToRgba(themeColor, 0.3)})` }}></div>
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: hexToRgba(themeColor, 0.2) }}></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor, boxShadow: `0 0 8px ${hexToRgba(themeColor, 0.6)}` }}></div>
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: hexToRgba(themeColor, 0.2) }}></div>
                    </div>
                    <div className="h-[1px] w-6" style={{ background: `linear-gradient(90deg, ${hexToRgba(themeColor, 0.3)}, transparent)` }}></div>
                </div>

                {/* Botones de Navegación Buenos Aires Sur (Estilo Blanco, Letras Celestes, Sombreado 3D) */}
                {isInBuenosAires && (
                    <div className="w-full mt-6 mb-2">
                        <div className="grid grid-cols-4 gap-1.5 px-3 max-w-[345px] mx-auto">
                            {[
                                { id: 'esteban-echeverria', label: 'Echeverría' },
                                { id: 'ezeiza', label: 'Ezeiza' },
                                { id: 'lomas-de-zamora', label: 'Lomas' },
                                { id: 'home', label: 'Home', isHome: true }
                            ].map((item) => {
                                const isActive = !item.isHome && townId === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            playNeonClick();
                                            if (item.isHome) {
                                                navigate('/');
                                            } else if (!isActive) {
                                                navigate(`/${item.id}/home`);
                                            }
                                        }}
                                        className={`py-2.5 px-0.5 rounded-xl text-[8px] font-black uppercase tracking-wider text-center transition-all ${
                                            isActive ? 'btn-3d-blanco-celeste active' : 'btn-3d-blanco-celeste'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Botones de Navegación Patagonia (Ubicados donde estaba la telemetría originalmente) */}
                {isInPatagonia && (
                    <div className="w-full mt-6 mb-2">
                        <div className="grid grid-cols-3 gap-2.5 px-4 max-w-[340px] mx-auto">
                            {PATAGONIA_7_LAGOS_REGION.towns.map((town) => {
                                const isActive = townId === town.id;

                                // Clases para Modo Día vs Modo Noche (con paddings compactos y texto en 1 línea)
                                const btnClass = isDayMode
                                    ? `px-1 py-2.5 rounded-xl text-[7.5px] font-[1000] uppercase tracking-wider transition-all duration-150 active:translate-y-[2px] text-center whitespace-nowrap overflow-hidden ${
                                        isActive 
                                            ? 'border-sky-400 bg-sky-500/20 text-sky-950 scale-105 shadow-[0_0_12px_rgba(14,165,233,0.3)]' 
                                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:-translate-y-[1.5px]'
                                      }`
                                    : `px-1 py-2 rounded-xl border transition-all duration-300 text-[7.5px] font-black uppercase tracking-wider text-center whitespace-nowrap overflow-hidden ${
                                        isActive
                                            ? 'backdrop-blur-md text-white scale-105 animate-pulse'
                                            : 'backdrop-blur-sm text-white/90 hover:text-white hover:scale-105 active:scale-95'
                                      }`;

                                // Estilos en línea específicos para relieve y glow
                                const btnStyle = isDayMode
                                    ? (isActive 
                                        ? {
                                            borderWidth: '1.5px',
                                            borderBottomWidth: '1.5px',
                                            borderBottomColor: themeColor,
                                            boxShadow: `0 0 12px ${hexToRgba(themeColor, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                                            transform: 'translateY(2px)',
                                            color: themeColor,
                                            fontWeight: '1000'
                                          }
                                        : {
                                            borderWidth: '1px',
                                            borderBottomWidth: '4px',
                                            borderBottomColor: '#cda488',
                                            boxShadow: '0 4px 8px rgba(88, 70, 50, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
                                          }
                                      )
                                    : (isActive 
                                        ? {
                                            backgroundColor: hexToRgba(themeColor, 0.35),
                                            borderColor: '#ffffff',
                                            boxShadow: `0 0 15px ${hexToRgba(themeColor, 0.8)}, inset 0 0 8px ${hexToRgba(themeColor, 0.5)}`,
                                            textShadow: `0 0 6px ${hexToRgba(themeColor, 0.9)}`
                                          } 
                                        : {
                                            backgroundColor: hexToRgba(themeColor, 0.1),
                                            borderColor: hexToRgba(themeColor, 0.3),
                                            boxShadow: `0 0 8px ${hexToRgba(themeColor, 0.1)}`
                                          }
                                      );

                                return (
                                    <button
                                        key={town.id}
                                        onClick={() => {
                                            playNeonClick();
                                            if (!isActive) navigate(`/${town.id}/home`);
                                        }}
                                        className={btnClass}
                                        style={btnStyle}
                                    >
                                        {town.id === 'san-martin-de-los-andes' ? 'San Martín' : town.id === 'villa-la-angostura' ? 'V. La Angostura' : 'Bariloche'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                                {globalConfig?.isChristmasMode && (
                    <div 
                        className="mt-6 w-full max-w-[340px] px-4 py-3 rounded-2xl border text-center relative overflow-hidden backdrop-blur-md animate-bounce-slow"
                        style={{
                            background: `linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(20, 83, 45, 0.3) 100%)`,
                            borderColor: '#ef4444',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.3)',
                        }}
                    >
                        {/* Christmas Lights decoration */}
                        <div className="absolute top-0 left-0 right-0 flex justify-around opacity-80 select-none text-[8px] tracking-[0.1em] pointer-events-none">
                            <span>🔴</span><span>🟢</span><span>🔵</span><span>🟡</span><span>🔴</span><span>🟢</span><span>🔵</span><span>🟡</span>
                        </div>
                        <h3 className="text-[13px] font-black text-white tracking-[0.15em] uppercase text-shadow-premium flex items-center justify-center gap-1.5 pt-1.5">
                            🎄 ¡Feliz Navidad en {townName}! 🎅
                        </h3>
                        <p className="text-[8.5px] font-black text-emerald-300 tracking-[0.1em] uppercase mt-1">
                            Disfrutá los catálogos y ofertas locales
                        </p>
                    </div>
                )}

                {/* Chips Regionales para Traslasierra */}
                {isInTraslasierra && (
                    <div className="w-full mt-6 mb-2">
                        <div className="flex flex-wrap justify-center gap-2.5 px-2 pb-2 max-w-[95%] mx-auto">
                            {TRASLASIERRA_REGION.towns.map((town) => {
                                const isActive = townId === town.id;
                                const themeMode = globalConfig?.themeMode || 'auto';
                                const isDayMode = themeMode === 'light' 
                                    ? true 
                                    : themeMode === 'dark' 
                                        ? false 
                                        : new Date().getHours() >= 8 && new Date().getHours() < 20;

                                // Clases para Modo Día vs Modo Noche
                                const btnClass = isDayMode
                                    ? `px-4 py-2.5 rounded-full text-[8.5px] font-[1000] uppercase tracking-widest transition-all duration-150 active:translate-y-[2px] ${
                                        isActive 
                                            ? 'border-sky-400 bg-sky-500/20 text-sky-950 scale-105 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:-translate-y-[1.5px]'
                                      }`
                                    : `px-4 py-2 rounded-full border transition-all duration-300 text-[8.5px] font-black uppercase tracking-widest ${
                                        isActive
                                            ? 'backdrop-blur-md text-white scale-105 animate-pulse'
                                            : 'backdrop-blur-sm text-white/90 hover:text-white hover:scale-105 active:scale-95'
                                      }`;

                                // Estilos en línea específicos para relieve y glow
                                const btnStyle = isDayMode
                                    ? (isActive 
                                        ? {
                                            borderWidth: '1.5px',
                                            borderBottomWidth: '1.5px',
                                            borderBottomColor: '#0ea5e9',
                                            boxShadow: `0 0 15px ${hexToRgba(themeColor, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                                            transform: 'translateY(2px)'
                                          }
                                        : {
                                            borderWidth: '1px',
                                            borderBottomWidth: '4px',
                                            borderBottomColor: '#cda488', // Relieve color arcilla/champagne
                                            boxShadow: '0 6px 12px rgba(88, 70, 50, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95)'
                                          }
                                      )
                                    : (isActive 
                                        ? {
                                            backgroundColor: hexToRgba(themeColor, 0.35),
                                            borderColor: '#ffffff',
                                            boxShadow: `0 0 20px ${hexToRgba(themeColor, 0.8)}, inset 0 0 10px ${hexToRgba(themeColor, 0.5)}`,
                                            textShadow: `0 0 8px ${hexToRgba(themeColor, 0.9)}`
                                          } 
                                        : {
                                            backgroundColor: hexToRgba(themeColor, 0.1),
                                            borderColor: hexToRgba(themeColor, 0.3),
                                            boxShadow: `0 0 10px ${hexToRgba(themeColor, 0.1)}`
                                          }
                                      );

                                return (
                                    <button
                                        key={town.id}
                                        onClick={() => {
                                            playNeonClick();
                                            if (!isActive) navigate(`/${town.id}/home`);
                                        }}
                                        className={btnClass}
                                        style={btnStyle}
                                    >
                                        {town.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-8 px-5 relative z-10">
                {(globalConfig?.categories || CATEGORIES).filter((c: any) => c.isActive !== false).map((cat: any, index: number) => (
                    <button
                        key={cat.id}
                        onClick={() => { playNeonClick(); navigate(`/${townId}/${cat.slug}`); }}
                        className="glass-button-3d category-btn aspect-square group backdrop-blur-md border rounded-[1.25rem] transition-all duration-300"
                        style={{
                            animation: `fadeUp 0.7s cubic-bezier(0.25, 1, 0.5, 1) ${index * 35}ms both`,
                            backgroundColor: hexToRgba(themeColor, 0.15),
                            borderColor: hexToRgba(themeColor, 0.2),
                            boxShadow: `0 0 15px ${hexToRgba(themeColor, 0.08)}`
                        }}
                    >
                        <div className="mb-1.5 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 ease-out" style={{ color: themeColor }}>
                            {cat.iconKey ? resolveIcon(cat.iconKey) : cat.icon}
                        </div>
                        <span className="text-[8.5px] text-center font-black uppercase leading-[1.1] tracking-[0.01em] px-0.5 text-white/90 group-hover:text-white transition-colors">
                            {t(cat.name)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-12 mb-4 px-14 flex flex-col gap-4 justify-center items-center w-full fade-up-item relative z-10" style={{ animationDelay: '700ms' }}>
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/subscripcion`); }}
                    className="w-full py-4 rounded-2xl text-[10px] font-[1100] uppercase tracking-[0.25em] flex items-center justify-center gap-3 btn-3d-celeste"
                >
                    <Store size={18} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                    <span className={isDayMode ? "" : "text-shadow-premium"}>{t('Suscribir Comercio')}</span>
                </button>

                <button
                    onClick={handleShare}
                    className="w-full py-4 rounded-2xl text-[10px] font-[1100] uppercase tracking-[0.25em] flex items-center justify-center gap-3 btn-3d-celeste"
                >
                    <Share2 size={16} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                    <span className={isDayMode ? "" : "text-shadow-premium"}>Compartir App</span>
                </button>
            </div>

            <footer className="w-full flex flex-col items-center gap-2 pt-6 pb-6 mt-auto border-t border-white/10 relative z-10">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.35em] text-center select-none">
                    © 2026 · ShopDigital
                </p>
                <div className="flex items-center gap-4 mt-1">
                    <p 
                        onClick={handleWalyClick}
                        className="text-[8px] font-bold uppercase tracking-[0.25em] text-center select-none cursor-pointer active:scale-95 transition-transform" 
                        style={{ color: themeColor, textShadow: `0 0 10px ${hexToRgba(themeColor, 0.8)}, 0 0 20px ${hexToRgba(themeColor, 0.4)}` }}
                    >
                        {isInPatagonia ? 'Patagonia' : townName}
                    </p>
                    <span className="text-white/20 text-[8px]">|</span>
                    <button 
                        onClick={() => { playNeonClick(); navigate(`/${townId}/terminos`); }}
                        className="text-[8px] font-bold uppercase tracking-[0.25em] text-center text-white hover:text-cyan-300 transition-colors"
                    >
                        Términos y Condiciones
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default Home;
