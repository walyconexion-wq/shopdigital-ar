import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Client, LiveEvent } from '../types';
import { db, suscribirseAEventos } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldCheck, User, Clock, ChevronLeft, Ticket, Wallet, Coins, ArrowRightLeft, ArrowDownRight, ArrowUpRight, Zap } from 'lucide-react';
import { playNeonClick } from '../utils/audio';
import LoadingScreen from '../components/LoadingScreen';
import { CyberCircuitBackground } from '../components/CyberCircuitBackground';

const ClientCredentialPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showWallet, setShowWallet] = useState(false);
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

    // Subscribe to live events
    useEffect(() => {
        const unsubscribe = suscribirseAEventos((events) => {
            setLiveEvents(events);
        });
        return () => unsubscribe();
    }, []);

    // Anti-screenshot real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch client
    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docRef = doc(db, 'clientes', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() } as Client);
                }
            } catch (error) {
                console.error("Error fetching client:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    // Match active event with client's active ticket
    const ticketEvent = useMemo(() => {
        if (!client?.activeTicket?.eventId) return null;
        return liveEvents.find(e => e.id === client.activeTicket?.eventId);
    }, [liveEvents, client?.activeTicket?.eventId]);

    // Active event for the client's zone if they don't have a ticket
    const generalActiveEvent = useMemo(() => {
        if (client?.activeTicket) return null;
        return liveEvents.find(e =>
            (e.status === 'active_live' || e.status === 'suspended') &&
            e.targetRoles.includes('cliente_calle')
        );
    }, [liveEvents, client]);

    if (loading) return (
        <div className="min-h-screen bg-transparent z-50 fixed inset-0 flex items-center justify-center">
            <CyberCircuitBackground />
            <LoadingScreen ready={false} onDone={() => {}} />
        </div>
    );

    if (!client) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-transparent text-[#2c2440]">
                <CyberCircuitBackground />
                <div className="relative z-10 w-full max-w-sm p-8 neu-plate flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto neu-inset-title">
                        <ShieldCheck size={32} className="animate-pulse text-[#ff6b6b]" />
                    </div>
                    <h1 className="text-xl font-black text-[#ff6b6b] uppercase tracking-tight mb-2">Credencial Inválida</h1>
                    <p className="text-[10px] text-[#4a3d6a] uppercase tracking-widest mb-8">El pase VIP no existe o fue revocado.</p>
                    <button
                        onClick={() => { playNeonClick(); navigate('/'); }}
                        className="w-full h-14 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer neu-btn-hero"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const validationUrl = `https://shopdigital.ar/cliente/${clientId}/validar`;
    const formattedTown = client.locality ? client.locality.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Zona Norte';

    return (
        <div className="min-h-screen w-full flex flex-col items-center px-4 py-6 relative overflow-y-auto selection:bg-cyan-500/30 bg-transparent text-[#2c2440]">
            {/* Fondo Ciber-Digital Púrpura Animado */}
            <CyberCircuitBackground />

            {/* HEADER NEUMÓRFICO */}
            <div className="w-full max-w-sm relative z-10 flex justify-between items-center mb-5 gap-3">
                <button
                    onClick={() => { playNeonClick(); navigate(-1); }}
                    className="w-11 h-11 flex items-center justify-center cursor-pointer transition-all neu-btn-pod group"
                    aria-label="Regresar"
                >
                    <ChevronLeft size={18} className="text-[#2c2440] group-hover:-translate-x-0.5 transition-transform" strokeWidth={3} />
                </button>

                <div className="flex-1 text-center px-4 py-2 neu-inset-title">
                    <h1 className="text-base font-black tracking-tight uppercase leading-tight text-[#2c2440]">
                        Pase VIP Cliente
                    </h1>
                    <p className="text-[8px] font-extrabold uppercase tracking-widest text-[#4a3d6a]">
                        {formattedTown} · ShopDigital
                    </p>
                </div>

                <div className="w-11 h-11 flex items-center justify-center neu-btn-pod">
                    <Ticket size={16} className="text-[#4a3d6a]" />
                </div>
            </div>

            {/* ═══════════ LIVE EVENT TICKER BANNER 🟢🔴 ═══════════ */}
            {client.activeTicket && ticketEvent && (
                <div className="w-full max-w-sm mb-5 relative z-10 animate-in slide-in-from-top-6 duration-500">
                    {ticketEvent.status === 'active_live' ? (
                        <div className="p-5 flex flex-col items-center justify-center relative overflow-hidden neu-plate border-2 border-emerald-500/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-center mb-1 text-emerald-700 animate-pulse">
                                🟢 EVENTO ACTIVO - ENTRADA VÁLIDA
                            </span>
                            <h3 className="text-xs font-black uppercase tracking-wider text-center mb-2 text-[#2c2440]">
                                {ticketEvent.name}
                            </h3>
                            <div className="px-3 py-1.5 rounded-full text-center neu-inset-title">
                                <span className="text-[9px] font-black uppercase tracking-widest block font-mono text-[#2c2440]">
                                    SECTOR: {client.activeTicket.seatSector || 'General'} · FILA: {client.activeTicket.fila || '-'} · ASIENTO: {client.activeTicket.asiento || '-'}
                                </span>
                            </div>
                        </div>
                    ) : ticketEvent.status === 'suspended' ? (
                        <div className="p-5 flex flex-col items-center justify-center relative overflow-hidden neu-plate border-2 border-red-500/40">
                            <span className="text-[10px] font-black uppercase tracking-widest text-center mb-1 text-red-600 animate-bounce">
                                🔴 EVENTO SUSPENDIDO / APLAZADO
                            </span>
                            <h3 className="text-xs font-black uppercase tracking-wider text-center mb-2 text-[#2c2440]">
                                {ticketEvent.name}
                            </h3>
                            <p className="text-[9px] font-black text-[#4a3d6a] uppercase tracking-widest text-center animate-pulse">
                                MÁS INFO VÍA ASISTENTE ARI 🤖
                            </p>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Promo banner si no tiene ticket */}
            {!client.activeTicket && generalActiveEvent && (
                <div className="w-full max-w-sm mb-5 relative z-10 animate-in slide-in-from-top-6 duration-500">
                    <div className="p-5 flex flex-col items-center justify-center relative overflow-hidden neu-plate border-2 border-[#4a3d6a]/30 animate-pulse">
                        <span className="text-[10px] font-black uppercase tracking-widest text-center mb-1 text-[#4a3d6a]">
                            ✨ EVENTO VIP DISPONIBLE EN TU ZONA
                        </span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-center mb-2 text-[#2c2440]">
                            {generalActiveEvent.name}
                        </h3>
                        <p className="text-[8px] font-black text-[#4a3d6a] uppercase tracking-widest text-center">
                            Adquirí tus entradas con descuento B2B consultando a Ari 🤖
                        </p>
                    </div>
                </div>
            )}

            {/* ══════════ TARJETA CREDENTIAL PRINCIPAL ══════════ */}
            <div className="w-full max-w-sm relative z-10 mt-2">
                <div className="neu-plate p-8 flex flex-col items-center relative overflow-hidden">

                    {/* Sello Temporal Anti-Falsificación */}
                    <div className="w-full mb-6 flex items-center justify-center gap-3 neu-inset-title py-2 px-4">
                        <Clock size={11} className="text-[#4a3d6a] animate-spin flex-shrink-0" style={{ animationDuration: '8s' }} />
                        <span className="text-[9px] font-mono font-black tracking-widest tabular-nums text-[#2c2440]">
                            {currentTime.toLocaleDateString('es-AR')} {currentTime.toLocaleTimeString('es-AR', { hour12: false })}
                        </span>
                    </div>

                    {/* TOP: Badge PASE VIP */}
                    <div className="flex items-center gap-2 mb-6 px-4 py-2 neu-btn-pod">
                        <Ticket size={16} className="text-[#ff6b6b]" />
                        <span className="text-[11px] font-black text-[#2c2440] uppercase tracking-[0.25em]">PASE VIP</span>
                    </div>

                    {/* CENTER: Avatar de Identidad */}
                    <div className="w-24 h-24 rounded-full p-1 mb-6 relative neu-btn-pod">
                        <div className="w-full h-full rounded-full neu-inset-title flex items-center justify-center overflow-hidden">
                            {client.photo ? (
                                <img src={client.photo} alt={client.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <User size={38} className="text-[#4a3d6a]" />
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-2 border-[#f0ece6] flex items-center justify-center shadow-md">
                            <ShieldCheck size={12} className="text-white" />
                        </div>
                    </div>

                    {!showWallet ? (
                        <>
                            {/* Identidad */}
                            <div className="text-center mb-6 w-full">
                                <h3 className="text-2xl font-[1000] uppercase tracking-tighter text-[#2c2440] mb-1 break-words leading-none">
                                    {client.name}
                                </h3>
                                <p className="text-[9px] text-[#4a3d6a] uppercase tracking-[0.2em] font-bold">
                                    Miembro Verificado · {formattedTown}
                                </p>
                            </div>

                            {/* Botón Billetera VIP — Héroe */}
                            <button
                                onClick={() => { playNeonClick(); setShowWallet(true); }}
                                className="w-full mb-6 h-14 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 cursor-pointer neu-btn-hero"
                            >
                                <Wallet size={18} className="text-[#ff6b6b]" />
                                <span className="text-[#2c2440]">Mi Billetera VIP</span>
                                <div className="flex items-center gap-1 neu-inset-title py-1 px-2 rounded-xl">
                                    <Coins size={12} className="text-amber-600" />
                                    <span className="text-[10px] text-amber-700 font-black">{client.points || 0}</span>
                                </div>
                            </button>

                            {/* BOTTOM: QR Code */}
                            <div className="neu-inset-title p-4 relative group">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[50px]" />
                                <QRCodeSVG
                                    value={validationUrl}
                                    size={160}
                                    bgColor="#f0ece6"
                                    fgColor="#2c2440"
                                    level="H"
                                    className="relative z-10"
                                />
                            </div>
                            <p className="text-[7px] text-[#4a3d6a]/60 uppercase tracking-widest mt-3 text-center">
                                Escaneá para validar en puerta
                            </p>
                        </>
                    ) : (
                        <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
                            {/* Header Billetera */}
                            <div className="w-full flex justify-between items-center mb-5">
                                <button
                                    onClick={() => { playNeonClick(); setShowWallet(false); }}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider cursor-pointer neu-btn-pod px-3 py-2 text-[#2c2440]"
                                >
                                    <ChevronLeft size={14} /> Volver
                                </button>
                                <span className="text-[10px] font-black text-[#4a3d6a] uppercase tracking-[0.2em] flex items-center gap-1">
                                    <Wallet size={14} /> Billetera
                                </span>
                            </div>

                            {/* Saldo */}
                            <div className="w-full rounded-[20px] p-6 mb-5 flex flex-col items-center justify-center relative overflow-hidden neu-plate">
                                <p className="text-[9px] uppercase tracking-[0.3em] text-[#4a3d6a] font-bold mb-2">Saldo Actual</p>
                                <div className="flex items-center gap-3">
                                    <Coins size={36} className="text-amber-600 drop-shadow-sm" />
                                    <span className="text-5xl font-[1000] tracking-tighter text-[#2c2440]">
                                        {client.points || 0}
                                    </span>
                                </div>
                                <p className="text-[8px] uppercase tracking-widest text-[#4a3d6a]/60 mt-3">
                                    Un punto = Un beneficio
                                </p>
                            </div>

                            {/* Historial de movimientos */}
                            <div className="w-full">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#4a3d6a] border-b-2 border-[#4a3d6a]/10 pb-2 mb-4 flex items-center gap-2">
                                    <ArrowRightLeft size={12} /> Movimientos Recientes
                                </h4>
                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {!client.pointsHistory || client.pointsHistory.length === 0 ? (
                                        <p className="text-center text-[10px] text-[#4a3d6a]/50 italic py-4">Aún no hay movimientos registrados.</p>
                                    ) : (
                                        client.pointsHistory.map((trx) => (
                                            <div key={trx.id} className="neu-plate p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center neu-btn-pod ${trx.type === 'earned' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        {trx.type === 'earned' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-[#2c2440] uppercase tracking-wider">{trx.shopName}</span>
                                                        <span className="text-[8px] text-[#4a3d6a]/60">{new Date(trx.date).toLocaleDateString('es-AR')} - {new Date(trx.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-[14px] font-[1000] ${trx.type === 'earned' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {trx.type === 'earned' ? '+' : '-'}{trx.points}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pie Neumórfico */}
            <div className="relative z-10 mt-6 mb-4 neu-footer flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[#4a3d6a]">
                <ShieldCheck size={11} className="text-[#ff6b6b]" />
                ShopDigital · Red Comercial Digital
            </div>
        </div>
    );
};

export default ClientCredentialPage;
