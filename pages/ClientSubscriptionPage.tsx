import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop, Client } from '../types';
import { guardarCliente, verificarClienteExistente, activarClienteYIncrementarSuscriptores } from '../firebase';
import { useTownCategories } from '../hooks/useTownCategories';
import {
    ChevronLeft,
    Gift,
    Phone,
    User,
    UserCircle,
    Mail,
    ShieldCheck,
    Store,
    CheckCircle2,
    MessageSquare,
    Ticket,
    FileText,
    ArrowRight,
    Lock,
    Unlock,
    AlertTriangle,
    Sparkles
} from 'lucide-react';
import { playNeonClick, playSuccessSound } from '../utils/audio';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

interface ClientSubscriptionPageProps {
    allShops: Shop[];
}

const ClientSubscriptionPage: React.FC<ClientSubscriptionPageProps> = ({ allShops }) => {
    const { townId = 'esteban-echeverria', categorySlug, shopSlug } = useParams<{ townId: string; categorySlug: string; shopSlug: string }>();
    const navigate = useNavigate();
    const categories = useTownCategories(townId);
    
    // States
    const [step, setStep] = useState<'form' | 'verify' | 'welcome'>('form');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duplicateError, setDuplicateError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });

    // Verification States
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [enteredOtp, setEnteredOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [newClientId, setNewClientId] = useState('');

    const selectedShop = useMemo(() =>
        allShops.find(shop => (shop.slug || shop.id) === shopSlug),
        [shopSlug, allShops]);

    const activeCatSlug = useMemo(() => {
        if (categorySlug) return categorySlug;
        if (selectedShop) {
            return categories.find(c => c.id === selectedShop.category)?.slug || 'comercio';
        }
        return 'comercio';
    }, [categorySlug, selectedShop, categories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playNeonClick();
        setDuplicateError('');
        
        const cleanPhone = formData.phone.replace(/\D/g, '');

        if (!formData.name || !cleanPhone || !formData.email) {
            alert("Por favor completá todos los campos para suscribirte.");
            return;
        }

        if (!selectedShop) {
            alert("Error: Comercio de origen no encontrado.");
            return;
        }

        setIsSubmitting(true);

        try {
            // FASE 1: Filtro de Unicidad Anti-Fraude
            const isDuplicate = await verificarClienteExistente(formData.email, cleanPhone, townId);
            if (isDuplicate) {
                setDuplicateError("Este correo o WhatsApp ya está registrado para una credencial VIP en esta zona.");
                setIsSubmitting(false);
                return;
            }

            // Generar código OTP de 6 dígitos
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otpCode);

            // Registrar cliente en estado 'pending'
            const clientId = `client-${cleanPhone || Date.now()}`;
            const newClient: Client = {
                id: clientId,
                name: formData.name.toUpperCase().trim(),
                phone: cleanPhone,
                email: formData.email.trim().toLowerCase(),
                sourceShopId: selectedShop.id,
                sourceShopName: selectedShop.name,
                createdAt: new Date().toISOString(),
                townId,
                status: 'pending',
                cardColor: '#00f5ff',
                verificationCode: otpCode,
                verificationExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                eventPassEnabled: true
            };

            await guardarCliente(newClient, townId);
            setNewClientId(clientId);
            setStep('verify');
            playSuccessSound();
        } catch (error) {
            console.error("Error al registrar cliente pre-validación:", error);
            alert("Hubo un error al procesar tu registro. Por favor intentá nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        playNeonClick();
        setOtpError('');

        if (enteredOtp.trim() !== generatedOtp) {
            setOtpError("Código incorrecto. Por favor verificá el código e ingresalo de nuevo.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (!selectedShop) return;
            await activarClienteYIncrementarSuscriptores(newClientId, selectedShop.id, townId);
            playSuccessSound();
            setStep('welcome');
        } catch (error) {
            console.error("Error al verificar código OTP:", error);
            setOtpError("Error al validar código. Por favor intentá nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!selectedShop) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 relative z-10 bg-transparent text-[#2c2440]">
                <CyberCircuitBackground />
                <div className="neu-plate p-8 max-w-sm flex flex-col items-center">
                    <ShieldCheck size={48} className="text-[#ff6b6b] mb-4 animate-pulse" />
                    <h2 className="text-lg font-black uppercase tracking-widest mb-2 text-[#2c2440]">Radar Sincronizando...</h2>
                    <p className="text-[10px] font-bold uppercase leading-relaxed text-[#4a3d6a]/70">
                        El comercio de origen no se encuentra en este universo regional.
                    </p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="neu-btn-3d mt-6 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] text-[#2c2440]"
                    >
                        Regresar al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const formattedTown = townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="min-h-screen pb-24 relative overflow-x-hidden bg-transparent text-[#2c2440] selection:bg-[#ff6b6b]/30">
            {/* Fondo Ciber-Digital Animado */}
            <CyberCircuitBackground />

            {/* Header Neumórfico Estilo Crema HD */}
            <div className="pt-6 pb-4 px-6 flex flex-col items-center sticky top-0 z-50 backdrop-blur-md bg-[#faf7f2]/70 border-b border-[#b4a594]/30 shadow-sm">
                <div className="w-full max-w-sm flex items-center justify-between mb-3">
                    <button 
                        onClick={() => { playNeonClick(); navigate(-1); }} 
                        className="neu-btn-3d w-10 h-10 rounded-2xl flex items-center justify-center transition-transform active:scale-90"
                    >
                        <ChevronLeft size={20} className="text-[#ff6b6b]" strokeWidth={2.5} />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <UserCircle size={22} className="text-[#ff6b6b]" />
                        <h2 className="text-[15px] font-[1000] uppercase tracking-[0.2em] text-[#2c2440]">
                            {step === 'form' && "Registro VIP"}
                            {step === 'verify' && "Verificación VIP"}
                            {step === 'welcome' && "¡Bienvenido a bordo!"}
                        </h2>
                    </div>

                    <div className="w-10" />
                </div>
                
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#4a3d6a]/70">
                    {formattedTown}
                </p>
                
                {step !== 'welcome' && (
                    <div className="mt-3 neu-inset-title px-4 py-1.5 rounded-full">
                        <p className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 text-[#2c2440]">
                            <Store size={11} className="text-[#ff6b6b]" /> Invitación de: <strong className="text-[#ff6b6b]">{selectedShop.name}</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* STEP 1: FORMULARIO NEUMÓRFICO DE REGISTRO */}
            {step === 'form' && (
                <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-6 max-w-[365px] mx-auto relative z-10 animate-in slide-in-from-bottom-6 duration-700">
                    
                    {/* Mascot Avatar Section */}
                    <div className="flex justify-center mb-2 pointer-events-none">
                        <img 
                            src="/ari-fullbody.png" 
                            alt="ARI Asistente VIP" 
                            className="h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(44,36,64,0.15)] animate-in fade-in zoom-in-75 duration-700" 
                        />
                    </div>

                    <div className="neu-plate p-6 space-y-6 flex flex-col">
                        <div className="text-center">
                            <h3 className="text-[13px] font-[1000] uppercase tracking-wider text-[#2c2440]">Completá tus datos</h3>
                            <p className="text-[8.5px] font-bold text-[#4a3d6a]/70 uppercase tracking-widest mt-1">
                                Obtené tu credencial VIP para acceder a beneficios exclusivos
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Campo Nombre */}
                            <div className="group">
                                <label className="text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 text-[#2c2440]">
                                    <User size={12} className="text-[#ff6b6b]" /> Nombre y Apellido
                                </label>
                                <input
                                    required
                                    placeholder="EJ: WALY MIRANDA"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl uppercase focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 transition-all text-[#2c2440] placeholder-[#2c2440]/40"
                                />
                            </div>

                            {/* Campo WhatsApp */}
                            <div className="group">
                                <label className="text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 text-[#2c2440]">
                                    <Phone size={12} className="text-[#ff6b6b]" /> WhatsApp (Sin Ceros)
                                </label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="EJ: 1122334455"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="neu-inset-title w-full p-4 text-xs font-black rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 transition-all text-[#2c2440] placeholder-[#2c2440]/40"
                                />
                            </div>

                            {/* Campo Correo */}
                            <div className="group">
                                <label className="text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 text-[#2c2440]">
                                    <Mail size={12} className="text-[#ff6b6b]" /> Correo Electrónico
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="EJ: WALY@SHOPDIGITAL.AR"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="neu-inset-title w-full p-4 text-xs font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 transition-all text-[#2c2440] placeholder-[#2c2440]/40"
                                />
                            </div>
                        </div>

                        {duplicateError && (
                            <div className="neu-inset-title p-3.5 flex items-start gap-3 border border-red-400/40">
                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-[8.5px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                                    {duplicateError}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 space-y-4">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="neu-btn-3d-active w-full py-4 rounded-[1.75rem] flex flex-col items-center justify-center gap-1.5 font-[1000] uppercase tracking-[0.2em] text-[11px] text-[#2c2440] transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-[#2c2440]/30 border-t-[#2c2440] rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Gift size={20} className="text-[#ff6b6b] animate-bounce" />
                                    <span>Activar Mi Credencial VIP</span>
                                </>
                            )}
                        </button>
                        
                        <div className="neu-inset-title p-4 text-center">
                            <p className="text-[7.5px] uppercase tracking-[0.3em] font-black leading-relaxed text-[#4a3d6a]/70">
                                Al registrarte aceptás los términos y condiciones <br/> de la red de beneficios exclusivos ShopDigital.
                            </p>
                        </div>
                    </div>
                </form>
            )}

            {/* STEP 2: VERIFICACIÓN OTP NEUMÓRFICA */}
            {step === 'verify' && (
                <div className="px-4 pt-6 space-y-6 max-w-[365px] mx-auto relative z-10 animate-in zoom-in duration-500">
                    
                    {/* Mascot Avatar Section */}
                    <div className="flex justify-center mb-1 pointer-events-none">
                        <img 
                            src="/ari-pointing.png" 
                            alt="ARI Asistente OTP" 
                            className="h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(44,36,64,0.15)] animate-in fade-in duration-700" 
                        />
                    </div>

                    {/* OTP Simulator Box */}
                    <div className="neu-inset-title p-4 flex flex-col items-center text-center">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] mb-1 text-[#ff6b6b]">📟 Simulador OTP (B2C Handshake)</span>
                        <div className="neu-plate text-[14px] font-mono font-black tracking-[0.1em] px-5 py-2 select-all my-1 text-[#2c2440]">
                            CÓDIGO: <span className="text-[#ff6b6b]">{generatedOtp}</span>
                        </div>
                        <span className="text-[7.5px] font-bold uppercase tracking-widest mt-1 text-[#4a3d6a]/70">
                            Simula el código enviado a tu Gmail/WhatsApp.
                        </span>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="neu-plate p-6 space-y-5 flex flex-col text-center">
                            <Lock className="text-[#ff6b6b] mx-auto animate-pulse" size={28} />
                            <div>
                                <h3 className="text-xs font-[1000] uppercase tracking-[0.2em] text-[#2c2440]">Ingresá tu Código VIP</h3>
                                <p className="text-[9px] font-bold uppercase tracking-wider leading-relaxed text-[#4a3d6a]/70 mt-1">
                                    Hemos enviado una clave secreta a tu WhatsApp y correo electrónico.
                                </p>
                            </div>

                            <div className="group">
                                <input
                                    required
                                    maxLength={6}
                                    placeholder="0 0 0 0 0 0"
                                    value={enteredOtp}
                                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                                    className="neu-inset-title w-full p-4 text-center font-mono text-xl font-black tracking-[0.3em] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]/40 text-[#2c2440]"
                                />
                            </div>

                            {otpError && (
                                <div className="neu-inset-title p-3.5 flex items-start gap-3 border border-red-400/40">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[8.5px] font-black text-red-500 uppercase tracking-widest leading-relaxed">
                                        {otpError}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-2">
                            <button 
                                type="submit"
                                disabled={isSubmitting || enteredOtp.length !== 6}
                                className="neu-btn-3d-active w-full py-4 rounded-[1.75rem] flex flex-col items-center justify-center gap-1.5 font-[1000] uppercase tracking-[0.2em] text-[11px] text-[#2c2440] transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-3 border-[#2c2440]/30 border-t-[#2c2440] rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Unlock size={18} className="text-[#ff6b6b]" />
                                        <span>Verificar Identidad</span>
                                    </>
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={() => { playNeonClick(); setStep('form'); }}
                                className="neu-btn-3d w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#2c2440]"
                            >
                                Volver al Formulario
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 3: WELCOME KIT NEUMÓRFICO */}
            {step === 'welcome' && (
                <div className="px-4 pt-6 space-y-6 max-w-[365px] mx-auto relative z-10 animate-in zoom-in duration-700">
                    
                    {/* Mascot Avatar Section */}
                    <div className="flex justify-center mb-1 pointer-events-none">
                        <img 
                            src="/ari-avatar.png" 
                            alt="ARI Asistente Bienvenido" 
                            className="h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(44,36,64,0.15)] animate-in fade-in duration-700" 
                        />
                    </div>

                    <div className="neu-plate p-6 text-center space-y-5 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center neu-btn-3d animate-bounce">
                            <CheckCircle2 size={30} className="text-[#6BCB77]" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] block text-[#ff6b6b]">
                                Socio VIP Validado
                            </span>
                            <h3 className="text-lg font-[1000] uppercase tracking-tight leading-tight text-[#2c2440]">
                                ¡Bienvenido a bordo, <br/> {formData.name.split(' ')[0]}!
                            </h3>
                            <p className="text-[8.5px] font-bold uppercase tracking-wider leading-relaxed text-[#4a3d6a]/70">
                                Tu identidad digital ha sido sincronizada con el comercio. Disponés de tu credencial VIP y acceso a toda la red.
                            </p>
                        </div>

                        {/* Guía Rápida Neumórfica */}
                        <div className="neu-inset-title w-full p-4 text-left space-y-3">
                            <h4 className="text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-[#b4a594]/20 pb-2 text-[#2c2440]">
                                <FileText size={11} className="text-[#ff6b6b]" /> Guía rápida de uso
                            </h4>
                            <ul className="space-y-2 text-[8px] font-bold uppercase tracking-wide text-[#4a3d6a]">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#ff6b6b] font-black">1.</span>
                                    <span>Presentá tu código QR VIP en caja al comprar.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#ff6b6b] font-black">2.</span>
                                    <span>Ganá créditos con cada compra para canjear en la red.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#ff6b6b] font-black">3.</span>
                                    <span>Accedé a eventos y recitales exclusivos en vivo.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Botones de Acción Neumórficos */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`/${townId}/${activeCatSlug}/${shopSlug}/credencial-vip/${newClientId}`);
                            }}
                            className="neu-btn-3d-active w-full py-4 px-6 rounded-2xl flex items-center justify-between font-black uppercase tracking-[0.15em] text-[10px] text-[#2c2440] transition-transform active:scale-95 group"
                        >
                            <div className="flex items-center gap-3">
                                <UserCircle size={22} className="text-[#ff6b6b]" />
                                <div className="text-left">
                                    <span className="block text-[11px] font-[1000]">Ver Mi Credencial VIP</span>
                                    <span className="block text-[7.5px] tracking-widest font-bold text-[#4a3d6a]/70 mt-0.5">Identidad Digital</span>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-[#ff6b6b] group-hover:translate-x-1.5 transition-transform" />
                        </button>

                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`/${townId}/red-comercial/ofertas`);
                            }}
                            className="neu-btn-3d w-full py-4 px-6 rounded-2xl flex items-center justify-between font-black uppercase tracking-[0.15em] text-[9px] text-[#2c2440] transition-transform active:scale-95 group"
                        >
                            <div className="flex items-center gap-3">
                                <Ticket size={20} className="text-[#6BCB77]" />
                                <div className="text-left">
                                    <span className="block">Explorar Descuentos VIP</span>
                                    <span className="block text-[7px] tracking-widest font-black text-[#4a3d6a]/70 mt-0.5">Ofertas B2C</span>
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-[#2c2440]/60 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <a
                            href="https://chat.whatsapp.com/G5iM46NnleN5d5Jk55D07G"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={playNeonClick}
                            className="neu-btn-3d w-full py-4 px-6 rounded-2xl flex items-center justify-between font-black uppercase tracking-[0.15em] text-[9px] text-[#25D366] transition-transform active:scale-95 group"
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare size={20} className="text-[#25D366]" fill="currentColor" strokeWidth={0} />
                                <div className="text-left">
                                    <span className="block text-[#2c2440]">Comunidad VIP WhatsApp</span>
                                    <span className="block text-[7px] tracking-widest font-black text-[#25D366] mt-0.5">Canal de Clientes felices</span>
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-[#25D366] group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSubscriptionPage;
