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
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

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
        <div className="flex flex-col pt-6 pb-10 animate-in slide-in-from-bottom-6 duration-700 relative overflow-hidden min-h-screen bg-transparent text-[#2c2440]">
            {/* Fondo Ciber-Digital de Circuitos Animados */}
            <CyberCircuitBackground />

            {/* ── Encabezado Principal de Categoría (Placa Neumórfica Crema HD) ── */}
            <header className="flex-shrink-0 w-full max-w-[365px] mx-auto relative z-20 transition-all duration-700 bg-transparent pt-3 px-4 mb-2.5">
                <div
                    onClick={handleTitleClick}
                    className="neu-plate cursor-pointer select-none active:scale-95 transition-all w-full text-center py-5 px-6"
                >
                    <h2 className="text-[19px] font-[900] uppercase tracking-[0.15em] leading-none text-center mb-2 text-[#2c2440]">
                        {activeSubcategory || selectedCategory.name}
                    </h2>
                    <div className="h-[1px] w-16 mb-2.5 mx-auto bg-[#b4a594]/40"></div>
                    <p className="text-[8.5px] font-extrabold uppercase tracking-[0.16em] leading-tight text-center px-2 text-[#4a3d6a]">
                        Seleccioná tu comercio y descubrí ofertas magníficas en {townName}
                    </p>
                </div>
            </header>

            <div className="flex flex-col gap-6 px-4 relative z-10 max-w-[365px] mx-auto w-full">
                {/* Botones de control (Volver / Modo Noche) Neumórficos 3D */}
                <div className="flex items-center justify-between w-full mx-auto px-1 z-20 gap-3">
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
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

                {/* Localidades / Zonas Neumórficas 3D */}
                {localities.length > 1 && (!isInTraslasierra) && (!isInPatagonia) && (
                    <div className="flex gap-2 w-full justify-center px-1 overflow-x-auto no-scrollbar">
                        {localities.map((loc) => {
                            const isActive = activeLocation === loc;
                            return (
                                <button
                                    key={loc}
                                    onClick={() => { playNeonClick(); setActiveLocation(loc); }}
                                    className={`flex-1 min-w-[72px] py-2.5 px-2 flex flex-col items-center justify-center text-[9px] font-extrabold uppercase tracking-wider text-center leading-tight transition-all ${
                                        isActive ? 'neu-btn-3d-active' : 'neu-btn-3d'
                                    }`}
                                >
                                    {loc}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Pestañas de Subcategorías Neumórficas 3D */}
                {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 px-1 mb-1">
                        {selectedCategory.subcategories.map((sub: string) => {
                            const isActive = activeSubcategory === sub;
                            return (
                                <button
                                    key={sub}
                                    onClick={() => { 
                                        playNeonClick(); 
                                        setActiveSubcategory(prev => prev === sub ? '' : sub); 
                                    }}
                                    className={`py-2 px-3.5 text-[8px] font-extrabold uppercase tracking-wider transition-all ${
                                        isActive ? 'neu-btn-3d-active' : 'neu-btn-3d'
                                    }`}
                                >
                                    {sub}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col gap-5" key={activeLocation + activeSubcategory}>
                    {/* Título de Sección con ícono Neumórfico Inset */}
                    <div className="neu-inset-title py-2 px-4 flex items-center gap-2.5 w-full">
                        <div className="w-6 h-6 rounded-full bg-[#f0ece6] flex items-center justify-center shadow-sm">
                            <MapPin size={14} className="text-[#ff6b6b]" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2c2440]">
                            {isInTraslasierra || isInPatagonia ? townName : activeLocation}
                        </h3>
                        <div className="h-[1px] flex-1 bg-[#b4a594]/30"></div>
                    </div>

                    {groupedShops[activeLocation] && groupedShops[activeLocation].length > 0 ? (
                        groupedShops[activeLocation].map((shop, index) => (
                            <div key={shop.id} style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }} className="neu-plate overflow-hidden flex flex-row cursor-default fade-up-item w-full items-stretch h-[170px] p-0 border border-white/60">
                                <div className="relative w-32 shop-image-wrapper flex-shrink-0 overflow-hidden border-r border-[#b4a594]/30">
                                    <ProgressiveShopImage
                                        src={shop.bannerImage}
                                        alt={shop.name}
                                        className="w-full h-full transition-transform duration-1000 hover:scale-110 object-cover"
                                        priority={index < 4}
                                        skeletonColor="rgba(0,0,0,0.06)"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col justify-between text-left min-w-0 bg-[#f0ece6]/90 p-3.5">
                                    <div className="space-y-1.5 overflow-hidden">
                                        <h3 className="font-[900] text-[17px] uppercase tracking-tight leading-none text-[#2c2440]">{String(shop.name || '').replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}</h3>
                                        <div className="flex items-start gap-1 pb-1 uppercase text-[8.5px] font-extrabold tracking-tight leading-snug text-[#4a3d6a]">
                                            <MapPin size={11} strokeWidth={2.5} className="flex-shrink-0 mt-0.5 text-[#ff6b6b]" />
                                            <span className="break-words line-clamp-2">{shop.address}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-1">
                                            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (<Star key={star} size={10} className={`${star <= Math.round(shop.rating) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} />))}
                                                    <span className="text-[9px] font-bold text-amber-500 ml-1">{shop.rating}</span>
                                                </div>
                                                {shop.specialty && <p className="text-[8px] font-extrabold italic tracking-wide leading-tight line-clamp-1 text-[#4a3d6a]/80">"{shop.specialty}"</p>}
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-lg border border-[#b4a594]/30 bg-[#e6e2dc] shadow-inner">
                                                <Eye size={11} className="text-[#4a3d6a]" />
                                                <span className="text-[8.5px] font-black text-[#2c2440]">{shop.visits || 0} visitas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center pt-2">
                                        <button
                                            onClick={() => { playNeonClick(); incrementarVisitas(shop.id); navigate(`/${townId}/${selectedCategory.slug}/${shop.slug || shop.id}`); }}
                                            className="neu-btn-3d w-full py-2 px-3 text-[9px] font-black uppercase tracking-[0.18em] flex items-center justify-center gap-2"
                                        >
                                            <BookOpen size={13} strokeWidth={2.5} className="text-[#ff6b6b]" />
                                            VER CATÁLOGO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="neu-plate py-10 px-6 text-center text-[#2c2440]">
                            <MapPin size={30} className="mx-auto mb-2 text-[#ff6b6b] opacity-80" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No hay comercios adheridos <br/>en {activeLocation} para {selectedCategory?.name}</p>
                        </div>
                    )}
                </div>

                <div className="w-full flex justify-center mt-2 mb-4">
                    <button 
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }} 
                        className="neu-btn-3d py-2.5 px-6 rounded-2xl flex items-center gap-2 text-[9.5px] font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={15} className="text-[#ff6b6b]" />
                        <span>Regresar a Zona</span>
                    </button>
                </div>
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
                            {activeSubcategory || selectedCategory.name}
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

export default CategoryPage;
