// ShopDetailPage — Interfaz 3: Catálogo de comercio con estilo White Tech Glassmorphism
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
    Moon,
    Camera,
    ShieldCheck,
    Gamepad2,
    Sparkles,
    Palette,
    Play,
    HelpCircle,
    Puzzle
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
    const [selectedMuroItemForModal, setSelectedMuroItemForModal] = useState<any | null>(null);
    const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
    const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
        const mockAds = [
            { title: 'Menú del Día', desc: '¡Aprovechá nuestro menú ejecutivo a un precio súper especial!' },
            { title: 'Promo Cervezas', desc: 'Llevate 2x1 en tus bebidas favoritas durante todo el finde.' },
            { title: 'Recital de Axel', desc: 'Show en vivo en Lomas este sábado. ¡Reservá tu mesa ahora!' },
            { title: 'Novedades', desc: 'Descubrí lo nuevo que tenemos para vos en nuestro local.' }
        ];

        const localItems = feedGallery.map((url, idx) => ({
            url,
            type: /\.(mp4|webm|mov)($|\?)/i.test(url) ? 'video' as const : 'image' as const,
            isBroadcast: false,
            title: mockAds[idx % mockAds.length].title,
            description: mockAds[idx % mockAds.length].desc
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

    // Mock reviews con fotos de clientes
    const mockReviews = useMemo(() => [
        { id: '1', authorName: 'Carlos M.', rating: 5, text: 'Vinimos en familia a cenar y fue espectacular. Los chicos se divirtieron, la comida increíble. ¡Volvemos seguro!', date: '12/07/2026 - 19:30hs', imageUrl: 'https://images.unsplash.com/photo-1529543544282-ea99407407c1?w=600&h=750&fit=crop' },
        { id: '2', authorName: 'Laura G.', rating: 5, text: 'Pedimos delivery y llegó todo perfecto, calentito y bien presentado. Un lujo tener este servicio en la zona.', date: '10/07/2026 - 21:15hs', imageUrl: 'https://images.unsplash.com/photo-1545987796-200d7e8b5fa9?w=600&h=750&fit=crop' },
        { id: '3', authorName: 'Diego F.', rating: 4, text: '¡Increíble la calidad! Se nota la dedicación en cada plato. Las cervezas artesanales son un golazo.', date: '08/07/2026 - 20:45hs', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=750&fit=crop' },
        { id: '4', authorName: 'Sofía R.', rating: 5, text: 'Festejamos el cumple de mi nena acá y fue todo soñado. La atención personalizada, la torta perfecta. ¡Gracias!', date: '05/07/2026 - 18:00hs', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=750&fit=crop' },
        { id: '5', authorName: 'Martín P.', rating: 5, text: 'Almuerzo ejecutivo de 10. Rápido, abundante y a muy buen precio. Lo recomiendo para la hora del laburo.', date: '03/07/2026 - 13:20hs', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=750&fit=crop' }
    ], []);

    // Auto-slideshow para reviews cada 6 segundos
    useEffect(() => {
        if (mockReviews.length <= 1) return;
        reviewTimerRef.current = setInterval(() => {
            setCurrentReviewSlide(prev => (prev + 1) % mockReviews.length);
        }, 6000);
        return () => { if (reviewTimerRef.current) clearInterval(reviewTimerRef.current); };
    }, [mockReviews.length]);

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
          className={`pb-24 animate-in fade-in duration-700 min-h-screen relative ${wallpaperClass} ${isDayMode ? 'day-mode bg-gradient-to-b from-[#f3f6f9] to-[#ebf0f5] glass-text-main' : 'bg-[#060d1a] text-white'}`}
          style={isCustomColor ? { backgroundColor: selectedShop.customBackground } : {}}
        >
            {/* Dynamic Glassmorphism Background Blobs (Day Mode Only) */}
            {isDayMode && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-5%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-cyan-300/40 mix-blend-multiply filter blur-[80px] opacity-80" />
                    <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-blue-400/30 mix-blend-multiply filter blur-[100px] opacity-70" />
                    <div className="absolute bottom-[-5%] left-[10%] w-[80vw] h-[80vw] rounded-full bg-indigo-300/30 mix-blend-multiply filter blur-[120px] opacity-60" />
                    <div className="absolute top-[60%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-teal-200/30 mix-blend-multiply filter blur-[90px] opacity-70" />
                </div>
            )}

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
                    className={`absolute top-6 left-5 z-[60] w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                        isDayMode ? 'home-btn-3d border' : 'btn-3d-blanco-celeste active:scale-90'
                    }`}
                    style={isDayMode ? { borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                >
                    <ArrowLeft size={18} style={{ color: isDayMode ? '#000000' : '#0891b2' }} strokeWidth={3} />
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
                    className={`absolute top-6 right-5 z-[60] w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${
                        isDayMode ? 'home-btn-3d border' : 'btn-3d-blanco-celeste active:scale-90'
                    }`}
                    style={isDayMode ? { borderBottomWidth: '4px', borderBottomColor: '#cda488' } : {}}
                >
                    {isDayMode ? (
                        <Moon 
                            size={16} 
                            style={{ color: '#000000' }} 
                        />
                    ) : (
                        <Sun 
                            size={16} 
                            style={{ color: '#0891b2' }} 
                        />
                    )}
                </button>

                {gallery.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`Cover ${idx}`}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        fetchPriority={idx === 0 ? 'high' : 'low'}
                        decoding="async"
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
                <div ref={catalogRef} className="w-full mb-14 mt-2 px-4">
                    <div className={`w-full rounded-[2rem] pt-5 pb-3 flex flex-col relative ${
                        isDayMode ? 'glass-section-card' : 'bg-white/5 border border-white/10 shadow-lg'
                    }`}>
                        {/* Título de la Sección */}
                        <h2 className={`text-[11px] font-[1000] uppercase tracking-widest mb-4 ml-3 ${
                            isDayMode ? 'glass-text-main' : 'text-white'
                        }`}>
                            Nuestro Catálogo
                        </h2>

                        <div className="w-full relative px-2">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                            <div 
                                className="flex gap-4 pb-4 overflow-x-auto snap-x snap-mandatory no-scrollbar relative z-10" 
                                style={{ contain: 'layout style', willChange: 'scroll-position' }}
                                ref={offersCarouselRef}
                                onTouchStart={() => isTouchingRef.current = true}
                                onTouchEnd={() => { setTimeout(() => isTouchingRef.current = false, 2000) }}
                                onMouseEnter={() => isTouchingRef.current = true}
                                onMouseLeave={() => isTouchingRef.current = false}
                            >
                                {selectedShop.offers.map((offer, idx) => {
                                    // Badges Dinámicos sugeridos por Gemy
                                    const badgeType = idx % 3;
                                    const badgeProps = badgeType === 0 
                                        ? { text: '🔥 HOT', bg: 'bg-orange-500/90', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.8)]' }
                                        : badgeType === 1 
                                        ? { text: '✨ NUEVO', bg: 'bg-green-500/90', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.8)]' }
                                        : { text: '⚡ HOY', bg: 'bg-rose-500/90', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.8)]' };

                                    return (
                                        <div key={`${offer.id}-${idx}`} className={`flex-shrink-0 w-40 p-3 flex flex-col relative group snap-center cursor-pointer ${
                                            isDayMode 
                                                ? 'bg-white/40 border border-white/50 shadow-sm rounded-[1.5rem]' 
                                                : 'glass-card-3d offer-card-neon'
                                        }`} onClick={() => { playNeonClick(); setSelectedOfferForModal(offer); logEvento('view_offer', selectedShop.id, { producto: offer.name }); }}>
                                            <div className={`rounded-xl overflow-hidden aspect-square mb-3 border shadow-md relative ${
                                                isDayMode ? 'border-white/60' : 'border-white/20'
                                            }`}>
                                                <ProgressiveShopImage
                                                    src={offer.image}
                                                    alt={offer.name}
                                                    className="w-full h-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                                                    priority={idx < 6}
                                                    skeletonColor="rgba(255,255,255,0.05)"
                                                />
                                                {/* Dynamic Badge */}
                                                <div className={`absolute top-2 right-2 text-white text-[7.5px] font-black px-2 py-1 rounded-full uppercase backdrop-blur-md ${badgeProps.bg} ${badgeProps.shadow} border border-white/20 pointer-events-none z-10`}>
                                                    {badgeProps.text}
                                                </div>
                                            </div>
                                            <div className="px-1 pb-1 text-center pointer-events-none">
                                                <p className={`text-[10px] font-black uppercase tracking-tight mb-2.5 line-clamp-1 ${
                                                    isDayMode ? 'glass-text-main' : 'text-white'
                                                }`}>{offer.name}</p>
                                                <div className={`py-1.5 px-3 rounded-lg border ${
                                                    isDayMode ? 'bg-white/60 border-white/80 glass-text-main shadow-inner font-extrabold' : 'glass-action-btn offer-price-tag border-white/10 bg-white/5 text-white'
                                                }`}>
                                                    <span className="text-[12px] font-black drop-shadow-sm">$ {offer.price.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botón de Abrir Catálogo movido a la base del contenedor */}
                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`${basePath}/${categorySlug}/${shopSlug}/menu`);
                            }}
                            className={`py-3.5 flex items-center justify-center gap-2.5 font-[1100] uppercase tracking-[0.2em] text-[10px] btn-open-catalog ${
                                isDayMode ? 'glass-text-main transition-transform active:scale-95' : 'text-white btn-3d-celeste'
                            }`}
                        >
                            <ShoppingBag size={15} style={isDayMode ? { color: '#0891b2' } : { color: '#00C2FF', filter: 'drop-shadow(0 0 3px rgba(0, 194, 255, 0.6))' }} strokeWidth={3} />
                            <span className={isDayMode ? "" : "text-shadow-premium"}>Abrir Catálogo Completo</span>
                        </button>
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
                            className={`w-full py-4 rounded-[2rem] flex items-center justify-center gap-3 group relative overflow-hidden transition-all ${
                                isDayMode 
                                    ? 'glass-button-3d w-full shadow-lg border' 
                                    : 'bg-[#EA044E]/10 border border-[#EA044E]/50 shadow-[0_0_20px_rgba(234,4,78,0.2)] hover:bg-[#EA044E]/20 active:scale-95'
                            }`}
                            style={isDayMode ? { 
                                background: 'rgba(255, 255, 255, 0.65)', 
                                border: '1px solid rgba(255, 255, 255, 0.85)',
                                color: '#00C2FF'
                            } : {}}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#EA044E]/0 via-white/10 to-[#EA044E]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <ShoppingBag size={18} strokeWidth={2.5} className="text-[#EA044E] group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EA044E] drop-shadow-md">Pedir por PedidoYa</span>
                        </button>
                    </div>
                )}

                {/* ---------- DASHBOARD DE CONTACTO ---------- */}
                <div className="w-full px-5 mb-14">
                    <div className={
                        isDayMode ? 'glass-section-card' : 'rounded-[2rem] p-5 bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                    }>
                        <div className="flex items-center gap-2 mb-5">
                            <MessageCircle size={14} className={isDayMode ? 'glass-text-main/60' : 'text-white/60'} />
                            <h3 className={`font-black text-[10px] uppercase tracking-[0.3em] ${isDayMode ? 'glass-text-main' : 'text-white/80'}`}>Canales de Atención</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleOpenLink('https://www.pedidosya.com.ar/')} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem] transition-transform active:scale-95 group ${
                                isDayMode ? 'bg-white/45 border border-white/60' : 'btn-neon-red bg-black/40 border border-[#EA044E]/30'
                            }`}>
                                <span className="italic text-[20px] font-black text-[#EA044E] drop-shadow-[0_0_8px_rgba(234,4,78,0.8)] group-hover:scale-110 transition-transform">P</span>
                                <span className={`text-[7.5px] tracking-[0.15em] font-black uppercase ${isDayMode ? 'text-[#EA044E]' : 'text-white/90'}`}>PedidosYa</span>
                            </button>
                            <button onClick={() => selectedShop.phone && handleOpenLink(`https://wa.me/549${String(selectedShop.phone).replace(/\D/g, '')}?text=Hola!%20Vengo%20de%20la%20App%20de%20Waly`)} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem] transition-transform active:scale-95 group ${
                                isDayMode ? 'bg-white/45 border border-white/60' : 'btn-neon-green bg-black/40 border border-[#25D366]/30'
                            }`}>
                                <MessageCircle size={20} className="text-[#25D366] drop-shadow-[0_0_8px_rgba(37,211,102,0.8)] group-hover:scale-110 transition-transform" fill="currentColor" strokeWidth={0} />
                                <span className={`text-[7.5px] tracking-[0.15em] font-black uppercase ${isDayMode ? 'text-[#25D366]' : 'text-white/90'}`}>WhatsApp</span>
                            </button>
                            <button onClick={() => handleOpenLink('https://www.mercadopago.com.ar/')} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem] transition-transform active:scale-95 group ${
                                isDayMode ? 'bg-white/45 border border-white/60' : 'btn-neon-blue bg-black/40 border border-[#009EE3]/30'
                            }`}>
                                <Handshake size={20} className="text-[#009EE3] drop-shadow-[0_0_8px_rgba(0,158,227,0.8)] group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                <span className={`text-[7.5px] tracking-[0.15em] font-black uppercase ${isDayMode ? 'text-[#009EE3]' : 'text-white/90'}`}>M. Pago</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- CREDENCIAL VIP PREMIUM ---------- */}
                <div className="w-full px-4 mb-14">
                    <div className={`w-full rounded-[2.5rem] pt-8 pb-6 px-6 flex flex-col relative items-center text-center ${
                        isDayMode ? 'glass-section-card' : 'bg-white/5 border border-white/10 shadow-lg'
                    }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="w-32 h-44 mb-2 relative z-10 drop-shadow-2xl">
                            {/* Avatar image - Using the provided 3D assistant /luz-avatar.png */}
                            <img src="/luz-avatar.png" alt="Avatar VIP" className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                        </div>
                        
                        <h3 className={`text-[13px] font-[1000] uppercase tracking-widest mb-2 z-10 ${
                            isDayMode ? 'glass-text-main' : 'text-white'
                        }`}>
                            Club de Beneficios VIP
                        </h3>
                        <p className={`text-[11px] mb-6 leading-relaxed z-10 px-2 ${
                            isDayMode ? 'glass-text-muted font-medium' : 'text-white/70'
                        }`}>
                            Suscribite ahora para desbloquear descuentos y promociones exclusivas.
                        </p>

                        <button
                            onClick={() => {
                                playNeonClick();
                                logEvento('click_vip_access', selectedShop.id);
                                navigate(`${basePath}/${categorySlug}/${shopSlug}/cliente-subscripcion`);
                            }}
                            className={`w-full py-4 flex items-center justify-center gap-3 font-[1100] uppercase tracking-[0.2em] text-[10px] z-10 transition-transform active:scale-95 ${
                                isDayMode ? 'glass-button-3d text-slate-700' : 'btn-3d-celeste text-white'
                            }`}
                        >
                            <Star size={16} className={isDayMode ? 'text-slate-700' : 'text-[#00C2FF] drop-shadow-[0_0_3px_rgba(0,194,255,0.6)]'} strokeWidth={3} />
                            <span className={isDayMode ? "" : "text-shadow-premium"}>Obtener Credencial VIP</span>
                        </button>
                    </div>
                </div>

                {/* ---------- MÓDULO DE UBICACIÓN ---------- */}
                <div className="w-full px-5 mb-14">
                    <div className={
                        isDayMode ? 'glass-section-card' : 'rounded-[2rem] p-5 bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                    }>
                        <div className="flex items-center gap-2 mb-5">
                            <MapPin size={14} className={isDayMode ? 'glass-text-main/60' : 'text-white/60'} />
                            <h3 className={`font-black text-[10px] uppercase tracking-[0.3em] ${isDayMode ? 'glass-text-main' : 'text-white/80'}`}>Dónde Encontrarnos</h3>
                        </div>
                        
                        <div className={`w-full h-48 overflow-hidden bg-black relative mb-4 rounded-[1.25rem] border group ${
                            isDayMode ? 'border-white/40' : 'border-white/10'
                        }`}>
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

                        <p className={`text-[8px] text-center font-bold uppercase tracking-widest mb-5 ${
                            isDayMode ? 'glass-text-main' : ''
                        }`} style={isDayMode ? {} : { color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor, 0.6)})` }}>
                            {selectedShop.address}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'google_maps' }); handleOpenLink(selectedShop.mapSheetUrl || '#'); }} 
                                className={`py-3 flex items-center justify-center gap-2 ${
                                    isDayMode ? 'glass-button-3d' : 'btn-3d-celeste text-white'
                                }`}
                                style={isDayMode ? { 
                                    background: 'rgba(255, 255, 255, 0.65)', 
                                    border: '1px solid rgba(255, 255, 255, 0.85)',
                                    color: '#2c3e50'
                                } : {}}
                            >
                                <Navigation size={14} style={{ color: '#00C2FF', filter: 'drop-shadow(0 0 3px rgba(0, 194, 255, 0.6))' }} strokeWidth={3} />
                                <span className="text-[8.5px] font-[1100] uppercase tracking-wider">Cómo llegar</span>
                            </button>
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'uber' }); handleOpenLink('https://m.uber.com/ul/'); }} 
                                className={`py-3 flex items-center justify-center gap-2 ${
                                    isDayMode ? 'glass-button-3d' : 'btn-3d-celeste text-white'
                                }`}
                                style={isDayMode ? { 
                                    background: 'rgba(255, 255, 255, 0.65)', 
                                    border: '1px solid rgba(255, 255, 255, 0.85)',
                                    color: '#2c3e50'
                                } : {}}
                            >
                                <Car size={14} style={{ color: '#00C2FF', filter: 'drop-shadow(0 0 3px rgba(0, 194, 255, 0.6))' }} strokeWidth={3} />
                                <span className="text-[8.5px] font-[1100] uppercase tracking-wider">Pedir Uber</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- MÓDULO COMUNIDAD ---------- */}
                <div className="w-full px-5 mb-12">
                    <div className={
                        isDayMode ? 'glass-section-card flex flex-col gap-4' : 'p-5 flex flex-col gap-4 rounded-[2rem] bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
                    }>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'facebook' }); selectedShop.facebook && handleOpenLink(selectedShop.facebook); }} className={`py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform ${
                                isDayMode ? 'bg-white/45 border border-white/60 shadow-sm' : 'bg-black/40 border border-[#1877F2]/20'
                            }`}>
                                <Facebook size={16} className="text-[#1877F2]" fill="currentColor" strokeWidth={0} />
                                <span className={`text-[7.5px] font-black uppercase tracking-wider ${isDayMode ? 'text-[#1877F2]' : 'text-white/80'}`}>Facebook</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'instagram' }); selectedShop.instagram && handleOpenLink(selectedShop.instagram); }} className={`py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform ${
                                isDayMode ? 'bg-white/45 border border-white/60 shadow-sm' : 'bg-black/40 border border-[#E4405F]/20'
                            }`}>
                                <Instagram size={16} className="text-[#E4405F]" strokeWidth={2.5} />
                                <span className={`text-[7.5px] font-black uppercase tracking-wider ${isDayMode ? 'text-[#E4405F]' : 'text-white/80'}`}>Instagram</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'tiktok' }); selectedShop.tiktok && handleOpenLink(selectedShop.tiktok); }} className={`py-3 rounded-[1rem] flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform ${
                                isDayMode ? 'bg-white/45 border border-white/60 shadow-sm' : 'bg-black/40 border border-white/20'
                            }`}>
                                <Music size={16} className={isDayMode ? 'glass-text-main' : 'text-white'} strokeWidth={2.5} />
                                <span className={`text-[7.5px] font-black uppercase tracking-wider ${isDayMode ? 'glass-text-main' : 'text-white/80'}`}>TikTok</span>
                            </button>
                        </div>
                        <button onClick={handleShare} className={`py-3 rounded-[1rem] flex items-center justify-center gap-2 active:scale-95 transition-transform mt-2 ${
                            isDayMode 
                                ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-800 shadow-sm' 
                                : 'bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-green-500/30 text-green-100'
                        }`}>
                            <Share2 size={14} className={isDayMode ? 'text-emerald-700' : 'text-green-400'} />
                            <span className="text-[9.5px] font-black uppercase tracking-widest">Compartir Catálogo</span>
                        </button>
                        
                        {/* Botón Gestión Mudo (Lock) */}
                        <div className="w-full flex justify-center mt-2">
                            <button onClick={() => {
                                playNeonClick();
                                handleLockTap();
                            }} className={`flex items-center justify-center gap-1.5 py-2 transition-all duration-300 ${
                                lockClicks >= 4 
                                ? 'text-cyan-600 scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' 
                                : lockClicks >= 2 
                                ? 'opacity-30'
                                : 'opacity-15'
                            } ${isDayMode ? 'glass-text-main' : 'text-white'}`}>
                                <Lock size={lockClicks >= 4 ? 14 : 10} className="transition-all duration-300" />
                                <span className={`font-bold uppercase tracking-widest transition-all duration-300 ${lockClicks >= 4 ? 'text-[9px]' : 'text-[7px]'}`}>Gestión</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- 📺 MURO VIVO (FEED DINÁMICO) ---------- */}
                <div className="w-full px-4 mb-14">
                    <div className={`w-full rounded-[2.5rem] pt-6 pb-4 px-3 flex flex-col relative ${
                        isDayMode ? 'glass-section-card' : 'bg-white/5 border border-white/10 shadow-lg'
                    }`}>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <ImageIcon size={16} style={isDayMode ? { color: '#00C2FF' } : { color: themeColor }} />
                            <h3 className={`font-black text-[11px] uppercase tracking-[0.3em] ${isDayMode ? 'glass-text-main' : ''}`} style={isDayMode ? {} : { color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor,0.6)})` }}>Muro de Novedades</h3>
                            {broadcasts.length > 0 && (
                                <div className="badge-en-vivo flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 ml-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    <div className="w-2 h-2 rounded-full bg-red-500 absolute" />
                                    <span className="text-[7px] font-black text-red-400 uppercase tracking-widest">En Vivo</span>
                                </div>
                            )}
                        </div>

                        <div className={`w-full aspect-[4/5] md:aspect-video rounded-[2rem] overflow-hidden relative border isolate bg-zinc-900 group ${
                            isDayMode ? 'border-white/40 shadow-lg' : ''
                        }`} style={isDayMode ? {} : { borderColor: hexToRgba(themeColor, 0.2), boxShadow: `0 0 30px ${hexToRgba(themeColor, 0.1)}` }}>
                            
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
                                            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/60 border border-red-500/30 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">📡 Transmisión</span>
                                            </div>
                                        )}

                                        {/* Overlay con texto y botón Ampliar */}
                                        {muroItems[currentSlide] && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-20 pb-8 px-6 z-20 flex flex-col items-start text-left pointer-events-auto">
                                                <h4 className="text-white font-[1000] text-[14px] uppercase tracking-widest mb-1.5 drop-shadow-md leading-tight">
                                                    {muroItems[currentSlide].title || 'Novedades'}
                                                </h4>
                                                <p className="text-white/80 font-medium text-[11px] leading-relaxed line-clamp-2 mb-4 drop-shadow">
                                                    {muroItems[currentSlide].description || 'Descubrí las últimas novedades y promociones.'}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playNeonClick();
                                                        setSelectedMuroItemForModal(muroItems[currentSlide]);
                                                    }}
                                                    className={`self-start py-2.5 px-5 rounded-full backdrop-blur-md border text-[10px] font-[1000] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
                                                        isDayMode ? 'bg-white/30 border-white/60 text-slate-800 hover:bg-white/50' : 'bg-black/40 border-white/30 text-white hover:bg-black/60'
                                                    }`}
                                                >
                                                    <Eye size={14} /> Ampliar
                                                </button>
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
                                <div className="absolute top-4 right-4 flex justify-center gap-1.5 pointer-events-none z-20">
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
                            <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleLikeFeed(); }}
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
                </div>

                {/* ---------- 🎈 ZONA KIDS ---------- */}
                <div className="w-full px-4 mb-14">
                    <div className={`w-full rounded-[2.5rem] pt-6 pb-5 px-3 flex flex-col relative overflow-hidden ${
                        isDayMode ? 'glass-section-card' : 'bg-white/5 border border-white/10 shadow-lg'
                    }`}>
                        {/* Globos decorativos flotantes */}
                        <div className="absolute -top-4 -left-2 w-10 h-12 rounded-full bg-red-400/30 blur-sm animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }} />
                        <div className="absolute -top-2 right-8 w-8 h-10 rounded-full bg-yellow-400/30 blur-sm animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                        <div className="absolute top-6 -right-1 w-9 h-11 rounded-full bg-green-400/25 blur-sm animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
                        <div className="absolute top-20 left-4 w-7 h-9 rounded-full bg-purple-400/20 blur-sm animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }} />
                        <div className="absolute bottom-12 right-4 w-8 h-10 rounded-full bg-pink-400/25 blur-sm animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1.5s' }} />
                        <div className="absolute bottom-4 left-10 w-6 h-8 rounded-full bg-cyan-400/20 blur-sm animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.8s' }} />

                        {/* Título */}
                        <div className="flex items-center justify-center gap-2.5 mb-5 relative z-10">
                            <span className="text-[22px]">🎈</span>
                            <h3 className={`font-[1000] text-[13px] uppercase tracking-[0.3em] ${
                                isDayMode ? 'glass-text-main' : ''
                            }`} style={isDayMode ? {} : { 
                                background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BCB)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 0 8px rgba(255,107,107,0.4))'
                            }}>Zona Kids</h3>
                            <span className="text-[22px]">🎈</span>
                        </div>

                        {/* Subtítulo */}
                        <p className={`text-center text-[10px] font-bold mb-5 relative z-10 ${
                            isDayMode ? 'text-slate-500' : 'text-white/50'
                        }`}>
                            🎉 ¡Diversión asegurada mientras la familia disfruta! 🎉
                        </p>

                        {/* Grid de actividades */}
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            {/* Card 1: Juegos */}
                            <button
                                onClick={() => { playNeonClick(); alert('🎮 ¡Próximamente! Estamos preparando juegos increíbles.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #FF6B6B22, #FF6B6B08)',
                                    borderColor: 'rgba(255,107,107,0.3)',
                                    boxShadow: '0 4px 20px rgba(255,107,107,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-red-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <Gamepad2 size={24} className="text-red-400 drop-shadow-[0_0_6px_rgba(255,107,107,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-red-500' : 'text-red-400'
                                }`}>Juegos</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>Mini-juegos divertidos para toda la familia</span>
                            </button>

                            {/* Card 2: Adivinanzas */}
                            <button
                                onClick={() => { playNeonClick(); alert('🧩 ¡Próximamente! Adivinanzas geniales en camino.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #FFD93D22, #FFD93D08)',
                                    borderColor: 'rgba(255,217,61,0.3)',
                                    boxShadow: '0 4px 20px rgba(255,217,61,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <HelpCircle size={24} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(255,217,61,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-yellow-600' : 'text-yellow-400'
                                }`}>Adivinanzas</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>Desafíos para pensar y divertirse</span>
                            </button>

                            {/* Card 3: Videos */}
                            <button
                                onClick={() => { playNeonClick(); alert('🎬 ¡Próximamente! Videos divertidos y educativos.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #6BCB7722, #6BCB7708)',
                                    borderColor: 'rgba(107,203,119,0.3)',
                                    boxShadow: '0 4px 20px rgba(107,203,119,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-green-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <Play size={24} className="text-green-400 drop-shadow-[0_0_6px_rgba(107,203,119,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-green-600' : 'text-green-400'
                                }`}>Videos</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>Contenido divertido y seguro para ver</span>
                            </button>

                            {/* Card 4: Colorear */}
                            <button
                                onClick={() => { playNeonClick(); alert('🎨 ¡Próximamente! Dibujos para colorear y crear.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #4D96FF22, #4D96FF08)',
                                    borderColor: 'rgba(77,150,255,0.3)',
                                    boxShadow: '0 4px 20px rgba(77,150,255,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-blue-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <Palette size={24} className="text-blue-400 drop-shadow-[0_0_6px_rgba(77,150,255,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-blue-600' : 'text-blue-400'
                                }`}>Colorear</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>Dibujá y pintá con tu imaginación</span>
                            </button>

                            {/* Card 5: Cartas / Memoria */}
                            <button
                                onClick={() => { playNeonClick(); alert('🃏 ¡Próximamente! Juego de memoria y cartas.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #FF6BCB22, #FF6BCB08)',
                                    borderColor: 'rgba(255,107,203,0.3)',
                                    boxShadow: '0 4px 20px rgba(255,107,203,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-pink-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <Puzzle size={24} className="text-pink-400 drop-shadow-[0_0_6px_rgba(255,107,203,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-pink-600' : 'text-pink-400'
                                }`}>Memoria</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>Encontrá los pares y ganá puntos</span>
                            </button>

                            {/* Card 6: Sorpresas / Más */}
                            <button
                                onClick={() => { playNeonClick(); alert('✨ ¡Más sorpresas en camino! Seguí explorando.'); }}
                                className="rounded-[1.5rem] p-4 flex flex-col items-center gap-2.5 border transition-all active:scale-95 hover:scale-[1.02] relative overflow-hidden group"
                                style={{
                                    background: 'linear-gradient(135deg, #A855F722, #A855F708)',
                                    borderColor: 'rgba(168,85,247,0.3)',
                                    boxShadow: '0 4px 20px rgba(168,85,247,0.1)'
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-purple-400/20 flex items-center justify-center shadow-md relative z-10">
                                    <Sparkles size={24} className="text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                                </div>
                                <span className={`text-[10px] font-[900] uppercase tracking-widest relative z-10 ${
                                    isDayMode ? 'text-purple-600' : 'text-purple-400'
                                }`}>Sorpresas</span>
                                <span className={`text-[8px] text-center leading-relaxed relative z-10 ${
                                    isDayMode ? 'text-slate-400' : 'text-white/40'
                                }`}>¡Próximamente más diversión!</span>
                            </button>
                        </div>

                        {/* Nota para padres */}
                        <div className={`mt-4 rounded-2xl p-3.5 flex items-start gap-3 relative z-10 ${
                            isDayMode ? 'bg-amber-50/60 border border-amber-200/50' : 'bg-white/5 border border-white/10'
                        }`}>
                            <ShieldCheck size={18} className={isDayMode ? 'text-amber-500 flex-shrink-0 mt-0.5' : 'text-yellow-400 flex-shrink-0 mt-0.5'} />
                            <p className={`text-[8.5px] leading-relaxed ${
                                isDayMode ? 'text-slate-500' : 'text-white/50'
                            }`}>
                                <strong className={isDayMode ? 'text-slate-700' : 'text-white/70'}>Contenido seguro para toda la familia.</strong> Todas las actividades son supervisadas y moderadas por nuestro equipo. Diversión sin preocupaciones. 🎈
                            </p>
                        </div>
                    </div>
                </div>

                {/* ---------- OPINIONES DE CLIENTES (CARRUSEL DINÁMICO) ---------- */}
                <div className="w-full px-4 mb-14">
                    <div className={`w-full rounded-[2.5rem] pt-6 pb-5 px-3 flex flex-col relative ${
                        isDayMode ? 'glass-section-card' : 'bg-white/5 border border-white/10 shadow-lg'
                    }`}>
                        {/* Título */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <MessageSquare size={16} style={isDayMode ? { color: '#00C2FF' } : { color: themeColor }} />
                            <h3 className={`font-black text-[11px] uppercase tracking-[0.3em] ${isDayMode ? 'glass-text-main' : ''}`} style={isDayMode ? {} : { color: themeColor, filter: `drop-shadow(0 0 8px ${hexToRgba(themeColor,0.6)})` }}>Opiniones de Clientes</h3>
                        </div>

                        {/* Carrusel de Reseñas con Fotos */}
                        <div className={`w-full aspect-[4/5] md:aspect-video rounded-[2rem] overflow-hidden relative border isolate bg-zinc-900 group ${
                            isDayMode ? 'border-white/40 shadow-lg' : ''
                        }`} style={isDayMode ? {} : { borderColor: hexToRgba(themeColor, 0.2), boxShadow: `0 0 30px ${hexToRgba(themeColor, 0.1)}` }}>
                            {/* Foto del cliente como fondo */}
                            <img
                                key={`review-img-${currentReviewSlide}`}
                                src={mockReviews[currentReviewSlide]?.imageUrl}
                                alt={`Reseña de ${mockReviews[currentReviewSlide]?.authorName}`}
                                className="w-full h-full object-cover muro-fade-in"
                                loading="lazy"
                            />

                            {/* Overlay con datos de la reseña */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-24 pb-8 px-6 z-20 flex flex-col items-start text-left">
                                {/* Estrellas */}
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < mockReviews[currentReviewSlide]?.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]' : 'text-white/20 fill-transparent'} />
                                    ))}
                                </div>
                                {/* Nombre */}
                                <h4 className="text-white font-[1000] text-[15px] uppercase tracking-widest mb-1 drop-shadow-md">
                                    {mockReviews[currentReviewSlide]?.authorName}
                                </h4>
                                {/* Texto de la reseña */}
                                <p className="text-white/85 font-medium text-[12px] leading-relaxed italic line-clamp-3 mb-2 drop-shadow">
                                    "{mockReviews[currentReviewSlide]?.text}"
                                </p>
                                {/* Fecha y hora */}
                                <span className="text-white/50 text-[9px] font-black uppercase tracking-[0.25em]">
                                    📅 {mockReviews[currentReviewSlide]?.date}
                                </span>
                            </div>

                            {/* Dots de paginación */}
                            {mockReviews.length > 1 && (
                                <div className="absolute top-4 right-4 flex gap-1.5 pointer-events-none z-20">
                                    {mockReviews.map((_, i) => (
                                        <div key={i} className={`rounded-full backdrop-blur-md shadow-[0_0_5px_rgba(0,0,0,0.5)] transition-all duration-500 ${
                                            i === currentReviewSlide
                                            ? 'w-4 h-1.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                                            : 'w-1.5 h-1.5 bg-white/30'
                                        }`}></div>
                                    ))}
                                </div>
                            )}

                            {/* Badge "Verificado" */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
                                <ShieldCheck size={12} className="text-green-400" />
                                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Cliente Verificado</span>
                            </div>
                        </div>

                        {/* Botón Dejar tu comentario */}
                        <button
                            onClick={() => {
                                playNeonClick();
                                if (!user) {
                                    alert('📋 Para dejar tu opinión y foto, primero debés suscribirte como cliente desde la sección Credencial VIP.');
                                    return;
                                }
                                alert('📸 ¡Gracias por querer compartir tu experiencia! Próximamente podrás subir tu foto y comentario.');
                            }}
                            className={`w-full mt-4 py-3.5 px-6 rounded-full backdrop-blur-md border text-[10px] font-[1000] uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg ${
                                isDayMode
                                ? 'bg-white/40 border-white/70 text-slate-700 hover:bg-white/60'
                                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            }`}
                        >
                            <Camera size={16} /> Dejar tu comentario
                        </button>

                        {/* Aviso de moderación */}
                        <div className={`mt-3 rounded-2xl p-3.5 flex items-start gap-3 ${
                            isDayMode ? 'bg-sky-50/60 border border-sky-200/50' : 'bg-white/5 border border-white/10'
                        }`}>
                            <ShieldCheck size={18} className={isDayMode ? 'text-sky-500 flex-shrink-0 mt-0.5' : 'text-cyan-400 flex-shrink-0 mt-0.5'} />
                            <p className={`text-[8.5px] leading-relaxed ${
                                isDayMode ? 'text-slate-500' : 'text-white/50'
                            }`}>
                                <strong className={isDayMode ? 'text-slate-700' : 'text-white/70'}>Moderado por Ari & Eve.</strong> Todas las fotos y comentarios son revisados antes de publicarse. No se permite contenido ofensivo, obsceno o inapropiado. Para comentar debes estar suscripto como cliente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botón Regresar */}
                <div className="w-full px-5 mb-14 flex justify-center">
                    <button 
                        onClick={() => {
                            playNeonClick();
                            navigate(`${basePath}/${categorySlug}`);
                        }} 
                        className={`w-max py-3 px-8 rounded-full flex items-center gap-2 ${
                            isDayMode ? 'glass-button-3d' : 'btn-3d-celeste text-white'
                        }`}
                        style={isDayMode ? { 
                            background: 'rgba(255, 255, 255, 0.65)', 
                            border: '1px solid rgba(255, 255, 255, 0.85)',
                            color: '#2c3e50'
                        } : {}}
                    >
                        <ArrowLeft size={14} style={{ color: '#00C2FF', filter: 'drop-shadow(0 0 3px rgba(0, 194, 255, 0.6))' }} strokeWidth={3} />
                        <span className="text-[10px] font-[1100] uppercase tracking-widest">Regresar</span>
                    </button>
                </div>

            </div>

            {/* PIE DE PÁGINA (Footer) — Términos y Condiciones */}
            <footer className="w-full max-w-md mx-auto px-5 z-10 pt-4 pb-4 mt-auto relative">
                {isDayMode ? (
                    <div className="bg-[#ffffff]/35 backdrop-blur-md border border-white/35 py-3 px-5 rounded-[1.8rem] flex items-center justify-between w-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_6px_15px_rgba(88,70,50,0.06)]">
                        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#5c4033] select-none">
                            © 2026 · ShopDigital
                        </p>
                        <div className="flex items-center gap-2.5">
                            <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#0f224e] select-none">
                                {selectedShop?.name?.split('-')[0]?.trim() || 'Catálogo'}
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
                            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-center select-none" style={{ color: themeColor, textShadow: `0 0 10px ${hexToRgba(themeColor, 0.8)}, 0 0 20px ${hexToRgba(themeColor, 0.4)}` }}>
                                {selectedShop?.name?.split('-')[0]?.trim() || 'Catálogo'}
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

            {/* Modal de Oferta (Fase 4) */}
            {selectedOfferForModal && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOfferForModal(null)}></div>
                    <div className={`relative w-full max-w-sm border rounded-[2rem] p-6 animate-in slide-in-from-bottom-10 duration-300 ${
                        isDayMode ? 'home-glass-plate' : 'bg-zinc-900 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
                    }`} style={isDayMode ? {} : { boxShadow: `0 0 40px ${hexToRgba(themeColor, 0.15)}` }}>
                        <button 
                            onClick={() => setSelectedOfferForModal(null)}
                            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border active:scale-90 transition-transform ${
                                isDayMode ? 'bg-[#faf8f5] border-[#5c4033]/25 text-[#5c4033]' : 'bg-black/50 border-white/10 text-white/70'
                            }`}
                        >
                            <span className="text-xl leading-none font-light">&times;</span>
                        </button>
                        
                        <div className={`w-full aspect-square rounded-[1.5rem] overflow-hidden border mb-5 relative ${
                            isDayMode ? 'border-[#5c4033]/15' : 'border-white/10'
                        }`}>
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
                        
                        <h2 className={`text-[16px] font-[1000] uppercase tracking-[0.1em] leading-tight mb-2 text-center ${
                            isDayMode ? 'text-[#5c4033]' : 'text-white'
                        }`}>
                            {selectedOfferForModal.name}
                        </h2>
                        
                        <div className="w-full flex justify-center mb-6">
                            <div className={`py-2 px-5 rounded-xl border ${
                                isDayMode ? 'bg-[#faf8f5] border-[#5c4033]/25 text-[#5c4033] shadow-inner font-[1000]' : 'glass-action-btn border-white/10 bg-white/5 text-white'
                            }`}>
                                <span className="text-[18px] font-black drop-shadow-md">$ {selectedOfferForModal.price.toLocaleString('es-AR')}</span>
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
                            <p className={`mt-4 text-center text-[7.5px] uppercase tracking-widest leading-relaxed px-2 ${
                                isDayMode ? 'text-[#7a6353]' : 'text-white/40'
                            }`}>
                                * {selectedOfferForModal.legalText}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Modal para ampliar Novedad */}
            {selectedMuroItemForModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedMuroItemForModal(null)}></div>
                    <div className="relative w-full max-w-md bg-zinc-900 border border-white/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
                        <button 
                            onClick={() => setSelectedMuroItemForModal(null)}
                            className="absolute top-4 right-4 w-8 h-8 z-20 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/30 active:scale-90 transition-transform text-white"
                        >
                            <span className="font-black text-[12px]">X</span>
                        </button>
                        
                        <div className="w-full aspect-[4/5] relative bg-black">
                            {selectedMuroItemForModal.type === 'video' ? (
                                <video src={selectedMuroItemForModal.url} className="w-full h-full object-cover" autoPlay controls playsInline />
                            ) : (
                                <img src={selectedMuroItemForModal.url} alt="Novedad" className="w-full h-full object-cover" />
                            )}
                        </div>
                        
                        <div className="p-6 bg-gradient-to-t from-zinc-900 via-zinc-900/90 to-transparent absolute bottom-0 left-0 right-0 pt-20">
                            <h4 className="text-white font-[1000] text-[18px] uppercase tracking-widest mb-3 drop-shadow-md">
                                {selectedMuroItemForModal.title || 'Novedades'}
                            </h4>
                            <p className="text-white/80 font-medium text-[13px] leading-relaxed drop-shadow mb-2">
                                {selectedMuroItemForModal.description || 'Descubrí las últimas novedades y promociones en nuestro muro.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopDetailPage;
