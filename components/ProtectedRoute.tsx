import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { playNeonClick } from '../utils/audio';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: ('admin' | 'ambassador')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { user, role, status, loading, login } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <Loader2 size={48} className="text-yellow-500 animate-spin mb-4" />
                <h1 className="text-2xl font-[1000] uppercase tracking-widest text-center">Verificando Acceso</h1>
                <p className="text-white/60 text-sm mt-2 text-center max-w-sm">Conectando con servidores de Google...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
                    
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={32} className="text-yellow-500" />
                    </div>
                    
                    <h2 className="text-xl font-[1000] uppercase tracking-widest mb-2">Acceso Restringido</h2>
                    <p className="text-white/60 text-xs leading-relaxed mb-8">Esta área es exclusiva para Administradores y Embajadores registrados de ShopDigital VIP.</p>
                    
                    <button 
                        onClick={() => { playNeonClick(); login(); }}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors shadow-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Ingresar con Google
                    </button>
                </div>
            </div>
        );
    }

    if (status !== 'active') {
        const message = status === 'pending' 
            ? "Tu solicitud está en revisión." 
            : status === 'inactive' 
                ? "Tu cuenta ha sido desactivada."
                : "Tu cuenta de Google no está autorizada en este sistema.";
                
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-[1000] uppercase tracking-widest text-red-500 mb-2">Acceso Denegado</h2>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">{message}</p>
                    <p className="text-[10px] text-white/40">{user.email}</p>
                </div>
            </div>
        );
    }

    // 🛡️ FAIL-CLOSED: Si se requieren roles específicos y el usuario
    // no tiene rol asignado O su rol no está en la lista, DENEGAR acceso.
    // Fix crítico: antes, role===null cortocircuitaba la condición y dejaba pasar.
    if (roles && (!role || !roles.includes(role))) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
