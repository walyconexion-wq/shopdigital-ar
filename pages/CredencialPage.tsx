import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop, Client, LiveEvent } from '../types';
import { db, suscribirseAEventos, registrarIntrusionBunker } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { transaccionarCreditos } from '../firebaseVIP';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import {
    ChevronLeft, ArrowLeft, Moon, Sun, Share2, Star, QrCode, ShieldCheck, Clock, IdCard,
    Wallet, CreditCard, ArrowUpRight, ArrowDownRight,
    CheckCircle, CheckCircle2, XCircle, Search, User, Store, MapPin, Zap, Lock, Radio,
    Camera, Edit2, Check, X, Award, Sparkles, Activity, Wifi, WifiOff
} from 'lucide-react';
import { playNeonClick, playSuccessSound } from '../utils/audio';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

interface CredencialPageProps {
    allShops: Shop[];
}

const CredencialPage: React.FC<CredencialPageProps> = ({ allShops }) => {
    const { townId = 'esteban-echeverria', categorySlug, shopSlug } = useParams<{
        townId: string; categorySlug: string; shopSlug: string;
    }>();
    const navigate = useNavigate();

    // Auth gating
    const { user, role, status, login, logoutUser, loading: authLoading } = useAuth();

    // --- Shop ---
    const selectedShop = useMemo(() =>
        allShops.find(shop => (shop.slug || shop.id) === shopSlug),
    [shopSlug, allShops]);

    const [shop, setShop] = useState<Shop | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        ownerName: '',
        shopNumber: '',
        gmail: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (selectedShop) {
            setShop(selectedShop);
            setEditForm({
                name: selectedShop.name || '',
                ownerName: selectedShop.ownerName || '',
                shopNumber: selectedShop.shopNumber || selectedShop.id.slice(0, 8).toUpperCase(),
                gmail: selectedShop.gmail || selectedShop.authorizedEmail || '',
                phone: selectedShop.phone || '',
                address: selectedShop.address || ''
            });
        }
    }, [selectedShop]);

    // Canvas image compression helper
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 300;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height = Math.round((height * MAX_SIZE) / width);
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width = Math.round((width * MAX_SIZE) / height);
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        resolve(dataUrl);
                    } else {
                        resolve(e.target?.result as string);
                    }
                };
                img.onerror = () => reject(new Error('Error cargando imagen.'));
                img.src = e.target?.result as string;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };

    // Photo direct handler
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedShop) return;

        setIsUploading(true);
        try {
            const compressed = await compressImage(file);
            const { doc, updateDoc } = await import('firebase/firestore');
            const shopRef = doc(db, 'comercios', selectedShop.id);
            await updateDoc(shopRef, { 
                ownerPhoto: compressed,
                updatedAt: new Date().toISOString()
            });
            setShop(prev => prev ? { ...prev, ownerPhoto: compressed } : null);
            playSuccessSound();
        } catch (err) {
            console.error("Error subiendo foto:", err);
            alert("Error al cargar y comprimir la foto.");
        } finally {
            setIsUploading(false);
        }
    };

    // Save profile from edit panel
    const handleSaveShopProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShop) return;
        playNeonClick();
        setIsSaving(true);
        try {
            const updatedData = {
                name: editForm.name.toUpperCase().trim(),
                ownerName: editForm.ownerName.trim(),
                shopNumber: editForm.shopNumber.trim(),
                gmail: editForm.gmail.trim().toLowerCase(),
                phone: editForm.phone.replace(/\D/g, ''),
                address: editForm.address.trim()
            };
            const { doc, updateDoc } = await import('firebase/firestore');
            const shopRef = doc(db, 'comercios', selectedShop.id);
            await updateDoc(shopRef, {
                ...updatedData,
                updatedAt: new Date().toISOString()
            });
            setShop(prev => prev ? { ...prev, ...updatedData } : null);
            setIsEditing(false);
            playSuccessSound();
        } catch (err) {
            console.error("Error guardando datos del comercio:", err);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    // Dynamic color scheme based on node type
    const isEnterprise = selectedShop?.entityType === 'enterprise';

    // --- Live Event Listener ---
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
    useEffect(() => {
        const unsubscribe = suscribirseAEventos((events) => {
            setLiveEvents(events);
        });
        return () => unsubscribe();
    }, []);

    // Active/Suspended event matching this locality & role 'comerciante'
    const activeEvent = useMemo(() => {
        const requiredRole = isEnterprise ? 'empresario' : 'comerciante';
        return liveEvents.find(e => 
            (e.status === 'active_live' || e.status === 'suspended') &&
            (e.targetRegion === townId || e.targetLocalities.includes('all')) &&
            e.targetRoles.includes(requiredRole)
        );
    }, [liveEvents, townId, isEnterprise]);

    // Fallback/Mock event data for sintonizador
    const sintonizadorEventData = useMemo(() => {
        if (activeEvent) {
            return {
                name: activeEvent.name,
                details: `ARTISTA: ${activeEvent.artist || 'Red ShopDigital'} · LOCALIDAD: ${activeEvent.targetLocalities.join(', ').toUpperCase()}`,
                access: isEnterprise ? 'ACCESO INDUSTRIAL VERIFICADO' : 'ACCESO COMERCIO VERIFICADO',
                isLive: true
            };
        }
        return {
            name: "Gala & Business Networking - Esteban Echeverría 🎷",
            details: "ARTISTA: GUSTAVO DIAZ QUINTET · CONEXIÓN B2B DIRECTA",
            access: isEnterprise ? 'ACCESO INDUSTRIAL VERIFICADO' : 'ACCESO COMERCIO VERIFICADO',
            isLive: false
        };
    }, [activeEvent, isEnterprise]);

    // --- Clock ---
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const formatClock = (d: Date) => {
        const dateStr = d.toLocaleDateString('es-AR');
        const hourStr = d.toLocaleTimeString('es-AR', { hour12: false });
        return `${dateStr} - ${hourStr}`;
    };

    // Theme Mode Resolver
    const [isDayMode, setIsDayMode] = useState(() => {
        const themeMode = localStorage.getItem('global_home_theme_mode') || 'light';
        return themeMode === 'light' || (themeMode === 'auto' && (() => {
            const hour = new Date().getHours();
            return hour >= 8 && hour < 20;
        })());
    });

    const toggleTheme = () => {
        playNeonClick();
        const nextMode = isDayMode ? 'dark' : 'light';
        localStorage.setItem('global_home_theme_mode', nextMode);
        window.dispatchEvent(new Event('theme_change'));
        setIsDayMode(!isDayMode);
    };

    // Listen for changes from other pages
    useEffect(() => {
        const handleThemeChange = () => {
            const themeMode = localStorage.getItem('global_home_theme_mode') || 'light';
            setIsDayMode(themeMode === 'light' || (themeMode === 'auto' && (() => {
                const hour = new Date().getHours();
                return hour >= 8 && hour < 20;
            })()));
        };
        window.addEventListener('theme_change', handleThemeChange);
        return () => window.removeEventListener('theme_change', handleThemeChange);
    }, []);

    // --- POSNET State ---
    const [posnetOpen, setPosnetOpen] = useState(false);
    const [posnetMode, setPosnetMode] = useState<'load' | 'spend'>('load');
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch clients when POSNET opens
    useEffect(() => {
        if (!posnetOpen) return;
        const fetchClients = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'clientes'), where('townId', '==', townId)));
                setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
            } catch (err) { console.error(err); }
        };
        fetchClients();
    }, [posnetOpen, townId]);

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const t = searchTerm.toLowerCase();
        return clients.filter(c =>
            c.name?.toLowerCase().includes(t) || c.dni?.toLowerCase().includes(t) || c.phone?.includes(t)
        ).slice(0, 6);
    }, [clients, searchTerm]);

    const handleTransaction = async () => {
        if (!selectedClient || !amount || !selectedShop) return;
        const num = parseInt(amount);
        if (isNaN(num) || num <= 0) return;

        if (posnetMode === 'spend' && (selectedClient.credits || 0) < num) {
            setErrorMsg(`Saldo insuficiente (${selectedClient.credits || 0} créditos)`);
            setTxStatus('error');
            return;
        }

        setIsProcessing(true);
        setTxStatus('idle');
        try {
            const desc = posnetMode === 'load'
                ? `+${num} créditos por compra en ${selectedShop.name}`
                : `-${num} créditos canjeados en ${selectedShop.name}`;
            const newBalance = await transaccionarCreditos(selectedClient.id, selectedShop.id, num, posnetMode, desc);
            setSelectedClient(prev => prev ? { ...prev, credits: newBalance } : null);
            setTxStatus('success');
            playSuccessSound();
            setAmount('');
        } catch (err) {
            console.error(err);
            setErrorMsg('Error en la transacción');
            setTxStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetPosnet = () => {
        setSelectedClient(null);
        setSearchTerm('');
        setAmount('');
        setTxStatus('idle');
        setErrorMsg('');
    };

    // Validation URL
    const validationUrl = useMemo(() =>
        `${window.location.origin}/${townId}/${categorySlug}/${shopSlug}/validar`,
    [townId, categorySlug, shopSlug]);

    // Permissions Gating Check
    const userEmail = user?.email?.trim().toLowerCase() || null;
    const isDG = userEmail === 'walyconexion@gmail.com';
    const isAmbassador = (role === 'admin' || role === 'ambassador') && status === 'active';
    const isShopOwner = userEmail && (
        userEmail === selectedShop?.gmail?.trim().toLowerCase() ||
        userEmail === selectedShop?.authorizedEmail?.trim().toLowerCase()
    );
    const isAuthorized = isDG || isAmbassador || isShopOwner;

    // Log intrusion to Bunker if unauthorized
    useEffect(() => {
        if (user && !isAuthorized && !authLoading) {
            registrarIntrusionBunker(userEmail).catch(console.error);
        }
    }, [user, isAuthorized, authLoading, userEmail]);

    if (!selectedShop) return null;

    // Loading State
    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-transparent">
                <CyberCircuitBackground />
                <div className="flex flex-col items-center gap-4 relative z-10 neu-plate p-8">
                    <div className="w-12 h-12 border-t-2 border-t-[#ff6b6b] border-[#4a3d6a]/20 rounded-full animate-spin" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4a3d6a] animate-pulse">
                        Autenticando Credencial de Comerciante...
                    </span>
                </div>
            </div>
        );
    }

    // Unauthenticated State
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent text-[#2c2440]">
                <CyberCircuitBackground />

                <div className="w-full max-w-sm rounded-[26px] p-8 relative z-10 neu-plate">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto neu-inset-title">
                        <Lock size={24} className="animate-pulse text-[#ff6b6b]" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-center mb-1 text-[#2c2440]">
                        Credencial Protegida
                    </h2>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-center mb-8 text-[#4a3d6a]">
                        Verificación B2B Comercio ShopDigital
                    </p>

                    <button
                        onClick={() => { playNeonClick(); login(); }}
                        className="w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer neu-btn-hero"
                    >
                        <User size={16} /> Iniciar Sesión con Google
                    </button>
                    
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className="w-full h-14 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer mt-4 neu-btn-3d"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    // Unauthorized Access State (Gated)
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent text-[#2c2440]">
                <CyberCircuitBackground />

                <div className="w-full max-w-sm rounded-[26px] p-8 relative z-10 neu-plate border-2 border-[#ff6b6b]">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto bg-red-500/10 border border-red-500/30">
                        <Zap size={24} className="text-[#ff6b6b] animate-bounce" />
                    </div>
                    <h2 className="text-xl font-black text-[#ff6b6b] uppercase tracking-tight text-center mb-2">Acceso Denegado</h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed text-center mb-6 text-[#2c2440]">
                        El correo <span className="font-mono text-[#ff6b6b] bg-[#faf7f2] px-1.5 py-0.5 rounded border border-[#ff6b6b]/30">{user.email}</span> no cuenta con autorización para administrar la credencial de {selectedShop.name}.
                    </p>
                    <p className="text-[8px] uppercase tracking-widest leading-normal mb-8 border-l-2 pl-3 text-[#4a3d6a] border-[#ff6b6b]">
                        Sistema Doberman B2B Security Audit activo.
                    </p>

                    <button
                        onClick={() => { playNeonClick(); logoutUser(); }}
                        className="w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer neu-btn-hero"
                    >
                        Cerrar Sesión / Cambiar Cuenta
                    </button>
                    
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className="w-full h-14 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer mt-4 neu-btn-3d"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const formattedTown = townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="min-h-screen w-full flex flex-col items-center px-4 py-6 relative overflow-y-auto selection:bg-cyan-500/30 bg-transparent text-[#2c2440]">
            {/* Estilos de alta precisión para campos de edición */}
            <style>{`
                .premium-input {
                    color: #083344 !important;
                    background-color: #ffffff !important;
                    border: 2.5px solid #0891b2 !important;
                    box-shadow: 0 2px 5px rgba(8, 145, 178, 0.08), inset 0 2px 4px rgba(0,0,0,0.03) !important;
                    transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
                }
                .premium-input:focus {
                    border-color: #083344 !important;
                    box-shadow: 0 0 0 3.5px rgba(8, 51, 68, 0.15), inset 0 2px 4px rgba(0,0,0,0.03) !important;
                    outline: none !important;
                }
                input, option, select {
                    color: #083344 !important;
                    background-color: #ffffff !important;
                }
            `}</style>

            {/* Fondo Ciber-Digital de Circuitos Animados */}
            <CyberCircuitBackground />

            {/* ══════════════════════════════════════════
                CABECERA SUPERIOR EN CONTENEDOR NEUMÓRFICO UNIFICADO (PARIDAD TOTAL CON CLIENTES)
            ══════════════════════════════════════════ */}
            <div className="w-full max-w-sm relative z-10 mb-5 p-3.5 neu-plate flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                {/* HEADER NEUMÓRFICO CON PODS DE CABECERA */}
                <div className="w-full flex justify-between items-center gap-2">
                    <button 
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group shrink-0"
                        aria-label="Regresar"
                    >
                        <ArrowLeft size={16} className="text-[#2c2440] group-hover:-translate-x-0.5 transition-transform" strokeWidth={3} />
                    </button>

                    <div className="flex-1 text-center px-3 py-1 neu-inset-title">
                        <h1 className="text-xs font-black tracking-tight uppercase leading-tight text-[#2c2440]">
                            Credencial VIP Comercio
                        </h1>
                        <p className="text-[7px] font-extrabold uppercase tracking-widest text-[#4a3d6a]">
                            {formattedTown}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={toggleTheme}
                            aria-label="Alternar modo de color"
                            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                        >
                            {isDayMode 
                                ? <Moon size={15} className="text-[#2c2440] group-hover:rotate-12 transition-transform" /> 
                                : <Sun size={15} className="text-[#ff6b6b] group-hover:rotate-45 transition-transform" />
                            }
                        </button>
                        <button 
                            onClick={() => {
                                playNeonClick();
                                if (navigator.share) {
                                    navigator.share({
                                        title: `Credencial VIP de ${selectedShop.name}`,
                                        text: `Mirá la Credencial VIP de ${selectedShop.name} en ShopDigital`,
                                        url: window.location.href,
                                     });
                                }
                            }}
                            className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                            aria-label="Compartir"
                        >
                            <Share2 size={15} className="text-[#2c2440] group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Avatar ARI Integrado en Cabecera */}
                {isDayMode && (
                    <div className="flex flex-col items-center select-none pointer-events-none my-0.5">
                        <img 
                            src="/ari-pointing.png" 
                            alt="ARI Asistente Credencial Comercio" 
                            className="h-20 w-auto object-contain drop-shadow-[0_4px_10px_rgba(44,36,64,0.18)] animate-in fade-in duration-700" 
                        />
                        <div className="ari-3d-shadow mt-0.5 scale-75" />
                    </div>
                )}

                {/* SELLO DE VIDA — TIMESTAMP ANTI-FALSIFICACIÓN INTEGRADO CON LUZ VERDE */}
                <div className="w-full flex items-center justify-between neu-inset-title px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#ff6b6b] animate-spin flex-shrink-0" style={{ animationDuration: '6s' }} />
                        <p className="text-[9.5px] font-black font-mono tracking-widest tabular-nums text-[#2c2440]">
                            {formatClock(currentTime)}
                        </p>
                    </div>
                    <div className="h-3.5 w-[1px] bg-[#4a3d6a]/20" />
                    <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest text-emerald-600">
                        <Wifi size={12} className="animate-pulse text-emerald-600" />
                        <span>LUZ VERDE ACTIVA</span>
                    </div>
                </div>
            </div>

            {/* ═══════════ LIVE EVENT TICKER BANNER 🟢🔴 ═══════════ */}
            {activeEvent && (
                <div className="w-full max-w-sm mb-5 relative z-10 animate-in slide-in-from-top-4 duration-500">
                    {activeEvent.status === 'active_live' ? (
                        <div className="p-4 flex flex-col items-center justify-center relative overflow-hidden neu-plate border-2 border-emerald-500/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-center mb-1 text-emerald-700">
                                🟢 EVENTO EN VIVO REGIONAL
                            </span>
                            <h3 className="text-xs font-black uppercase tracking-wider text-center mb-2 text-[#2c2440]">
                                {activeEvent.name}
                            </h3>
                            <div className="px-4 py-1 rounded-full text-center neu-inset-title">
                                <span className="text-[9px] font-black uppercase tracking-widest block text-emerald-800">
                                    🎫 ACCESO VIP EXCLUSIVO INCLUIDO
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col items-center justify-center relative overflow-hidden neu-plate border-2 border-[#ff6b6b]/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-center mb-1 text-[#ff6b6b]">
                                🔴 EVENTO REPROGRAMADO
                            </span>
                            <h3 className="text-xs font-black uppercase tracking-wider text-center mb-1 text-[#2c2440]">
                                {activeEvent.name}
                            </h3>
                            <p className="text-[8px] font-extrabold uppercase tracking-widest text-center text-[#4a3d6a]">
                                Consultar actualización vía Ari 🤖
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ CREDENCIAL COMERCIANTE PRINCIPAL NEUMÓRFICA ═══════════ */}
            <div className="w-full max-w-sm relative z-10 animate-in zoom-in duration-700 delay-100">
                <div className="neu-plate p-8 pb-10 relative overflow-hidden">
                    
                    {/* Top Row: Badge LUZ VERDE + Edit Pod + Star */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="px-3 py-1.5 rounded-full flex items-center gap-2 neu-btn-pod border border-emerald-500/30 bg-emerald-500/10">
                            <Activity size={12} className="animate-pulse text-emerald-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                                {isEnterprise ? 'EMPRESA VERIFICADA · LUZ VERDE' : 'COMERCIO VIP ACTIVO · LUZ VERDE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAuthorized && (
                                <button 
                                    onClick={() => { playNeonClick(); setIsEditing(true); }}
                                    className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                                    title="Editar Comercio"
                                >
                                    <Edit2 size={14} className="text-[#2c2440] group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                            <Star size={24} className="text-[#ff6b6b]" style={{ fill: '#ff6b6b', color: '#ff6b6b' }} />
                        </div>
                    </div>

                    {/* Nombre / Titular del Local */}
                    <div className="mb-8 relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-[#4a3d6a]">Comercio Acreditado</p>
                        <h3 className="text-3xl font-[1000] uppercase tracking-tighter leading-none mb-2 text-[#2c2440]">
                            {shop?.name || selectedShop.name}
                        </h3>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest mb-2 text-[#4a3d6a]">
                            {shop?.specialty || shop?.category || selectedShop.specialty || selectedShop.category}
                        </p>
                        <div className="flex items-center gap-2 text-[#4a3d6a]">
                            <MapPin size={12} className="text-[#ff6b6b]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{shop?.address || selectedShop.address || formattedTown}</span>
                        </div>
                    </div>

                    {/* Foto Propietario / Logo Comercio con LUZ VERDE */}
                    <div className="w-full aspect-square neu-inset-title flex flex-col items-center justify-center p-8 mb-8 relative overflow-hidden group/photo transition-all duration-500">
                        <div className="relative w-40 h-40 rounded-full border-2 border-[#4a3d6a]/20 p-1 shadow-lg overflow-hidden group-hover/photo:scale-105 transition-transform duration-500 neu-btn-pod">
                            <img 
                                src={shop?.ownerPhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80"} 
                                alt={shop?.ownerName} 
                                className="w-full h-full object-cover rounded-full" 
                            />
                            {isAuthorized && (
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity border-none cursor-pointer rounded-full"
                                >
                                    <Camera size={32} className="text-white mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Editar Foto</span>
                                </button>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-full z-10">
                                    <div className="w-8 h-8 border-3 border-[#4a3d6a]/20 border-t-[#ff6b6b] rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 px-5 py-2 neu-btn-pod bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-[10px] font-black tracking-[0.25em] flex items-center gap-2 text-emerald-700">
                                <CheckCircle2 size={13} className="text-emerald-600 animate-pulse" /> LUZ VERDE · ACCESO VERIFICADO
                            </p>
                        </div>
                    </div>

                    {/* Grilla de Datos Neumórfica */}
                    <div className="space-y-4 border-t-2 border-[#4a3d6a]/10 pt-6 mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 neu-inset-title">
                                <p className="text-[7.5px] font-black uppercase tracking-widest mb-1 text-[#4a3d6a]">Titular Propietario</p>
                                <p className="text-xs font-[1000] uppercase tracking-tight truncate text-[#2c2440]">
                                    {shop?.ownerName || selectedShop.ownerName || 'Sin Registrar'}
                                </p>
                            </div>
                            
                            <div className="p-3.5 neu-inset-title">
                                <p className="text-[7.5px] font-black uppercase tracking-widest mb-1 text-[#4a3d6a]">{isEnterprise ? 'ID Empresa' : 'ID Comercio'}</p>
                                <p className="text-xs font-[1000] tracking-tight truncate text-[#ff6b6b]">
                                    {shop?.shopNumber || selectedShop.shopNumber || selectedShop.id.slice(0, 8).toUpperCase()}
                                </p>
                            </div>
                        </div>

                        <div className="p-3.5 neu-inset-title">
                            <p className="text-[7.5px] font-black uppercase tracking-widest mb-1 text-[#4a3d6a]">Dirección Física</p>
                            <p className="text-xs font-bold truncate text-[#2c2440]">{shop?.address || selectedShop.address}</p>
                        </div>
                    </div>

                    {/* Contenedor Código QR */}
                    <div className="w-full p-5 flex flex-col items-center mb-6 relative group/qr overflow-hidden neu-inset-title">
                        <div className="bg-white p-4 rounded-2xl mb-3 shadow-md relative z-10 border border-[#f0ece6]">
                            <QRCodeCanvas
                                value={validationUrl}
                                size={145}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: shop?.ownerPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
                                    x: undefined, y: undefined,
                                    height: 30, width: 30, excavate: true,
                                }}
                            />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4a3d6a]">
                            Código de Validación QR
                        </p>
                    </div>

                    {/* 🛰️ SINTONIZADOR DE ACCESO / EVENTOS LIVE CON LUZ VERDE */}
                    <div className="w-full p-4 space-y-3 relative overflow-hidden mb-6 z-10 neu-inset-title">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 text-[#2c2440]">
                                <Radio size={12} className="animate-pulse text-[#ff6b6b]" /> Sintonizador B2B
                            </label>
                            <span className="text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider neu-btn-emerald-active text-emerald-800">
                                LUZ VERDE · LIVE SIGNAL
                            </span>
                        </div>
                        
                        {sintonizadorEventData && (
                            <div className="space-y-2">
                                <p className="text-[12px] font-black uppercase tracking-tight leading-snug text-[#2c2440]">
                                    {sintonizadorEventData.name}
                                </p>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-[#4a3d6a]">
                                    {sintonizadorEventData.details}
                                </p>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-xl w-fit bg-emerald-500/15 border border-emerald-500/40">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-[8.5px] font-black text-emerald-700 uppercase tracking-widest">
                                        {sintonizadorEventData.access} · LUZ VERDE
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Membresía */}
                    <div className="w-full flex justify-between items-center text-[9.5px] font-black uppercase tracking-widest border-t-2 border-[#4a3d6a]/10 pt-4">
                        <span className="text-[#4a3d6a]">Estado de Membresía</span>
                        <span className={`font-black flex items-center gap-1 ${
                            selectedShop.isActive ? 'text-emerald-700' : 'text-[#ff6b6b]'
                        }`}>
                            {selectedShop.isActive ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>⚡ HABILITADA VIP · LUZ VERDE</span>
                                </>
                            ) : (
                                <span>⏳ EN REVISIÓN</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════ POSNET DE CRÉDITOS INTEGRADO (HERO CTA PROTAGONISTA) ═══════════ */}
            <div className="w-full max-w-sm mt-6 relative z-10 space-y-4">
                {!posnetOpen ? (
                    <button
                        onClick={() => { playNeonClick(); setPosnetOpen(true); }}
                        className="w-full h-16 text-[11px] font-[1000] uppercase tracking-[0.2em] neu-btn-hero flex items-center justify-center gap-3 shadow-xl cursor-pointer group"
                    >
                        <CreditCard size={20} className="text-[#ff6b6b] group-hover:scale-110 transition-transform" />
                        <span>Abrir POSNET de Créditos</span>
                        <Sparkles size={14} className="text-[#ff6b6b] opacity-80 animate-pulse" />
                    </button>
                ) : (
                    <div className="p-6 space-y-4 transition-all neu-plate border-2 border-[#ff6b6b]/40">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-[1000] uppercase tracking-wider flex items-center gap-2 text-[#2c2440]">
                                <CreditCard size={16} className="text-[#ff6b6b]" /> POSNET de Créditos
                            </h3>
                            <button 
                                onClick={() => { playNeonClick(); setPosnetOpen(false); resetPosnet(); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer neu-btn-pod"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Selección Cargar / Descontar — Doble Conmutador con Jerarquía Neumórfica */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { playNeonClick(); setPosnetMode('load'); setTxStatus('idle'); }}
                                className={`py-3.5 rounded-xl font-[1000] uppercase tracking-wider text-[9.5px] flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                    posnetMode === 'load'
                                        ? 'neu-btn-emerald-active'
                                        : 'neu-btn-3d opacity-75 hover:opacity-100'
                                }`}
                            >
                                <ArrowUpRight size={17} className={posnetMode === 'load' ? 'text-emerald-600' : 'text-[#4a3d6a]'} />
                                Cargar Créditos
                            </button>

                            <button
                                onClick={() => { playNeonClick(); setPosnetMode('spend'); setTxStatus('idle'); }}
                                className={`py-3.5 rounded-xl font-[1000] uppercase tracking-wider text-[9.5px] flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                    posnetMode === 'spend'
                                        ? 'neu-btn-3d-active'
                                        : 'neu-btn-3d opacity-75 hover:opacity-100'
                                }`}
                            >
                                <ArrowDownRight size={17} className={posnetMode === 'spend' ? 'text-[#ff6b6b]' : 'text-[#4a3d6a]'} />
                                Descontar Créditos
                            </button>
                        </div>

                        {/* Búsqueda o Cliente Seleccionado */}
                        {!selectedClient ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Buscar socio (nombre, DNI, tel)..."
                                        className="w-full p-3.5 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                        autoFocus
                                    />
                                    <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 text-[#2c2440]" />
                                </div>
                                {filteredClients.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => { playNeonClick(); setSelectedClient(c); setSearchTerm(''); setTxStatus('idle'); }}
                                        className="w-full p-3 rounded-xl flex items-center gap-3 text-left cursor-pointer transition-all neu-btn-3d hover:border-[#ff6b6b]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover rounded-full" alt="" /> : <User size={12} className="opacity-40" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-wider truncate text-[#2c2440]">{c.name}</p>
                                            <p className="text-[8px] text-[#4a3d6a]">{c.dni || 'Sin DNI'} · 💰 {c.credits || 0} crs</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3.5 rounded-xl flex items-center gap-3 relative neu-inset-title">
                                    <button 
                                        onClick={() => { playNeonClick(); resetPosnet(); }}
                                        className="absolute top-2.5 right-2.5 text-xs opacity-50 hover:opacity-100 border-none bg-transparent cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black/10 flex-shrink-0">
                                        {selectedClient.photo ? <img src={selectedClient.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><User size={16} className="opacity-30" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-wider truncate text-[#2c2440]">{selectedClient.name}</p>
                                        <p className="text-[8.5px] text-[#4a3d6a]">Saldo actual: <span className="font-black tabular-nums text-[#2c2440]">{selectedClient.credits || 0}</span> créditos</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-3.5 text-2xl font-black tabular-nums text-center focus:outline-none neu-inset-title text-[#2c2440]"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black opacity-50 uppercase tracking-widest text-[#4a3d6a]">CRÉDITOS</span>
                                </div>

                                {txStatus === 'success' && (
                                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-3">
                                        <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                                                {posnetMode === 'load' ? '✅ Créditos Otorgados' : '✅ Descuento Aplicado'}
                                            </p>
                                            <p className="text-[8px] text-emerald-800">Nuevo Saldo: {selectedClient.credits} créditos</p>
                                        </div>
                                    </div>
                                )}

                                {txStatus === 'error' && (
                                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center gap-3">
                                        <XCircle size={18} className="text-red-500 flex-shrink-0" />
                                        <p className="text-[9px] font-black text-red-600 text-left">{errorMsg}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleTransaction}
                                    disabled={isProcessing || !amount}
                                    className={`w-full h-15 text-[10.5px] font-[1000] uppercase tracking-[0.18em] flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer ${
                                        posnetMode === 'load' ? 'neu-btn-emerald-active' : 'neu-btn-hero'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {posnetMode === 'load' ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
                                            {posnetMode === 'load' ? 'Otorgar Créditos' : 'Confirmar Descuento'}
                                        </>
                                    )}
                                </button>

                                {txStatus === 'success' && (
                                    <button 
                                        onClick={() => { playNeonClick(); resetPosnet(); }}
                                        className="w-full h-11 text-[8.5px] font-black uppercase tracking-widest cursor-pointer mt-2 neu-btn-3d"
                                    >
                                        Nueva Transacción
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTONES DE NAVEGACIÓN (NIVEL 2 PROTAGONISTAS DE NAVEGACIÓN) */}
            <div className="w-full max-w-sm mt-5 space-y-3.5 relative z-10">
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/${categorySlug}/${shopSlug}/panel-autogestion`); }}
                    className="w-full h-14 text-[9.5px] font-[1000] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 cursor-pointer neu-btn-3d group hover:border-[#ff6b6b]/60"
                >
                    <Store size={16} className="text-[#ff6b6b] group-hover:scale-110 transition-transform" />
                    <span>Panel de Autogestión</span>
                </button>
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                    className="w-full h-14 text-[9.5px] font-[1000] uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer neu-btn-3d group"
                >
                    <ArrowLeft size={15} className="text-[#4a3d6a] group-hover:-translate-x-1 transition-transform" />
                    <span>Volver al Inicio</span>
                </button>
            </div>

            {/* MODAL NEUMÓRFICO DE EDICIÓN DEL COMERCIO */}
            {isEditing && isAuthorized && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsEditing(false)} />
                    
                    <div className="relative w-full max-w-sm p-6 overflow-hidden transition-all neu-plate border-2 border-[#ff6b6b]/40">
                        <div className="flex justify-between items-center mb-5 relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-[#2c2440]">
                                <ShieldCheck size={18} className="text-[#ff6b6b]" /> Editar Comercio
                            </h3>
                            <button 
                                onClick={() => { playNeonClick(); setIsEditing(false); }} 
                                className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all neu-btn-pod"
                                aria-label="Cerrar"
                            >
                                <X size={16} className="text-[#2c2440]" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveShopProfile} className="space-y-4 relative z-10 max-h-[70vh] overflow-y-auto pr-1">
                            <div>
                                <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Nombre del Local</label>
                                <input 
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 text-xs rounded-xl focus:outline-none uppercase font-black neu-inset-title text-[#2c2440]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Titular</label>
                                    <input 
                                        required
                                        value={editForm.ownerName}
                                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                        className="w-full p-3 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Nro / DNI / CUIT</label>
                                    <input 
                                        required
                                        value={editForm.shopNumber}
                                        onChange={(e) => setEditForm({ ...editForm, shopNumber: e.target.value })}
                                        className="w-full p-3 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">WhatsApp</label>
                                    <input 
                                        required
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full p-3 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Email Autorizado</label>
                                    <input 
                                        required
                                        type="email"
                                        value={editForm.gmail}
                                        onChange={(e) => setEditForm({ ...editForm, gmail: e.target.value })}
                                        className="w-full p-3 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Dirección Física</label>
                                <input 
                                    required
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full p-3 text-xs rounded-xl focus:outline-none font-bold neu-inset-title text-[#2c2440]"
                                />
                            </div>

                            <div>
                                <label className="text-[8.5px] font-black uppercase tracking-widest mb-1.5 block text-[#4a3d6a]">Foto del Propietario</label>
                                <div className="flex gap-2.5 items-center">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-black/10 shrink-0">
                                        <img src={shop?.ownerPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80'} className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { playNeonClick(); fileInputRef.current?.click(); }}
                                        className="flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest cursor-pointer neu-btn-3d hover:border-[#ff6b6b]/50"
                                    >
                                        Subir Nueva Foto
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 flex items-center justify-center gap-2 font-[1000] uppercase tracking-[0.2em] text-[10px] cursor-pointer neu-btn-hero"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={16} className="text-[#ff6b6b]" strokeWidth={3} />
                                        <span>Guardar Cambios</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PIE DE PÁGINA NEUMÓRFICO FLOAT */}
            <div className="mt-8 mb-4 relative z-10">
                <div className="flex flex-col items-center gap-1.5 text-center transition-all neu-footer">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#2c2440]">
                        ID SEGURIDAD: SHOP-{selectedShop.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className="text-[7.5px] font-extrabold uppercase tracking-widest text-[#4a3d6a]">
                        ShopDigital.tech · Credencial Oficial
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CredencialPage;
