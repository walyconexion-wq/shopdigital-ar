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
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

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
    const mapRef = useRef<HTMLDivElement>(null);
    const [selectedOfferForModal, setSelectedOfferForModal] = useState<ProductOffer | null>(null);
    const [selectedMuroItemForModal, setSelectedMuroItemForModal] = useState<any | null>(null);
    const [currentReviewSlide, setCurrentReviewSlide] = useState(0);
    const reviewTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { user, login } = useAuth();
    const [lockClicks, setLockClicks] = useState(0);
    const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [mapVisible, setMapVisible] = useState(false);

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

    // Lazy map: activate iframe only when user scrolls near the map section
    useEffect(() => {
        if (!mapRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setMapVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px', threshold: 0 }
        );
        observer.observe(mapRef.current);
        return () => observer.disconnect();
    }, []);

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
        <div className="pb-24 animate-in fade-in duration-700 min-h-screen relative bg-transparent text-[#2c2440]">
            {/* Fondo Ciber-Digital Animado */}
            <CyberCircuitBackground />

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

            {/* ---------- PORTADA PRINCIPAL / HERO BANNER ---------- */}
            <div className="relative w-full h-[350px] bg-zinc-900 overflow-hidden shadow-2xl rounded-b-[2.5rem] border-b border-[#b4a594]/30">
                {/* Botón Volver Neumórfico 3D */}
                <button
                    onClick={() => { playNeonClick(); navigate(`${basePath}/${categorySlug}`); }}
                    className="neu-btn-3d absolute top-5 left-5 z-[60] w-11 h-11 flex items-center justify-center rounded-2xl transition-transform active:scale-90"
                    title="Volver"
                >
                    <ArrowLeft size={18} className="text-[#ff6b6b]" strokeWidth={2.5} />
                </button>

                {/* Botón Modo Noche/Día Neumórfico 3D */}
                <button
                    onClick={() => {
                        playNeonClick();
                        const current = localStorage.getItem('global_home_theme_mode') || 'light';
                        const nextTheme = current === 'light' ? 'dark' : 'light';
                        localStorage.setItem('global_home_theme_mode', nextTheme);
                        window.dispatchEvent(new Event('theme-changed'));
                    }}
                    className="neu-btn-3d absolute top-5 right-5 z-[60] w-11 h-11 flex items-center justify-center rounded-2xl transition-transform active:scale-90"
                    title="Cambiar Modo"
                >
                    {isDayMode ? <Moon size={17} className="text-[#2c2440]" /> : <Sun size={17} className="text-[#ff6b6b]" />}
                </button>

                {/* Imágenes de Fondo de Portada */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />

                {/* Placa Neumórfica de Nombre y Ubicación */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[90%] max-w-[345px] flex flex-col items-center">
                    <div className="neu-plate w-full py-4 px-6 text-center border border-white/70 shadow-2xl backdrop-blur-md">
                        <h1 className="text-[20px] sm:text-[22px] font-[1000] uppercase tracking-wider text-[#2c2440] leading-tight mb-1 drop-shadow-sm">
                            {String(selectedShop.name || '').replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}
                        </h1>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                            <MapPin size={13} className="text-[#ff6b6b]" strokeWidth={2.5} />
                            <span className="text-[9.5px] font-black uppercase tracking-[0.2em] text-[#4a3d6a]">
                                {selectedShop.zone || 'Tu zona'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Badges Inferiores de Visitas y Suscriptores (Simétricos y Neumórficos) */}
                <div className="absolute bottom-5 left-0 right-0 z-40 px-5 flex items-center justify-between pointer-events-none">
                    <div className="neu-inset-title flex items-center gap-1.5 px-3 py-1.5 text-[8.5px] font-black text-[#2c2440] uppercase tracking-widest backdrop-blur-sm bg-[#faf7f2]/80">
                        <Eye size={12} className="text-[#4a3d6a]" />
                        <span>{selectedShop.visits || 0} visitas</span>
                    </div>

                    <div className="neu-inset-title flex items-center gap-1.5 px-3 py-1.5 text-[8.5px] font-black text-[#2c2440] uppercase tracking-widest backdrop-blur-sm bg-[#faf7f2]/80">
                        <Users size={12} className="text-[#ff6b6b]" />
                        <span>{selectedShop.subscribers || 0} suscriptores</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">

                {/* ---------- CATÁLOGO DE OFERTAS NEUMÓRFICO CREMA HD ---------- */}
                <div ref={catalogRef} className="w-full mb-8 mt-4 px-4 max-w-[365px] mx-auto">
                    <div className="neu-plate w-full p-4 flex flex-col">
                        {/* Título de la Sección */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <ShoppingBag size={15} className="text-[#ff6b6b]" strokeWidth={2.5} />
                            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#2c2440]">Nuestro Catálogo</h2>
                        </div>

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
                                    const badgeType = idx % 3;
                                    const badgeProps = badgeType === 0 
                                        ? { text: '🔥 HOT', bg: 'bg-orange-500/90', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.8)]' }
                                        : badgeType === 1 
                                        ? { text: '✨ NUEVO', bg: 'bg-green-500/90', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.8)]' }
                                        : { text: '⚡ HOY', bg: 'bg-rose-500/90', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.8)]' };

                                    return (
                                        <div key={`${offer.id}-${idx}`} className="flex-shrink-0 w-40 p-3 flex flex-col relative group snap-center cursor-pointer neu-btn-3d" onClick={() => { playNeonClick(); setSelectedOfferForModal(offer); logEvento('view_offer', selectedShop.id, { producto: offer.name }); }}>
                                            <div className="rounded-xl overflow-hidden aspect-square mb-3 border border-[#b4a594]/30 shadow-md relative">
                                                <ProgressiveShopImage
                                                    src={offer.image}
                                                    alt={offer.name}
                                                    className="w-full h-full group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                                                    priority={idx < 6}
                                                    skeletonColor="rgba(196,163,133,0.15)"
                                                />
                                                <div className={`absolute top-2 right-2 text-white text-[7.5px] font-black px-2 py-1 rounded-full uppercase backdrop-blur-md ${badgeProps.bg} ${badgeProps.shadow} border border-white/20 pointer-events-none z-10`}>
                                                    {badgeProps.text}
                                                </div>
                                            </div>
                                            <div className="px-1 pb-1 text-center pointer-events-none">
                                                <p className="text-[10px] font-black uppercase tracking-tight mb-2.5 line-clamp-1 text-[#2c2440]">{offer.name}</p>
                                                <div className="neu-inset-title py-1.5 px-3">
                                                    <span className="text-[12px] font-black text-[#ff6b6b]">$ {offer.price.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}  
                            </div>
                        </div>

                        {/* Botón Abrir Catálogo Neumórfico */}
                        <button
                            onClick={() => { playNeonClick(); navigate(`${basePath}/${categorySlug}/${shopSlug}/menu`); }}
                            className="neu-btn-3d-active w-full py-3.5 flex items-center justify-center gap-2.5 font-[1100] uppercase tracking-[0.2em] text-[10px] text-[#2c2440] mt-3"
                        >
                            <ShoppingBag size={15} className="text-[#ff6b6b]" strokeWidth={2.5} />
                            <span>Abrir Catálogo Completo</span>
                        </button>
                    </div>
                </div>

                {/* ---------- INTEGRACIÓN PEDIDOSYA NEUMÓRFICA ---------- */}
                {selectedShop.pedidoYaUrl && (
                    <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                        <button
                            onClick={() => {
                                playNeonClick();
                                window.open(selectedShop.pedidoYaUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="neu-btn-3d w-full py-4 flex items-center justify-center gap-3 transition-transform active:scale-95"
                        >
                            <ShoppingBag size={18} strokeWidth={2.5} className="text-[#EA044E]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EA044E]">Pedir por PedidoYa</span>
                        </button>
                    </div>
                )}

                {/* ---------- DASHBOARD DE CONTACTO NEUMÓRFICO ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <MessageCircle size={14} className="text-[#ff6b6b]" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-[#2c2440]">Canales de Atención</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handleOpenLink('https://www.pedidosya.com.ar/')} className="neu-btn-3d flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem]">
                                <span className="italic text-[20px] font-black text-[#EA044E]">P</span>
                                <span className="text-[7.5px] tracking-[0.15em] font-black uppercase text-[#EA044E]">PedidosYa</span>
                            </button>
                            <button onClick={() => selectedShop.phone && handleOpenLink(`https://wa.me/549${String(selectedShop.phone).replace(/\D/g, '')}?text=Hola!%20Vengo%20de%20la%20App%20de%20Waly`)} className="neu-btn-3d flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem]">
                                <MessageCircle size={20} className="text-[#25D366]" fill="currentColor" strokeWidth={0} />
                                <span className="text-[7.5px] tracking-[0.15em] font-black uppercase text-[#25D366]">WhatsApp</span>
                            </button>
                            <button onClick={() => handleOpenLink('https://www.mercadopago.com.ar/')} className="neu-btn-3d flex flex-col items-center justify-center gap-2 py-4 rounded-[1.25rem]">
                                <Handshake size={20} className="text-[#009EE3]" strokeWidth={2.5} />
                                <span className="text-[7.5px] tracking-[0.15em] font-black uppercase text-[#009EE3]">M. Pago</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- CREDENCIAL VIP NEUMÓRFICA CREMA HD ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-6 flex flex-col items-center text-center">
                        <div className="w-28 h-40 mb-3 relative drop-shadow-2xl">
                            <img src="/luz-avatar.png" alt="Avatar VIP" className="w-full h-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                        </div>
                        <h3 className="text-[12px] font-[1000] uppercase tracking-widest mb-2 text-[#2c2440]">Club de Beneficios VIP</h3>
                        <p className="text-[10.5px] mb-5 leading-relaxed text-[#4a3d6a]/80 font-medium px-2">
                            Suscribite ahora para desbloquear descuentos y promociones exclusivas.
                        </p>
                        <button
                            onClick={() => { playNeonClick(); logEvento('click_vip_access', selectedShop.id); navigate(`${basePath}/${categorySlug}/${shopSlug}/cliente-subscripcion`); }}
                            className="neu-btn-3d-active w-full py-4 flex items-center justify-center gap-3 font-[1100] uppercase tracking-[0.2em] text-[10px] text-[#2c2440]"
                        >
                            <Star size={16} className="text-[#ff6b6b]" strokeWidth={2.5} />
                            <span>Obtener Credencial VIP</span>
                        </button>
                    </div>
                </div>

                {/* ---------- MÓDULO DE UBICACIÓN NEUMÓRFICO ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <MapPin size={14} className="text-[#ff6b6b]" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-[#2c2440]">Dónde Encontrarnos</h3>
                        </div>
                        
                        <div ref={mapRef} className={`w-full h-48 overflow-hidden bg-black relative mb-4 rounded-[1.25rem] border group ${
                            isDayMode ? 'border-white/40' : 'border-white/10'
                        }`}>
                            {mapVisible ? (
                                <iframe
                                    title="Ubicación"
                                    src={selectedShop.mapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    className="rounded-[1.25rem] invert-[95%] hue-rotate-180 contrast-[120%] saturate-[200%] brightness-[85%] opacity-90 pointer-events-auto transition-all group-hover:opacity-100"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
                                    <MapPin size={28} className="text-white" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">Cargando mapa...</span>
                                </div>
                            )}
                            <div className="absolute inset-0 pointer-events-none rounded-[1.25rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]"></div>
                        </div>

                        <p className="text-[8px] text-center font-bold uppercase tracking-widest mb-4 text-[#4a3d6a]/70">
                            {selectedShop.address}
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'google_maps' }); handleOpenLink(selectedShop.mapSheetUrl || '#'); }} 
                                className="neu-btn-3d py-3 flex items-center justify-center gap-2 text-[#2c2440]"
                            >
                                <Navigation size={14} className="text-[#ff6b6b]" strokeWidth={2.5} />
                                <span className="text-[8.5px] font-[1100] uppercase tracking-wider">Cómo llegar</span>
                            </button>
                            <button 
                                onClick={() => { logEvento('click_location', selectedShop.id, { metodo: 'uber' }); handleOpenLink('https://m.uber.com/ul/'); }} 
                                className="neu-btn-3d py-3 flex items-center justify-center gap-2 text-[#2c2440]"
                            >
                                <Car size={14} className="text-[#4a3d6a]" strokeWidth={2.5} />
                                <span className="text-[8.5px] font-[1100] uppercase tracking-wider">Pedir Uber</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- COMUNIDAD NEUMÓRFICA ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users size={14} className="text-[#ff6b6b]" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-[#2c2440]">Comunidad</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'facebook' }); selectedShop.facebook && handleOpenLink(selectedShop.facebook); }} className="neu-btn-3d py-2.5 flex flex-col items-center justify-center gap-1">
                                <Facebook size={16} className="text-[#1877F2]" fill="currentColor" strokeWidth={0} />
                                <span className="text-[7.5px] font-black uppercase tracking-wider text-[#1877F2]">Facebook</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'instagram' }); selectedShop.instagram && handleOpenLink(selectedShop.instagram); }} className="neu-btn-3d py-2.5 flex flex-col items-center justify-center gap-1">
                                <Instagram size={16} className="text-[#E4405F]" strokeWidth={2.5} />
                                <span className="text-[7.5px] font-black uppercase tracking-wider text-[#E4405F]">Instagram</span>
                            </button>
                            <button onClick={() => { logEvento('click_social', selectedShop.id, { plataforma: 'tiktok' }); selectedShop.tiktok && handleOpenLink(selectedShop.tiktok); }} className="neu-btn-3d py-2.5 flex flex-col items-center justify-center gap-1">
                                <Music size={16} className="text-[#2c2440]" strokeWidth={2.5} />
                                <span className="text-[7.5px] font-black uppercase tracking-wider text-[#2c2440]">TikTok</span>
                            </button>
                        </div>
                        <button onClick={handleShare} className="neu-btn-3d w-full py-3 flex items-center justify-center gap-2 mt-1 text-[#2c2440]">
                            <Share2 size={14} className="text-[#ff6b6b]" strokeWidth={2.5} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Compartir Catálogo</span>
                        </button>
                        <div className="w-full flex justify-center">
                            <button onClick={() => { playNeonClick(); handleLockTap(); }} className={`flex items-center justify-center gap-1.5 py-2 transition-all duration-300 ${
                                lockClicks >= 4 ? 'text-cyan-600 scale-110' : lockClicks >= 2 ? 'opacity-30' : 'opacity-15'
                            } text-[#2c2440]`}>
                                <Lock size={lockClicks >= 4 ? 14 : 10} className="transition-all duration-300" />
                                <span className={`font-bold uppercase tracking-widest transition-all duration-300 ${lockClicks >= 4 ? 'text-[9px]' : 'text-[7px]'}`}>Gestión</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ---------- 📺 MURO VIVO NEUMÓRFICO ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-4">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <ImageIcon size={16} className="text-[#ff6b6b]" />
                            <h3 className="font-extrabold text-[10px] uppercase tracking-[0.25em] text-[#2c2440]">Muro de Novedades</h3>
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

                {/* ---------- 🎈 ZONA KIDS NEUMÓRFICA ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-5 flex flex-col overflow-hidden">
                        {/* Título colorido */}
                        <div className="flex items-center justify-center gap-2.5 mb-3">
                            <span className="text-[22px]">🎈</span>
                            <h3 className="font-[1000] text-[13px] uppercase tracking-[0.3em] text-[#2c2440]">Zona Kids</h3>
                            <span className="text-[22px]">🎈</span>
                        </div>
                        <p className="text-center text-[9.5px] font-bold mb-5 text-[#4a3d6a]/70">
                            🎉 ¡Diversión asegurada mientras la familia disfruta! 🎉
                        </p>

                        {/* Grid de actividades neumórficas */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { playNeonClick(); alert('🎮 ¡Próximamente! Estamos preparando juegos increíbles.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,107,0.15)', boxShadow: 'inset 2px 2px 5px rgba(255,107,107,0.1)' }}>
                                    <Gamepad2 size={24} className="text-red-400" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-red-500">Juegos</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">Mini-juegos divertidos para toda la familia</span>
                            </button>

                            <button
                                onClick={() => { playNeonClick(); alert('🧩 ¡Próximamente! Adivinanzas geniales en camino.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,217,61,0.15)', boxShadow: 'inset 2px 2px 5px rgba(255,217,61,0.1)' }}>
                                    <HelpCircle size={24} className="text-yellow-500" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-yellow-600">Adivinanzas</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">Desafíos para pensar y divertirse</span>
                            </button>

                            <button
                                onClick={() => { playNeonClick(); alert('🎬 ¡Próximamente! Videos divertidos y educativos.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(107,203,119,0.15)', boxShadow: 'inset 2px 2px 5px rgba(107,203,119,0.1)' }}>
                                    <Play size={24} className="text-green-500" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-green-600">Videos</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">Contenido divertido y seguro para ver</span>
                            </button>

                            <button
                                onClick={() => { playNeonClick(); alert('🎨 ¡Próximamente! Dibujos para colorear y crear.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(77,150,255,0.15)', boxShadow: 'inset 2px 2px 5px rgba(77,150,255,0.1)' }}>
                                    <Palette size={24} className="text-blue-500" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-blue-600">Colorear</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">Dibujá y pintá con tu imaginación</span>
                            </button>

                            <button
                                onClick={() => { playNeonClick(); alert('🃏 ¡Próximamente! Juego de memoria y cartas.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,203,0.15)', boxShadow: 'inset 2px 2px 5px rgba(255,107,203,0.1)' }}>
                                    <Puzzle size={24} className="text-pink-500" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-pink-600">Memoria</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">Encontrá los pares y ganá puntos</span>
                            </button>

                            <button
                                onClick={() => { playNeonClick(); alert('✨ ¡Más sorpresas en camino! Seguí explorando.'); }}
                                className="neu-btn-3d p-4 flex flex-col items-center gap-2.5 rounded-[1.5rem]"
                            >
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', boxShadow: 'inset 2px 2px 5px rgba(168,85,247,0.1)' }}>
                                    <Sparkles size={24} className="text-purple-500" />
                                </div>
                                <span className="text-[10px] font-[900] uppercase tracking-widest text-purple-600">Sorpresas</span>
                                <span className="text-[7.5px] text-center leading-relaxed text-[#4a3d6a]/60">¡Próximamente más diversión!</span>
                            </button>
                        </div>

                        {/* Nota para padres neumórfica */}
                        <div className="neu-inset-title mt-4 p-3.5 flex items-start gap-3">
                            <ShieldCheck size={18} className="text-[#ff6b6b] flex-shrink-0 mt-0.5" />
                            <p className="text-[8px] leading-relaxed text-[#4a3d6a]/80">
                                <strong className="text-[#2c2440]">Contenido seguro para toda la familia.</strong> Todas las actividades son supervisadas y moderadas por nuestro equipo. Diversión sin preocupaciones. 🎈
                            </p>
                        </div>
                    </div>
                </div>


                {/* ---------- OPINIONES DE CLIENTES NEUMÓRFICA ---------- */}
                <div className="w-full px-4 mb-8 max-w-[365px] mx-auto">
                    <div className="neu-plate p-4 flex flex-col">
                        {/* Título */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <MessageSquare size={16} className="text-[#ff6b6b]" />
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-[#2c2440]">Opiniones de Clientes</h3>
                        </div>

                        {/* Carrusel de Reseñas con Fotos */}
                        <div className="w-full aspect-[4/5] md:aspect-video rounded-2xl overflow-hidden relative border border-[#b4a594]/30 bg-zinc-900 group shadow-md">
                            <img
                                key={`review-img-${currentReviewSlide}`}
                                src={mockReviews[currentReviewSlide]?.imageUrl}
                                alt={`Reseña de ${mockReviews[currentReviewSlide]?.authorName}`}
                                className="w-full h-full object-cover muro-fade-in"
                                loading="lazy"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-24 pb-8 px-6 z-20 flex flex-col items-start text-left">
                                <div className="flex gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < mockReviews[currentReviewSlide]?.rating ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]' : 'text-white/20 fill-transparent'} />
                                    ))}
                                </div>
                                <h4 className="text-white font-[1000] text-[15px] uppercase tracking-widest mb-1 drop-shadow-md">
                                    {mockReviews[currentReviewSlide]?.authorName}
                                </h4>
                                <p className="text-white/85 font-medium text-[12px] leading-relaxed italic line-clamp-3 mb-2 drop-shadow">
                                    "{mockReviews[currentReviewSlide]?.text}"
                                </p>
                                <span className="text-white/50 text-[9px] font-black uppercase tracking-[0.25em]">
                                    📅 {mockReviews[currentReviewSlide]?.date}
                                </span>
                            </div>
                            {mockReviews.length > 1 && (
                                <div className="absolute top-4 right-4 flex gap-1.5 pointer-events-none z-20">
                                    {mockReviews.map((_, i) => (
                                        <div key={i} className={`rounded-full backdrop-blur-md transition-all duration-500 ${
                                            i === currentReviewSlide
                                            ? 'w-4 h-1.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                                            : 'w-1.5 h-1.5 bg-white/30'
                                        }`}></div>
                                    ))}
                                </div>
                            )}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 rounded-full px-3 py-1.5 backdrop-blur-md shadow-lg">
                                <ShieldCheck size={12} className="text-green-400" />
                                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Cliente Verificado</span>
                            </div>
                        </div>

                        {/* Botón Dejar comentario Neumórfico */}
                        <button
                            onClick={() => {
                                playNeonClick();
                                if (!user) {
                                    alert('📋 Para dejar tu opinión y foto, primero debés suscribirte como cliente desde la sección Credencial VIP.');
                                    return;
                                }
                                alert('📸 ¡Gracias por querer compartir tu experiencia! Próximamente podrás subir tu foto y comentario.');
                            }}
                            className="neu-btn-3d w-full mt-4 py-3.5 flex items-center justify-center gap-2.5 text-[10px] font-[1000] uppercase tracking-widest text-[#2c2440]"
                        >
                            <Camera size={16} className="text-[#ff6b6b]" /> Dejar tu comentario
                        </button>

                        {/* Aviso de moderación neumórfico */}
                        <div className="neu-inset-title mt-3 p-3.5 flex items-start gap-3">
                            <ShieldCheck size={18} className="text-[#ff6b6b] flex-shrink-0 mt-0.5" />
                            <p className="text-[8px] leading-relaxed text-[#4a3d6a]/80">
                                <strong className="text-[#2c2440]">Moderado por Ari &amp; Eve.</strong> Todas las fotos y comentarios son revisados antes de publicarse. No se permite contenido ofensivo, obsceno o inapropiado. Para comentar debes estar suscripto como cliente.
                            </p>
                        </div>
                    </div>
                </div>


                {/* Botón Regresar Neumórfico */}
                <div className="w-full px-4 mb-14 flex justify-center">
                    <button
                        onClick={() => { playNeonClick(); navigate(`${basePath}/${categorySlug}`); }}
                        className="neu-btn-3d py-3 px-10 flex items-center gap-2.5 text-[#2c2440]"
                    >
                        <ArrowLeft size={14} className="text-[#ff6b6b]" strokeWidth={2.5} />
                        <span className="text-[10px] font-[1100] uppercase tracking-widest">Regresar</span>
                    </button>
                </div>

            </div>

            {/* PIE DE PÁGINA NEUMÓRFICO */}
            <footer className="w-full max-w-[365px] mx-auto px-4 z-10 pt-2 pb-4 mt-auto relative">
                <div className="neu-plate flex items-center justify-between w-full py-3 px-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#5c4033] select-none">
                        © 2026 · ShopDigital
                    </p>
                    <div className="flex items-center gap-2.5">
                        <p className="text-[8px] font-extrabold uppercase tracking-[0.15em] text-[#2c2440] select-none">
                            {selectedShop?.name?.split('-')[0]?.trim() || 'Catálogo'}
                        </p>
                        <span className="text-[#5c4033]/40 text-[7px] select-none">|</span>
                        <button
                            onClick={() => { playNeonClick(); navigate(`/${townId}/terminos`); }}
                            className="text-[7.5px] font-extrabold uppercase tracking-[0.15em] text-[#ff6b6b] hover:underline active:opacity-75 transition-opacity select-none"
                        >
                            Términos
                        </button>
                    </div>
                </div>
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
