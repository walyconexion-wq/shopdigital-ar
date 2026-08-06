import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shop, Client, LiveEvent } from '../types';
import { db, suscribirseAEventos } from '../firebase';
import { actualizarFotoCliente, actualizarDatosCliente } from '../firebaseVIP';
import { useAuth } from '../components/AuthContext';
import { 
    ShieldCheck, 
    Star, 
    QrCode, 
    ChevronLeft,
    ArrowLeft,
    Share2,
    Activity,
    User,
    AlertTriangle,
    MapPin,
    Calendar,
    IdCard,
    Clock,
    Camera,
    Wallet,
    CheckCircle2,
    X,
    Ticket,
    Edit2,
    Check,
    Radio,
    Wifi,
    WifiOff,
    Moon,
    Sun
} from 'lucide-react';
import { playNeonClick, playSuccessSound } from '../utils/audio';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

interface ClientVipCredentialPageProps {
    allShops: Shop[];
    allClients: Client[];
}

const ClientVipCredentialPage: React.FC<ClientVipCredentialPageProps> = ({ allShops, allClients }) => {
    const { townId = 'esteban-echeverria', categorySlug, shopSlug, clientId } = useParams<{ 
        townId: string, 
        categorySlug: string, 
        shopSlug: string,
        clientId?: string
    }>();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    // --- STATE ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

    // Client State Rescue
    const [client, setClient] = useState<Client | null>(null);
    const [isLoadingClient, setIsLoadingClient] = useState(true);

    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        email: '',
        dni: '',
        photo: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Theme Mode Resolver (sincronizado con GlobalHomePage, ClientSubscriptionPage y SubscriptionPage)
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

    // Subscribe to live events
    useEffect(() => {
        const unsubscribe = suscribirseAEventos((events) => {
            setLiveEvents(events);
        });
        return () => unsubscribe();
    }, []);

    // Load or rescue client
    useEffect(() => {
        if (!clientId) {
            setIsLoadingClient(false);
            return;
        }
        
        const found = allClients.find(c => c.id === clientId);
        if (found) {
            setClient(found);
            setEditForm({
                name: found.name || '',
                phone: found.phone || '',
                email: found.email || '',
                dni: found.dni || '',
                photo: found.photo || ''
            });
            setIsLoadingClient(false);
            return;
        }

        const fetchDirect = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const docRef = doc(db, 'clientes', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Client;
                    setClient(data);
                    setEditForm({
                        name: data.name || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        dni: data.dni || '',
                        photo: data.photo || ''
                    });
                }
            } catch (err) {
                console.error("Error al rescatar cliente:", err);
            } finally {
                setIsLoadingClient(false);
            }
        };
        
        fetchDirect();
    }, [allClients, clientId]);

    // Authorization checks
    const userEmail = user?.email?.trim().toLowerCase() || null;
    const isClientOwner = userEmail && client && userEmail === client.email.trim().toLowerCase();
    const isDG = userEmail === 'walyconexion@gmail.com';
    const isAuthorized = isClientOwner || role === 'admin' || isDG;

    // Match active event with client's active ticket
    const ticketEvent = useMemo(() => {
        if (!client?.activeTicket?.eventId) return null;
        return liveEvents.find(e => e.id === client.activeTicket?.eventId);
    }, [liveEvents, client?.activeTicket?.eventId]);

    // Active event for client zone if they don't have a ticket
    const generalActiveEvent = useMemo(() => {
        if (client?.activeTicket) return null;
        return liveEvents.find(e => 
            (e.status === 'active_live' || e.status === 'suspended') &&
            e.targetRoles.includes('cliente_calle')
        );
    }, [liveEvents, client]);

    const sintonizadorEventData = useMemo(() => {
        if (client?.eventPassEnabled === false) return null;
        if (client?.activeTicket && ticketEvent) {
            return {
                name: ticketEvent.name,
                details: `SECTOR: ${client.activeTicket.seatSector || 'General VIP'} · FILA: ${client.activeTicket.fila || '-'} · ASIENTO: ${client.activeTicket.asiento || '-'}`,
                access: 'PASE VIP ACTIVO',
                isTicket: true
            };
        }
        if (generalActiveEvent) {
            return {
                name: generalActiveEvent.name,
                details: `ARTISTA: ${generalActiveEvent.artist || 'Red ShopDigital'} · LOCALIDAD: ${generalActiveEvent.targetLocalities.join(', ').toUpperCase()}`,
                access: 'ENTRADA LIBRE',
                isTicket: false
            };
        }
        // Fallback mock event for demonstration
        return {
            name: "Jazz & Pizza VIP Night - Monte Grande 🎷",
            details: "ARTISTA: GUSTAVO DIAZ QUINTET · ACCESO EXCLUSIVO CON CREDENCIAL VIP",
            access: "PASE VIP ACTIVO",
            isTicket: false
        };
    }, [client, ticketEvent, generalActiveEvent]);

    // Encontrar el comercio origen
    const shop = useMemo(() => {
        if (!shopSlug) return null;
        let found = allShops.find(s => (s.slug === shopSlug || s.id === shopSlug));
        if (!found || shopSlug === 'club') {
            if (client?.sourceShopId) {
                found = allShops.find(s => s.id === client.sourceShopId);
            }
        }
        return found;
    }, [allShops, shopSlug, client]);

    // Sello de vida clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatClock = (date: Date) => {
        const d = date.toLocaleDateString('es-AR');
        const t = date.toLocaleTimeString('es-AR');
        return `${d} - ${t}`;
    };

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
        if (!file || !clientId) return;

        setIsUploading(true);
        try {
            const compressed = await compressImage(file);
            await actualizarFotoCliente(clientId, compressed);
            setEditForm(prev => ({ ...prev, photo: compressed }));
            if (client) {
                setClient({ ...client, photo: compressed });
            }
            playSuccessSound();
        } catch (err) {
            console.error("Error subiendo foto:", err);
            alert("Error al cargar y comprimir la foto.");
        } finally {
            setIsUploading(false);
        }
    };

    // Toggle live events receiver
    const handleToggleEventReceiver = async () => {
        if (!client || !clientId) return;
        playNeonClick();
        const nextValue = client.eventPassEnabled === false ? true : false;
        try {
            await actualizarDatosCliente(clientId, { eventPassEnabled: nextValue });
            setClient({ ...client, eventPassEnabled: nextValue });
            playSuccessSound();
        } catch (err) {
            console.error("Error al actualizar sintonizador de eventos:", err);
        }
    };

    // Save profile from edit panel
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !client) return;
        playNeonClick();
        setIsSaving(true);
        try {
            const updatedData = {
                name: editForm.name.toUpperCase().trim(),
                phone: editForm.phone.replace(/\D/g, ''),
                email: editForm.email.trim().toLowerCase(),
                dni: editForm.dni.trim(),
                photo: editForm.photo
            };
            await actualizarDatosCliente(clientId, updatedData);
            setClient({
                ...client,
                ...updatedData
            });
            setIsEditing(false);
            playSuccessSound();
        } catch (err) {
            console.error("Error guardando datos:", err);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingClient) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-transparent">
                <CyberCircuitBackground />
                <div className="relative z-10 neu-plate p-8 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 rounded-full animate-spin border-[#4a3d6a]/20 border-t-[#ff6b6b]" />
                    <p className="text-[10px] uppercase tracking-widest font-black animate-pulse text-[#4a3d6a]">
                        Sincronizando Identidad...
                    </p>
                </div>
            </div>
        );
    }

    if (!shop || !client) {
        const targetHome = townId ? `/${townId}/home` : '/esteban-echeverria/home';
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-transparent">
                <CyberCircuitBackground />
                <div className="relative z-10 w-full max-w-sm p-8 neu-plate flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto border-2 border-[#ff6b6b]/30 bg-red-500/10">
                        <ShieldCheck size={40} className="text-[#ff6b6b] animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-2 text-[#2c2440]">Socio No Encontrado</h2>
                    <p className="text-[10px] uppercase mb-8 leading-relaxed text-[#4a3d6a]">
                        La credencial no pertenece a este radar o ha sido revocada.
                    </p>
                    <button 
                        onClick={() => { playNeonClick(); navigate(targetHome); }} 
                        className="w-full h-14 text-[10px] font-black uppercase tracking-[0.25em] neu-btn-hero flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const isSuspended = client.status === 'suspended';
    const formattedTown = townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="min-h-screen w-full flex flex-col items-center px-4 py-6 relative overflow-y-auto selection:bg-cyan-500/30 bg-transparent text-[#2c2440]">
            {/* Estilos premium para inputs del modal */}
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

            {/* Fondo Ciber-Digital Púrpura Animado */}
            <CyberCircuitBackground />

            {/* ══════════════════════════════════════════
                CABECERA SUPERIOR EN CONTENEDOR ESMERILADO TECNOLÓGICO
            ══════════════════════════════════════════ */}
            <div className="w-full max-w-sm relative z-10 mb-6 p-4 rounded-[2.5rem] bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_10px_32px_rgba(44,36,64,0.15)] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                {/* HEADER NEUMÓRFICO CON PODS DE CABECERA */}
                <div className="w-full flex justify-between items-center gap-2">
                    <button 
                        onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                        className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group shrink-0"
                        aria-label="Regresar"
                    >
                        <ArrowLeft size={18} className="text-[#2c2440] group-hover:-translate-x-0.5 transition-transform" strokeWidth={3} />
                    </button>

                    <div className="flex-1 text-center px-3 py-1.5 neu-inset-title">
                        <h1 className="text-sm font-black tracking-tight uppercase leading-tight text-[#2c2440]">
                            Credencial VIP Cliente
                        </h1>
                        <p className="text-[7.5px] font-extrabold uppercase tracking-widest text-[#4a3d6a]">
                            {formattedTown}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={toggleTheme}
                            aria-label="Alternar modo de color"
                            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                        >
                            {isDayMode 
                                ? <Moon size={16} className="text-[#2c2440] group-hover:rotate-12 transition-transform" />
                                : <Sun size={16} className="text-[#ff6b6b] group-hover:rotate-45 transition-transform" />
                            }
                        </button>
                        <button 
                            onClick={() => {
                                playNeonClick();
                                if (navigator.share) {
                                    navigator.share({
                                        title: `Credencial VIP de ${client.name}`,
                                        text: `Mirá mi Credencial VIP en ShopDigital: ${shop.name}`,
                                        url: window.location.href,
                                     });
                                }
                            }}
                            className="w-10 h-10 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                            aria-label="Compartir"
                        >
                            <Share2 size={16} className="text-[#2c2440] group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Avatar ARI Integrado */}
                {isDayMode && (
                    <div className="flex flex-col items-center select-none pointer-events-none my-1">
                        <img 
                            src="/ari-pointing.png" 
                            alt="ARI Asistente Credencial" 
                            className="h-28 w-auto object-contain drop-shadow-[0_8px_16px_rgba(44,36,64,0.25)] animate-in fade-in duration-700" 
                        />
                        <div className="ari-3d-shadow mt-1" />
                    </div>
                )}

                {/* SELLO DE VIDA — TIMESTAMP ANTI-FALSIFICACIÓN INTEGRADO */}
                <div className="w-full flex items-center justify-between neu-inset-title px-4 py-2">
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#4a3d6a] animate-spin flex-shrink-0" style={{ animationDuration: '8s' }} />
                        <p className="text-[9.5px] font-black font-mono tracking-widest tabular-nums text-[#2c2440]">
                            {formatClock(currentTime)}
                        </p>
                    </div>
                    <div className="h-3.5 w-[1px] bg-[#4a3d6a]/20" />
                    <button 
                        onClick={handleToggleEventReceiver}
                        className={`flex items-center gap-1.5 border-none bg-transparent font-black text-[9px] uppercase tracking-widest cursor-pointer transition-colors ${
                            client.eventPassEnabled !== false ? 'text-emerald-600' : 'text-[#4a3d6a]/40'
                        }`}
                    >
                        {client.eventPassEnabled !== false ? (
                            <>
                                <Wifi size={12} className="animate-pulse" />
                                <span>ON</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={12} />
                                <span>OFF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                TARJETA VIP PRINCIPAL — NEUMÓRFICA
            ══════════════════════════════════════════ */}
            <div className="w-full max-w-sm relative z-10 animate-in zoom-in duration-700 delay-100">
                <div className="neu-plate p-8 pb-10 relative overflow-hidden">

                    {/* Overlay suspensión */}
                    {isSuspended && (
                        <div className="absolute inset-0 z-50 bg-red-600/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(239,68,68,0.05)_20px,rgba(239,68,68,0.05)_40px)]" />
                            <div className="bg-red-600 px-6 py-2 rounded-xl shadow-lg rotate-[-5deg] mb-4">
                                <h4 className="text-xl font-[1000] text-white uppercase tracking-widest">CUENTA SUSPENDIDA</h4>
                            </div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest max-w-[200px] leading-relaxed">
                                Contacte con {shop.name} para regularizar su situación de membresía.
                            </p>
                        </div>
                    )}

                    {/* Top Row: Badge + Edit + Star */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="px-3 py-1.5 rounded-full flex items-center gap-2 neu-btn-pod">
                            <Activity size={10} className="animate-pulse text-[#ff6b6b]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#2c2440]">SOCIO VIP ACTIVO</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAuthorized && (
                                <button 
                                    onClick={() => { playNeonClick(); setIsEditing(true); }}
                                    className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                                    title="Editar Perfil"
                                >
                                    <Edit2 size={14} className="text-[#2c2440] group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                            <Star size={24} className="text-[#ff6b6b]" style={{ fill: '#ff6b6b', color: '#ff6b6b' }} />
                        </div>
                    </div>

                    {/* Titular VIP */}
                    <div className="mb-8 relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 text-[#4a3d6a]">Titular VIP</p>
                        <h3 className="text-3xl font-[1000] uppercase tracking-tighter leading-none mb-2 text-[#2c2440]">
                            {client.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[#4a3d6a]">
                            <MapPin size={12} className="text-[#ff6b6b]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{shop.zone || formattedTown}</span>
                        </div>
                    </div>

                    {/* Foto / Avatar VIP */}
                    <div className="w-full aspect-square neu-inset-title flex flex-col items-center justify-center p-8 mb-8 relative overflow-hidden group/photo transition-all duration-500">
                        <div className="relative w-40 h-40 rounded-full border-2 border-[#4a3d6a]/20 p-1 shadow-lg overflow-hidden group-hover/photo:scale-105 transition-transform duration-500 neu-btn-pod">
                            <img 
                                src={client.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80'} 
                                className="w-full h-full object-cover rounded-full" 
                                alt={client.name} 
                            />
                            
                            {isAuthorized && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity border-none cursor-pointer rounded-full"
                                >
                                    <Camera size={32} className="text-white mb-2" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white">{client.photo ? 'Editar Foto' : 'Subir Foto'}</span>
                                </button>
                            )}
                            
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-full">
                                    <div className="w-8 h-8 border-3 border-[#4a3d6a]/20 border-t-[#ff6b6b] rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 px-5 py-2 neu-btn-pod">
                            <p className="text-[10px] font-black tracking-[0.3em] flex items-center gap-2 text-[#2c2440]">
                                <CheckCircle2 size={12} className="text-emerald-600" /> IDENTIDAD VERIFICADA
                            </p>
                        </div>
                    </div>

                    {/* Info Membresía */}
                    <div className="space-y-5 border-t-2 border-[#4a3d6a]/10 pt-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-[#4a3d6a]">Local de Suscripción</p>
                                <p className="text-[15px] font-[1000] tracking-tighter uppercase leading-tight text-[#2c2440]">
                                    {shop.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-[#4a3d6a]">Nro. de Membresía (DNI)</p>
                                <p className={`text-[15px] font-black tracking-tighter uppercase leading-tight flex items-center justify-end gap-1 ${client.dni ? 'text-[#2c2440]' : 'text-[#ff6b6b] animate-pulse'}`}>
                                    <IdCard size={14} className="opacity-40" /> {client.dni || "COMPLETAR DNI"}
                                </p>
                            </div>
                        </div>

                        {/* Wallet de Créditos */}
                        <div className="p-5 neu-plate flex justify-between items-center group/wallet">
                            <div>
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 text-[#4a3d6a]">
                                    <Wallet size={10} className="text-[#ff6b6b]" /> Créditos ShopDigital
                                </label>
                                <p className="text-2xl font-[1000] font-inter tabular-nums text-[#2c2440]">
                                    {client.credits || 0}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest neu-inset-title text-[#4a3d6a]">
                                    DISPONIBLES
                                </div>
                            </div>
                        </div>

                        {/* 🛰️ SINTONIZADOR DE ACCESO / EVENTOS LIVE */}
                        <div className="rounded-[2rem] p-6 space-y-4 relative overflow-hidden bg-[#2c2440] border-2 border-[#4a3d6a] shadow-lg">
                            <div className="flex justify-between items-center relative z-10">
                                <label className="text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2 text-amber-400">
                                    <Radio size={12} className="animate-pulse text-amber-400" /> Sintonizador de Acceso
                                </label>
                                <span className="text-[8px] font-[900] border px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse bg-amber-500/20 border-amber-400/40 text-amber-300">
                                    LIVE SINFONÍA
                                </span>
                            </div>
                            
                            {client.eventPassEnabled !== false && sintonizadorEventData ? (
                                <div className="space-y-3.5 relative z-10">
                                    <p className="text-[13px] font-[1000] uppercase tracking-tight leading-snug text-white">
                                        {sintonizadorEventData.name}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed text-amber-300/90">
                                        {sintonizadorEventData.details}
                                    </p>
                                    <div className="flex items-center gap-2 border px-3 py-1.5 rounded-xl w-fit bg-emerald-500/20 border-emerald-500/40">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        <span className="text-[9px] font-[1000] text-emerald-400 uppercase tracking-widest">
                                            {sintonizadorEventData.access}
                                        </span>
                                    </div>
                                    <p className="text-[7.5px] font-bold uppercase tracking-widest leading-relaxed text-white/50">
                                        Control de Puerta: Permitir acceso y verificar DNI/Membresía.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-widest italic text-white/50">
                                        {client.eventPassEnabled === false ? 'Sintonizador inactivo (OFF)' : 'Buscando transmisiones...'}
                                    </p>
                                    <p className="text-[8px] font-bold uppercase tracking-wider leading-relaxed text-white/40">
                                        {client.eventPassEnabled === false 
                                            ? 'Active el sintonizador arriba para recibir pases de eventos live.' 
                                            : 'Sin eventos live activos en este radar. Acceso comercial estándar.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                QR DE VALIDACIÓN
            ══════════════════════════════════════════ */}
            <div className="w-full max-w-sm mt-6 relative z-10">
                <div className="neu-plate p-8 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-5 text-[#4a3d6a]">Validación de Descuentos</p>
                    <div className="neu-inset-title p-4 relative group/qr">
                        <QrCode size={160} className="text-[#2c2440] transition-transform group-hover/qr:scale-105 duration-500" />
                    </div>
                    <p className="text-[8px] text-[#4a3d6a]/60 uppercase tracking-widest mt-4 text-center">
                        Escaneá en el punto de acceso para validar
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                BOTONES DE ACCIÓN — JERARQUÍA 3D
            ══════════════════════════════════════════ */}
            <div className="w-full max-w-sm mt-6 space-y-3 relative z-10 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                <button 
                    onClick={() => { playNeonClick(); navigate(`/${townId}/red-comercial/ofertas`); }}
                    className="w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] neu-btn-hero flex items-center justify-center gap-3 cursor-pointer"
                >
                    <Star size={16} className="text-[#ff6b6b]" />
                    <span className="text-[#2c2440]">Explorar Beneficios VIP</span>
                </button>
                <button 
                    onClick={() => { playNeonClick(); navigate(`/${townId}/home`); }}
                    className="w-full h-14 text-[10px] font-extrabold uppercase tracking-[0.2em] neu-btn-3d flex items-center justify-center gap-2 cursor-pointer"
                >
                    <ArrowLeft size={16} className="text-[#4a3d6a]" /> Volver al Inicio
                </button>
            </div>

            {/* MODAL DE EDICIÓN DEL CLIENTE VIP */}
            {isEditing && isAuthorized && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
                    
                    <div className="relative w-full max-w-sm neu-plate p-8 overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-[#2c2440]">
                                <ShieldCheck size={18} className="text-[#ff6b6b]" /> Editar Perfil VIP
                            </h3>
                            <button 
                                onClick={() => { playNeonClick(); setIsEditing(false); }} 
                                className="w-9 h-9 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                                aria-label="Cerrar"
                            >
                                <X size={16} className="text-[#2c2440] group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div>
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 block text-[#4a3d6a]">Nombre del Titular</label>
                                <input 
                                    required
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 text-sm rounded-xl focus:outline-none uppercase font-black premium-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 block text-[#4a3d6a]">DNI / Membresía</label>
                                    <input 
                                        required
                                        placeholder="Ej: 41234567"
                                        value={editForm.dni}
                                        onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                                        className="w-full p-3 text-sm rounded-xl focus:outline-none font-bold premium-input"
                                    />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 block text-[#4a3d6a]">WhatsApp</label>
                                    <input 
                                        required
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full p-3 text-sm rounded-xl focus:outline-none font-bold premium-input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 block text-[#4a3d6a]">Correo Electrónico</label>
                                <input 
                                    required
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full p-3 text-xs rounded-xl focus:outline-none premium-input"
                                />
                            </div>

                            <div>
                                <label className="text-[8px] font-black uppercase tracking-[0.2em] mb-2 block text-[#4a3d6a]">Foto de Perfil</label>
                                <div className="flex gap-2 items-center">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 neu-btn-pod">
                                        <img src={editForm.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { playNeonClick(); fileInputRef.current?.click(); }}
                                        className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest neu-btn-3d flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Camera size={14} className="text-[#4a3d6a]" /> Subir Foto
                                    </button>
                                </div>
                            </div>

                            {/* Botón Guardar — Hero */}
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full h-14 neu-btn-hero flex items-center justify-center gap-2 font-[1000] uppercase tracking-[0.2em] text-[10px] cursor-pointer disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-[#4a3d6a]/25 border-t-[#ff6b6b] rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={16} className="text-[#ff6b6b]" strokeWidth={3} />
                                        <span className="text-[#2c2440]">Guardar Cambios</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FOOTER INFO */}
            <p className="text-[8px] uppercase tracking-[0.4em] font-black text-center leading-[1.8] mt-10 mb-4 px-8 text-[#4a3d6a]/50 relative z-10">
                Secured VIP Network · {formatClock(client.updatedAt ? new Date(client.updatedAt) : currentTime)} <br/>
                ID: {client.id}
            </p>

            {/* Pie Neumórfico */}
            <div className="relative z-10 mb-6 neu-footer flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#4a3d6a]">
                <ShieldCheck size={11} className="text-[#ff6b6b]" />
                ShopDigital · Red Comercial Digital
            </div>
        </div>
    );
};

export default ClientVipCredentialPage;
