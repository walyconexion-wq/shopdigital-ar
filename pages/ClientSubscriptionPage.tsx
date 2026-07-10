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
    AlertTriangle
} from 'lucide-react';
import { playNeonClick, playSuccessSound } from '../utils/audio';

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

    // Theme Mode Resolver (sincronizado con GlobalHomePage)
    const [currentTime] = useState(new Date());
    const themeMode = localStorage.getItem('global_home_theme_mode') || 'dark';
    const isDayMode = themeMode === 'light' || (themeMode === 'auto' && (() => {
        const hour = currentTime.getHours();
        return hour >= 8 && hour < 20;
    })());

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
            <div className={`flex flex-col items-center justify-center min-h-screen text-center p-8 ${isDayMode ? 'bg-[#cda488] text-[#2d1e15]' : 'bg-black text-white'}`}>
                <ShieldCheck size={48} className={`${isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'} mb-6 animate-pulse opacity-40`} />
                <h2 className="text-xl font-black uppercase tracking-widest mb-2">Radar Sincronizando...</h2>
                <p className={`text-[10px] uppercase leading-relaxed ${isDayMode ? 'text-[#2d1e15]/60' : 'text-white/40'}`}>El comercio de origen no se encuentra <br/> en este universo regional.</p>
                <button 
                    onClick={() => navigate('/')} 
                    className={`mt-8 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border ${
                        isDayMode 
                            ? 'bg-white text-[#2d1e15] border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] hover:bg-white/90 active:translate-y-[2px] active:border-b-[1px]' 
                            : 'bg-zinc-900 text-cyan-400 border-white/10 hover:bg-white/5 active:scale-95'
                    }`}
                >
                    Regresar al Inicio
                </button>
            </div>
        );
    }

    const formattedTown = townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className={`min-h-screen pb-24 relative overflow-x-hidden selection:bg-cyan-500/30 transition-colors duration-500 ${
            isDayMode ? 'bg-[#cda488] text-[#2d1e15]' : 'bg-gradient-to-b from-slate-900 via-[#0a1e2d] to-slate-950 text-white'
        }`}>
            <style>{`
                input, select, textarea, option {
                    color: ${isDayMode ? '#2d1e15' : '#ffffff'} !important;
                    background-color: ${isDayMode ? '#faf8f5' : '#0b1329'} !important;
                }
                input::placeholder, textarea::placeholder {
                    color: ${isDayMode ? 'rgba(45, 30, 21, 0.4)' : 'rgba(255, 255, 255, 0.4)'} !important;
                }
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 30px ${isDayMode ? '#faf8f5' : '#0b1329'} inset !important;
                    -webkit-text-fill-color: ${isDayMode ? '#2d1e15' : '#ffffff'} !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
            
            {/* Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse ${
                    isDayMode ? 'bg-amber-500/10' : 'bg-cyan-500/5'
                }`} />
                {!isDayMode && (
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
                )}
            </div>

            {/* Header */}
            <div className={`backdrop-blur-md pt-8 pb-6 px-8 flex flex-col items-center border-b mb-4 sticky top-0 z-50 transition-all duration-300 ${
                isDayMode 
                    ? 'bg-[#cbd5e1]/45 border-white/20 shadow-[0_10px_25px_rgba(88,70,50,0.08)]' 
                    : 'bg-zinc-900/50 border-cyan-500/20 shadow-[0_4px_20px_rgba(0,251,255,0.05)]'
            }`}>
                <button 
                    onClick={() => { playNeonClick(); navigate(-1); }} 
                    className={`self-start mb-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all border shadow-lg ${
                        isDayMode 
                            ? 'bg-white/90 border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] text-[#2d1e15] hover:bg-white active:translate-y-[2px] active:border-b-[1px]' 
                            : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 active:scale-95'
                    }`}
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2 mb-1">
                    <UserCircle size={22} className={isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'} />
                    <h2 className={`text-[18px] font-[1000] uppercase tracking-[0.2em] ${
                        isDayMode 
                            ? 'text-[#2d1e15] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]' 
                            : 'text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                    }`}>
                        {step === 'form' && "Registro VIP"}
                        {step === 'verify' && "Verificación VIP"}
                        {step === 'welcome' && "¡Bienvenido a bordo!"}
                    </h2>
                </div>
                
                <p className={`text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic ${
                    isDayMode ? 'text-[#5c4033]/70' : 'text-white/30'
                }`}>{formattedTown}</p>
                
                {step !== 'welcome' && (
                    <div className={`mt-4 px-5 py-2 rounded-2xl border shadow-inner ${
                        isDayMode 
                            ? 'bg-white/95 border-[#a88d75]/30' 
                            : 'bg-cyan-500/10 border-cyan-500/20'
                    }`}>
                        <p className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${
                            isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'
                        }`}>
                            <Store size={10} /> Invitación de: {selectedShop.name}
                        </p>
                    </div>
                )}
            </div>

            {/* STEP 1: FORM VIEW */}
            {step === 'form' && (
                <form onSubmit={handleSubmit} className="px-8 space-y-6 max-w-sm mx-auto relative z-10 animate-in slide-in-from-bottom-6 duration-700">
                    
                    {/* Brand Avatar Section */}
                    {isDayMode && (
                        <div className="flex justify-center mb-2 model-floating select-none pointer-events-none">
                            <img 
                                src="/ari-fullbody.png" 
                                alt="ARI Asistente VIP" 
                                className="h-32 w-auto object-contain drop-shadow-[0_10px_15px_rgba(88,70,50,0.15)] animate-in fade-in zoom-in-75 duration-700" 
                            />
                        </div>
                    )}

                    <div className={`rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden border ${
                        isDayMode 
                            ? 'home-glass-plate border-white/40' 
                            : 'glass-card-3d bg-white/[0.02] border-white/10'
                    }`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${
                            isDayMode ? 'bg-[#cda488]/10' : 'bg-cyan-500/5'
                        }`} />
                        
                        <div className="space-y-6">
                            <div className="group">
                                <label className={`text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 transition-colors ${
                                    isDayMode 
                                        ? 'text-[#000000]/70 group-focus-within:text-[#000000]' 
                                        : 'text-white/30 group-focus-within:text-cyan-400'
                                    }`}>
                                    <User size={12} /> Nombre y Apellido
                                </label>
                                <input
                                    required
                                    placeholder="EJ: WALY MIRANDA"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                    className={`w-full border p-4 text-sm font-black rounded-2xl transition-all uppercase focus:outline-none ${
                                        isDayMode 
                                            ? 'bg-white/45 text-black border-white/45 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] focus:bg-white/60 focus:border-[#5c4033]/40' 
                                            : 'bg-[#0b1329] text-white border-white/10 border-b-[4px] border-b-white/20 focus:border-cyan-400/50 focus:border-b-cyan-400/50'
                                    }`}
                                    style={isDayMode ? { color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.45)' } : { color: '#ffffff', backgroundColor: '#0b1329' }}
                                />
                            </div>

                            <div className="group">
                                <label className={`text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 transition-colors ${
                                    isDayMode 
                                        ? 'text-[#000000]/70 group-focus-within:text-[#000000]' 
                                        : 'text-white/30 group-focus-within:text-cyan-400'
                                    }`}>
                                    <Phone size={12} /> WhatsApp (Sin Ceros)
                                </label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="EJ: 1122334455"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`w-full border p-4 text-sm font-black rounded-2xl transition-all focus:outline-none ${
                                        isDayMode 
                                            ? 'bg-white/45 text-black border-white/45 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] focus:bg-white/60 focus:border-[#5c4033]/40' 
                                            : 'bg-[#0b1329] text-white border-white/10 border-b-[4px] border-b-white/20 focus:border-cyan-400/50 focus:border-b-cyan-400/50'
                                    }`}
                                    style={isDayMode ? { color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.45)' } : { color: '#ffffff', backgroundColor: '#0b1329' }}
                                />
                            </div>

                            <div className="group">
                                <label className={`text-[9px] flex items-center gap-2 font-black uppercase tracking-[0.25em] mb-2 ml-1 transition-colors ${
                                    isDayMode 
                                        ? 'text-[#000000]/70 group-focus-within:text-[#000000]' 
                                        : 'text-white/30 group-focus-within:text-cyan-400'
                                    }`}>
                                    <Mail size={12} /> Correo Electrónico
                                </label>
                                <input
                                    required
                                    type="email"
                                    placeholder="EJ: WALY@SHOPDIGITAL.AR"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full border p-4 text-sm font-bold rounded-2xl transition-all focus:outline-none ${
                                        isDayMode 
                                            ? 'bg-white/45 text-black border-white/45 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7)] focus:bg-white/60 focus:border-[#5c4033]/40' 
                                            : 'bg-[#0b1329] text-white border-white/10 border-b-[4px] border-b-white/20 focus:border-cyan-400/50 focus:border-b-cyan-400/50'
                                    }`}
                                    style={isDayMode ? { color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.45)' } : { color: '#ffffff', backgroundColor: '#0b1329' }}
                                />
                            </div>
                        </div>

                        {duplicateError && (
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-relaxed">
                                    {duplicateError}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 font-[1000] uppercase tracking-[0.2em] text-[11px] border cursor-pointer transition-all ${
                                isDayMode 
                                    ? 'home-btn-3d text-white font-extrabold border-[#855b3c]' 
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white border-white/20 border-b-[6px] border-b-cyan-800 shadow-[0_10px_40px_rgba(34,211,238,0.2)] active:translate-y-[4px] active:border-b-[2px]'
                            } disabled:opacity-50`}
                            style={isDayMode ? { backgroundColor: '#a5734e', borderBottomWidth: '6px', borderBottomColor: '#734b2f', textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {}}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Gift size={20} className="text-white animate-bounce" />
                                    <span>Activar Mi Credencial VIP</span>
                                </>
                            )}
                        </button>
                        
                        <div className={`mt-8 p-4 rounded-2xl border text-center ${
                            isDayMode 
                                ? 'home-glass-plate border-white/35 shadow-sm' 
                                : 'bg-white/[0.03] border-white/5'
                        }`}>
                            <p className={`text-[7px] uppercase tracking-[0.4em] font-black leading-relaxed ${
                                isDayMode ? 'text-[#2d1e15]/40' : 'text-white/20'
                            }`}>
                                Al registrarte aceptás los términos y condiciones <br/> de la red de beneficios exclusivos ShopDigital.
                            </p>
                        </div>
                    </div>
                </form>
            )}

            {/* STEP 2: VERIFICATION OTP HANDSHAKE */}
            {step === 'verify' && (
                <div className="px-8 space-y-6 max-w-sm mx-auto relative z-10 animate-in zoom-in duration-500">
                    
                    {/* Brand Avatar Section */}
                    {isDayMode && (
                        <div className="flex justify-center mb-1 model-floating select-none pointer-events-none">
                            <img 
                                src="/ari-pointing.png" 
                                alt="ARI Asistente OTP" 
                                className="h-32 w-auto object-contain drop-shadow-[0_10px_15px_rgba(88,70,50,0.15)] animate-in fade-in duration-700" 
                            />
                        </div>
                    )}

                    {/* OTP Simulator HUD Alert */}
                    <div className={`border p-4 rounded-3xl flex flex-col items-center text-center shadow-lg ${
                        isDayMode 
                            ? 'bg-white border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1]' 
                            : 'bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                    }`}>
                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${
                            isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'
                        }`}>📟 Simulador OTP (B2C Handshake)</span>
                        <div className={`text-[14px] font-mono font-black tracking-[0.1em] px-4 py-1.5 rounded-xl border select-all ${
                            isDayMode 
                                ? 'bg-[#faf8f5] text-[#2d1e15] border-[#cbd5e1]' 
                                : 'bg-black/60 text-white border-white/10'
                        }`}>
                            CÓDIGO: <span className={isDayMode ? 'text-[#855b3c]' : 'text-cyan-300'}>{generatedOtp}</span>
                        </div>
                        <span className={`text-[7px] uppercase tracking-widest mt-2 ${
                            isDayMode ? 'text-[#2d1e15]/50' : 'text-white/40'
                        }`}>Simula el código enviado a tu Gmail/WhatsApp.</span>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className={`rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden border ${
                            isDayMode 
                                ? 'bg-white/85 border-[#cbd5e1] border-b-[6px] border-b-[#cbd5e1]' 
                                : 'glass-card-3d bg-white/[0.02] border-white/10'
                        }`}>
                            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${
                                isDayMode ? 'bg-[#cda488]/10' : 'bg-cyan-500/5'
                            }`} />
                            
                            <div className="text-center space-y-2">
                                <Lock className={isDayMode ? 'text-[#855b3c] mx-auto animate-pulse' : 'text-cyan-400 mx-auto animate-pulse'} size={28} />
                                <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${isDayMode ? 'text-[#2d1e15]' : 'text-white'}`}>Ingresá tu Código VIP</h3>
                                <p className={`text-[9px] font-bold uppercase tracking-wider leading-relaxed ${
                                    isDayMode ? 'text-[#2d1e15]/60' : 'text-white/40'
                                }`}>
                                    Hemos enviado una clave secreta a tu WhatsApp y a tu dirección de correo electrónico.
                                </p>
                            </div>

                            <div className="group">
                                <input
                                    required
                                    maxLength={6}
                                    placeholder="0 0 0 0 0 0"
                                    value={enteredOtp}
                                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                                    className={`w-full border p-4 text-center font-mono text-xl font-black tracking-[0.3em] rounded-2xl transition-all focus:outline-none ${
                                        isDayMode 
                                            ? 'bg-[#faf8f5] text-[#2d1e15] border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] focus:border-[#a88d75] focus:border-b-[#a88d75]' 
                                            : 'bg-[#0b1329] text-white border-white/10 border-b-[4px] border-b-white/20 focus:border-cyan-400/50 focus:border-b-cyan-400/50'
                                    }`}
                                    style={isDayMode ? { color: '#2d1e15', backgroundColor: '#faf8f5' } : { color: '#ffffff', backgroundColor: '#0b1329' }}
                                />
                            </div>

                            {otpError && (
                                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-relaxed">
                                        {otpError}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <button 
                                type="submit"
                                disabled={isSubmitting || enteredOtp.length !== 6}
                                className={`w-full py-6 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 font-black uppercase tracking-[0.2em] text-[11px] border cursor-pointer transition-all ${
                                    isDayMode 
                                        ? 'bg-gradient-to-b from-[#b58866] to-[#9c7151] hover:from-[#c29673] hover:to-[#a87c5b] text-white border-[#855b3c] border-b-[6px] border-b-[#734b2f] shadow-[0_10px_30px_rgba(140,90,50,0.2)] active:translate-y-[4px] active:border-b-[2px]' 
                                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-white/20 border-b-[6px] border-b-cyan-800 shadow-[0_10px_30px_rgba(34,211,238,0.2)] active:translate-y-[4px] active:border-b-[2px]'
                                } disabled:opacity-50 disabled:grayscale`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Unlock size={18} />
                                        <span>Verificar Identidad</span>
                                    </>
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={() => { playNeonClick(); setStep('form'); }}
                                className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                    isDayMode 
                                        ? 'bg-white/80 border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] text-[#2d1e15] hover:bg-white active:translate-y-[2px] active:border-b-[1px]' 
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white active:scale-95'
                                }`}
                            >
                                Volver al Formulario
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 3: WELCOME KIT ONBOARDING ARTILLERY */}
            {step === 'welcome' && (
                <div className="px-8 space-y-6 max-w-sm mx-auto relative z-10 animate-in zoom-in duration-700">
                    
                    {/* Brand Avatar Section */}
                    {isDayMode && (
                        <div className="flex justify-center mb-1 model-floating select-none pointer-events-none">
                            <img 
                                src="/ari-avatar.png" 
                                alt="ARI Asistente Bienvenido" 
                                className="h-32 w-auto object-contain drop-shadow-[0_10px_15px_rgba(88,70,50,0.15)] animate-in fade-in duration-700" 
                            />
                        </div>
                    )}

                    <div className={`rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-center space-y-6 border ${
                        isDayMode 
                            ? 'bg-white/85 border-[#cbd5e1] border-b-[6px] border-b-[#cbd5e1]' 
                            : 'glass-card-3d bg-white/[0.02] border-cyan-500/30'
                    }`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                            isDayMode ? 'bg-amber-500/5' : 'bg-cyan-500/10'
                        }`} />
                        
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg mx-auto animate-bounce ${
                            isDayMode 
                                ? 'bg-white border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1]' 
                                : 'bg-cyan-500/10 border-cyan-400/40 shadow-[0_0_25px_rgba(34,211,238,0.4)]'
                        }`}>
                            <CheckCircle2 size={32} className={isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'} />
                        </div>

                        <div className="space-y-2">
                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] block ${
                                isDayMode ? 'text-[#855b3c]' : 'text-cyan-400'
                            }`}>Socio VIP Validado</span>
                            <h3 className={`text-xl font-[1000] uppercase tracking-tighter leading-tight ${isDayMode ? 'text-[#2d1e15]' : 'text-white'}`}>
                                ¡Bienvenido a bordo, <br/> {formData.name.split(' ')[0]}!
                            </h3>
                            <p className={`text-[9px] font-bold uppercase tracking-wider leading-relaxed ${
                                isDayMode ? 'text-[#2d1e15]/60' : 'text-white/40'
                            }`}>
                                Tu identidad digital ha sido sincronizada con el nodo comercial. Disponés de tu credencial VIP y acceso a toda la red.
                            </p>
                        </div>

                        {/* Fast Guide Box */}
                        <div className={`border rounded-2xl p-4 text-left space-y-3 shadow-inner ${
                            isDayMode ? 'bg-[#faf8f5] border-[#cbd5e1]' : 'bg-black/50 border-white/5'
                        }`}>
                            <h4 className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border-b pb-1.5 ${
                                isDayMode ? 'text-[#855b3c] border-black/5' : 'text-cyan-400 border-white/5'
                            }`}>
                                <FileText size={10} /> Guía rápida de uso
                            </h4>
                            <ul className={`space-y-2 text-[8px] font-bold uppercase tracking-wide ${
                                isDayMode ? 'text-[#2d1e15]/70' : 'text-white/60'
                            }`}>
                                <li className="flex items-start gap-2">
                                    <span className={isDayMode ? 'text-[#855b3c] font-black' : 'text-cyan-400 font-black'}>1.</span>
                                    <span>Presentá tu código QR VIP en caja al comprar.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className={isDayMode ? 'text-[#855b3c] font-black' : 'text-cyan-400 font-black'}>2.</span>
                                    <span>Ganá créditos con cada compra para canjear en la red.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className={isDayMode ? 'text-[#855b3c] font-black' : 'text-cyan-400 font-black'}>3.</span>
                                    <span>Accedé a eventos y recitales exclusivos sintonizados en vivo.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Action buttons - Welcoming kit */}
                    <div className="space-y-4 pt-2">
                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`/${townId}/${activeCatSlug}/${shopSlug}/credencial-vip/${newClientId}`);
                            }}
                            className={`w-full h-20 rounded-3xl flex items-center justify-between px-8 font-black uppercase tracking-[0.15em] text-[10px] border transition-all cursor-pointer group ${
                                isDayMode 
                                    ? 'bg-gradient-to-r from-[#b58866] to-[#9c7151] hover:from-[#c29673] hover:to-[#a87c5b] text-white border-[#855b3c] border-b-[6px] border-b-[#734b2f] shadow-[0_10px_30px_rgba(140,90,50,0.2)] active:translate-y-[4px] active:border-b-[2px]' 
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-cyan-400/40 hover:border-cyan-400/80 shadow-[0_0_35px_rgba(34,211,238,0.25)] hover:shadow-[0_0_45px_rgba(34,211,238,0.45)] border-b-[6px] border-b-cyan-800 active:translate-y-[4px] active:border-b-[2px]'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <UserCircle size={24} className="text-white" />
                                <div className="text-left">
                                    <span className="block text-[11px] font-[1000]">Ver Mi Credencial VIP</span>
                                    <span className={`block text-[7px] tracking-widest font-bold mt-0.5 ${
                                        isDayMode ? 'text-white/80' : 'text-cyan-200/50'
                                    }`}>Identidad Digital</span>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-white group-hover:translate-x-1.5 transition-transform" />
                        </button>

                        <button
                            onClick={() => {
                                playNeonClick();
                                navigate(`/${townId}/red-comercial/ofertas`);
                            }}
                            className={`w-full h-16 rounded-2xl flex items-center justify-between px-8 font-black uppercase tracking-[0.15em] text-[9px] border transition-all cursor-pointer group ${
                                isDayMode 
                                    ? 'bg-white/85 border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] text-[#2d1e15] hover:bg-white active:translate-y-[2px] active:border-b-[1px]' 
                                    : 'bg-zinc-900 hover:bg-zinc-900/80 border-white/10 text-white active:scale-95'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Ticket size={18} className="text-green-400" />
                                <div className="text-left">
                                    <span className="block">Explorar Descuentos VIP</span>
                                    <span className={`block text-[6px] tracking-widest font-black mt-0.5 ${
                                        isDayMode ? 'text-[#2d1e15]/40' : 'text-white/30'
                                    }`}>Ofertas B2C</span>
                                </div>
                            </div>
                            <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isDayMode ? 'text-[#2d1e15]/75' : 'text-white/40'}`} />
                        </button>

                        <a
                            href="https://chat.whatsapp.com/G5iM46NnleN5d5Jk55D07G"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={playNeonClick}
                            className={`w-full h-16 rounded-2xl flex items-center justify-between px-8 font-black uppercase tracking-[0.15em] text-[9px] border transition-all cursor-pointer group ${
                                isDayMode 
                                    ? 'bg-[#25d366]/10 border-[#25d366]/40 text-[#128c7e] hover:bg-[#25d366]/20 border-b-[4px] border-b-[#25d366]/40 active:translate-y-[2px] active:border-b-[1px]' 
                                    : 'bg-[#00e676]/10 border-[#00e676]/30 hover:bg-[#00e676]/15 text-[#00e676] border-b-[4px] border-b-[#00e676]/40 active:translate-y-[2px] active:border-b-[1px]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} className={isDayMode ? 'text-[#128c7e]' : 'text-[#00e676]'} />
                                <div className="text-left">
                                    <span className="block">Comunidad VIP WhatsApp</span>
                                    <span className={`block text-[6px] tracking-widest font-black mt-0.5 ${
                                        isDayMode ? 'text-[#128c7e]/70' : 'text-[#00e676]/50'
                                    }`}>Canal de Clientes felices</span>
                                </div>
                            </div>
                            <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isDayMode ? 'text-[#128c7e]/80' : 'text-[#00e676]/70'}`} />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSubscriptionPage;
