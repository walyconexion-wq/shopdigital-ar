import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { Shop } from '../types';
import { TRASLASIERRA_REGION } from '../data/regionalTemplates/traslasierraConfig';
import { PATAGONIA_7_LAGOS_REGION } from '../data/regionalTemplates/patagonia7LagosConfig';
import { ChevronLeft, MapPin, Star, BookOpen, ArrowLeft, Eye, Sun, Moon } from 'lucide-react';
import { playNeonClick } from '../utils/audio';
import { incrementarVisitas } from '../firebase';
import { useTownLocalities } from '../hooks/useTownLocalities';
import ProgressiveShopImage from '../components/ProgressiveShopImage';

interface CategoryPageProps {
    allShops: Shop[];
    globalConfig?: any;
}

// Paleta de colores cíclica para las localidades dinámicas
const LOCALITY_COLORS = [
    { border: 'border-violet-400/80 border-b-[4px] border-b-violet-500/60', bg: 'bg-violet-600/50', shadow: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]', pin: 'text-violet-400', line: 'bg-violet-400/30', dot: 'bg-violet-500/20 border-violet-400/50', card: 'card-neon-violet border-b-[5px] border-b-violet-500/30 shadow-[0_15px_30px_rgba(139,92,246,0.15)]', btn: 'border-violet-400/50 bg-violet-600/30 border-b-[4px] border-b-violet-500/80 shadow-lg text-white' },
    { border: 'border-cyan-400/80 border-b-[4px] border-b-cyan-500/60',   bg: 'bg-cyan-600/50',   shadow: 'shadow-[0_0_20px_rgba(34,211,238,0.5)]',  pin: 'text-cyan-400',   line: 'bg-cyan-400/30',   dot: 'bg-cyan-500/20 border-cyan-400/50',   card: 'card-neon-cyan border-b-[5px] border-b-cyan-500/30 shadow-[0_15px_30px_rgba(34,211,238,0.15)]',   btn: 'border-cyan-400/50 bg-cyan-600/30 border-b-[4px] border-b-cyan-500/80 shadow-lg text-white' },
    { border: 'border-rose-400/80 border-b-[4px] border-b-rose-500/60',   bg: 'bg-rose-600/50',   shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.5)]',   pin: 'text-rose-400',   line: 'bg-rose-400/30',   dot: 'bg-rose-500/20 border-rose-400/50',   card: 'card-neon-red border-b-[5px] border-b-rose-500/30 shadow-[0_15px_30px_rgba(244,63,94,0.15)]',    btn: 'border-rose-400/50 bg-rose-600/30 border-b-[4px] border-b-rose-500/80 shadow-lg text-white' },
    { border: 'border-green-400/80 border-b-[4px] border-b-green-500/60',  bg: 'bg-green-600/50',  shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',   pin: 'text-green-400',  line: 'bg-green-400/30',  dot: 'bg-green-500/20 border-green-400/50',  card: 'card-neon-green border-b-[5px] border-b-green-500/30 shadow-[0_15px_30px_rgba(34,197,94,0.15)]',  btn: 'border-green-400/50 bg-green-600/30 border-b-[4px] border-b-green-500/80 shadow-lg text-white' },
    { border: 'border-amber-400/80 border-b-[4px] border-b-amber-500/60',  bg: 'bg-amber-600/50',  shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',  pin: 'text-amber-400',  line: 'bg-amber-400/30',  dot: 'bg-amber-500/20 border-amber-400/50',  card: 'card-neon-amber border-b-[5px] border-b-amber-500/30 shadow-[0_15px_30px_rgba(245,158,11,0.15)]',  btn: 'border-amber-400/50 bg-amber-600/30 border-b-[4px] border-b-amber-500/80 shadow-lg text-white' },
];

const CategoryPage: React.FC<CategoryPageProps> = ({ allShops, globalConfig }) => {
    const { townId = 'esteban-echeverria', categorySlug } = useParams<{ townId: string, categorySlug: string }>();
    const navigate = useNavigate();
    const { localities } = useTownLocalities(townId);
    
    // Determinar si estamos en Traslasierra o Patagonia
    const isInTraslasierra = townId === 'traslasierra' || TRASLASIERRA_REGION.towns.some(t => t.id === townId);
    const isInPatagonia = townId === 'patagonia-7-lagos' || PATAGONIA_7_LAGOS_REGION.towns.some(t => t.id === townId);
    
    // Obtener townName amigable
    const townName = isInTraslasierra 
        ? TRASLASIERRA_REGION.towns.find(t => t.id === townId)?.name || townId.replace(/-/g, ' ')
        : isInPatagonia
        ? PATAGONIA_7_LAGOS_REGION.towns.find(t => t.id === townId)?.name || townId.replace(/-/g, ' ')
        : (globalConfig?.townName || 'Esteban Echeverría');

    const [activeLocation, setActiveLocation] = useState<string>('');
    const [activeSubcategory, setActiveSubcategory] = useState<string>('');
    const [titleClicks, setTitleClicks] = React.useState(0);

    const themeColor = globalConfig?.primaryColor || '#22d3ee';
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

    const hexToRgba = (hex: string, alpha: number) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } catch { return `rgba(34, 211, 238, ${alpha})`; }
    };

    // PRIMERO: Declarar selectedCategory para que los useEffect de abajo puedan referenciarlo
    const selectedCategory = useMemo(() => {
        const availableCategories = globalConfig?.categories || CATEGORIES;
        return availableCategories.find((cat: any) => cat.slug === categorySlug);
    }, [categorySlug, globalConfig]);

    // Resetear al cambiar de zona o categoría para evitar fantasmas de filtrado
    useEffect(() => {
        setActiveLocation('');
        setActiveSubcategory('');
    }, [townId, categorySlug]);

    // Sincronizar activeLocation con las localidades validadas por el hook
    useEffect(() => {
        if (localities.length > 0 && (!activeLocation || !localities.includes(activeLocation))) {
            setActiveLocation(localities[0]);
        }
    }, [localities, activeLocation]);

    // NO auto-seleccionar subcategoría: dejar vacío muestra TODOS los comercios.
    // El usuario selecciona manualmente si quiere filtrar.

    React.useEffect(() => {
        if (titleClicks === 0) return;
        const timer = setTimeout(() => setTitleClicks(0), 1500);
        return () => clearTimeout(timer);
    }, [titleClicks]);

    const handleTitleClick = () => {
        playNeonClick();
        const nextClicks = titleClicks + 1;
        if (nextClicks >= 5) { setTitleClicks(0); navigate(`/${townId}/embajador`); }
        else setTitleClicks(nextClicks);
    };

    const handleWalyClick = () => {
        playNeonClick();
        navigate(`/${townId}/tablero-maestro`);
    };

    const groupedShops = useMemo(() => {
        if (!selectedCategory || localities.length === 0) return {};
        const grouped: Record<string, Shop[]> = {};
        const normalize = (str: any) => {
            if (typeof str !== 'string') return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        };
        
        localities.forEach(loc => {
            const normalizedLoc = normalize(loc);
            grouped[loc] = allShops.filter(shop => {
                if (!shop) return false;

                // 1. Estado Activo
                const isActive = shop.isActive !== false;

                // 2. Coincidencia de Categoría
                const shopCatStr = typeof shop.category === 'string' ? shop.category : String(shop.category || '');
                const selCatNameStr = typeof selectedCategory.name === 'string' ? selectedCategory.name : String(selectedCategory.name || '');

                const categoryMatch =
                    shop.category === selectedCategory.id ||
                    shop.category === selectedCategory.slug ||
                    shopCatStr.toLowerCase() === selCatNameStr.toLowerCase();

                // 3. Localidad — busca por shop.zone o por dirección
                const isMotherZone = townId === 'esteban-echeverria' || isInTraslasierra;
                const isSingleLocalityFallback = localities.length <= 1 || loc === 'Centro' || isInPatagonia;
                const zoneMatch = (isMotherZone || isSingleLocalityFallback)
                    ? ((shop.zone === loc) || !shop.zone || normalize(shop.address || '').includes(normalizedLoc) || isSingleLocalityFallback)
                    : ((shop.zone === loc) || normalize(shop.address || '').includes(normalizedLoc));

                // 4. Coincidencia de Subcategoría (solo si el usuario seleccionó una)
                const subMatch = !activeSubcategory || 
                    (shop.specialty && normalize(shop.specialty).includes(normalize(activeSubcategory))) ||
                    (shop.description && normalize(shop.description).includes(normalize(activeSubcategory))) ||
                    (shop.tags && shop.tags.some(tag => normalize(tag).includes(normalize(activeSubcategory))));

                return isActive && categoryMatch && zoneMatch && subMatch;
            });
        });
        return grouped;
    }, [selectedCategory, allShops, localities, townId, activeSubcategory]);

    // Obtener el color de la localidad activa según su índice en el array
    const activeIdx = localities.indexOf(activeLocation);
    const activeColors = LOCALITY_COLORS[activeIdx % LOCALITY_COLORS.length] || LOCALITY_COLORS[0];

    if (!selectedCategory) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <p>Categoría no encontrada</p>
                <button onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }} className="mt-4 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Volver al inicio</button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col pt-8 pb-10 animate-in slide-in-from-bottom-6 duration-700 relative overflow-hidden min-h-screen bg-transparent ${isDayMode ? 'text-slate-800' : 'text-white'}`}>
            <style>
                {`
                @keyframes bounceSlow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce-slow {
                    animation: bounceSlow 3s ease-in-out infinite;
                }
                @keyframes scanner-line {
                    0% { transform: translateY(-50%); }
                    100% { transform: translateY(0%); }
                }
                `}
            </style>
            {/* HUD Background - Tech Mesh Encendida */}
            {!isDayMode && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-indigo-500/18 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                    <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-cyan-500/18 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
                    <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[120px]" />
                    {/* Tech Grid Mesh */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] bg-[size:30px_30px]" />
                    {/* Tech Dots Mesh */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.18)_1px,transparent_1.5px)] bg-[size:15px_15px]" />
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.04] to-transparent h-[200%] w-full -translate-y-1/2 animate-[scanner-line_8s_linear_infinite]" />
                </div>
            )}

            {/* ── Encabezado Principal de Categoría (Estilo Cartel de la Home) ── */}
            <header className="flex-shrink-0 w-full max-w-[340px] mx-auto relative z-20 transition-all duration-700 bg-transparent pt-4 px-4 mb-2.5">
                <div
                    onClick={handleTitleClick}
                    className={`glass-header rounded-3xl p-5 border backdrop-blur-md cursor-pointer select-none active:translate-y-[4px] transition-all w-full text-center ${
                        isDayMode 
                            ? 'bg-white/45 border-white/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_4px_12px_rgba(88,70,50,0.06)]' 
                            : 'border-b-[4px] border-white/20'
                    }`}
                    style={isDayMode ? {} : {
                        borderColor: hexToRgba(themeColor, 0.5),
                        boxShadow: `0 15px 40px ${hexToRgba(themeColor, 0.4)}`,
                        background: `linear-gradient(135deg, ${hexToRgba(themeColor, 0.15)} 0%, rgba(15,23,42,0.6) 100%)`
                    }}
                >
                    <h2 className={`text-[20px] font-[1000] uppercase tracking-[0.18em] leading-none text-center mb-2 ${isDayMode ? 'text-[#5c4033] drop-shadow-sm' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'}`}>
                        {activeSubcategory || selectedCategory.name}
                    </h2>
                    <div className="h-[1px] w-16 mb-2.5 mx-auto" style={{ backgroundColor: isDayMode ? 'rgba(88, 70, 50, 0.25)' : hexToRgba(themeColor, 0.6), boxShadow: isDayMode ? 'none' : `0 0 10px ${hexToRgba(themeColor, 0.8)}` }}></div>
                    <p className={`text-[8.5px] font-black uppercase tracking-[0.15em] leading-tight text-center px-4 ${isDayMode ? 'text-[#7a6353]/90' : 'text-white/90'}`}>
                        Seleccioná tu comercio y descubrí ofertas magníficas
                    </p>
                </div>
            </header>

            <div className="flex flex-col gap-8 px-2 pt-2 relative z-10">
                {/* Botones de control (Retroceso / Clima) en línea (estilo Interfaz 1) */}
                <div className="flex items-center justify-between w-full max-w-[340px] mx-auto px-4 z-20">
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className={`py-3 px-6 rounded-2xl cursor-pointer flex items-center justify-center text-[9.5px] font-[1000] uppercase tracking-wider gap-1.5 shadow-md flex-1 mr-3 ${
                            isDayMode ? 'home-btn-3d border' : 'btn-3d-blanco-celeste text-cyan-900'
                        }`}
                        style={isDayMode ? { color: '#000000', borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                    >
                        <ArrowLeft size={14} style={{ color: isDayMode ? '#000000' : '#0891b2' }} />
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
                        className={`py-3 px-6 rounded-2xl cursor-pointer flex items-center justify-center text-[9.5px] font-[1000] uppercase tracking-wider gap-1.5 shadow-md flex-1 ${
                            isDayMode ? 'home-btn-3d border' : 'btn-3d-blanco-celeste text-cyan-900'
                        }`}
                        style={isDayMode ? { color: '#000000', borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                    >
                        {isDayMode ? (
                            <>
                                <Moon size={14} style={{ color: '#000000' }} />
                                <span>Modo Noche</span>
                            </>
                        ) : (
                            <>
                                <Sun size={14} style={{ color: '#0891b2' }} />
                                <span>Modo Día</span>
                            </>
                        )}
                    </button>
                </div>
                {globalConfig?.isChristmasMode && (
                    <div 
                        className="mt-4 w-[calc(100%-1rem)] max-w-[340px] mx-auto px-4 py-2.5 rounded-2xl border text-center relative overflow-hidden backdrop-blur-md animate-bounce-slow"
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
                        <h3 className="text-[12px] font-black text-white tracking-[0.12em] uppercase text-shadow-premium flex items-center justify-center gap-1.5 pt-1">
                            🎄 ¡Feliz Navidad en {townName}! 🎅
                        </h3>
                    </div>
                )}
                {localities.length > 1 && (!isInTraslasierra) && (!isInPatagonia) && (
                    <div className="flex gap-2 w-full justify-center px-2 mb-2 overflow-x-auto no-scrollbar">
                        {localities.map((loc, idx) => {
                            const isActive = activeLocation === loc;
                            const activeClass = isActive
                                ? (isDayMode ? 'home-btn-3d-active' : 'active-3d-primary')
                                : (isDayMode ? 'home-btn-3d' : 'inactive-3d');
                            return (
                                <button
                                    key={loc}
                                    onClick={() => { playNeonClick(); setActiveLocation(loc); }}
                                    className={`locality-tab flex-1 min-w-[72px] py-3 px-2 flex flex-col items-center justify-center rounded-2xl text-[10px] sm:text-[11px] font-[1000] uppercase tracking-widest text-center leading-tight transition-all duration-150 active:translate-y-[2px] ${
                                        isDayMode ? activeClass : `btn-locality-3d-tab ${activeClass}`
                                    }`}
                                >
                                    {loc}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Pestañas de Subcategorías */}
                {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2.5 px-2 pb-2 max-w-[95%] mx-auto mb-2">
                        {selectedCategory.subcategories.map((sub: string) => {
                            const isActive = activeSubcategory === sub;
                            const btnClass = isDayMode
                                ? `px-4 py-2.5 rounded-2xl text-[8.5px] font-[1000] uppercase tracking-widest transition-all duration-150 active:translate-y-[4px] ${
                                    isActive 
                                        ? 'home-btn-3d-active' 
                                        : 'home-btn-3d'
                                  }`
                                : `px-4 py-2 rounded-2xl border transition-all duration-300 text-[8.5px] font-black uppercase tracking-widest active:translate-y-[4px] ${
                                    isActive
                                        ? 'active-sub backdrop-blur-md text-white border-b-[4px] border-b-white/40 shadow-lg'
                                        : 'backdrop-blur-sm text-white/90 hover:text-white border-b-[4px] border-b-white/20'
                                  }`;

                            const btnStyle = isDayMode
                                ? {}
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
                                        key={sub}
                                        onClick={() => { 
                                            playNeonClick(); 
                                            setActiveSubcategory(prev => prev === sub ? '' : sub); 
                                        }}
                                        className={btnClass}
                                        style={isDayMode ? { borderBottomWidth: isActive ? '1px' : '4px', borderBottomColor: '#cda488', color: isActive ? '#5c4033' : '#000000' } : btnStyle}
                                    >
                                        {sub}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                <div className="flex flex-col gap-6" key={activeLocation + activeSubcategory}>
                    {/* Título de Sección con ícono */}
                    <div className="flex items-center gap-3 ml-2">
                        <div className={`w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-colors ${
                            isDayMode ? 'bg-[#faf8f5]/80 border-slate-200/50' : activeColors.dot
                        }`}>
                            <MapPin size={16} className={isDayMode ? 'text-[#855b3c]' : activeColors.pin} />
                        </div>
                        <h3 className={`text-[12px] font-black uppercase tracking-[0.4em] ${isDayMode ? 'text-[#5c4033]' : 'text-shadow-premium'}`}>
                            {isInTraslasierra || isInPatagonia ? townName : activeLocation}
                        </h3>
                        <div className={`h-[1px] flex-1 opacity-50 transition-colors ${isDayMode ? 'bg-[#5c4033]/20' : activeColors.line}`}></div>
                    </div>

                    {groupedShops[activeLocation] && groupedShops[activeLocation].length > 0 ? (
                        groupedShops[activeLocation].map((shop, index) => (
                            <div key={shop.id} style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }} className={`overflow-hidden flex flex-row cursor-default fade-up-item w-full items-stretch h-[170px] ${
                                isDayMode 
                                    ? 'home-glass-plate rounded-[2rem] border' 
                                    : `glass-card-3d ${activeColors.card} border-r border-white/20`
                            }`}>
                                <div className={`relative w-32 shop-image-wrapper flex-shrink-0 overflow-hidden border-r ${
                                    isDayMode ? 'border-[#5c4033]/15' : 'border-white/20'
                                }`}>
                                    <ProgressiveShopImage
                                        src={shop.bannerImage}
                                        alt={shop.name}
                                        className="w-full h-full transition-transform duration-1000 hover:scale-110"
                                        priority={index < 4}
                                        skeletonColor={isDayMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
                                    />
                                </div>
                                <div className={`flex-1 flex flex-col justify-between text-left min-w-0 ${isDayMode ? 'bg-white/45' : 'bg-white/[0.04]'}`}>
                                    <div className="space-y-1.5 overflow-hidden p-4 pb-2">
                                        <h3 className={`font-[1000] text-[18px] shop-title-text uppercase tracking-tighter leading-none ${isDayMode ? 'text-[#5c4033]' : 'text-white text-shadow-premium'}`}>{String(shop.name || '').replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}</h3>
                                        <div className={`flex items-start gap-1 pb-1 shop-address-sub uppercase text-[9px] font-black tracking-tight leading-snug overflow-hidden ${isDayMode ? 'text-[#7a6353]' : 'text-white/80'}`}>
                                            <MapPin size={11} strokeWidth={3} className={`flex-shrink-0 mt-0.5 ${isDayMode ? 'text-[#855b3c]' : activeColors.pin}`} />
                                            <span className="break-words line-clamp-2">{shop.address}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-1">
                                            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (<Star key={star} size={10} className={`${star <= Math.round(shop.rating) ? 'fill-yellow-400 text-yellow-400' : `fill-transparent ${isDayMode ? 'text-slate-300' : 'text-white/20'}`}`} />))}
                                                    <span className="text-[9px] font-bold text-yellow-400/80 ml-1">{shop.rating}</span>
                                                </div>
                                                {shop.specialty && <p className={`text-[8px] font-bold italic tracking-wide leading-tight line-clamp-1 ${isDayMode ? 'text-[#7a6353]/70' : 'text-white/50'}`}>"{shop.specialty}"</p>}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-md border shadow-inner" style={{ 
                                                backgroundColor: isDayMode ? 'rgba(88, 70, 50, 0.08)' : hexToRgba(themeColor, 0.2), 
                                                borderColor: isDayMode ? 'rgba(88, 70, 50, 0.15)' : hexToRgba(themeColor, 0.3) 
                                            }}>
                                                <Eye size={11} style={{ color: isDayMode ? '#7a6353' : themeColor }} />
                                                <span className="text-[9px] font-black" style={{ color: isDayMode ? '#5c4033' : themeColor }}>{shop.visits || 0} visitas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center py-2.5 px-4">
                                        <button
                                            onClick={() => { playNeonClick(); incrementarVisitas(shop.id); navigate(`/${townId}/${selectedCategory.slug}/${shop.slug || shop.id}`); }}
                                            className={`w-[90%] py-2.5 px-4 text-[9.5px] font-[1100] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border ${
                                                isDayMode ? 'home-btn-3d text-black' : 'btn-ver-catalogo-3d'
                                            }`}
                                            style={isDayMode ? { borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                                        >
                                            <BookOpen size={14} strokeWidth={2.5} className={`${isDayMode ? 'text-[#47def6]' : 'text-white'} drop-shadow-md`} />
                                            VER CATÁLOGO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={`py-12 px-6 text-center rounded-3xl mt-4 ${isDayMode ? 'home-glass-plate' : 'glass-card-3d bg-white/5 border-white/10'}`}>
                            <MapPin size={32} className={`mx-auto mb-3 ${isDayMode ? 'text-[#855b3c]' : 'text-white/20'}`} />
                            <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest leading-relaxed ${isDayMode ? 'text-[#5c4033]' : 'text-white/50'}`}>No hay comercios adheridos <br/>en {activeLocation} para {selectedCategory?.name}</p>
                        </div>
                    )}
                </div>

                <div className="w-full flex justify-center mb-8">
                    <button onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }} className={`w-max py-2.5 px-6 rounded-2xl flex items-center gap-2 border ${
                        isDayMode ? 'home-btn-3d text-black' : 'btn-3d-celeste'
                    }`}
                    style={isDayMode ? { borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                    >
                        <ArrowLeft size={16} style={isDayMode ? { color: '#000000' } : { color: themeColor }} />
                        <span className="text-[10px] font-[1100] uppercase tracking-widest">Regresar</span>
                    </button>
                </div>
            </div>

            <footer className="w-full max-w-md mx-auto px-5 z-10 pt-4 pb-4 mt-auto relative">
                {isDayMode ? (
                    <div className="bg-[#ffffff]/35 backdrop-blur-md border border-white/35 py-3 px-5 rounded-[1.8rem] flex items-center justify-between w-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_6px_15px_rgba(88,70,50,0.06)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#5c4033] select-none">
                            © 2026 · ShopDigital
                        </p>
                        <div className="flex items-center gap-2.5">
                            <p 
                                onClick={handleWalyClick}
                                className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#0f224e] select-none cursor-pointer active:scale-95 transition-transform" 
                            >
                                {activeSubcategory || selectedCategory.name}
                            </p>
                            <span className="text-[#5c4033]/40 text-[7px] select-none">|</span>
                            <button 
                                onClick={() => { playNeonClick(); navigate(`/${townId}/terminos`); }}
                                className="text-[7.5px] font-extrabold uppercase tracking-[0.15em] text-[#0f224e] hover:underline active:opacity-75 transition-opacity select-none"
                            >
                                Términos
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center gap-2 pt-4 pb-4 border-t border-white/10">
                        <p className="text-[9px] font-black text-white uppercase tracking-[0.35em] text-center select-none">
                            © 2026 · ShopDigital
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                            <p 
                                onClick={handleWalyClick}
                                className="text-[8px] font-bold uppercase tracking-[0.25em] text-center select-none cursor-pointer active:scale-95 transition-transform" 
                                style={{ color: themeColor, textShadow: `0 0 10px ${hexToRgba(themeColor, 0.8)}, 0 0 20px ${hexToRgba(themeColor, 0.4)}` }}
                            >
                                {activeSubcategory || selectedCategory.name}
                            </p>
                            <span className="text-white/20 text-[8px]">|</span>
                            <button 
                                onClick={() => { playNeonClick(); navigate(`/${townId}/terminos`); }}
                                className="text-[8px] font-bold uppercase tracking-[0.25em] text-center text-white hover:text-cyan-300 transition-colors"
                            >
                                Términos y Condiciones
                            </button>
                        </div>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default CategoryPage;
