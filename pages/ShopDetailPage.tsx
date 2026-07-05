import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop, ProductOffer } from '../types';
import {
    Share2,
    MapPin,
    BookOpen,
    ShoppingBag,
    Lock,
    MessageCircle,
    Handshake,
    Navigation,
    Car,
    Facebook,
    Instagram,
    Music,
    ArrowLeft,
    Gift,
    Users,
    MessageSquare,
    Star,
    Settings,
    Eye,
    Heart,
    Image as ImageIcon,
    Sun,
    Moon
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { playNeonClick } from '../utils/audio';
import { useAuth } from '../components/AuthContext';
import { incrementarLikesFeed, suscribirseABroadcast, Broadcast } from '../firebase';
import { logEvento } from '../services/telemetry';
import ProgressiveShopImage from '../components/ProgressiveShopImage';

interface ShopDetailPageProps {
    allShops: Shop[];
    globalConfig?: any;
}

const ShopDetailPage: React.FC<ShopDetailPageProps> = ({ allShops, globalConfig }) => {
    const { townId = 'esteban-echeverria', categorySlug, shopSlug } = useParams<{ townId: string; categorySlug: string; shopSlug: string }>();
    const navigate = useNavigate();
    const isEnterprisePath = window.location.pathname.startsWith('/empresas');
    const basePath = isEnterprisePath ? '/empresas' : `/${townId}`;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentTime] = useState(new Date());
    const checkIsDayMode = () => {
        const saved = localStorage.getItem('global_home_theme_mode');
        return (saved || 'light') === 'light';
    };
    const [isDayMode, setIsDayMode] = useState(checkIsDayMode);

    useEffect(() => {
        const syncTheme = () => setIsDayMode(checkIsDayMode());
        window.addEventListener('theme-changed', syncTheme);
        return () => window.removeEventListener('theme-changed', syncTheme);
    }, []);
    const catalogRef = useRef<HTMLDivElement>(null);
    const offersCarouselRef = useRef<HTMLDivElement>(null);
    const offersTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isTouchingRef = useRef(false);
    const [selectedOfferForModal, setSelectedOfferForModal] = useState<ProductOffer | null>(null);
    const { user, login } = useAuth();
    const [lockClicks, setLockClicks] = useState(0);
    const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ROOT_EMAIL = 'walyconexion@gmail.com';

    const handleMerchantAccess = async (destination: string) => {
        playNeonClick();
        if (!user) {
            await login();
            return;
        }
        const userEmail = user.email?.trim().toLowerCase();
        const shopEmail = selectedShop?.authorizedEmail?.trim().toLowerCase();
        if (userEmail === ROOT_EMAIL || (shopEmail && userEmail === shopEmail)) {
            navigate(destination);
        }
        // Si no tiene acceso, simplemente no pasa nada (modo mudo)
    };

    // 🔐 Cerradura Secreta: 5 toques para activar
    const handleLockTap = () => {
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        const next = lockClicks + 1;
        setLockClicks(next);
        if (next >= 5 && selectedShop) {
            setLockClicks(0);
            handleMerchantAccess(`/${townId}/mi-catalogo/editar/${selectedShop.id}`);
            return;
        }
        // Reset después de 3 segundos sin toques
        lockTimerRef.current = setTimeout(() => setLockClicks(0), 3000);
    };

    const selectedShop = useMemo(() =>
        allShops.find(shop => (shop.slug || shop.id) === shopSlug),
        [shopSlug, allShops]);

    const themeColor = selectedShop?.themeColor || '#22d3ee';
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Mapa de configuracion visual por tema estacional
    const SEASON_CONFIG: Record<string, { particles: string[]; bg: string; overlay: string }> = {
        winter:     { particles: ['❄️','❅','❄️','⛄','❄️'], bg: 'rgba(30,58,138,0.07)',  overlay: 'rgba(96,165,250,0.04)' },
        spring:     { particles: ['🌸','🌷','🌺','🪷','🌸'], bg: 'rgba(131,24,67,0.06)',  overlay: 'rgba(244,114,182,0.04)' },
        summer:     { particles: ['☀️','🌞','🌴','🌼','☀️'], bg: 'rgba(120,53,15,0.07)',  overlay: 'rgba(251,191,36,0.04)' },
        autumn:     { particles: ['🍂','🍁','🍃','🍂','🍁'], bg: 'rgba(124,45,18,0.08)',  overlay: 'rgba(249,115,22,0.04)' },
        christmas:  { particles: ['❄️','🎄','🎅','⭐','🔔'], bg: 'rgba(20,83,45,0.08)',   overlay: 'rgba(34,197,94,0.04)' },
        halloween:  { particles: ['🎃','👻','🕷️','🌚','🎃'], bg: 'rgba(67,20,7,0.10)',   overlay: 'rgba(249,115,22,0.05)' },
        valentines: { particles: ['❤️','💕','💖','💝','❤️'], bg: 'rgba(136,19,55,0.08)',  overlay: 'rgba(244,63,94,0.04)' },
        newyear:    { particles: ['🎆','✨','🥂','🎆','✨'], bg: 'rgba(69,10,10,0.07)',   overlay: 'rgba(250,204,21,0.04)' },
        patrio:     { particles: ['🇦🇷','⭐','🌊','⭐','🇦🇷'], bg: 'rgba(7,89,133,0.08)',  overlay: 'rgba(56,189,248,0.04)' },
        carnival:   { particles: ['🎭','🎉','🎈','✨','🎊'], bg: 'rgba(88,28,135,0.08)',  overlay: 'rgba(168,85,247,0.04)' },
        easter:     { particles: ['🐣','🐥','🌻','🥚','🐣'], bg: 'rgba(26,46,5,0.07)',   overlay: 'rgba(132,204,22,0.04)' },
    };
    const activeSeason = (selectedShop?.seasonTheme && selectedShop.seasonTheme !== 'none')
        ? SEASON_CONFIG[selectedShop.seasonTheme]
        : (globalConfig?.isChristmasMode ? SEASON_CONFIG.christmas : null);


    const [hasLikedFeed, setHasLikedFeed] = useState(false);
    const [feedLikesCount, setFeedLikesCount] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isGlitching, setIsGlitching] = useState(false);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const feedGallery = useMemo(() => {
        if (!selectedShop) return [];
        if (selectedShop.feedImages && selectedShop.feedImages.length > 0) {
            return selectedShop.feedImages;
        }
        if (selectedShop.bannerImage) return [selectedShop.bannerImage];
        if (selectedShop.image) return [selectedShop.image];
        return [];
    }, [selectedShop]);

    // Mezclar feed local + broadcasts globales
    const muroItems = useMemo(() => {
        const localItems = feedGallery.map(url => ({
            url,
            type: /\.(mp4|webm|mov)($|\?)/i.test(url) ? 'video' as const : 'image' as const,
            isBroadcast: false,
            title: ''
        }));
        // Filtrar broadcasts por categoría del comercio
        const shopCategory = selectedShop?.category?.toLowerCase() || '';
        const activeBroadcasts = broadcasts
            .filter(b => b.targetCategories.includes('all') || b.targetCategories.some(c => c.toLowerCase() === shopCategory))
            .map(b => ({
                url: b.mediaUrl,
                type: b.mediaType,
                isBroadcast: true,
                title: b.title
            }));
        // Intercalar: broadcast cada 2 items locales
        const result = [...localItems];
        activeBroadcasts.forEach((bc, i) => {
            const pos = Math.min((i + 1) * 2, result.length);
            result.splice(pos, 0, bc);
        });
        return result.length > 0 ? result : [];
    }, [feedGallery, broadcasts, selectedShop]);

    // Suscribirse a broadcasts en tiempo real
    useEffect(() => {
        const unsub = suscribirseABroadcast((bcs) => setBroadcasts(bcs), townId);
        return () => unsub();
    }, [townId]);

    // Auto-slideshow cada 5 segundos
    useEffect(() => {
        if (muroItems.length <= 1) return;
        slideTimerRef.current = setInterval(() => {
            setIsGlitching(true);
            setTimeout(() => {
                setCurrentSlide(prev => (prev + 1) % muroItems.length);
                setIsGlitching(false);
            }, 400);
        }, 5000);
        return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current); };
    }, [muroItems.length]);

    const handleLikeFeed = async () => {
        if (hasLikedFeed || !selectedShop) return;
        playNeonClick();
        setHasLikedFeed(true);
        setFeedLikesCount(prev => prev + 1);
        await incrementarLikesFeed(selectedShop.id);
    };

    useEffect(() => {
        if (selectedShop) {
            setFeedLikesCount(selectedShop.feedLikes || 0);

            const gallery = selectedShop.galleryImages && selectedShop.galleryImages.length > 0
                ? selectedShop.galleryImages
                : [selectedShop.bannerImage, selectedShop.image, selectedShop.offers[0]?.image].filter(Boolean) as string[];

            if (gallery.length > 1) {
                const timer = setInterval(() => {
                    setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
                }, 6000);
                return () => clearInterval(timer);
            }
        }
        return undefined;
    }, [selectedShop]);

    // Auto-scroll híbrido del carrusel de ofertas
    useEffect(() => {
        if (!selectedShop || selectedShop.offers.length <= 1) return;
        
        offersTimerRef.current = setInterval(() => {
            if (!isTouchingRef.current && offersCarouselRef.current) {
                const el = offersCarouselRef.current;
                if (el.scrollLeft >= (el.scrollWidth - el.clientWidth - 10)) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    el.scrollBy({ left: 180, behavior: 'smooth' });
                }
            }
        }, 3500); 

        return () => { if (offersTimerRef.current) clearInterval(offersTimerRef.current); };
    }, [selectedShop]);

    // 🛰️ SENSOR ARI: Tráfico Base (Entrada al Búnker)
    useEffect(() => {
        if (selectedShop) {
            logEvento('view_shop', selectedShop.id, { nombre_local: selectedShop.name });
        }
    }, [selectedShop?.id]);

    const scrollToCatalog = () => {
        playNeonClick();
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleShare = () => {
        playNeonClick();
        const appUrl = window.location.href;
        const shopName = selectedShop?.name || 'shopdigital.ar';
        const shareTitle = `${shopName} - Catálogo Online`;
        const shareDescription = `Te comparto el catálogo de *${shopName}* desde la App de Waly 🚀`;
        const shareText = `${shareDescription}\n\n👉 ${appUrl}`;

        if (navigator.share) {
            navigator.share({
                title: shareTitle,
                text: shareText,
                url: appUrl,
            }).catch(console.error);
        } else {
            const whatsappText = encodeURIComponent(shareText);
            window.open(`https://wa.me/?text=${whatsappText}`, '_blank', 'noopener,noreferrer');
        }
    };

    const handleOpenLink = (url: string | null) => {
        playNeonClick();
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('Función próximamente disponible');
        }
    };

    if (!selectedShop) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <p>Comercio no encontrado</p>
                <button onClick={() => {
                    playNeonClick();
                    navigate(isEnterprisePath ? '/empresas' : `/${townId}/home`);
                }} className="mt-4 text-cyan-400 font-bold uppercase tracking-widest text-[10px]">Volver al inicio</button>
            </div>
        );
    }

    const gallery = selectedShop.galleryImages && selectedShop.galleryImages.length > 0
        ? selectedShop.galleryImages
        : [selectedShop.bannerImage, selectedShop.image, selectedShop.offers[0]?.image].filter(Boolean) as string[];

    const isCustomColor = selectedShop.customBackground?.startsWith('#');
    
    const wallpaperClass = selectedShop.customBackground && selectedShop.customBackground !== 'none' && !isCustomColor
        ? `bg-pattern-${selectedShop.customBackground}` 
        : '';
    
    // Función para detectar si un color hexadecimal es claro u oscuro
    const isLightColor = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    };

    const isLightWallpaper = isCustomColor ? isLightColor(selectedShop.customBackground!) : false;

    return (
        <div 
          className={`pb-24 animate-in fade-in duration-700 min-h-screen relative ${wallpaperClass} ${isDayMode ? 'day-mode bg-[#cda488] text-[#2d1e15]' : 'bg-[#060d1a] text-white'}`}
          style={isCustomColor ? { backgroundColor: selectedShop.customBackground } : {}}
        >

            {/* OVERLAY ESTACIONAL - particulas flotantes */}
            {activeSeason && (
                <div className="fixed inset-0 pointer-events-none z-[998] overflow-hidden">
                    <div className="absolute inset-0" style={{ background: activeSeason.bg }} />
                    <div className="absolute inset-0" style={{ background: activeSeason.overlay }} />
                    {activeSeason.particles.map((emoji, i) => (
                        <span key={i} className="absolute text-2xl select-none" style={{
                            left: `${8 + i * 17}%`,
                            top: '-8%',
                            animation: `seasonFall ${7 + i * 1.4}s linear ${i * 1.1}s infinite`,
                            opacity: 0.65,
                        }}>{emoji}</span>
                    ))}
                    {activeSeason.particles.map((emoji, i) => (
                        <span key={`b${i}`} className="absolute text-xl select-none" style={{
                            left: `${3 + i * 20}%`,
                            top: '-12%',
                            animation: `seasonFall ${9 + i * 1.1}s linear ${i * 2.2 + 2}s infinite`,
                            opacity: 0.35,
                        }}>{emoji}</span>
                    ))}
                </div>
            )}

            <Helmet>
                <title>{selectedShop.name} - Catálogo de Ofertas</title>
                <meta name="description" content={`Mirá nuestro menú digital de ${selectedShop.specialty || 'gastronomía'} en nuestra app. Pedidos directos por WhatsApp.`} />

                {/* Facebook / OG */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${selectedShop.name} - Catálogo de Ofertas`} />
                <meta property="og:description" content={`Mirá nuestro menú digital de ${selectedShop.specialty || 'gastronomía'} en nuestra app. Pedidos directos por WhatsApp.`} />
                <meta property="og:image" content={selectedShop.bannerImage || selectedShop.image} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${selectedShop.name} - Catálogo de Ofertas`} />
                <meta name="twitter:description" content={`Mirá nuestro menú digital de ${selectedShop.specialty || 'gastronomía'} en nuestra app. Pedidos directos por WhatsApp.`} />
                <meta name="twitter:image" content={selectedShop.bannerImage || selectedShop.image} />
            </Helmet>

            <div className="relative w-full h-[360px] bg-black overflow-hidden">
                {/* Back Button Overlay */}
                <button
                    onClick={() => {
                        playNeonClick();
                        navigate(`${basePath}/${categorySlug}`);
                    }}
                    className="absolute top-6 left-5 z-[60] w-10 h-10 flex items-center justify-center rounded-full btn-3d-celeste active:scale-90 transition-all"
                >
                    <ArrowLeft size={18} style={isDayMode ? { color: '#083344' } : { color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                </button>

                {/* Botón de alternancia de tema (Sol/Luna) premium */}
                <button
                    onClick={() => {
                        playNeonClick();
                        const current = localStorage.getItem('global_home_theme_mode') || 'light';
                        const nextTheme = current === 'light' ? 'dark' : 'light';
                        localStorage.setItem('global_home_theme_mode', nextTheme);
                        window.dispatchEvent(new Event('theme-changed'));
                    }}
                    className="absolute top-6 left-[72px] z-[60] w-10 h-10 flex items-center justify-center rounded-full btn-3d-celeste active:scale-90 transition-all"
                >
                    {isDayMode ? (
                        <Moon 
                            size={16} 
                            style={{ color: '#083344' }} 
                        />
                    ) : (
                        <Sun 
                            size={16} 
                            style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 6px #22d3ee)' }} 
                        />
                    )}
                </button>

                {gallery.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`Cover ${idx}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                    />
                ))}
                {/* Gradiente sutil solo en los bordes para lectura de texto, el centro queda 100% visible */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>

                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] flex flex-col items-center">
                    {/* 💡 LETRERO NEÓN 3D — Nombre del Comercio */}
                    <div className="relative" style={{ '--neon-color': themeColor } as React.CSSProperties}>
                        {globalConfig?.isChristmasMode && (
                            <svg className="absolute -top-4 left-[-15px] w-9 h-9 z-[60] pointer-events-none drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] rotate-[-15deg]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 14C18 10 16 5 11 3C10.5 4 9 6.5 9 8C9 9 9.5 9.5 9 10C8 11 6.5 12 5.5 14C4 17 6.5 18 11 18C15.5 18 18 17 18 14Z" fill="#ef4444"/>
                                <path d="M4 17C4 16 5 15.5 11 15.5C17 15.5 18 16 18 17C18 18 16.5 19 11 19C5.5 19 4 18 4 17Z" fill="#ffffff"/>
                                <circle cx="10" cy="3.5" r="2.5" fill="#ffffff"/>
                            </svg>
                        )}
                        {/* Capa de resplandor trasero (profundidad 3D) */}
                        <h1
                            aria-hidden="true"
                            className="neon-sign-title neon-sign-glow text-[36px] text-center pointer-events-none select-none"
                            style={{ color: themeColor }}
                        >
                            {String(selectedShop.name || '').replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}
                        </h1>
                        {/* Capa principal del letrero */}
                        <h1 
                            className="neon-sign-title neon-warm-up text-[36px] text-center pointer-events-auto cursor-default"
                            onClick={(e) => e.preventDefault()}
                        >
                            {String(selectedShop.name || '').replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 opacity-90">
                        <MapPin size={10} className="text-red-400" strokeWidth={3} />
                        <span className="text-[8.5px] font-black uppercase tracking-[0.3em] text-white/80 text-shadow-premium">
                            {selectedShop.zone || 'Tu zona'}
                        </span>
                    </div>
                    <div className="w-12 h-[1px] bg-white/40 mx-auto mt-2.5 shadow-[0_0_10px_rgba(255,255,255,0.6)]"></div>
                </div>

                {/* Contador de Visitas Portada (Esquina Inferior Izquierda) */}
                <div className="absolute bottom-5 left-5 z-40 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border shadow-inner backdrop-blur-sm" style={{ borderColor: hexToRgba(themeColor, 0.2) }}>
                    <Eye size={12} style={{ color: themeColor }} />
                    <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: themeColor }}>{selectedShop.visits || 0} visitas</span>
                </div>

                {/* Contador de Suscriptores Portada (Esquina Inferior Derecha) */}
                <div className="absolute bottom-5 right-5 z-40 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border shadow-inner backdrop-blur-sm" style={{ borderColor: hexToRgba(themeColor, 0.2) }}>
                    <Users size={12} style={{ color: themeColor }} />
                    <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: themeColor }}>{selectedShop.subscribers || 0} suscriptores</span>
                </div>

            </div>

            <div className="relative z-10 flex flex-col items-center">

                {/* ---------- CATÁLOGO DE OFERTAS ---------- */}
                <div ref={catalogRef} className="w-full mb-14 mt-2">
                    <div className="w-full px-5 mb-6 flex flex-col items-center">
                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`${basePath}/${categorySlug}/${shopSlug}/menu`);
                            }}
                            className="w-full py-4 flex items-center justify-center gap-3 font-[1100] uppercase tracking-[0.25em] text-[10px] text-white btn-3d-celeste"
                        >
                            <ShoppingBag size={16} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                            <span className={isDayMode ? "" : "text-shadow-premium"}>Abrir Catálogo Completo</span>
                        </button>
                    </div>

                    <div className="w-full relative">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                        <div 
                            className="flex gap-4 px-4 pb-4 overflow-x-auto snap-x snap-mandatory no-scrollbar relative z-10" 
                            ref={offersCarouselRef}
                            onTouchStart={() => isTouchingRef.current = true}
                            onTouchEnd={() => { setTimeout(() => isTouchingRef.current = false, 2000) }}
                            onMouseEnter={() => isTouchingRef.current = true}
                            onMouseLeave={() => isTouchingRef.current = false}
                        >
                            {[...selectedShop.offers, ...selectedShop.offers].map((offer, idx) => {
                                // Badges Dinámicos sugeridos por Gemy
                                const badgeType = idx % 3;
                                const badgeProps = badgeType === 0 
                                    ? { text: '🔥 HOT', bg: 'bg-orange-500/90', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.8)]' }
                                    : badgeType === 1 
                                    ? { text: '✨ NUEVO', bg: 'bg-green-500/90', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.8)]' }
                                    : { text: '⚡ HOY', bg: 'bg-rose-500/90', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.8)]' };

                                return (
                                    <div key={`${offer.id}-${idx}`} className="glass-card-3d offer-card-neon flex-shrink-0 w-44 p-3.5 flex flex-col relative group snap-center cursor-pointer" onClick={() => { playNeonClick(); setSelectedOfferForModal(offer); logEvento('view_offer', selectedShop.id, { producto: offer.name }); }}>
                                        <div className="rounded-2xl overflow-hidden aspect-square mb-3.5 border border-white/20 shadow-xl relative">
                                            <ProgressiveShopImage
                                                src={offer.image}
                                                alt={offer.name}
                                                className="w-full h-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                                                priority={idx < 4}
                                                skeletonColor="rgba(255,255,255,0.05)"
                                            />
                                            {/* Dynamic Badge */}
                                            <div className={`absolute top-2 right-2 text-white text-[7.5px] font-black px-2 py-1 rounded-full uppercase backdrop-blur-md ${badgeProps.bg} ${badgeProps.shadow} border border-white/20 pointer-events-none z-10`}>
                                                {badgeProps.text}
                                            </div>
                                        </div>
                                        <div className="px-1 pb-1 text-center pointer-events-none">
                                            <p className="text-[10px] font-black uppercase tracking-tight text-white mb-3.5 line-clamp-1">{offer.name}</p>
                                            <div className="glass-action-btn offer-price-tag py-2 px-3 rounded-xl border border-white/10 bg-white/5">
                                                <span className="text-[12.5px] font-black text-white drop-shadow-md">$ {offer.price.toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ---------- INTEGRACIÓN PEDIDOSYA ---------- */}
                {selectedShop.pedidoYaUrl && (
                    <div className="w-full px-5 mb-14">
                        <button
                            onClick={() => {
                                playNeonClick();
                                window.open(selectedShop.pedidoYaUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="w-full bg-[#EA044E]/10 border border-[#EA044E]/50 py-4 rounded-[2rem] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(234,4,78,0.2)] hover:bg-[#EA044E]/20 active:scale-95 group relative overflow-hidden transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#EA044E]/0 via-white/10 to-[#EA044E]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <ShoppingBag size={18} strokeWidth={2.5} className="text-[#EA044E] group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EA044E] drop-shadow-md">Pedir por PedidoYa</span>
                        </button>
                    </div>
                )}

                {/* ---------- DASHBOARD DE CONTACTO ---------- */}
                <div className="w-full px-5 mb-14">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 mb-5">
                            <MessageCircle size={14} className="text-white/60" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/80">Canales de Atención</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleOpenLink('https://www.pedidosya.com.ar/')} className="btn-neon-red flex flex-col items-center justify-center gap-2 bg-black/40 border border-[#EA044E]/30 py-4 rounded-[1.25rem] transition-transform active:scale-95 group">
                                <span className="italic text-[20px] font-black text-[#EA044E] drop-shadow-[0_0_8px_rgba(234,4,78,0.8)] group-hover:scale-110 transition-transform">P</span>
                                <span className="text-[7.5px] tracking-[0.15em] font-bold text-white/90 uppercase">PedidosYa</span>
                            </button>
                            <button onClick={() => selectedShop.phone && handleOpenLink(`https://wa.me/549${String(selectedShop.phone).replace(/\D/g, '')}?text=Hola!%20Vengo%20de%20la%20App%20de%20Waly`)} className="btn-neon-green flex flex-col items-center justify-center gap-2 bg-black/40 border border-[#25D366]/30 py-4 rounded-[1.25rem] transition-transform active:scale-95 group">
                                <MessageCircle size={20} className="text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.8)] group-hover:scale-110 transition-transform" fill="currentColor" strokeWidth={0} />
                                <span className="text-[7.5px] tracking-[0.15em] font-bold text-white/90 uppercase">WhatsApp</span>
                            </button>
                            <button onClick={() => handleOpenLink('https://www.mercadopago.com.ar/')} className="btn-neon-blue flex flex-col items-center justify-center gap-2 bg-black/40 border border-[#009EE3]/30 py-4 rounded-[1.25rem] transition-transform active:scale-95 group">
                                <Handshake size={20} className="text-[#009EE3] drop-shadow-[0_0_8px_rgba(0,158,227,0.8)] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                <span className="text-[7.5px] tracking-[0.15em] font-bold text-white/90 uppercase">M. Pago</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- CREDENCIAL VIP PREMIUM ---------- */}
                <div className="w-full px-5 mb-14">
                    <button
                        onClick={() => {
                            playNeonClick();
                            logEvento('click_vip_access', selectedShop.id);
                            navigate(`${basePath}/${categorySlug}/${shopSlug}/cliente-subscripcion`);
                        }}
                        className="w-full py-4 text-white btn-3d-celeste flex items-center justify-center gap-3"
                    >
                        <Star size={16} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                        <span className={`text-[10px] font-[1100] uppercase tracking-[0.25em] ${isDayMode ? '' : 'text-shadow-premium'}`}>Obtener Credencial VIP</span>
                    </button>
                </div>

                {/* ---------- MÓDULO DE UBICACIÓN ---------- */}
                <div className="w-full px-5 mb-14">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 mb-5">
                            <MapPin size={14} className="text-white/60" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/80">Dónde Encontrarnos</h3>
                        </div>
                        
                        <div className="w-full h-48 overflow-hidden bg-black relative mb-4 rounded-[1.25rem] border border-white/10 group">
                            <iframe
                                title="Ubicación"
                                src={selectedShop.mapUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={false}
                                loading="lazy"
                                className="rounded-[1.25rem] invert-[95%] hue-rotate-180 contrast-[120%] saturate-[200%] brightness-[85%] opacity-90 pointer-events-auto transition-all group-hover:opacity-100"
                            ></iframe>
                            <div className="absolute inset-0 pointer-events-none rounded-[1.25rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
                        </div>

                        <p className="text-[8px] text-center font-bold uppercase tracking-widest mb-5" style={{ color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor, 0.6)})` }}>
                            {selectedShop.address}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'google_maps' }); handleOpenLink(selectedShop.mapSheetUrl || '#'); }} 
                                className="py-3 flex items-center justify-center gap-2 text-white btn-3d-celeste"
                            >
                                <Navigation size={14} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                                <span className={`text-[8.5px] font-[1100] uppercase tracking-wider ${isDayMode ? '' : 'text-shadow-premium'}`}>Cómo llegar</span>
                            </button>
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'uber' }); handleOpenLink('https://m.uber.com/ul/'); }} 
                                className="py-3 flex items-center justify-center gap-2 text-white btn-3d-celeste"
                            >
                                <Car size={14} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                                <span className={`text-[8.5px] font-[1100] uppercase tracking-wider ${isDayMode ? '' : 'text-shadow-premium'}`}>Pedir Uber</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- MÓDULO COMUNIDAD ---------- */}
                <div className="w-full px-5 mb-12">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'facebook' }); selectedShop.facebook && handleOpenLink(selectedShop.facebook); }} className="bg-black/40 border border-[#1877F2]/20 py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform">
                                <Facebook size={16} className="text-[#1877F2]" fill="currentColor" strokeWidth={0} />
                                <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/80">Facebook</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'instagram' }); selectedShop.instagram && handleOpenLink(selectedShop.instagram); }} className="bg-black/40 border border-[#E4405F]/20 py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform">
                                <Instagram size={16} className="text-[#E4405F]" strokeWidth={2.5} />
                                <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/80">Instagram</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'tiktok' }); selectedShop.tiktok && handleOpenLink(selectedShop.tiktok); }} className="bg-black/40 border border-white/20 py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform">
                                <Music size={16} className="text-white" strokeWidth={2.5} />
                                <span className="text-[7.5px] font-bold uppercase tracking-wider text-white/80">TikTok</span>
                            </button>
                        </div>
                        <button onClick={handleShare} className="w-full bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-green-500/30 py-3 rounded-[1rem] flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2">
                            <Share2 size={14} className="text-green-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-green-100">Compartir Catálogo</span>
                        </button>
                        
                        {/* Botón Gestión Mudo (Lock) */}
                        <div className="w-full flex justify-center mt-2">
                            <button onClick={() => {
                                playNeonClick();
                                handleLockTap();
                            }} className={`flex items-center justify-center gap-1.5 py-2 transition-all duration-300 ${
                                lockClicks >= 4 
                                ? 'text-cyan-400 scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
                                : lockClicks >= 2 
                                ? 'text-white/25'
                                : 'text-white/15'
                            }`}>
                                <Lock size={lockClicks >= 4 ? 14 : 10} className="transition-all duration-300" />
                                <span className={`font-bold uppercase tracking-widest transition-all duration-300 ${lockClicks >= 4 ? 'text-[9px]' : 'text-[7px]'}`}>Gestión</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- 📺 MURO VIVO (FEED DINÁMICO) ---------- */}
                <div className="w-full px-5 mb-14 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6">
                        <ImageIcon size={16} style={{ color: themeColor }} />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.3em]" style={{ color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor,0.6)})` }}>Muro de Novedades</h3>
                        {broadcasts.length > 0 && (
                            <div className="badge-en-vivo flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 ml-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <div className="w-2 h-2 rounded-full bg-red-500 absolute" />
                                <span className="text-[7px] font-black text-red-400 uppercase tracking-widest">En Vivo</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full aspect-square md:aspect-video rounded-[1.7rem] overflow-hidden relative border isolate bg-zinc-900 group" style={{ borderColor: hexToRgba(themeColor, 0.2), boxShadow: `0 0 30px ${hexToRgba(themeColor, 0.1)}` }}>
                        
                        {/* Slide Container */}
                        <div className={`w-full h-full relative ${isGlitching ? 'muro-glitch-active muro-scanline' : ''}`}>
                            {muroItems.length > 0 ? (
                                <>
                                    {muroItems[currentSlide]?.type === 'video' ? (
                                        <video
                                            key={`vid-${currentSlide}`}
                                            src={muroItems[currentSlide].url}
                                            className="w-full h-full object-cover muro-fade-in"
                                            autoPlay muted loop playsInline
                                        />
                                    ) : (
                                        <img 
                                            key={`img-${currentSlide}`}
                                            src={muroItems[currentSlide]?.url} 
                                            className="w-full h-full object-cover muro-fade-in" 
                                            alt={`Slide ${currentSlide + 1}`} 
                                            loading="lazy" 
                                        />
                                    )}
                                    {/* Broadcast overlay label */}
                                    {muroItems[currentSlide]?.isBroadcast && (
                                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 border border-red-500/30 rounded-full px-2.5 py-1 backdrop-blur-md">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-[7px] font-black text-red-400 uppercase tracking-widest">📡 Transmisión</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 text-white/40 relative">
                                    <div className="absolute inset-0 bg-cyan-500/5 blur-3xl pointer-events-none" />
                                    <ImageIcon size={32} className="mb-2 opacity-50" />
                                    <p className="text-[10px] uppercase font-black tracking-widest text-center px-4">Próximamente nuevas publicidades</p>
                                </div>
                            )}
                        </div>

                        {/* Dots de paginación activos */}
                        {muroItems.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
                                {muroItems.map((item, i) => (
                                    <div key={i} className={`rounded-full backdrop-blur-md shadow-[0_0_5px_rgba(0,0,0,0.5)] transition-all duration-500 ${
                                        i === currentSlide 
                                        ? `w-4 h-1.5 ${item.isBroadcast ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'}` 
                                        : 'w-1.5 h-1.5 bg-white/30'
                                    }`}></div>
                                ))}
                            </div>
                        )}

                        {/* Like Button */}
                        <div className="absolute top-3 right-3 z-20">
                            <button
                                onClick={handleLikeFeed}
                                disabled={hasLikedFeed}
                                className={`glass-action-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${
                                    hasLikedFeed 
                                    ? 'bg-rose-500/30 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                                    : 'bg-black/40 border-white/20 hover:bg-black/60 hover:border-white/40'
                                }`}
                            >
                                <Heart size={14} className={`${hasLikedFeed ? 'fill-rose-400 text-rose-400' : 'text-white'} transition-colors duration-300`} />
                                <span className={`text-[10px] font-black tracking-widest ${hasLikedFeed ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'text-white'}`}>
                                    {feedLikesCount}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- REVIEWS AND RATING SECTION ---------- */}
                <div className="w-full px-5 mb-14 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6">
                        <MessageSquare size={16} style={{ color: themeColor }} />
                        <h3 className="font-black text-[11px] uppercase tracking-[0.3em]" style={{ color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor,0.6)})` }}>Opiniones de Clientes</h3>
                    </div>

                    {/* Review List */}
                    <div className="flex flex-col gap-3 w-full mb-6 relative">
                        {/* Decorative glow behind reviews */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 blur-3xl rounded-full pointer-events-none" style={{ backgroundColor: hexToRgba(themeColor, 0.05) }} />
                        
                        {(selectedShop.reviews || [
                            { id: '1', authorName: 'Carlos M.', rating: 5, text: 'Excelente atención y los productos de primera calidad. Vuelvo seguro. Recomendado al 100%.', date: 'Hace 2 días' },
                            { id: '2', authorName: 'Laura G.', rating: 5, text: 'Muy buen servicio, llegó todo rapidísimo y caliente. Un lujo tener algo así en la zona.', date: 'Hace 1 semana' },
                            { id: '3', authorName: 'Diego F.', rating: 4, text: '¡Increíble la calidad! Se nota que le ponen mucha dedicación a lo que hacen.', date: 'Hace 2 semanas' }
                        ]).slice(0, 5).map((review) => (
                            <div key={review.id} className="glass-card-3d backdrop-blur-sm border rounded-[1.25rem] p-4 flex flex-col gap-2 relative overflow-hidden" style={{ backgroundColor: hexToRgba(themeColor, 0.05), borderColor: hexToRgba(themeColor, 0.2) }}>
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full" />
                                <div className="flex justify-between items-center w-full relative z-10">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{review.authorName}</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={10} className={i < review.rating ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]" : "text-white/10 fill-white/5"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[9.5px] text-white/70 italic leading-relaxed relative z-10">"{review.text}"</p>
                                <span className="text-[7.5px] text-cyan-500/60 font-black uppercase tracking-[0.2em] mt-1 relative z-10">{review.date}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions: View All / Leave Review */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button 
                            className="py-3 flex items-center justify-center gap-2 text-white btn-3d-celeste"
                        >
                            <span className={`text-[8px] font-[1100] uppercase tracking-widest ${isDayMode ? '' : 'text-shadow-premium'}`}>Ver Todas</span>
                        </button>
                        <button 
                            className="py-3 flex items-center justify-center gap-2 text-white btn-3d-celeste"
                        >
                            <MessageSquare size={12} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                            <span className={`text-[8px] font-[1100] uppercase tracking-widest ${isDayMode ? '' : 'text-shadow-premium'}`}>Dejar Reseña</span>
                        </button>
                    </div>
                </div>
                {/* ----------------------------------------------- */}

                <div className="w-full flex justify-center mb-8">
                    <button 
                        onClick={() => {
                            playNeonClick();
                            navigate(`${basePath}/${categorySlug}`);
                        }} 
                        className="w-max py-3 px-8 rounded-full flex items-center gap-2 text-white btn-3d-celeste"
                    >
                        <ArrowLeft size={14} style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.6))' }} strokeWidth={3} />
                        <span className={`text-[10px] font-[1100] uppercase tracking-widest ${isDayMode ? '' : 'text-shadow-premium'}`}>Regresar</span>
                    </button>
                </div>


            </div>

            {/* Modal de Oferta (Fase 4) */}
            {selectedOfferForModal && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOfferForModal(null)}></div>
                    <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 duration-300" style={{ boxShadow: `0 0 40px ${hexToRgba(themeColor, 0.15)}` }}>
                        <button 
                            onClick={() => setSelectedOfferForModal(null)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/70 active:scale-90 transition-transform"
                        >
                            <span className="text-xl leading-none font-light">&times;</span>
                        </button>
                        
                        <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden border border-white/10 mb-5 relative">
                            <img src={selectedOfferForModal.image} alt={selectedOfferForModal.name} className="w-full h-full object-cover" />
                            <div className={`absolute top-3 left-3 ${selectedOfferForModal.scarcityLabel ? 'bg-orange-500/90 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : 'bg-cyan-500/90 shadow-[0_0_15px_rgba(6,182,212,0.8)]'} text-white text-[9px] font-black px-3 py-1 rounded-full uppercase backdrop-blur-md`}>
                                {selectedOfferForModal.scarcityLabel || 'Oferta Especial'}
                            </div>
                            {selectedOfferForModal.stockCount && selectedOfferForModal.stockCount > 0 && (
                                <div className="absolute top-3 right-3 bg-red-600/90 shadow-[0_0_15px_rgba(220,38,38,0.8)] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase backdrop-blur-md flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Solo quedan {selectedOfferForModal.stockCount}
                                </div>
                            )}
                        </div>
                        
                        <h2 className="text-[16px] font-black uppercase tracking-[0.1em] text-white leading-tight mb-2 text-center">
                            {selectedOfferForModal.name}
                        </h2>
                        
                        <div className="w-full flex justify-center mb-6">
                            <div className="glass-action-btn py-2 px-5 rounded-xl border border-white/10 bg-white/5">
                                <span className="text-[18px] font-black text-white drop-shadow-md">$ {selectedOfferForModal.price.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {/* Botón WhatsApp */}
                            {selectedShop.phone && (
                                <button 
                                    onClick={() => {
                                        playNeonClick();
                                        logEvento('click_whatsapp', selectedShop.id, { producto: selectedOfferForModal.name, precio: selectedOfferForModal.price });
                                        const msg = `Hola! Vengo de la App Waly. Me interesa la oferta: *${selectedOfferForModal.name}* por *$${selectedOfferForModal.price.toLocaleString('es-AR')}*. ¿Tienen disponibilidad?`;
                                        window.open(`https://wa.me/549${String(selectedShop.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="w-full btn-neon-green bg-[#25D366]/10 border border-[#25D366]/50 py-3.5 rounded-[1.25rem] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)]"
                                >
                                    <MessageCircle size={18} className="text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]" fill="currentColor" strokeWidth={0} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#25D366]">Consultar x WhatsApp</span>
                                </button>
                            )}
                            
                            {/* Botón MercadoPago Permanente */}
                            <button 
                                onClick={() => {
                                    playNeonClick();
                                    logEvento('click_mercadopago', selectedShop.id, { producto: selectedOfferForModal.name, monto: selectedOfferForModal.price });
                                    if (selectedShop.mercadoPagoUrl) {
                                        window.open(selectedShop.mercadoPagoUrl, '_blank', 'noopener,noreferrer');
                                    } else {
                                        alert('⚠️ Este comercio aún no tiene habilitado el link de pago automático. Por favor, pedile el CVU/Alias por WhatsApp al botón de arriba.');
                                    }
                                }}
                                className={`w-full btn-neon-blue bg-[#009EE3]/10 border border-[#009EE3]/50 py-3.5 rounded-[1.25rem] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,158,227,0.2)] ${!selectedShop.mercadoPagoUrl ? 'opacity-80 grayscale-[30%]' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Handshake size={18} className="text-[#009EE3] drop-shadow-[0_0_8px_rgba(0,158,227,0.8)]" strokeWidth={2.5} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#009EE3]">Pagar con M. Pago</span>
                                </div>
                                <span className="text-[6.5px] font-bold tracking-widest text-[#009EE3]/70 uppercase">
                                    {selectedShop.mercadoPagoUrl ? 'Recordá ingresar el monto exacto' : 'Consultar CVU/Alias al comercio'}
                                </span>
                            </button>
                        </div>

                        {/* Texto Legal Scarcity */}
                        {selectedOfferForModal.legalText && (
                            <p className="mt-4 text-center text-[7.5px] text-white/40 uppercase tracking-widest leading-relaxed px-2">
                                * {selectedOfferForModal.legalText}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDetailPage;
