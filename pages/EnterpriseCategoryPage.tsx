import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ENTERPRISE_CATEGORIES } from '../enterpriseConstants';
import { Shop } from '../types';
import { ChevronLeft, Factory, MapPin, Star, BookOpen, Globe, Landmark, Phone, Zap, Sun, Moon } from 'lucide-react';
import { playNeonClick } from '../utils/audio';
import { inyectarEmpresaPruebaB2B } from '../scripts/seedEnterpriseB2B';

const FOOD_IMAGES = [
    'https://images.unsplash.com/photo-1608228080908-1481d530059b?w=500&auto=format&fit=crop&q=80', // Embutidos / Chacinados
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80', // Panificadora / Harinas
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80', // Carnes / Distribución
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&auto=format&fit=crop&q=80', // Cocina / Alimentos Elaborados
    'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=80', // Bebidas / Embotelladora
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80', // Alimentos Gourmet / Quesos
];

const SEED_MOCKUP_PATTERNS = [
    'APNQkAFW_DwehRWqr6azXnpgkRWLBOcVKBC_5GNrCSPemAFiDcTlOd6KusGcQ0e0lP61o0wUDcL_lJsju2sMWqTcAMyBW5tb_Zo18tb2yrsbsD58uCr2E-zUcRmajkj2GVyl9GtxQHBETQ',
    'photo-1527960656366-ee2a5e98f661', // Imagen de bebidas de muestra rota (404)
    'photo-1606787366850-de6330128bfc', // Imagen de alimentos de muestra repetida
];

export const getEnterpriseImage = (shopId: string, customImage?: string) => {
    const isMock = !customImage || SEED_MOCKUP_PATTERNS.some(pat => customImage.includes(pat));
    if (isMock) {
        let hash = 0;
        for (let i = 0; i < shopId.length; i++) {
            hash = shopId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const idx = Math.abs(hash) % FOOD_IMAGES.length;
        return FOOD_IMAGES[idx];
    }
    return customImage;
};

interface EnterpriseCategoryPageProps {
    allShops: Shop[];
}

// Filtros de Alcance Industrial 🌍
const REACH_FILTERS = [
    { id: 'all', label: 'Todos', icon: <Globe size={14} /> },
    { id: 'national', label: 'Nacional', icon: <Globe size={14} /> },
    { id: 'regional', label: 'Regional', icon: <Landmark size={14} /> },
];

const EnterpriseCategoryPage: React.FC<EnterpriseCategoryPageProps> = ({ allShops }) => {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeReach, setActiveReach] = useState('all');

    // Theme Mode Resolver
    const [currentTime] = React.useState(new Date());
    const [themeMode, setThemeMode] = useState(() => {
        return localStorage.getItem('global_home_theme_mode') || 'auto';
    });

    const isDayMode = themeMode === 'light' || (themeMode === 'auto' && (() => {
        const hour = currentTime.getHours();
        return hour >= 8 && hour < 20;
    })());

    const toggleTheme = () => {
        playNeonClick();
        const nextMode = isDayMode ? 'dark' : 'light';
        localStorage.setItem('global_home_theme_mode', nextMode);
        setThemeMode(nextMode);
        window.dispatchEvent(new Event('theme-changed'));
    };

    // Leer provincia del query param (viene del Home cuando se seleccionó una cápsula)
    const searchParams = new URLSearchParams(location.search);
    const activeProvince = searchParams.get('provincia') || 'all';

    const PROVINCE_LABELS: Record<string, string> = {
        'buenos-aires': '🏙️ Buenos Aires',
        'cordoba': '🏔️ Córdoba',
        'santa-fe': '🌾 Santa Fe',
        'mendoza': '🍇 Mendoza',
        'tucuman': '🌿 Tucumán',
        'entre-rios': '🌊 Entre Ríos',
        'misiones': '🌴 Misiones',
        'neuquen': '⛽ Neuquén',
        'patagonia': '🏔️ Patagonia',
    };

    const selectedCategory = useMemo(() =>
        ENTERPRISE_CATEGORIES.find(cat => cat.slug === categorySlug),
        [categorySlug]);

    const filteredEnterprises = useMemo(() => {
        if (!selectedCategory) return [];
        
        const enterprises = allShops.filter(shop => {
            return shop.entityType === 'enterprise' || (shop.category && shop.category.startsWith('ent-'));
        });

        return enterprises.filter(shop => {
            const categoryMatch = shop.category === selectedCategory.id || shop.category === selectedCategory.slug;
            const reachMatch = activeReach === 'all' || shop.reach === activeReach;
            const shopProv = (shop as any).province || 'buenos-aires';
            const provinceMatch = activeProvince === 'all' || shopProv === activeProvince;
            return categoryMatch && reachMatch && provinceMatch;
        });
    }, [selectedCategory, allShops, activeReach, activeProvince]);

    // Paleta Tech Neon
    const primaryColor = '#06b6d4'; // Cyan
    const secondaryColor = '#3b82f6'; // Azul Royal
    const bgColor = '#020617'; // Slate 950

    const hexToRgba = (hex: string, alpha: number) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } catch { return `rgba(6,182,212,${alpha})`; }
    };

    if (!selectedCategory) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white min-h-screen" style={{ backgroundColor: bgColor }}>
                <Factory size={48} className="text-cyan-400/30 mb-4" />
                <p className="text-cyan-100/50 uppercase tracking-widest text-[10px] font-black">Sector Industrial no encontrado</p>
                <button onClick={() => { playNeonClick(); navigate(`/empresas`); }} className="mt-4 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Volver al Directorio</button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col animate-in slide-in-from-bottom-6 duration-1000 relative overflow-hidden min-h-screen pb-10 day-mode-bg-reset ${isDayMode ? 'day-mode' : ''}`} style={isDayMode ? { backgroundColor: '#f8fafc' } : { backgroundColor: bgColor }}>
            {/* ── CSS Animations Inline ── */}
            <style>{`
                @keyframes levitate {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes pulseGlow {
                    0%, 100% { filter: drop-shadow(0 0 15px ${hexToRgba(primaryColor, 0.4)}); }
                    50% { filter: drop-shadow(0 0 35px ${hexToRgba(primaryColor, 0.8)}); }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(200%); }
                }
                .tech-grid-bg {
                    background-size: 30px 30px;
                    background-image: 
                        linear-gradient(to right, ${hexToRgba(secondaryColor, 0.04)} 1px, transparent 1px),
                        linear-gradient(to bottom, ${hexToRgba(secondaryColor, 0.04)} 1px, transparent 1px);
                }
                .glass-card-neon {
                    background: linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.4));
                    backdrop-filter: blur(12px);
                    border: 1px solid ${hexToRgba(primaryColor, 0.2)};
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                }
                /* ☀️ REGLAS TÁCTICAS PARA EL MODO DÍA B2B */
                .day-mode .day-mode-bg-reset {
                    background: transparent !important;
                }
                .day-mode .glass-card-neon {
                    background: #ffffff !important;
                    border: 1.5px solid rgba(8, 145, 178, 0.3) !important;
                    border-bottom: 4px solid rgba(8, 145, 178, 0.45) !important;
                    box-shadow: 0 4px 10px rgba(8, 145, 178, 0.04) !important;
                }
                .day-mode .glass-card-neon h2 {
                    color: #083344 !important;
                    text-shadow: none !important;
                }
                .day-mode .glass-card-neon p {
                    color: #0284c7 !important;
                }
                .day-mode .glass-card-neon p.italic {
                    color: rgba(8, 51, 68, 0.5) !important;
                }
                .day-mode .glass-card-neon span {
                    color: #083344 !important;
                }
                .day-mode .glass-card-neon svg {
                    color: #0891b2 !important;
                    filter: none !important;
                }
                .day-mode footer p {
                    color: #083344 !important;
                    opacity: 0.75 !important;
                }
            `}</style>

            {/* ── HUD Background Tech ── */}
            <div className="fixed inset-0 pointer-events-none z-0 tech-grid-bg">
                <div className="absolute top-40 right-[-10%] w-72 h-72 rounded-full blur-[120px] opacity-30 mix-blend-screen" style={isDayMode ? { display: 'none' } : { backgroundColor: primaryColor }} />
                <div className="absolute bottom-40 left-[-10%] w-72 h-72 rounded-full blur-[120px] opacity-40 mix-blend-screen" style={isDayMode ? { display: 'none' } : { backgroundColor: secondaryColor }} />
                
                {/* Scanline Effect */}
                <div className="absolute inset-0 w-full h-[20vh] opacity-10 pointer-events-none" 
                     style={{ background: `linear-gradient(to bottom, transparent, ${primaryColor}, transparent)`, animation: 'scanline 8s linear infinite' }} />
            </div>

            {/* Header */}
            <header className="pt-4 flex-shrink-0 flex flex-col items-center relative z-10">
                <div className="w-full px-6 flex flex-col pb-2">
                    <button
                        onClick={() => { playNeonClick(); navigate(`/empresas`); }}
                        className="absolute top-6 left-5 z-[60] w-11 h-11 flex items-center justify-center btn-3d-celeste transition-all cursor-pointer"
                    >
                        <ChevronLeft size={24} style={isDayMode ? { color: '#083344' } : { color: '#22d3ee' }} strokeWidth={3} />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="absolute top-6 right-5 z-[60] w-11 h-11 flex items-center justify-center btn-3d-celeste transition-all cursor-pointer"
                        title={isDayMode ? "Activar Modo Noche" : "Activar Modo Día"}
                    >
                        {isDayMode ? (
                            <Sun size={20} className="text-amber-500 animate-[spin_8s_linear_infinite]" strokeWidth={2.5} />
                        ) : (
                            <Moon size={20} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" strokeWidth={2.5} />
                        )}
                    </button>

                    <div className="flex justify-center w-full px-2 mt-2">
                        <div className="glass-card-neon rounded-3xl w-full py-4 px-5 flex flex-col items-center border-t border-l" style={{ borderTopColor: hexToRgba(primaryColor, 0.4), borderLeftColor: hexToRgba(primaryColor, 0.2) }}>
                            <p className="text-[9px] font-bold text-cyan-200/60 uppercase tracking-widest mb-1 italic">SECTOR PRODUCTIVO</p>
                            <div className="flex items-center gap-2 mb-2">
                                <Factory size={22} style={{ color: primaryColor, animation: 'pulseGlow 3s infinite alternate' }} />
                                <h2 className="text-[18px] font-bold text-white uppercase tracking-[0.2em] leading-none text-center" style={{ textShadow: `0 0 15px ${hexToRgba(primaryColor, 0.5)}` }}>
                                    {selectedCategory.name}
                                </h2>
                            </div>
                            <div className="h-[2px] w-16 mb-2 rounded-full" style={{ backgroundImage: `linear-gradient(to right, transparent, ${primaryColor}, transparent)` }} />
                            <p className="text-[9px] font-medium text-cyan-100 uppercase tracking-[0.2em] text-center opacity-80">
                                Listado de Proveedores
                            </p>
                            {/* Badge de Provincia activa */}
                            {activeProvince !== 'all' && (
                                <div className="mt-3 px-3 py-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-[9px] font-bold uppercase tracking-widest text-cyan-200 flex items-center gap-1.5" style={{ boxShadow: `inset 0 0 10px ${hexToRgba(primaryColor, 0.2)}` }}>
                                    <MapPin size={10} className="text-cyan-400" />
                                    {PROVINCE_LABELS[activeProvince] || activeProvince}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-6 px-4 pt-4 relative z-10">
                {/* Filtros de Alcance */}
                <div className="flex gap-2 w-full justify-center px-2 mb-2">
                    {REACH_FILTERS.map((filter) => {
                        const isActive = activeReach === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => { playNeonClick(); setActiveReach(filter.id); }}
                                className="flex-1 min-w-[80px] py-3 px-2 rounded-2xl border flex items-center justify-center gap-1.5 transition-all duration-300 active:translate-y-[4px] relative overflow-hidden cursor-pointer"
                                style={isDayMode ? (
                                    isActive ? {
                                        backgroundColor: 'rgba(8, 145, 178, 0.15)',
                                        borderColor: '#0891b2',
                                        borderBottomWidth: '4px',
                                        borderBottomColor: '#0891b2',
                                        color: '#083344',
                                        boxShadow: '0 4px 12px rgba(8, 145, 178, 0.15)',
                                    } : {
                                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                        borderColor: 'rgba(8, 145, 178, 0.2)',
                                        borderBottomWidth: '4px',
                                        borderBottomColor: 'rgba(8, 145, 178, 0.3)',
                                        color: 'rgba(8, 51, 68, 0.6)',
                                    }
                                ) : (
                                    isActive ? {
                                        backgroundColor: hexToRgba(secondaryColor, 0.3),
                                        borderColor: primaryColor,
                                        borderBottomWidth: '4px',
                                        borderBottomColor: hexToRgba(primaryColor, 0.8),
                                        color: '#ffffff',
                                        boxShadow: `0 0 20px ${hexToRgba(primaryColor, 0.4)}`,
                                    } : {
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderBottomWidth: '4px',
                                        borderBottomColor: 'rgba(255,255,255,0.2)',
                                        color: 'rgba(255,255,255,0.5)',
                                    }
                                )}
                            >
                                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />}
                                <span style={{ color: isActive ? primaryColor : 'rgba(255,255,255,0.3)' }}>{filter.icon}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    {filter.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tarjetas de Empresa */}
                {filteredEnterprises.length > 0 ? (
                    <div className="flex flex-col gap-5" key={activeReach + activeProvince}>
                        {filteredEnterprises.map((enterprise, index) => (
                            <div
                                key={enterprise.id}
                                style={{ 
                                    animationDelay: `${Math.min(index * 40, 200)}ms`, 
                                    borderBottomWidth: '5px', 
                                    borderBottomColor: isDayMode ? 'rgba(8, 145, 178, 0.45)' : hexToRgba(primaryColor, 0.3) 
                                }}
                                className="glass-card-neon overflow-hidden flex flex-row cursor-default fade-up-item w-full items-stretch h-[170px] rounded-2xl relative group shadow-[0_15px_30px_rgba(6,182,212,0.1)]"
                            >
                                {/* Brillo interactivo de la tarjeta */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                                     style={{ background: `radial-gradient(circle at center, ${hexToRgba(primaryColor, 0.1)} 0%, transparent 70%)` }} />

                                {/* Imagen lateral */}
                                <div className="relative w-32 flex-shrink-0 overflow-hidden border-r" style={{ borderColor: isDayMode ? 'rgba(8, 145, 178, 0.25)' : hexToRgba(primaryColor, 0.2) }}>
                                    <img
                                        src={getEnterpriseImage(enterprise.id, enterprise.bannerImage || enterprise.image)}
                                        alt={enterprise.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110 opacity-90"
                                    />
                                    {/* Badge Verificado */}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-wider border backdrop-blur-md bg-cyan-500/30 border-cyan-400/50 text-cyan-100 flex items-center gap-1 shadow-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        ACTIVO
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 flex flex-col justify-between text-left min-w-0 bg-transparent z-10">
                                    <div className="space-y-1.5 overflow-hidden p-4 pb-2">
                                        <h3 className="font-bold text-[17px] text-white uppercase tracking-tighter leading-none" style={isDayMode ? { color: '#083344' } : { textShadow: `0 0 10px ${hexToRgba(primaryColor, 0.5)}` }}>
                                            {enterprise.name.replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}
                                        </h3>
                                        <div className="flex items-start gap-1 pb-1 text-cyan-100/80 uppercase text-[9px] font-semibold tracking-tight leading-snug overflow-hidden">
                                            <MapPin size={11} strokeWidth={2.5} className="flex-shrink-0 mt-[1px]" style={{ color: isDayMode ? '#0891b2' : primaryColor }} />
                                            <span className="break-words line-clamp-2">{enterprise.address || enterprise.zone}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-auto pt-1">
                                            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} size={10} className={`${star <= Math.round(enterprise.rating) ? 'fill-cyan-400 text-cyan-400' : 'fill-transparent text-white/20'}`} />
                                                    ))}
                                                    <span className="text-[9px] font-bold text-cyan-400/90 ml-1">{enterprise.rating}</span>
                                                </div>
                                                {enterprise.specialty && <p className="text-[8px] font-medium text-cyan-200/50 italic tracking-wide leading-tight line-clamp-1">"{enterprise.specialty}"</p>}
                                            </div>
                                            {/* Badge Alcance */}
                                            <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 rounded-md border shadow-inner" style={isDayMode ? { backgroundColor: 'rgba(8, 145, 178, 0.1)', borderColor: 'rgba(8, 145, 178, 0.3)' } : { backgroundColor: hexToRgba(secondaryColor, 0.2), borderColor: hexToRgba(primaryColor, 0.3) }}>
                                                <Globe size={9} style={{ color: isDayMode ? '#0891b2' : primaryColor }} />
                                                <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: isDayMode ? '#0891b2' : primaryColor }}>
                                                    {enterprise.reach === 'national' ? 'Nacional' : enterprise.reach === 'regional' ? 'Regional' : 'Local'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Botón VER CATÁLOGO */}
                                    <div className="w-full flex justify-center py-3 px-4">
                                        <button
                                            onClick={() => { playNeonClick(); navigate(`/empresas/${selectedCategory!.slug}/${enterprise.slug || enterprise.id}`); }}
                                            className="w-full py-2.5 px-4 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer btn-3d-celeste group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
                                            <BookOpen size={14} style={isDayMode ? { color: '#083344' } : { color: '#22d3ee' }} />
                                            <span style={isDayMode ? { color: '#083344' } : { color: '#ffffff' }}>VER CATÁLOGO</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center glass-card-neon rounded-3xl mt-4">
                        <Factory size={32} className="mx-auto text-cyan-500/30 mb-4" />
                        <p className="text-[10px] font-bold text-cyan-100/60 uppercase tracking-widest leading-relaxed">
                            No hay proveedores adheridos<br />en {selectedCategory?.name}
                        </p>
                        <button
                            onClick={async () => {
                                playNeonClick();
                                try {
                                    await inyectarEmpresaPruebaB2B();
                                    alert('✅ Empresa "Embutidos Monte Grande" inyectada con éxito. Recargá la página.');
                                    window.location.reload();
                                } catch (e: any) {
                                    alert('❌ Error al inyectar: ' + e.message);
                                }
                            }}
                            className="mt-6 px-6 py-3 rounded-xl border flex items-center gap-2 mx-auto active:scale-95 transition-all text-[9px] font-bold uppercase tracking-widest cursor-pointer"
                            style={isDayMode ? { backgroundColor: 'rgba(8, 145, 178, 0.1)', borderColor: 'rgba(8, 145, 178, 0.4)', color: '#0891b2' } : { backgroundColor: hexToRgba(primaryColor, 0.1), borderColor: hexToRgba(primaryColor, 0.4), color: primaryColor }}
                        >
                            <Zap size={14} /> Inyectar Empresa Demo
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="w-full flex flex-col items-center gap-2 pt-8 pb-6 mt-auto relative z-10">
                <div className="flex items-center gap-2 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <p className="text-[9px] font-bold text-cyan-200 uppercase tracking-widest cursor-default select-none">
                        SHOPDIGITAL NETWORKS © 2026
                    </p>
                </div>
                <p className="text-[8px] font-medium uppercase tracking-[0.25em]" style={{ color: hexToRgba(secondaryColor, 0.7) }}>
                    NODO EMPRESARIAL SECURE LINK
                </p>
            </footer>
        </div>
    );
};

export default EnterpriseCategoryPage;
