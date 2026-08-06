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
    CheckCircle, XCircle, Search, User, Store, MapPin, Zap, Lock, Radio,
    Camera, Edit2, Check, X, Award, Sparkles
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

    // Theme Mode Resolver (sincronizado con GlobalHomePage, ClientSubscriptionPage, SubscriptionPage y ClientVipCredentialPage)
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
            <div className={`min-h-screen flex flex-col items-center justify-center p-8 ${isDayMode ? 'bg-[#f0ece6]' : 'bg-[#0f0920]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className={`w-12 h-12 border-t-2 rounded-full animate-spin ${
                        isDayMode ? 'border-t-[#ff6b6b] border-[#4a3d6a]/20' : 'border-t-[#00fbff] border-purple-500/20'
                    }`} />
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest animate-pulse ${
                        isDayMode ? 'text-[#4a3d6a]' : 'text-[#00fbff]'
                    }`}>Autenticando Credencial de Comerciante...</span>
                </div>
            </div>
        );
    }

    // Unauthenticated State
    if (!user) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${
                isDayMode ? 'bg-[#faf7f2] text-[#2c2440]' : 'bg-[#0f0920] text-white'
            }`}>
                {!isDayMode && <CyberCircuitBackground />}

                <div className={`w-full max-w-sm rounded-[26px] p-8 relative z-10 transition-all ${
                    isDayMode 
                        ? 'neu-plate' 
                        : 'bg-[#181130]/90 border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.25)] backdrop-blur-xl'
                }`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${
                        isDayMode ? 'neu-inset-title' : 'bg-[#241747] border border-cyan-500/30'
                    }`}>
                        <Lock size={24} className={`animate-pulse ${isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'}`} />
                    </div>
                    <h2 className={`text-xl font-black uppercase tracking-tight text-center mb-1 ${isDayMode ? 'text-[#2c2440]' : 'text-white'}`}>
                        Credencial Protegida
                    </h2>
                    <p className={`text-[9px] font-bold uppercase tracking-widest text-center mb-8 ${isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-400/70'}`}>
                        Verificación B2B Comercio ShopDigital
                    </p>

                    <button
                        onClick={() => { playNeonClick(); login(); }}
                        className={`w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer ${
                            isDayMode ? 'neu-btn-3d-active' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg border border-cyan-400/40'
                        }`}
                    >
                        <User size={16} /> Iniciar Sesión con Google
                    </button>
                    
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className={`w-full h-14 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer mt-4 ${
                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-cyan-400/30 text-cyan-300 rounded-xl'
                        }`}
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
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${
                isDayMode ? 'bg-[#faf7f2] text-[#2c2440]' : 'bg-[#0f0920] text-white'
            }`}>
                {!isDayMode && <CyberCircuitBackground />}

                <div className={`w-full max-w-sm rounded-[26px] p-8 relative z-10 transition-all ${
                    isDayMode 
                        ? 'neu-plate border-2 border-[#ff6b6b]' 
                        : 'bg-red-950/30 border border-red-500/40 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.2)]'
                }`}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto bg-red-500/10 border border-red-500/30">
                        <Zap size={24} className="text-[#ff6b6b] animate-bounce" />
                    </div>
                    <h2 className="text-xl font-black text-[#ff6b6b] uppercase tracking-tight text-center mb-2">Acceso Denegado</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-wider leading-relaxed text-center mb-6 ${
                        isDayMode ? 'text-[#2c2440]' : 'text-red-300'
                    }`}>
                        El correo <span className="font-mono text-[#ff6b6b] bg-[#faf7f2] px-1.5 py-0.5 rounded border border-[#ff6b6b]/30">{user.email}</span> no cuenta con autorización para administrar la credencial de {selectedShop.name}.
                    </p>
                    <p className={`text-[8px] uppercase tracking-widest leading-normal mb-8 border-l-2 pl-3 ${
                        isDayMode ? 'text-[#4a3d6a] border-[#ff6b6b]' : 'text-white/50 border-red-500/40'
                    }`}>
                        Sistema Doberman B2B Security Audit activo.
                    </p>

                    <button
                        onClick={() => { playNeonClick(); logoutUser(); }}
                        className={`w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center cursor-pointer ${
                            isDayMode ? 'neu-btn-3d-active' : 'bg-red-600 text-white rounded-xl shadow-lg'
                        }`}
                    >
                        Cerrar Sesión / Cambiar Cuenta
                    </button>
                    
                    <button
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className={`w-full h-14 text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center cursor-pointer mt-4 ${
                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] text-white rounded-xl'
                        }`}
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const formattedTown = townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className={`min-h-screen flex flex-col items-center px-4 py-6 relative overflow-hidden transition-colors duration-500 ${
            isDayMode ? 'bg-[#faf7f2] text-[#2c2440]' : 'bg-[#0f0920] text-white'
        }`}>
            {/* Cyber Circuit Background for Dark Mode */}
            {!isDayMode && <CyberCircuitBackground />}

            {/* Ambient Ambient Glow in Day Mode */}
            {isDayMode && (
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#ff6b6b]/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-[#00fbff]/5 rounded-full blur-[120px]" />
                </div>
            )}

            {/* HEADER NEUMÓRFICO */}
            <div className="w-full max-w-sm relative z-10 flex justify-between items-center mb-5 gap-3">
                <button 
                    onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                    className={`w-11 h-11 flex items-center justify-center cursor-pointer transition-all ${
                        isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-cyan-400/30 text-cyan-300 rounded-xl shadow-lg'
                    }`}
                    aria-label="Regresar"
                >
                    <ArrowLeft size={18} className={isDayMode ? 'text-[#2c2440]' : 'text-[#00fbff]'} strokeWidth={3} />
                </button>

                <div className={`flex-1 text-center px-4 py-2 ${isDayMode ? 'neu-inset-title' : 'bg-[#150d2a]/90 border border-purple-500/30 rounded-full'}`}>
                    <h1 className={`text-base font-black tracking-tight uppercase leading-tight ${
                        isDayMode 
                            ? 'text-[#2c2440]' 
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-purple-400'
                    }`}>
                        Credencial Comerciante
                    </h1>
                    <p className={`text-[8px] font-extrabold uppercase tracking-widest ${isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-400/80'}`}>
                        {formattedTown}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        aria-label="Alternar modo de color"
                        className={`w-11 h-11 flex items-center justify-center cursor-pointer transition-all ${
                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-cyan-400/30 text-cyan-300 rounded-xl shadow-lg'
                        }`}
                    >
                        {isDayMode ? <Moon size={16} className="text-[#2c2440]" /> : <Sun size={16} className="text-[#00fbff]" />}
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
                        className={`w-11 h-11 flex items-center justify-center cursor-pointer transition-all ${
                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-cyan-400/30 text-cyan-300 rounded-xl shadow-lg'
                        }`}
                        aria-label="Compartir"
                    >
                        <Share2 size={16} className={isDayMode ? 'text-[#2c2440]' : 'text-[#00fbff]'} />
                    </button>
                </div>
            </div>

            {/* Brand Avatar Section / Ari 3D Floating */}
            {isDayMode && (
                <div className="flex flex-col items-center mb-3 mt-1 ari-3d-avatar-container select-none pointer-events-none z-20">
                    <img 
                        src="/ari-pointing.png" 
                        alt="ARI Asistente Credencial Comercio" 
                        className="h-28 w-auto object-contain drop-shadow-[0_8px_16px_rgba(180,165,148,0.4)]" 
                    />
                    <div className="ari-3d-shadow mt-1" />
                </div>
            )}

            {/* ═══════════ LIVE EVENT TICKER BANNER 🟢🔴 ═══════════ */}
            {activeEvent && (
                <div className="w-full max-w-sm mb-5 relative z-10 animate-in slide-in-from-top-4 duration-500">
                    {activeEvent.status === 'active_live' ? (
                        <div className={`p-4 flex flex-col items-center justify-center relative overflow-hidden ${
                            isDayMode 
                                ? 'neu-plate border-2 border-emerald-500/40' 
                                : 'bg-emerald-950/30 border border-emerald-400/40 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        }`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-center mb-1 ${isDayMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                🟢 EVENTO EN VIVO REGIONAL
                            </span>
                            <h3 className={`text-xs font-black uppercase tracking-wider text-center mb-2 ${isDayMode ? 'text-[#2c2440]' : 'text-white'}`}>
                                {activeEvent.name}
                            </h3>
                            <div className={`px-4 py-1 rounded-full text-center ${isDayMode ? 'neu-inset-title' : 'bg-emerald-500/20 border border-emerald-400/40'}`}>
                                <span className={`text-[9px] font-black uppercase tracking-widest block ${isDayMode ? 'text-emerald-800' : 'text-emerald-300'}`}>
                                    🎫 ACCESO VIP EXCLUSIVO INCLUIDO
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className={`p-4 flex flex-col items-center justify-center relative overflow-hidden ${
                            isDayMode 
                                ? 'neu-plate border-2 border-[#ff6b6b]/40' 
                                : 'bg-red-950/30 border border-red-400/40 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        }`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-center mb-1 ${isDayMode ? 'text-[#ff6b6b]' : 'text-red-400'}`}>
                                🔴 EVENTO REPROGRAMADO
                            </span>
                            <h3 className={`text-xs font-black uppercase tracking-wider text-center mb-1 ${isDayMode ? 'text-[#2c2440]' : 'text-white'}`}>
                                {activeEvent.name}
                            </h3>
                            <p className={`text-[8px] font-extrabold uppercase tracking-widest text-center ${isDayMode ? 'text-[#4a3d6a]' : 'text-red-300'}`}>
                                Consultar actualización vía Ari 🤖
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ CREDENCIAL COMERCIANTE PRINCIPAL ═══════════ */}
            <div className="w-full max-w-sm relative z-10">
                <div className={`p-6 flex flex-col items-center relative overflow-hidden transition-all ${
                    isDayMode 
                        ? 'neu-plate' 
                        : 'bg-[#181130]/95 border-2 border-purple-500/30 rounded-[28px] shadow-[0_0_50px_rgba(168,85,247,0.3)] backdrop-blur-2xl'
                }`}>
                    {/* SELLO DE TIEMPO E INVIOLABILIDAD */}
                    <div className={`w-full flex flex-col items-center justify-center gap-1 mb-5 py-2.5 px-4 relative overflow-hidden transition-all ${
                        isDayMode 
                            ? 'neu-inset-title' 
                            : 'bg-[#0d071c] border border-cyan-500/40 rounded-2xl shadow-[inset_0_0_12px_rgba(0,251,255,0.15)]'
                    }`}>
                        <div className="flex items-center gap-2 relative z-10">
                            <Clock size={13} className={`animate-spin ${isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'}`} style={{ animationDuration: '6s' }} />
                            <span className={`text-xs font-black font-mono tracking-widest tabular-nums ${
                                isDayMode ? 'text-[#2c2440]' : 'text-[#00fbff]'
                            }`}>
                                {formatClock(currentTime)}
                            </span>
                        </div>
                        <span className={`text-[7px] font-black uppercase tracking-widest ${
                            isDayMode ? 'text-[#ff6b6b]' : 'text-cyan-400'
                        }`}>
                            SELLO DE VERIFICACIÓN EN TIEMPO REAL
                        </span>
                    </div>

                    {/* Botón de Edición del Comercio */}
                    {isAuthorized && (
                        <button 
                            onClick={() => { playNeonClick(); setIsEditing(true); }}
                            className={`absolute top-4 right-4 w-9 h-9 flex items-center justify-center cursor-pointer z-25 transition-all ${
                                isDayMode ? 'neu-btn-3d' : 'bg-[#241747] border border-cyan-400/40 text-cyan-300 rounded-xl'
                            }`}
                            title="Editar Comercio"
                        >
                            <Edit2 size={14} className={isDayMode ? 'text-[#2c2440]' : 'text-[#00fbff]'} />
                        </button>
                    )}

                    {/* Foto Propietario / Logo Comercio */}
                    <div className={`relative w-24 h-24 rounded-full p-1 mb-4 flex-shrink-0 group/photo transition-all ${
                        isDayMode 
                            ? 'neu-plate' 
                            : 'bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-1 shadow-[0_0_25px_rgba(0,251,255,0.4)]'
                    }`}>
                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative bg-black/40">
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
                                    <Camera size={18} className="text-white mb-1" />
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white">Editar</span>
                                </button>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-full z-10">
                                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Nombre del Comercio */}
                    <h2 className={`text-xl font-black uppercase tracking-tight mb-1 text-center leading-tight ${
                        isDayMode ? 'text-[#2c2440]' : 'text-white'
                    }`}>
                        {shop?.name || selectedShop.name}
                    </h2>
                    <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-4 text-center ${
                        isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-400/80'
                    }`}>
                        {shop?.specialty || shop?.category || selectedShop.specialty || selectedShop.category}
                    </p>

                    {/* Insignia de Comercio Verificado */}
                    <div className={`flex items-center gap-2 mb-5 px-5 py-2 cursor-default transition-all ${
                        isDayMode ? 'neu-btn-3d-active' : 'bg-purple-600/30 border border-purple-400/50 rounded-full text-cyan-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    }`}>
                        <ShieldCheck className={`w-4 h-4 ${isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                            isDayMode ? 'text-[#2c2440]' : 'text-cyan-200'
                        }`}>
                            {isEnterprise ? 'Empresa Industrial Verificada' : 'Comercio Acreditado VIP'}
                        </span>
                    </div>

                    {/* Grilla de Datos Neumórfica */}
                    <div className="w-full grid grid-cols-2 gap-3 mb-5">
                        <div className={`p-3 transition-all ${
                            isDayMode ? 'neu-inset-title' : 'bg-[#0d071c] border border-purple-500/20 rounded-2xl'
                        }`}>
                            <p className={`text-[7px] font-extrabold uppercase tracking-widest mb-1 ${
                                isDayMode ? 'text-[#4a3d6a]' : 'text-purple-300/70'
                            }`}>Titular</p>
                            <p className={`text-[11px] font-black uppercase tracking-tight truncate ${
                                isDayMode ? 'text-[#2c2440]' : 'text-white'
                            }`}>
                                {shop?.ownerName || selectedShop.ownerName || 'Sin Registrar'}
                            </p>
                        </div>
                        
                        <div className={`p-3 transition-all ${
                            isDayMode ? 'neu-inset-title' : 'bg-[#0d071c] border border-purple-500/20 rounded-2xl'
                        }`}>
                            <p className={`text-[7px] font-extrabold uppercase tracking-widest mb-1 ${
                                isDayMode ? 'text-[#4a3d6a]' : 'text-purple-300/70'
                            }`}>{isEnterprise ? 'ID Empresa' : 'ID Comercio'}</p>
                            <p className={`text-[11px] font-black tracking-tight truncate ${
                                isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'
                            }`}>
                                {shop?.shopNumber || selectedShop.shopNumber || selectedShop.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                        
                        <div className={`p-3 col-span-2 transition-all ${
                            isDayMode ? 'neu-inset-title' : 'bg-[#0d071c] border border-purple-500/20 rounded-2xl'
                        }`}>
                            <p className={`text-[7px] font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1 ${
                                isDayMode ? 'text-[#4a3d6a]' : 'text-purple-300/70'
                            }`}>
                                <MapPin size={8} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} /> Dirección Física
                            </p>
                            <p className={`text-[10px] font-bold truncate ${
                                isDayMode ? 'text-[#2c2440]' : 'text-white/80'
                            }`}>{shop?.address || selectedShop.address}</p>
                        </div>
                    </div>

                    {/* QR Code Container */}
                    <div className={`w-full p-5 flex flex-col items-center mb-5 relative group/qr overflow-hidden transition-all ${
                        isDayMode ? 'neu-plate' : 'bg-[#0d071c] border border-cyan-500/30 rounded-2xl shadow-[0_0_20px_rgba(0,251,255,0.15)]'
                    }`}>
                        <div className="bg-white p-3.5 rounded-2xl mb-3 shadow-md relative z-10 border border-[#f0ece6]">
                            <QRCodeCanvas
                                value={validationUrl}
                                size={140}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: shop?.ownerPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
                                    x: undefined, y: undefined,
                                    height: 28, width: 28, excavate: true,
                                }}
                            />
                        </div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${
                            isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-400'
                        }`}>
                            Código de Validación QR
                        </p>
                    </div>

                    {/* 🛰️ SINTONIZADOR DE ACCESO / EVENTOS LIVE */}
                    <div className={`w-full p-4 space-y-3 relative overflow-hidden mb-5 z-10 transition-all ${
                        isDayMode 
                            ? 'neu-inset-title' 
                            : 'bg-[#0d071c] border border-purple-500/30 rounded-2xl'
                    }`}>
                        <div className="flex justify-between items-center">
                            <label className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                isDayMode ? 'text-[#2c2440]' : 'text-cyan-300'
                            }`}>
                                <Radio size={12} className={`animate-pulse ${isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'}`} /> Sintonizador B2B
                            </label>
                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                isDayMode ? 'neu-btn-3d-active text-[8px] py-0.5' : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                            }`}>
                                LIVE SIGNAL
                            </span>
                        </div>
                        
                        {sintonizadorEventData && (
                            <div className="space-y-2">
                                <p className={`text-[12px] font-black uppercase tracking-tight leading-snug ${
                                    isDayMode ? 'text-[#2c2440]' : 'text-white'
                                }`}>
                                    {sintonizadorEventData.name}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-wider ${
                                    isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-300/80'
                                }`}>
                                    {sintonizadorEventData.details}
                                </p>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-xl w-fit bg-emerald-500/10 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-widest">
                                        {sintonizadorEventData.access}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Membresía */}
                    <div className="w-full flex justify-between items-center text-[9px] font-black uppercase tracking-widest pt-2">
                        <span className={isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'}>Membresía Comercio</span>
                        <span className={`font-black ${
                            selectedShop.isActive 
                                ? 'text-emerald-600' 
                                : isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'
                        }`}>
                            {selectedShop.isActive ? '⚡ HABILITADA VIP' : '⏳ EN REVISIÓN'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════════ POSNET DE CRÉDITOS INTEGRADO ═══════════ */}
            <div className="w-full max-w-sm mt-6 relative z-10 space-y-4">
                {!posnetOpen ? (
                    <button
                        onClick={() => { playNeonClick(); setPosnetOpen(true); }}
                        className={`w-full h-15 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer ${
                            isDayMode ? 'neu-btn-3d-active' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg border border-cyan-400/40'
                        }`}
                    >
                        <CreditCard size={18} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} />
                        <span>Abrir POSNET de Créditos</span>
                    </button>
                ) : (
                    <div className={`p-6 space-y-4 transition-all ${
                        isDayMode 
                            ? 'neu-plate' 
                            : 'bg-[#181130]/90 border border-purple-500/30 rounded-[28px] backdrop-blur-xl'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-2 ${
                                isDayMode ? 'text-[#2c2440]' : 'text-cyan-300'
                            }`}>
                                <CreditCard size={15} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} /> POSNET de Créditos
                            </h3>
                            <button 
                                onClick={() => { playNeonClick(); setPosnetOpen(false); resetPosnet(); }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer ${
                                    isDayMode ? 'neu-btn-3d' : 'bg-white/10 text-white/60 hover:text-white'
                                }`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Selección Cargar / Descontar */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { playNeonClick(); setPosnetMode('load'); setTxStatus('idle'); }}
                                className={`py-3 rounded-xl font-black uppercase tracking-wider text-[9px] flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                    posnetMode === 'load'
                                        ? isDayMode 
                                            ? 'neu-btn-3d-active border-emerald-500 text-emerald-700' 
                                            : 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                        : isDayMode 
                                            ? 'neu-btn-3d text-[#4a3d6a]' 
                                            : 'bg-[#1e153b] text-white/50 border border-cyan-400/20'
                                }`}
                            >
                                <ArrowUpRight size={16} />
                                Cargar Créditos
                            </button>

                            <button
                                onClick={() => { playNeonClick(); setPosnetMode('spend'); setTxStatus('idle'); }}
                                className={`py-3 rounded-xl font-black uppercase tracking-wider text-[9px] flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                    posnetMode === 'spend'
                                        ? isDayMode 
                                            ? 'neu-btn-3d-active border-[#ff6b6b] text-[#ff6b6b]' 
                                            : 'bg-red-600 text-white border border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                                        : isDayMode 
                                            ? 'neu-btn-3d text-[#4a3d6a]' 
                                            : 'bg-[#1e153b] text-white/50 border border-cyan-400/20'
                                }`}
                            >
                                <ArrowDownRight size={16} />
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
                                        className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                        autoFocus
                                    />
                                    <Search size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 opacity-40 ${isDayMode ? 'text-[#2c2440]' : 'text-white'}`} />
                                </div>
                                {filteredClients.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => { playNeonClick(); setSelectedClient(c); setSearchTerm(''); setTxStatus('idle'); }}
                                        className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left cursor-pointer transition-all ${
                                            isDayMode 
                                                ? 'neu-btn-3d hover:border-[#ff6b6b]' 
                                                : 'bg-[#0d071c] border border-purple-500/20 text-white hover:border-cyan-400/40'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover rounded-full" alt="" /> : <User size={12} className="opacity-40" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-wider truncate">{c.name}</p>
                                            <p className={`text-[8px] ${isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-400/70'}`}>{c.dni || 'Sin DNI'} · 💰 {c.credits || 0} crs</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className={`p-3 rounded-xl flex items-center gap-3 relative ${
                                    isDayMode ? 'neu-inset-title' : 'bg-[#0d071c] border border-cyan-400/30'
                                }`}>
                                    <button 
                                        onClick={() => { playNeonClick(); resetPosnet(); }}
                                        className="absolute top-2 right-2 text-xs opacity-50 hover:opacity-100 border-none bg-transparent cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black/10 flex-shrink-0">
                                        {selectedClient.photo ? <img src={selectedClient.photo} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center"><User size={16} className="opacity-30" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-black uppercase tracking-wider truncate">{selectedClient.name}</p>
                                        <p className={`text-[8.5px] ${isDayMode ? 'text-[#4a3d6a]' : 'text-cyan-300'}`}>Saldo actual: <span className="font-black tabular-nums">{selectedClient.credits || 0}</span> créditos</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0"
                                        className={`w-full p-3 text-2xl font-black tabular-nums text-center focus:outline-none ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                    />
                                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black opacity-50 uppercase tracking-widest ${
                                        isDayMode ? 'text-[#4a3d6a]' : 'text-white'
                                    }`}>CRÉDITOS</span>
                                </div>

                                {txStatus === 'success' && (
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-3">
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
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 flex items-center gap-3">
                                        <XCircle size={18} className="text-red-500 flex-shrink-0" />
                                        <p className="text-[9px] font-black text-red-600 text-left">{errorMsg}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleTransaction}
                                    disabled={isProcessing || !amount}
                                    className={`w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer ${
                                        isDayMode ? 'neu-btn-3d-active' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {posnetMode === 'load' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            {posnetMode === 'load' ? 'Otorgar Créditos' : 'Confirmar Descuento'}
                                        </>
                                    )}
                                </button>

                                {txStatus === 'success' && (
                                    <button 
                                        onClick={() => { playNeonClick(); resetPosnet(); }}
                                        className={`w-full h-10 text-[8px] font-black uppercase tracking-widest cursor-pointer mt-2 ${
                                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] text-white rounded-xl'
                                        }`}
                                    >
                                        Nueva Transacción
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="w-full max-w-sm mt-5 space-y-3 relative z-10">
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/${categorySlug}/${shopSlug}/panel-autogestion`); }}
                    className={`w-full h-14 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer ${
                        isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-cyan-400/30 text-cyan-300 rounded-xl shadow-lg'
                    }`}
                >
                    <Store size={15} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} /> Panel de Autogestión
                </button>
                <button
                    onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                    className={`w-full h-14 text-[9px] font-black uppercase tracking-widest flex items-center justify-center cursor-pointer ${
                        isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] border border-purple-500/30 text-white rounded-xl shadow-lg'
                    }`}
                >
                    Volver al Inicio
                </button>
            </div>

            {/* MODAL NEUMÓRFICO DE EDICIÓN DEL COMERCIO */}
            {isEditing && isAuthorized && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsEditing(false)} />
                    
                    <div className={`relative w-full max-w-sm p-6 overflow-hidden transition-all ${
                        isDayMode 
                            ? 'neu-plate' 
                            : 'bg-[#181130] border-2 border-cyan-400/40 rounded-[28px] text-white shadow-[0_0_50px_rgba(0,251,255,0.3)]'
                    }`}>
                        <div className="flex justify-between items-center mb-5 relative z-10">
                            <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                                isDayMode ? 'text-[#2c2440]' : 'text-white'
                            }`}>
                                <ShieldCheck size={18} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} /> Editar Comercio
                            </h3>
                            <button 
                                onClick={() => { playNeonClick(); setIsEditing(false); }} 
                                className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                                    isDayMode ? 'neu-btn-3d' : 'bg-white/10 text-cyan-300'
                                }`}
                                aria-label="Cerrar"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveShopProfile} className="space-y-4 relative z-10 max-h-[70vh] overflow-y-auto pr-1">
                            <div>
                                <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                    isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                }`}>Nombre del Local</label>
                                <input 
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className={`w-full p-3 text-xs rounded-xl focus:outline-none uppercase font-black ${
                                        isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                    }`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                        isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                    }`}>Titular</label>
                                    <input 
                                        required
                                        value={editForm.ownerName}
                                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                        className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                        isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                    }`}>Nro / DNI / CUIT</label>
                                    <input 
                                        required
                                        value={editForm.shopNumber}
                                        onChange={(e) => setEditForm({ ...editForm, shopNumber: e.target.value })}
                                        className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                        isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                    }`}>WhatsApp</label>
                                    <input 
                                        required
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                        isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                    }`}>Email Autorizado</label>
                                    <input 
                                        required
                                        type="email"
                                        value={editForm.gmail}
                                        onChange={(e) => setEditForm({ ...editForm, gmail: e.target.value })}
                                        className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                            isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                    isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                }`}>Dirección Física</label>
                                <input 
                                    required
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className={`w-full p-3 text-xs rounded-xl focus:outline-none font-bold ${
                                        isDayMode ? 'neu-inset-title text-[#2c2440]' : 'bg-[#0d071c] border border-cyan-400/30 text-white'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className={`text-[8.5px] font-black uppercase tracking-widest mb-1.5 block ${
                                    isDayMode ? 'text-[#4a3d6a]' : 'text-white/70'
                                }`}>Foto del Propietario</label>
                                <div className="flex gap-2.5 items-center">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-black/10 shrink-0">
                                        <img src={shop?.ownerPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80'} className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { playNeonClick(); fileInputRef.current?.click(); }}
                                        className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest cursor-pointer ${
                                            isDayMode ? 'neu-btn-3d' : 'bg-[#1e153b] text-cyan-300 rounded-xl'
                                        }`}
                                    >
                                        Subir Nueva Foto
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSaving}
                                className={`w-full py-4 flex items-center justify-center gap-2 font-black uppercase tracking-wider text-[10px] cursor-pointer ${
                                    isDayMode ? 'neu-btn-3d-active' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg'
                                }`}
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={16} className={isDayMode ? 'text-[#ff6b6b]' : 'text-[#00fbff]'} strokeWidth={3} />
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
                <div className={`flex flex-col items-center gap-1.5 text-center transition-all ${
                    isDayMode ? 'neu-footer' : 'bg-[#150d2a] border border-purple-500/30 rounded-full px-6 py-3 text-white'
                }`}>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${
                        isDayMode ? 'text-[#2c2440]' : 'text-cyan-400'
                    }`}>
                        ID SEGURIDAD: SHOP-{selectedShop.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`text-[7.5px] font-extrabold uppercase tracking-widest ${
                        isDayMode ? 'text-[#4a3d6a]' : 'text-purple-300/60'
                    }`}>
                        ShopDigital.tech · Credencial Oficial
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CredencialPage;
