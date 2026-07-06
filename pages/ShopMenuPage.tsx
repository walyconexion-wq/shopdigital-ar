import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop } from '../types';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { playNeonClick } from '../utils/audio';

interface ShopMenuPageProps {
    allShops: Shop[];
}

const ShopMenuPage: React.FC<ShopMenuPageProps> = ({ allShops }) => {
    const { townId = 'esteban-echeverria', categorySlug, shopSlug } = useParams<{ townId: string; categorySlug: string; shopSlug: string }>();
    const navigate = useNavigate();
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

    const selectedShop = allShops.find(
        (s) => (s.slug || s.id) === shopSlug
    );

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!selectedShop) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDayMode ? 'bg-[#cda488]' : 'bg-black'}`}>
                <h2 className={`text-xl font-black mb-4 ${isDayMode ? 'text-[#2d1e15]' : 'neon-text-red text-white'}`}>Comercio no encontrado</h2>
                <button 
                    onClick={() => { playNeonClick(); navigate(-1); }} 
                    className={`px-6 py-2 rounded-full border transition-all active:scale-95 ${
                        isDayMode 
                            ? 'bg-white text-[#2d1e15] border-[#cbd5e1] shadow-sm'
                            : 'bg-cyan-950 text-white border-cyan-500 hover:bg-cyan-900'
                    }`}
                >
                    Volver
                </button>
            </div>
        );
    }

    // Default mock data if no offers (for visual presentation)
    const mockOffers = [
        { id: '1', name: 'Promo Especial 1', description: 'Porción abundante con ingredientes frescos. Calidad premium asegurada para nuestros clientes.', price: 5000, originalPrice: 6500, image: selectedShop.image },
        { id: '2', name: 'Promo Especial 2', description: 'Ideal para compartir, el mejor precio de la zona con envío incluido.', price: 8500, originalPrice: 10000, image: selectedShop.bannerImage },
        { id: '3', name: 'Promo Especial 3', description: 'Nuestra especialidad de la casa, directamente a tu mesa.', price: 12000, originalPrice: 15000, image: selectedShop.galleryImages?.[0] || selectedShop.image },
        { id: '4', name: 'Promo Individual', description: 'Perfecto para una sola persona, date el gusto.', price: 3500, originalPrice: 4200, image: selectedShop.galleryImages?.[1] || selectedShop.bannerImage }
    ];

    const displayOffers = selectedShop.offers && selectedShop.offers.length > 0 ? selectedShop.offers : mockOffers;

    return (
        <div className={`min-h-screen pb-24 animate-in fade-in duration-700 transition-colors duration-500 ${
            isDayMode ? 'bg-[#cda488]' : 'bg-black'
        }`}>
            <Helmet>
                <title>Menú de {selectedShop.name} - ShopDigital</title>
            </Helmet>

            {/* Header Banner */}
            <div className={`relative w-full h-48 overflow-hidden rounded-b-[2.5rem] mb-8 border-b-[8px] transition-all duration-300 ${
                isDayMode 
                    ? 'bg-[#faf8f5] border-[#855b3c] shadow-md' 
                    : 'bg-black border-cyan-500/20 shadow-[0_10px_30px_rgba(34,211,238,0.15)]'
            }`}>
                <img 
                    src={selectedShop.bannerImage || selectedShop.image} 
                    alt="Banner" 
                    className={`w-full h-full object-cover transition-all ${
                        isDayMode ? 'opacity-35' : 'opacity-50'
                    }`} 
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${
                    isDayMode 
                        ? 'from-[#faf8f5] via-[#faf8f5]/60 to-transparent' 
                        : 'from-cyan-950/90 via-black/50 to-black/80'
                }`} />
                
                <div className="absolute top-6 left-6 z-50">
                    <button 
                        onClick={() => {
                            playNeonClick();
                            navigate(-1);
                        }} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                            isDayMode
                                ? 'bg-white/90 border border-[#855b3c]/30 text-[#855b3c] hover:bg-white hover:text-black'
                                : 'bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-cyan-400 hover:border-cyan-500/30'
                        }`}
                    >
                        <ArrowLeft size={18} />
                    </button>
                </div>

                <div className="absolute bottom-6 left-0 w-full px-6 flex flex-col items-center z-40">
                    {/* Merchant Logo circular container */}
                    <div className={`w-14 h-14 rounded-full p-0.5 overflow-hidden mb-3 bg-black transition-all ${
                        isDayMode 
                            ? 'border-2 border-[#855b3c] shadow-sm' 
                            : 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                    }`}>
                        <img src={selectedShop.image} alt={selectedShop.name} className="w-full h-full object-cover rounded-full" />
                    </div>

                    <h1 className={`text-[16px] font-black uppercase tracking-widest text-center ${
                        isDayMode 
                            ? 'text-[#2d1e15]' 
                            : 'text-white text-shadow-premium drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                    }`}>
                        {selectedShop.name.replace(/\s*\(.*\)\s*/, '').split('-')[0].trim()}
                    </h1>

                    <div className="flex items-center gap-1.5 mt-1">
                        <ShoppingBag size={10} className={isDayMode ? 'text-[#855b3c]' : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]'} />
                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${
                            isDayMode 
                                ? 'text-[#855b3c]' 
                                : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]'
                        }`}>Catálogo Oficial</span>
                    </div>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="px-5 w-full max-w-md mx-auto flex flex-col gap-4">
                {displayOffers.map((offer, idx) => (
                    <div 
                        key={`${offer.id}-${idx}`} 
                        className={`border overflow-hidden p-3.5 flex gap-4 relative group transition-all duration-300 ${
                            isDayMode
                                ? 'bg-[#faf8f5] border-[#855b3c] border-b-[8px] border-b-[#855b3c] rounded-[2rem] hover:shadow-md'
                                : 'glass-card-3d bg-cyan-950/20 backdrop-blur-md border border-cyan-500/30 rounded-[1.5rem] hover:border-cyan-400'
                        }`}
                    >
                        {/* Decorative glow (Only in Night Mode) */}
                        {!isDayMode && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full pointer-events-none" />
                        )}
                        
                        <div className="w-24 h-24 flex-shrink-0 rounded-[1.2rem] overflow-hidden relative border border-white/10 shadow-sm">
                            <img src={offer.image} alt={offer.name} className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-750" />
                            <div className={`absolute top-1 left-1 text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                isDayMode 
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'bg-cyan-500/90 backdrop-blur-sm text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                            }`}>
                                PROMO
                            </div>
                        </div>

                        <div className="flex flex-col justify-center flex-grow py-1 pr-1 z-10 w-full">
                            <h3 className={`text-[11px] font-black uppercase tracking-wide leading-tight mb-1 ${
                                isDayMode ? 'text-[#2d1e15]' : 'text-white'
                            }`}>
                                {offer.name}
                            </h3>
                            
                            <p className={`text-[8px] leading-snug mb-3 line-clamp-2 ${
                                isDayMode ? 'text-[#2d1e15]/60' : 'text-white/50'
                            }`}>
                                {offer.description}
                            </p>
                            
                            <div className="flex items-end justify-between mt-auto w-full">
                                <div className="flex flex-col">
                                    {offer.originalPrice > offer.price && (
                                        <span className={`text-[8px] line-through font-bold mb-0.5 ${
                                            isDayMode ? 'text-[#2d1e15]/40' : 'text-white/30'
                                        }`}>
                                            ${offer.originalPrice.toLocaleString('es-AR')}
                                        </span>
                                    )}
                                    <span className={`text-[14px] font-black ${
                                        isDayMode 
                                            ? 'text-[#2d1e15]' 
                                            : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                                    }`}>
                                        ${offer.price.toLocaleString('es-AR')}
                                    </span>
                                </div>
                                
                                <button 
                                    onClick={() => selectedShop.phone && window.open(`https://wa.me/549${selectedShop.phone.replace(/\D/g, '')}?text=Hola!%20Quiero%20pedir%20la%20oferta:%20*${offer.name}*%20por%20$${offer.price}%20desde%20el%20Catálogo%20ShopDigital.`, '_blank')} 
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                        isDayMode
                                            ? 'bg-gradient-to-b from-[#b58866] to-[#9c7151] text-white border border-[#855b3c] border-b-[4px] border-b-[#734b2f] active:translate-y-[2px] active:border-b-[1px] shadow-sm'
                                            : 'glass-action-btn bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:scale-90 active:bg-cyan-500 active:text-black'
                                    }`}
                                >
                                    <ShoppingBag size={13} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="w-full flex justify-center mt-10 opacity-30">
                <span className={`text-[7px] tracking-[0.5em] font-black uppercase ${
                    isDayMode ? 'text-[#2d1e15]' : 'text-white'
                }`}>POWERED BY SHOPDIGITAL</span>
            </div>
        </div>
    );
};

export default ShopMenuPage;
