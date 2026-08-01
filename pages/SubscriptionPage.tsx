import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { guardarComercio } from '../firebase';
import { useTownLocalities } from '../hooks/useTownLocalities';
import { Shop } from '../types';
import { CATEGORIES } from '../constants';
import { processImageToDataUrl } from '../utils/imageProcessor';
import {
    ChevronLeft,
    Rocket,
    Camera,
    MapPin,
    Phone,
    User,
    Store,
    Tag,
    PartyPopper,
    ImagePlus,
    Share2,
    Mail,
    CheckCircle2
} from 'lucide-react';
import { playNeonClick, playSuccessSound } from '../utils/audio';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

const SubscriptionPage: React.FC = () => {
    const { townId = 'esteban-echeverria' } = useParams<{ townId: string }>();
    const navigate = useNavigate();
    const { localities } = useTownLocalities(townId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: CATEGORIES[0].id,
        zone: '',
        address: '',
        bannerImage: '',
        ownerName: '',
        phone: '',
        gmail: ''
    });

    // Setear la primera localidad como default una vez que carguen
    useEffect(() => {
        if (localities.length > 0 && !formData.zone) {
            setFormData(prev => ({ ...prev, zone: localities[0] }));
        }
    }, [localities]);

    const generateSlug = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            // Pipeline WebP: max 800px · 80% quality · fondo blanco para PNG
            const dataUrl = await processImageToDataUrl(file, 'banner');
            setFormData({ ...formData, bannerImage: dataUrl });
        } catch (err) {
            console.warn('[SubscriptionPage] Compresión fallida, cargando imagen original.', err);
            const reader = new FileReader();
            reader.onload = (ev) => setFormData({ ...formData, bannerImage: ev.target?.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playNeonClick();
        
        if (!formData.name || !formData.ownerName || !formData.phone || !formData.gmail) {
            alert("Por favor completá todos los datos mínimos para crear tu catálogo.");
            return;
        }

        if (!formData.gmail.trim().toLowerCase().endsWith('@gmail.com')) {
            alert("⚠️ El correo electrónico debe ser una cuenta de Gmail válida (@gmail.com) para poder acceder a las credenciales y al panel de autogestión.");
            return;
        }

        setIsSubmitting(true);

        const newShop: Shop = {
            id: `shop-${Date.now()}`,
            slug: generateSlug(formData.name),
            townId,
            name: formData.name,
            category: formData.category,
            zone: formData.zone,
            bannerImage: formData.bannerImage,
            image: formData.bannerImage,
            ownerName: formData.ownerName,
            phone: formData.phone,
            gmail: formData.gmail.trim().toLowerCase(),
            rating: 5.0,
            isActive: false,
            specialty: '',
            address: formData.address || formData.zone,
            offers: [],
            mapUrl: '',
            mapSheetUrl: '',
            instagram: '',
            facebook: '',
            tiktok: ''
        };

        try {
            await guardarComercio(newShop, townId);
            playSuccessSound();
            setShowSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Hubo un error al crear tu comercio. Por favor intentá nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShare = async () => {
        playNeonClick();
        const url = `${window.location.origin}/${townId}/subscripcion`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Sumá tu comercio a ShopDigital ${townId.replace(/-/g, ' ')}`,
                    text: '¡Subite a la red comercial inteligente y ganá visibilidad!',
                    url: url
                });
            } else {
                await navigator.clipboard.writeText(url);
                alert('¡Link de suscripción copiado al portapapeles!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500 relative bg-transparent text-[#2c2440]">
                <CyberCircuitBackground />

                {/* Mascot Avatar Section */}
                <div className="flex justify-center mb-4 pointer-events-none z-10">
                    <img 
                        src="/ari-avatar.png" 
                        alt="ARI Asistente Éxito" 
                        className="h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(44,36,64,0.15)] animate-in fade-in duration-700" 
                    />
                </div>

                <div className="neu-plate w-full max-w-[365px] p-8 text-center flex flex-col items-center relative z-10 space-y-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center neu-btn-3d animate-bounce">
                        <PartyPopper size={34} className="text-[#ff6b6b]" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-xl font-[1000] uppercase tracking-wider text-[#2c2440]">
                            ¡Felicitaciones!
                        </h2>
                        
                        <p className="text-[9px] font-bold uppercase leading-relaxed text-[#4a3d6a]/80">
                            Pronto un embajador de zona lo estará visitando para completar su catálogo y traerle noticias exclusivas.
                            <br/><br/>
                            Ya puede disfrutar de nuestros servicios y compartir su catálogo para promoción en la red.
                        </p>
                    </div>
                    
                    <button
                        onClick={() => {
                            playNeonClick();
                            navigate(`/${townId}/home`);
                        }}
                        className="neu-btn-3d-active w-full py-4 rounded-2xl flex items-center justify-center transition-transform active:scale-95"
                    >
                        <span className="font-[1000] uppercase tracking-widest text-[11px] text-[#2c2440]">Entrar a la App</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 relative overflow-x-hidden bg-transparent text-[#2c2440] selection:bg-[#ff6b6b]/30">
            {/* Fondo Ciber-Digital Animado */}
            <CyberCircuitBackground />

            {/* HEADER STICKY NEUMÓRFICO */}
            <div className="pt-6 pb-4 px-6 flex flex-col items-center sticky top-0 z-50 backdrop-blur-md bg-[#faf7f2]/70 border-b border-[#b4a594]/30 shadow-sm">
                <div className="w-full max-w-[365px] flex items-center justify-between mb-2">
                    <button 
                        onClick={() => { playNeonClick(); navigate(-1); }} 
                        className="neu-btn-3d w-10 h-10 rounded-2xl flex items-center justify-center transition-transform active:scale-90"
                    >
                        <ChevronLeft size={20} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <Rocket size={20} className="text-[#ff6b6b]" />
                        <div>
                            <h1 className="text-[13px] font-[1000] uppercase tracking-widest leading-none text-center text-[#2c2440]">
                                Inscripción de Comercio
                            </h1>
                            <span className="text-[8px] font-black uppercase tracking-widest block text-center mt-1 text-[#4a3d6a]/70">
                                {townId.replace(/-/g, ' ')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-10" />
                </div>
                
                <p className="text-[8px] font-bold uppercase tracking-widest text-center mt-1 px-4 leading-relaxed text-[#4a3d6a]/70">
                    Completá los datos para registrar tu negocio. <br/>
                    📢 <span className="text-[#ff6b6b] font-black">Este formulario es público:</span> compartilo con otros comerciantes.
                </p>
            </div>

            {/* Mascot Avatar Section */}
            <div className="flex justify-center mb-2 mt-4 pointer-events-none relative z-10">
                <img 
                    src="/ari-fullbody.png" 
                    alt="ARI Asistente VIP" 
                    className="h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(44,36,64,0.15)] animate-in fade-in zoom-in-75 duration-700" 
                />
            </div>

            <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-5 max-w-[365px] mx-auto relative z-10 animate-in slide-in-from-bottom-6 duration-700">
                {/* Nombre Comercio */}
                <div className="neu-plate p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[9.5px] flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[#2c2440]">
                            <Store size={14} className="text-[#ff6b6b]" /> Marca Comercial
                        </label>
                        <span className="text-[8px] text-red-500 font-bold uppercase">* Requerido</span>
                    </div>
                    <input
                        required
                        placeholder="Ej: Pizzería El Buen Gusto"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440] placeholder-[#2c2440]/40"
                    />
                </div>

                {/* Rubro y Localidad */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="neu-plate p-4">
                        <label className="text-[9px] flex items-center gap-1.5 font-black uppercase tracking-[0.2em] mb-2 text-[#2c2440]">
                            <Tag size={12} className="text-[#ff6b6b]" /> Rubro
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="neu-inset-title w-full p-3 text-xs font-black rounded-xl focus:outline-none text-[#2c2440]"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="neu-plate p-4">
                        <label className="text-[9px] flex items-center gap-1.5 font-black uppercase tracking-[0.2em] mb-2 text-[#2c2440]">
                            <MapPin size={12} className="text-[#ff6b6b]" /> Localidad
                        </label>
                        <select
                            value={formData.zone}
                            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                            className="neu-inset-title w-full p-3 text-xs font-black rounded-xl focus:outline-none text-[#2c2440]"
                        >
                            {localities.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dirección del Local */}
                <div className="neu-plate p-5 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[9.5px] flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[#2c2440]">
                            <MapPin size={14} className="text-[#ff6b6b]" /> Dirección del Local
                        </label>
                        <span className="text-[8px] text-red-500 font-bold uppercase">* Requerido</span>
                    </div>
                    <input
                        required
                        placeholder={`Ej: Av. Principal 123, ${formData.zone || (localities[0] || 'tu localidad')}`}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440] placeholder-[#2c2440]/40"
                    />
                </div>

                {/* Foto / Logo (Opcional) */}
                <div className="neu-plate p-5 space-y-3">
                    <label className="text-[9.5px] flex items-center gap-2 font-black uppercase tracking-[0.2em] text-[#2c2440]">
                        <Camera size={14} className="text-[#ff6b6b]" /> Logo / Foto (Opcional)
                    </label>
                    
                    <div className="flex flex-col gap-3">
                        <input
                            id="image-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <input
                            id="image-camera-upload"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => document.getElementById('image-file-upload')?.click()}
                                className="neu-btn-3d p-4 flex flex-col items-center justify-center rounded-2xl active:scale-95"
                            >
                                <ImagePlus size={22} className="text-[#ff6b6b] mb-1.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#2c2440]">Subir Archivo</span>
                                <span className="text-[7px] uppercase tracking-widest text-[#4a3d6a]/60 mt-0.5">Galería</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => document.getElementById('image-camera-upload')?.click()}
                                className="neu-btn-3d p-4 flex flex-col items-center justify-center rounded-2xl active:scale-95"
                            >
                                <Camera size={22} className="text-[#ff6b6b] mb-1.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#2c2440]">Tomar Foto</span>
                                <span className="text-[7px] uppercase tracking-widest text-[#4a3d6a]/60 mt-0.5">Cámara</span>
                            </button>
                        </div>

                        {formData.bannerImage && (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[#b4a594]/30 shadow-md">
                                <img src={formData.bannerImage} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 px-3">
                                    <span className="text-[8px] font-black text-green-400 uppercase tracking-widest drop-shadow-md">✓ Imagen lista</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Datos del Titular */}
                <div className="neu-plate p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-[#ff6b6b]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2c2440]">Titular de Contacto</h3>
                    </div>
                    
                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-[0.1em] mb-1.5 block text-[#4a3d6a]">
                            Nombre Completo
                        </label>
                        <input
                            required
                            placeholder="Ej: Juan Pérez"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440] placeholder-[#2c2440]/40"
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-bold uppercase tracking-[0.1em] mb-1.5 block text-[#4a3d6a]">
                            Gmail de Acceso (Obligatorio)
                        </label>
                        <input
                            required
                            type="email"
                            placeholder="Ej: juan.perez@gmail.com"
                            value={formData.gmail}
                            onChange={(e) => setFormData({ ...formData, gmail: e.target.value })}
                            className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440] placeholder-[#2c2440]/40"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[9px] font-bold uppercase tracking-[0.1em] block text-[#4a3d6a]">
                                Celular / WhatsApp
                            </label>
                            <Phone size={10} className="text-green-500" />
                        </div>
                        <input
                            required
                            type="tel"
                            placeholder="Ej: 1122334455"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440] placeholder-[#2c2440]/40"
                        />
                    </div>
                </div>

                {/* Botón de Envió & Compartir */}
                <div className="pt-2 space-y-4">
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="neu-btn-3d-active w-full py-4 rounded-[1.75rem] flex items-center justify-center gap-2.5 font-[1000] uppercase tracking-[0.2em] text-[11px] text-[#2c2440] transition-transform active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-[#2c2440]/30 border-t-[#2c2440] rounded-full animate-spin" />
                        ) : (
                            <>
                                <Store size={18} className="text-[#ff6b6b]" />
                                <span>Ingresar mi negocio</span>
                            </>
                        )}
                    </button>
                    
                    {/* Tarjeta Viral para Compartir */}
                    <div className="neu-inset-title p-4 text-center space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ff6b6b]">
                            📢 ¿Conocés a otros comerciantes o colegas?
                        </p>
                        <p className="text-[8px] uppercase tracking-wider text-[#4a3d6a]/80 leading-normal px-2">
                            Ayudalos a digitalizar su negocio. Copiá y enviales el link de este formulario para que puedan auto-inscribirse.
                        </p>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="neu-btn-3d w-full py-3.5 mt-1 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9.5px] text-[#2c2440] active:scale-95"
                        >
                            <Share2 size={14} className="text-[#ff6b6b]" />
                            Compartir con mis colegas
                        </button>
                    </div>

                    <p className="text-[7.5px] text-center uppercase tracking-[0.3em] font-bold text-[#4a3d6a]/60 pt-2">
                        Al enviar, aceptás los términos y condiciones de la red ShopDigital.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default SubscriptionPage;
