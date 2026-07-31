import React from 'react';
import { CATEGORIES } from '../constants';
import Logo from '../components/Logo';
import { Share2, Store, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { playNeonClick } from '../utils/audio';
import { resolveIcon } from '../utils/iconResolver';
import { useAuth } from '../components/AuthContext';
import { TRASLASIERRA_REGION } from '../data/regionalTemplates/traslasierraConfig';
import { PATAGONIA_7_LAGOS_REGION } from '../data/regionalTemplates/patagonia7LagosConfig';
import { useLanguage } from '../components/LanguageContext';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

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
    const checkIsDayMode = () => {
        const saved = localStorage.getItem('global_home_theme_mode');
        return (saved || 'light') === 'light';
    };
    const [isDayMode, setIsDayMode] = React.useState(checkIsDayMode);

    React.useEffect(() => {
        const syncTheme = () => setIsDayMode(checkIsDayMode());
        window.addEventListener('theme-changed', syncTheme);
        return () => window.removeEventListener('theme-changed', syncTheme);
    }, []);

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
            {/* Fondo Ciber-Digital de Circuitos Animados */}
            <CyberCircuitBackground />
            
            <SeasonalDecoration />

            {/* Panel de Telemetría Neumórfico Crema HD (Hora, Fecha, Visitas, Clima) */}
            <div className="neu-inset-title absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2.5rem)] max-w-[345px] px-3.5 py-2 text-[8.5px] font-extrabold uppercase tracking-widest flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                    <span className="text-[#4a3d6a] text-[6.5px] tracking-[0.2em] mb-0.5">{t('HORA')}</span>
                    <span className="font-mono text-[9.5px] tracking-wider text-[#2c2440]">
                        {currentTimeStr}
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-[#b4a594]/30" />
                <div className="flex flex-col items-center flex-1">
                    <span className="text-[#4a3d6a] text-[6.5px] tracking-[0.2em] mb-0.5">{t('FECHA')}</span>
                    <span className="text-[9.5px] tracking-wider text-[#2c2440]">
                        {currentDateStr}
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-[#b4a594]/30" />
                <div className="flex flex-col items-center flex-1">
                    <span className="text-[#4a3d6a] text-[6.5px] tracking-[0.2em] mb-0.5">{t('VISITAS')}</span>
                    <span className="text-[9.5px] tracking-wider text-[#2c2440]">
                        👁️ {globalConfig?.visits || 1}
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-[#b4a594]/30" />
                <div className="flex flex-col items-center flex-1">
                    <span className="text-[#4a3d6a] text-[6.5px] tracking-[0.2em] mb-0.5">{t('CLIMA')}</span>
                    <span className="text-[9.5px] tracking-wider text-[#2c2440]">
                        {getWeatherEmoji(weatherCode)} {temp !== null ? `${temp}°C` : (weatherError ? '18°C' : '...')}
                    </span>
                </div>
            </div>

            {/* Header del Nombre de la Zona (Placa Neumórfica Crema HD) */}
            <header className="flex-shrink-0 w-full max-w-[345px] mx-auto relative z-20 transition-all duration-700 bg-transparent pt-14 px-4 mb-3">
                <div 
                    onClick={handleLogoClick}
                    className="neu-plate cursor-pointer active:scale-95 transition-all w-full text-center py-5 px-6"
                >
                    <Logo />
                </div>
            </header>

            <div className="flex flex-col items-center mb-6 mt-1 fade-up-item relative z-10 px-6">
                
                {/* Botones de control (Volver / Modo Noche) Neumórficos 3D */}
                <div className="flex items-center justify-between w-full max-w-[345px] mb-4 px-1 z-20 gap-3">
                    <button
                        onClick={() => {
                            playNeonClick();
                            navigate('/');
                        }}
                        className="neu-btn-3d py-3 px-6 text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 flex-1"
                    >
                        <ArrowLeft size={14} className="text-[#ff6b6b]" />
                        <span>Volver</span>
                    </button>

                    <button
                        onClick={() => {
                            playNeonClick();
                            const current = localStorage.getItem('global_home_theme_mode') || 'light';
                            const nextTheme = current === 'light' ? 'dark' : 'light';
                            localStorage.setItem('global_home_theme_mode', nextTheme);
                            window.dispatchEvent(new Event('theme-changed'));
                        }}
                        className="neu-btn-3d py-3 px-6 text-[9px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 flex-1"
                    >
                        {isDayMode ? (
                            <>
                                <Moon size={14} className="text-[#2c2440]" />
                                <span>Modo Noche</span>
                            </>
                        ) : (
                            <>
                                <Sun size={14} className="text-[#ff6b6b]" />
                                <span>Modo Día</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Botones de Navegación Buenos Aires Sur (Neumórficos 3D) */}
                {isInBuenosAires && (
                    <div className="w-full mt-2 mb-2">
                        <div className="grid grid-cols-4 gap-2 px-1 max-w-[345px] mx-auto">
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
                                        className={`py-2.5 px-0.5 text-[8px] font-extrabold uppercase tracking-wider text-center transition-all ${
                                            isActive ? 'neu-btn-3d-active' : 'neu-btn-3d'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Botones de Navegación Patagonia (Neumórficos 3D) */}
                {isInPatagonia && (
                    <div className="w-full mt-2 mb-2">
                        <div className="grid grid-cols-3 gap-2 px-1 max-w-[345px] mx-auto">
                            {PATAGONIA_7_LAGOS_REGION.towns.map((town) => {
                                const isActive = townId === town.id;
                                return (
                                    <button
                                        key={town.id}
                                        onClick={() => {
                                            playNeonClick();
                                            if (!isActive) navigate(`/${town.id}/home`);
                                        }}
                                        className={`py-2.5 px-1 text-[7.5px] font-extrabold uppercase tracking-wider text-center transition-all whitespace-nowrap overflow-hidden ${
                                            isActive ? 'neu-btn-3d-active' : 'neu-btn-3d'
                                        }`}
                                    >
                                        {town.id === 'san-martin-de-los-andes' ? 'San Martín' : town.id === 'villa-la-angostura' ? 'V. Angostura' : 'Bariloche'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Chips Regionales para Traslasierra (Neumórficos 3D) */}
                {isInTraslasierra && (
                    <div className="w-full mt-2 mb-2">
                        <div className="flex flex-wrap justify-center gap-2 px-1 max-w-[345px] mx-auto">
                            {TRASLASIERRA_REGION.towns.map((town) => {
                                const isActive = townId === town.id;
                                return (
                                    <button
                                        key={town.id}
                                        onClick={() => {
                                            playNeonClick();
                                            if (!isActive) navigate(`/${town.id}/home`);
                                        }}
                                        className={`py-2 px-3.5 text-[8px] font-extrabold uppercase tracking-wider text-center transition-all ${
                                            isActive ? 'neu-btn-3d-active' : 'neu-btn-3d'
                                        }`}
                                    >
                                        {town.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Contenedor Neumórfico Crema HD para la Grilla de Categorías */}
            <div className="px-4 relative z-10 max-w-[365px] mx-auto w-full">
                <div className="neu-plate w-full grid grid-cols-3 gap-3">
                    {(globalConfig?.categories || CATEGORIES).filter((c: any) => c.isActive !== false).map((cat: any, index: number) => {
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { playNeonClick(); navigate(`/${townId}/${cat.slug}`); }}
                                className="neu-btn-3d aspect-square p-2 flex flex-col items-center justify-center gap-1.5 transition-all group"
                                style={{
                                    animation: `fadeUp 0.6s cubic-bezier(0.25, 1, 0.5, 1) ${index * 30}ms both`
                                }}
                            >
                                <div className="text-[#2c2440] group-hover:text-[#ff6b6b] transform group-hover:scale-110 transition-transform duration-300">
                                    {cat.iconKey ? resolveIcon(cat.iconKey) : cat.icon}
                                </div>
                                <span className="text-[8px] text-center font-extrabold uppercase leading-tight tracking-wide text-[#2c2440] group-hover:text-[#ff6b6b] transition-colors">
                                    {t(cat.name)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Botones Neumórficos de Suscribir Comercio y Compartir App */}
            <div className="mt-6 mb-4 px-4 flex flex-col gap-3 justify-center items-center w-full max-w-[365px] mx-auto fade-up-item relative z-10">
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/subscripcion`); }}
                    className="neu-btn-3d w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2.5"
                >
                    <Store size={15} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    <span>{t('Suscribir Comercio')}</span>
                </button>

                <button
                    onClick={handleShare}
                    className="neu-btn-3d w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2.5"
                >
                    <Share2 size={15} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    <span>Compartir App</span>
                </button>
            </div>

            {/* Pie de Página Neumórfico Crema HD */}
            <footer className="w-full max-w-[365px] mx-auto px-4 z-10 pt-2 pb-2 mt-auto relative">
                <div className="neu-footer flex items-center justify-between w-full">
                    <p className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-[#2c2440] select-none">
                        © 2026 · ShopDigital
                    </p>
                    <div className="flex items-center gap-3">
                        <p 
                            onClick={handleWalyClick}
                            className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#2c2440] hover:text-[#ff6b6b] select-none cursor-pointer active:scale-95 transition-all" 
                        >
                            {isInPatagonia ? 'Patagonia' : townName}
                        </p>
                        <span className="text-[#b4a594]/50 text-[7px] select-none">|</span>
                        <button 
                            onClick={() => { playNeonClick(); navigate(`/${townId}/terminos`); }}
                            className="text-[7.5px] font-extrabold uppercase tracking-[0.14em] text-[#2c2440] hover:text-[#ff6b6b] active:opacity-75 transition-all select-none"
                        >
                            Términos
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
