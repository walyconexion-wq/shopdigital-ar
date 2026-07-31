import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, getDoc, updateDoc, query, where, increment, addDoc, orderBy, limit, runTransaction } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "shopdigital-ee.firebaseapp.com",
    projectId: "shopdigital-ee",
    storageBucket: "shopdigital-ee.firebasestorage.app",
    messagingSenderId: "201282750733",
    appId: "1:201282750733:web:e1fc713e99fab35ba8c844",
    measurementId: "G-D842DKHX2F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// --- MASTER CONSTANTS (Moved to top to avoid TDZ errors) ---
// Master list of all available categories (with lucide icon key for rendering)
export const ALL_CATEGORIES_MASTER = [
    { id: 'pizzerias', slug: 'pizzerias', name: 'Pizzerías', iconKey: 'Pizza', isSystem: true },
    { id: 'restaurantes', slug: 'restaurantes', name: 'Restaurantes', iconKey: 'UtensilsCrossed', isSystem: true },
    { id: 'fastfood', slug: 'fastfood', name: 'Comida Rápida', iconKey: 'Beef', isSystem: true },
    { id: 'beer', slug: 'beer', name: 'Cervecerías', iconKey: 'Beer', isSystem: true },
    { id: 'icecream', slug: 'icecream', name: 'Heladerías', iconKey: 'IceCream', isSystem: true },
    { id: 'gastro', slug: 'gastro', name: 'Gastronomías', iconKey: 'Utensils', isSystem: true },
    { id: 'markets', slug: 'markets', name: 'Mercados', iconKey: 'ShoppingCart', isSystem: true },
    { id: 'fashion', slug: 'fashion', name: 'Indumentarias', iconKey: 'Shirt', isSystem: true },
    { id: 'tech', slug: 'tech', name: 'Tecnología', iconKey: 'Smartphone', isSystem: true },
    { id: 'home', slug: 'home', name: 'Hogar', iconKey: 'Home', isSystem: true },
    { id: 'barber', slug: 'barber', name: 'Barberías', iconKey: 'Scissors', isSystem: true },
    { id: 'hair', slug: 'hair', name: 'Peluquerías', iconKey: 'UserCircle', isSystem: true },
    { id: 'gym', slug: 'gym', name: 'Gimnasios', iconKey: 'Dumbbell', isSystem: true },
    { id: 'hardware', slug: 'hardware', name: 'Ferreterías', iconKey: 'Hammer', isSystem: true },
    { id: 'pets', slug: 'pets', name: 'Mascotas', iconKey: 'PawPrint', isSystem: true },
    { id: 'tattoo', slug: 'tattoo', name: 'Tatuajes', iconKey: 'PenTool', isSystem: true },
    { id: 'beauty', slug: 'beauty', name: 'Estéticas', iconKey: 'Sparkles', isSystem: true },
    { id: 'inmo', slug: 'inmo', name: 'Inmobiliarias', iconKey: 'Building2', isSystem: true },
    { id: 'auto', slug: 'auto', name: 'Automotor', iconKey: 'Car', isSystem: true },
    { id: 'gifts', slug: 'gifts', name: 'Regalería', iconKey: 'Gift', isSystem: true },
    { id: 'finance', slug: 'finance', name: 'Finanzas', iconKey: 'DollarSign', isSystem: true },
    { id: 'servicios', slug: 'servicios', name: 'Servicios y Profesionales', iconKey: 'Briefcase', isSystem: true },
    { id: 'automotormotos', slug: 'automotormotos', name: 'Automotor y Motos', iconKey: 'Wrench', isSystem: true },
    { id: 'farmacias', slug: 'farmacias', name: 'Farmacias', iconKey: 'PlusSquare', isSystem: true },
];

// Default active categories (all system categories active by default)
export const DEFAULT_CATEGORIES_CONFIG = ALL_CATEGORIES_MASTER.map(c => ({ ...c, isActive: true }));

export const loginConGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error al iniciar sesión con Google:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        throw error;
    }
};

// --- CONTROL DE ACCESO (ADMIN/EMBAJADORES) ---
export const checkUserAuthorization = async (email: string) => {
    try {
        const q = query(collection(db, "autorizados"), where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            return {
                id: querySnapshot.docs[0].id,
                email: docData.email,
                role: docData.role, // 'admin' | 'ambassador'
                status: docData.status, // 'active' | 'inactive' | 'pending'
                name: docData.name
            };
        }
        return null;
    } catch (e) {
        console.error("Error validando autorización:", e);
        return null;
    }
};

export const crearAspirante = async (aspiranteData: any) => {
    try {
        const id = aspiranteData.id || `asp-${Date.now()}`;
        await setDoc(doc(db, "autorizados", id), { ...aspiranteData, id, status: 'pending', role: 'ambassador' });
        return id;
    } catch (e) {
        console.error("Error al crear aspirante:", e);
        throw e;
    }
};

export const suscribirseAAutorizados = (callback: (usuarios: any[]) => void) => {
    const colRef = collection(db, "autorizados");
    return onSnapshot(colRef, (snapshot) => {
        const usuarios = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(usuarios);
    }, (error) => {
        console.error("Error en suscripción de autorizados:", error);
    });
};

export const actualizarAutorizado = async (id: string, updateData: any) => {
    try {
        const docRef = doc(db, "autorizados", id);
        await updateDoc(docRef, updateData);
        return true;
    } catch (error) {
        console.error("Error al actualizar autorizado:", error);
        throw error;
    }
};

export const eliminarAutorizado = async (id: string) => {
    try {
        await deleteDoc(doc(db, "autorizados", id));
        return true;
    } catch (error) {
        console.error("Error al eliminar autorizado:", error);
        throw error;
    }
};

// --- MULTI-TOWN MANAGEMENT (LA FÁBRICA) ---

export const getTowns = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "towns"));
        return querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    } catch (error) {
        console.error("Error getting towns:", error);
        return [];
    }
};

export const subscribeToTowns = (callback: (towns: any[]) => void) => {
    const colRef = collection(db, "towns");
    return onSnapshot(colRef, (snapshot) => {
        const towns = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(towns);
    });
};

export const saveTown = async (townData: any) => {
    try {
        const id = townData.id;
        if (!id) throw new Error("ID de zona es requerido.");
        await setDoc(doc(db, "towns", id), { ...townData, updatedAt: new Date().toISOString() }, { merge: true });
        
        // Initialize appConfig for the new town if it doesn't already exist
        const configRef = doc(db, 'appConfig', id);
        const configSnap = await getDoc(configRef);
        if (!configSnap.exists()) {
            // Use serializable categories (no React icon elements)
            const serializableCategories = ALL_CATEGORIES_MASTER.map(({ id: cId, slug, name, iconKey, isSystem }) => ({
                id: cId, slug, name, iconKey, isActive: true, isSystem: !!isSystem
            }));
            await setDoc(configRef, {
                mainTitle: "ShopDigital",
                mainSubtitle: `Tu guía de ofertas en ${townData.name}`,
                theme: 'default',
                primaryColor: '#22d3ee',
                townName: townData.name,
                categories: serializableCategories,
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Config base inicializada para zona: ${id}`);
        }
        return id;
    } catch (error) {
        console.error("Error saving town:", error);
        throw error;
    }
};


// Optimización: Habilitar persistencia de datos local (Ahorro Máximo de Lecturas)
// Esto permite que la app use datos en caché y solo descargue cambios, reduciendo el consumo de cuota.
import { enableIndexedDbPersistence } from "firebase/firestore";

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn("La persistencia falló (múltiples pestañas abiertas)");
    } else if (err.code === 'unimplemented') {
        console.warn("El navegador no soporta persistencia");
    }
});

// --- SERVICIOS ---

// 1. Obtener todos los comercios desde la colección "comercios"
export const obtenerComercios = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "comercios"));
        return querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    } catch (error) {
        console.error("Error obteniendo comercios:", error);
        return [];
    }
};

// 1b. Suscribirse a los comercios en tiempo real (Filtrado por Zona)
export const suscribirseAComercios = (callback: (comercios: any[]) => void, townId?: string, onError?: (error: any) => void) => {
    const colRef = collection(db, "comercios");
    const q = townId 
        ? query(colRef, where("townId", "==", townId)) 
        : colRef;
    
    return onSnapshot(q, (snapshot) => {
        const comercios = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(comercios);
    }, (error) => {
        console.error("Error en la suscripción de comercios:", error);
        if (onError) onError(error);
    });
};

// 2. Guardar o actualizar un comercio en la colección "comercios"
export const guardarComercio = async (comercioData: any, townId: string = 'esteban-echeverria') => {
    try {
        const id = comercioData.id;
        if (!id) throw new Error("ID de comercio es requerido para guardar.");

        // Generar slug automático si falta
        let slug = comercioData.slug;
        if (!slug && comercioData.name) {
            slug = comercioData.name.toString().toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        }

        // Inyectar townId si no lo tiene
        const finalData = { ...comercioData, slug, townId: comercioData.townId || townId };
        await setDoc(doc(db, "comercios", id), finalData);
        console.log("Comercio guardado con éxito. ID:", id, "Zona:", finalData.townId);
        return id;
    } catch (error) {
        console.error("Error al guardar en Firestore:", error);
        throw error;
    }
};

export const updateComercio = async (id: string, updates: any) => {
    try {
        const docRef = doc(db, "comercios", id);
        
        // Generar slug si viene el nombre y falta el slug
        let finalUpdates = { ...updates };
        if (updates.name && !updates.slug) {
            finalUpdates.slug = updates.name.toString().toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        }

        await updateDoc(docRef, finalUpdates);
        return true;
    } catch (error) {
        console.error("Error al actualizar comercio:", error);
        throw error;
    }
};

// 🚀 ONBOARDING BLITZKRIEG — Aprobar comercio con registro completo de onboarding y validación estricta de Gmail
export const aprobarComercioOnboarding = async (shopId: string, ambassadorEmail: string): Promise<boolean> => {
    try {
        const docRef = doc(db, "comercios", shopId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            throw new Error("El comercio a aprobar no existe en el sistema.");
        }
        const shopData = docSnap.data();
        if (!shopData.gmail || !shopData.gmail.trim() || !shopData.gmail.includes('@')) {
            throw new Error("Gmail obligatorio: El comercio debe poseer un Gmail de acceso válido para poder ser aprobado e ingresar al sistema.");
        }

        let slug = shopData.slug;
        if (!slug && shopData.name) {
            slug = shopData.name.toString().toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
        }

        await updateDoc(docRef, {
            slug,
            isActive: true,
            onboardingStatus: 'approved',
            onboardingApprovedAt: new Date().toISOString(),
            onboardingApprovedBy: ambassadorEmail,
            memberSince: new Date().toISOString(),
        });
        console.log(`✅ Comercio ${shopId} aprobado por ${ambassadorEmail}`);
        return true;
    } catch (error) {
        console.error("Error al aprobar comercio:", error);
        throw error;
    }
};

// 🚀 ONBOARDING BLITZKRIEG — Marcar comercio como pendiente de revisión por embajador
export const marcarPendienteRevision = async (shopId: string): Promise<boolean> => {
    try {
        const docRef = doc(db, "comercios", shopId);
        await updateDoc(docRef, {
            onboardingStatus: 'pending_review',
            onboardingSubmittedAt: new Date().toISOString(),
        });
        console.log(`⏳ Comercio ${shopId} marcado como pendiente de revisión`);
        return true;
    } catch (error) {
        console.error("Error al marcar pendiente:", error);
        throw error;
    }
};

// Incrementar visitas de un comercio (contador atómico)
export const incrementarVisitas = async (comercioId: string) => {
    try {
        const ref = doc(db, "comercios", comercioId);
        await updateDoc(ref, { visits: increment(1) });
    } catch (error) {
        console.error("Error incrementando visitas:", error);
    }
};

// Incrementar likes del muro de novedades (contador atómico)
export const incrementarLikesFeed = async (comercioId: string) => {
    try {
        const ref = doc(db, "comercios", comercioId);
        await updateDoc(ref, { feedLikes: increment(1) });
    } catch (error) {
        console.error("Error incrementando likes del muro:", error);
    }
};

// 3. Eliminar un comercio de la colección "comercios"
export const eliminarComercio = async (id: string) => {
    try {
        await deleteDoc(doc(db, "comercios", id));
        console.log("Comercio eliminado con éxito. ID:", id);
        return true;
    } catch (error) {
        console.error("Error al eliminar de Firestore:", error);
        throw error;
    }
};

// 4. Actualizar un comercio en la colección "comercios"
export const actualizarComercio = async (id: string, updateData: any) => {
    try {
        const docRef = doc(db, "comercios", id);
        await updateDoc(docRef, updateData);
        console.log(`Comercio ${id} actualizado con éxito.`);
        return true;
    } catch (error) {
        console.error(`Error al actualizar comercio ${id}:`, error);
        throw error;
    }
};

// --- SERVICIOS BASE CLIENTES (B2C) ---

export const obtenerClientes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        return querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        return [];
    }
};
// Métricas de hoy
export const obtenerClientesHoy = async (townId: string = 'esteban-echeverria') => {
    try {
        const start = new Date();
        start.setHours(0,0,0,0);
        const colRef = collection(db, "clientes");
        const q = query(colRef,
            where("townId", "==", townId),
            where("createdAt", ">=", start.toISOString())
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
        console.error("Error obteniendo clientes de hoy:", error);
        return [];
    }
};

export const obtenerComerciosHoy = async (townId: string = 'esteban-echeverria') => {
    try {
        const start = new Date();
        start.setHours(0,0,0,0);
        const colRef = collection(db, "comercios");
        const q = query(colRef,
            where("townId", "==", townId),
            where("createdAt", ">=", start.toISOString())
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
        console.error("Error obteniendo comercios de hoy:", error);
        return [];
    }
};

export const suscribirseAClientes = (callback: (clientes: any[]) => void, townId?: string) => {
    const colRef = collection(db, "clientes");
    const q = townId ? query(colRef, where("townId", "==", townId)) : colRef;
    
    return onSnapshot(q, (snapshot) => {
        const clientes = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(clientes);
    }, (error) => {
        console.error("Error en la suscripción de clientes:", error);
    });
};

export const guardarCliente = async (clienteData: any, townId: string = 'esteban-echeverria') => {
    try {
        const id = clienteData.id;
        if (!id) throw new Error("ID de cliente es requerido.");
        const finalData = { ...clienteData, townId: clienteData.townId || townId };
        await setDoc(doc(db, "clientes", id), finalData);
        return id;
    } catch (error) {
        console.error("Error saving client:", error);
        throw error;
    }
};

export const verificarClienteExistente = async (email: string, phone: string, townId: string = 'esteban-echeverria') => {
    try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.replace(/\D/g, '');
        const colRef = collection(db, "clientes");
        
        const qEmail = query(colRef, where("townId", "==", townId), where("email", "==", cleanEmail));
        const qPhone = query(colRef, where("townId", "==", townId), where("phone", "==", cleanPhone));
        
        const [snapEmail, snapPhone] = await Promise.all([
            getDocs(qEmail),
            getDocs(qPhone)
        ]);
        
        return !snapEmail.empty || !snapPhone.empty;
    } catch (error) {
        console.error("Error al verificar cliente existente:", error);
        return false;
    }
};

export const activarClienteYIncrementarSuscriptores = async (clientId: string, shopId: string, townId: string = 'esteban-echeverria') => {
    try {
        const clientRef = doc(db, "clientes", clientId);
        const shopRef = doc(db, "comercios", shopId);
        
        await runTransaction(db, async (transaction) => {
            const clientSnap = await transaction.get(clientRef);
            if (!clientSnap.exists()) {
                throw new Error("Cliente no existe.");
            }
            
            transaction.update(clientRef, {
                status: 'active',
                updatedAt: new Date().toISOString()
            });
            
            transaction.update(shopRef, {
                subscribers: increment(1)
            });
        });
        
        console.log(`Cliente ${clientId} activado e incremento de suscriptores para el comercio ${shopId} ejecutado con éxito.`);
    } catch (error) {
        console.error("Error en activarClienteYIncrementarSuscriptores:", error);
        throw error;
    }
};

export const eliminarCliente = async (id: string) => {
    try {
        await deleteDoc(doc(db, "clientes", id));
        console.log("Cliente eliminado con éxito. ID:", id);
        return true;
    } catch (error) {
        console.error("Error al eliminar cliente de Firestore:", error);
        throw error;
    }
};

export const actualizarPuntosCliente = async (clientId: string, pointsDelta: number, shopName: string, type: 'earned' | 'redeemed') => {
    try {
        const docRef = doc(db, "clientes", clientId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const clientData = docSnap.data();
            const currentPoints = clientData.points || 0;
            const newPoints = Math.max(0, currentPoints + pointsDelta);
            
            const transactionRef = {
                id: `trx-${Date.now()}`,
                shopName,
                type,
                points: Math.abs(pointsDelta),
                date: new Date().toISOString()
            };

            const currentHistory = clientData.pointsHistory || [];
            
            await updateDoc(docRef, {
                points: newPoints,
                pointsHistory: [transactionRef, ...currentHistory]
            });
            
            console.log(`Puntos actualizados para el cliente ${clientId}. Nuevo saldo: ${newPoints}`);
            return newPoints;
        } else {
            throw new Error("Cliente no encontrado.");
        }
    } catch (error) {
        console.error("Error al actualizar puntos del cliente en Firestore:", error);
        throw error;
    }
};

// --- SERVICIOS OFERTAS (B2B & B2C) ---

export const suscribirseAOfertas = (callback: (ofertas: any[]) => void, townId?: string) => {
    const colRef = collection(db, "ofertas");
    const q = townId 
        ? query(colRef, where("townId", "==", townId)) 
        : colRef;
    
    return onSnapshot(q, (snapshot) => {
        const ofertas = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(ofertas);
    }, (error) => {
        console.error("Error en la suscripción de ofertas:", error);
    });
};

export const guardarOferta = async (ofertaData: any, townId: string = 'esteban-echeverria') => {
    try {
        const id = ofertaData.id;
        if (!id) throw new Error("ID de oferta es requerido.");
        const finalData = { ...ofertaData, townId: ofertaData.townId || townId };
        await setDoc(doc(db, "ofertas", id), finalData);
        return id;
    } catch (error) {
        console.error("Error saving offer:", error);
        throw error;
    }
};

export const eliminarOferta = async (id: string) => {
    try {
        await deleteDoc(doc(db, "ofertas", id));
        console.log("Oferta eliminada con éxito. ID:", id);
        return true;
    } catch (error) {
        console.error("Error al eliminar oferta de Firestore:", error);
        throw error;
    }
};

// --- SERVICIOS DE SUSCRIPCIÓN Y FACTURACIÓN (FASE 1) ---

export const suscribirseAFacturasPorZona = (townId: string, callback: (facturas: any[]) => void) => {
    const colRef = collection(db, "facturas");
    const q = townId ? query(colRef, where("townId", "==", townId)) : colRef;
    return onSnapshot(q, (snapshot) => {
        const facturas = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(facturas);
    }, (error) => {
        console.error("Error en la suscripción de facturas:", error);
    });
};

export const obtenerFactura = async (id: string) => {
    try {
        const docRef = doc(db, "facturas", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error al obtener factura:", error);
        throw error;
    }
};

export const obtenerFacturaPorComercio = async (shopId: string) => {
    try {
        const q = query(collection(db, "facturas"), where("shopId", "==", shopId));
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
            const facturas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const pendiente = facturas.find((f: any) => f.status === 'pending');
            if (pendiente) return pendiente;
            
            facturas.sort((a: any, b: any) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
            return facturas[0];
        }
        return null;
    } catch (error) {
        console.error("Error al obtener factura por comercio:", error);
        return null;
    }
};

export const crearFactura = async (facturaData: any) => {
    try {
        const id = facturaData.id || `inv-${Date.now()}`;
        await setDoc(doc(db, "facturas", id), { ...facturaData, id });
        console.log("Factura creada con éxito. ID:", id);
        return id;
    } catch (error) {
        console.error("Error al crear factura en Firestore:", error);
        throw error;
    }
};

export const actualizarEstadoFactura = async (id: string, status: 'pending' | 'paid' | 'uncollectible' | 'suspended') => {
    try {
        const docRef = doc(db, "facturas", id);
        const updateData: any = { status };
        if (status === 'paid') {
            updateData.paymentDate = new Date().toISOString();
        }
        await updateDoc(docRef, updateData);
        console.log(`Estado de factura ${id} actualizado a ${status}`);
        return true;
    } catch (error) {
        console.error(`Error al actualizar estado de factura ${id}:`, error);
        throw error;
    }
};

export const actualizarFactura = async (id: string, updateData: any) => {
    try {
        const docRef = doc(db, "facturas", id);
        await updateDoc(docRef, updateData);
        console.log(`Factura ${id} actualizada con éxito.`);
        return true;
    } catch (error) {
        console.error(`Error al actualizar factura ${id}:`, error);
        throw error;
    }
};

export const eliminarFactura = async (id: string) => {
    try {
        const docRef = doc(db, "facturas", id);
        await deleteDoc(docRef);
        console.log(`Factura ${id} eliminada con éxito.`);
        return true;
    } catch (error) {
        console.error(`Error al eliminar factura ${id}:`, error);
        throw error;
    }
};

// --- MÓDULO DE RELEVAMIENTO TÁCTICO (Prospectos/Leads) ---

export const suscribirseARelevamientos = (callback: (leads: any[]) => void, townId?: string) => {
    const colRef = collection(db, "relevamientos");
    const q = townId ? query(colRef, where("townId", "==", townId)) : colRef;
    
    return onSnapshot(q, (snapshot) => {
        const leads = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        callback(leads);
    }, (error) => {
        console.error("Error en la suscripción de relevamientos:", error);
    });
};

export const guardarRelevamiento = async (leadData: any, townId: string = 'esteban-echeverria') => {
    try {
        const id = leadData.id || `lead-${Date.now()}`;
        const finalData = { ...leadData, id, townId: leadData.townId || townId };
        await setDoc(doc(db, "relevamientos", id), finalData);
        return id;
    } catch (error) {
        console.error("Error saving relevamiento:", error);
        throw error;
    }
};

export const eliminarRelevamiento = async (id: string) => {
    try {
        await deleteDoc(doc(db, "relevamientos", id));
        return true;
    } catch (error) {
        console.error("Error eliminando relevamiento:", error);
        throw error;
    }
};

export const actualizarRelevamiento = async (id: string, data: any) => {
    try {
        await updateDoc(doc(db, "relevamientos", id), data);
        return true;
    } catch (error) {
        console.error("Error actualizando relevamiento:", error);
        throw error;
    }
};

// --- GLOBAL CONFIGURATION (TOWN THEMES & TITLES) ---

export const getGlobalConfig = async (townId: string = 'esteban-echeverria') => {
    try {
        const docRef = doc(db, 'appConfig', townId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        // Default config if not exists
        return {
            mainTitle: "ShopDigital",
            mainSubtitle: "Tu guía de ofertas locales",
            theme: 'default',
            primaryColor: '#22d3ee',
            townName: "Esteban Echeverría"
        };
    } catch (error) {
        console.error("Error getting global config:", error);
        return null;
    }
};

export const subscribeToGlobalConfig = (onUpdate: (config: any) => void, townId: string = 'esteban-echeverria') => {
    const docRef = doc(db, 'appConfig', townId);
    return onSnapshot(docRef, async (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            // Si el documento existe pero no tiene categorías (o están vacías), inyectamos los defaults
            if (!data.categories || data.categories.length === 0) {
                onUpdate({
                    ...data,
                    categories: ALL_CATEGORIES_MASTER.map(c => ({ ...c, isActive: true, isSystem: true }))
                });
            } else {
                onUpdate(data);
            }
        } else if (townId === 'esteban-echeverria') {
            // Si es la zona por defecto y no existe el doc, intentamos usar el legado o el default maestro
            onUpdate({
                mainTitle: "ShopDigital",
                mainSubtitle: "Tu guía de ofertas locales",
                theme: 'winter',
                primaryColor: '#22d3ee',
                townName: "Esteban Echeverría",
                categories: ALL_CATEGORIES_MASTER.map(c => ({ ...c, isActive: true, isSystem: true }))
            });
        } else {
            // Nueva zona sin configuración aún: generar default dinámico usando el nombre real de la zona
            const displayName = townId
                .split('-')
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            onUpdate({
                mainTitle: "ShopDigital",
                mainSubtitle: `Tu guía de ofertas en ${displayName}`,
                theme: 'default',
                primaryColor: '#22d3ee',
                townName: displayName,
                categories: ALL_CATEGORIES_MASTER.map(c => ({ ...c, isActive: true, isSystem: true }))
            });
        }
    });
};

export const saveGlobalConfig = async (config: any, townId: string = 'esteban-echeverria') => {
    try {
        const docRef = doc(db, 'appConfig', townId);
        await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving global config:", error);
        throw error;
    }
};

export const incrementarVisitasZona = async (townId: string) => {
    try {
        const ref = doc(db, 'appConfig', townId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            await updateDoc(ref, { visits: increment(1) });
        } else {
            await setDoc(ref, { visits: 1, updatedAt: new Date().toISOString() }, { merge: true });
        }
    } catch (error) {
        console.error("Error incrementing zone visits:", error);
    }
};

export const registrarVisitaConTelemetria = async (
    townId: string,
    temp: number | null,
    weatherCode: number | null
) => {
    try {
        const now = new Date();
        const hour = now.getHours();
        
        let timeOfDay = 'noche';
        if (hour >= 6 && hour < 12) timeOfDay = 'mañana';
        else if (hour >= 12 && hour < 19) timeOfDay = 'tarde';
        else if (hour >= 19 && hour < 24) timeOfDay = 'noche';
        else timeOfDay = 'madrugada';

        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayOfWeek = days[now.getDay()];

        const dateStr = now.toISOString().split('T')[0];

        const visitData = {
            townId,
            timestamp: now.toISOString(),
            hour,
            dayOfWeek,
            timeOfDay,
            dateStr,
            temp: temp !== null ? temp : 18,
            weatherCode: weatherCode !== null ? weatherCode : 0,
            createdAt: now.toISOString()
        };

        await addDoc(collection(db, "telemetria_visitas"), visitData);
        console.log("Telemetry visit logged successfully:", visitData);
    } catch (e) {
        console.error("Error logging telemetry visit:", e);
    }
};

export const suscribirseATelemetriaVisitas = (callback: (data: any[]) => void, limitCount: number = 100) => {
    const q = query(
        collection(db, "telemetria_visitas"), 
        orderBy("timestamp", "desc"), 
        limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
    }, (error) => {
        console.error("Error in telemetry subscription:", error);
    });
};

// --- CATEGORY (RUBROS) CONFIG ---

// Default active categories (all system categories active by default)

export const saveCategoriesConfig = async (categories: any[], townId: string = 'esteban-echeverria') => {
    try {
        const docRef = doc(db, 'appConfig', townId);
        // Strip React elements (icons) before saving — only save serializable data
        const serializable = categories.map(({ id, slug, name, iconKey, isActive, isSystem }) => ({
            id, slug, name, iconKey, isActive: !!isActive, isSystem: !!isSystem
        }));
        await setDoc(docRef, { categories: serializable, updatedAt: new Date().toISOString() }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving categories config:", error);
        throw error;
    }
};

// --- MÓDULO DE MANTENIMIENTO Y MIGRACIÓN ---

/**
 * Inicializa la configuración de una zona si no existe.
 * Útil para asegurar que una zona tenga los rubros maestros por defecto.
 */
export const inicializarZonaPredeterminada = async (townId: string = 'esteban-echeverria') => {
    try {
        const docRef = doc(db, 'appConfig', townId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || !docSnap.data().categories) {
            console.log(`Inicializando configuración base para: ${townId}`);
            const serializable = ALL_CATEGORIES_MASTER.map(cat => ({
                ...cat,
                isActive: true,
                isSystem: true
            }));
            await setDoc(docRef, {
                mainTitle: "ShopDigital",
                mainSubtitle: "Tu guía de ofertas locales",
                theme: 'default',
                primaryColor: '#22d3ee',
                townName: townId === 'esteban-echeverria' ? "Esteban Echeverría" : townId,
                categories: serializable,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        return true;
    } catch (error) {
        console.error("Error inicializando zona:", error);
        throw error;
    }
};

/**
 * Migra todos los registros (comercios, clientes, ofertas) que no tengan townId 
 * asignándoles la zona especificada.
 */
export const migrarDatosLegados = async (targetTownId: string = 'esteban-echeverria') => {
    try {
        console.log("Iniciando migración de datos legados a:", targetTownId);
        
        // 1. Migrar Comercios
        const shopsSnap = await getDocs(collection(db, "comercios"));
        const shopsToUpdate = shopsSnap.docs.filter(d => !d.data().townId);
        for (const d of shopsToUpdate) {
            await updateDoc(doc(db, "comercios", d.id), { townId: targetTownId });
        }
        
        // 2. Migrar Clientes
        const clientsSnap = await getDocs(collection(db, "clientes"));
        const clientsToUpdate = clientsSnap.docs.filter(d => !d.data().townId);
        for (const d of clientsToUpdate) {
            await updateDoc(doc(db, "clientes", d.id), { townId: targetTownId });
        }

        // 3. Migrar Ofertas
        const offersSnap = await getDocs(collection(db, "ofertas"));
        const offersToUpdate = offersSnap.docs.filter(d => !d.data().townId);
        for (const d of offersToUpdate) {
            await updateDoc(doc(db, "ofertas", d.id), { townId: targetTownId });
        }

        console.log(`Migración completada. Actualizados: ${shopsToUpdate.length} comercios, ${clientsToUpdate.length} clientes, ${offersToUpdate.length} ofertas.`);
        
        // 4. Asegurar que la zona destino tenga rubros
        await inicializarZonaPredeterminada(targetTownId);
        
        return {
            shops: shopsToUpdate.length,
            clients: clientsToUpdate.length,
            offers: offersToUpdate.length
        };
    } catch (error) {
        console.error("Error en migración:", error);
        throw error;
    }
};

// --- CEREBRO DE CONSULTAS IA (LA MENTE DE DATOS DEL BOT) ---

export const SumaTotal = async (townId: string, locality?: string, period?: string, status?: string): Promise<number> => {
    try {
        const colRef = collection(db, "facturas");
        let constraints: any[] = [where("townId", "==", townId)];
        if (status) constraints.push(where("status", "==", status));
        // Filtramos localidad y periodo localmente
        const q = query(colRef, ...constraints);
        const snapshot = await getDocs(q);
        let facturas = snapshot.docs.map(d => d.data() as any);
        
        const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        if (locality) {
            const normalizedLoc = normalize(locality);
            facturas = facturas.filter(f => normalize(f.locality) === normalizedLoc);
        }
        if (period) facturas = facturas.filter(f => f.period === period);
        
        return facturas.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    } catch (error) {
        console.error("Error en SumaTotal (IA):", error);
        return 0;
    }
};

export const ConteoPendientes = async (townId: string, locality?: string, period?: string): Promise<number> => {
    try {
        const colRef = collection(db, "facturas");
        const q = query(colRef, where("townId", "==", townId), where("status", "==", "pending"));
        const snapshot = await getDocs(q);
        let facturas = snapshot.docs.map(d => d.data() as any);
        
        const normalize = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        if (locality) {
            const normalizedLoc = normalize(locality);
            facturas = facturas.filter(f => normalize(f.locality) === normalizedLoc);
        }
        if (period) facturas = facturas.filter(f => f.period === period);
        
        return facturas.length;
    } catch (error) {
        console.error("Error en ConteoPendientes (IA):", error);
        return 0;
    }
};

// ==============================
// 🐕 PROTOCOLO DOBERMAN (Security Logs)
// ==============================
const ROOT_EMAIL = 'walyconexion@gmail.com';

export const registrarIntrusionBunker = async (email: string | null) => {
    // 🛡️ NO registrar al Director — Reconocimiento de Dueño
    if (email && email.trim().toLowerCase() === ROOT_EMAIL) return;

    try {
        // Obtener IP + País (Geo-IP gratuito)
        let ip = 'desconocida';
        let country = 'Desconocido';
        let countryCode = '??';
        try {
            const geoRes = await fetch('https://ipapi.co/json/');
            const geoData = await geoRes.json();
            ip = geoData.ip || 'desconocida';
            country = geoData.country_name || 'Desconocido';
            countryCode = geoData.country_code || '??';
        } catch {
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                ip = ipData.ip || 'desconocida';
            } catch { ip = 'no-disponible'; }
        }

        await addDoc(collection(db, 'securityLogs'), {
            type: 'bunker_intrusion',
            email: email || 'anonimo',
            ip,
            country,
            countryCode,
            userAgent: navigator.userAgent.substring(0, 150),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('es-AR'),
            time: new Date().toLocaleTimeString('es-AR'),
        });
        console.warn(`[DOBERMAN] 🐕 Intrusión registrada: ${email || 'anónimo'} desde ${country} (IP: ${ip})`);
    } catch (error) {
        console.error("[DOBERMAN] Error registrando intrusión:", error);
    }
};

export const obtenerIntrusiones = async (maxResults: number = 20): Promise<any[]> => {
    try {
        const q = query(
            collection(db, 'securityLogs'),
            orderBy('timestamp', 'desc'),
            limit(maxResults)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("[DOBERMAN] Error leyendo intrusiones:", error);
        return [];
    }
};

export const eliminarIntrusion = async (logId: string) => {
    try {
        await deleteDoc(doc(db, 'securityLogs', logId));
        console.log(`[DOBERMAN] Intruso ${logId} eliminado del registro.`);
    } catch (error) {
        console.error("[DOBERMAN] Error eliminando intrusión:", error);
    }
};

export const limpiarTodasIntrusiones = async () => {
    try {
        const snap = await getDocs(collection(db, 'securityLogs'));
        const batch: Promise<void>[] = [];
        snap.docs.forEach(d => batch.push(deleteDoc(doc(db, 'securityLogs', d.id))));
        await Promise.all(batch);
        console.log(`[DOBERMAN] 🧹 ${snap.size} registros limpiados.`);
    } catch (error) {
        console.error("[DOBERMAN] Error limpiando:", error);
    }
};

// ==============================
// 📺 CANAL DE BROADCAST (Muro Vivo)
// ==============================
export interface Broadcast {
    id?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    title: string;
    description?: string;
    targetCategories: string[];  // ['all'] o ['pizzerias','heladerias']
    active: boolean;
    priority: number;
    targetTowns: string[];  // Ej: ['global'], ['ezeiza', 'esteban-echeverria']
    createdAt: string;
    createdBy: string;
    scheduledStart?: string; // ISO String para activar
    scheduledEnd?: string;   // ISO String para desactivar
}

export const guardarBroadcast = async (broadcast: Omit<Broadcast, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'broadcastChannel'), {
            ...broadcast,
            createdAt: new Date().toISOString(),
        });
        console.log(`[BROADCAST] 📡 Transmisión creada: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("[BROADCAST] Error guardando:", error);
    }
};

export const suscribirseABroadcast = (onUpdate: (broadcasts: Broadcast[]) => void, townId: string = 'esteban-echeverria') => {
    const q = query(
        collection(db, 'broadcastChannel'),
        where('active', '==', true),
        where('targetTowns', 'array-contains-any', [townId, 'global']),
    );
    return onSnapshot(q, (snap) => {
        const broadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Broadcast));
        // Ordenar por prioridad (menor número = mayor prioridad)
        broadcasts.sort((a, b) => (a.priority || 99) - (b.priority || 99));
        onUpdate(broadcasts);
    }, (error) => {
        console.error("[BROADCAST] Error suscribiéndose:", error);
        onUpdate([]);
    });
};

export const obtenerBroadcasts = async (townId: string = 'esteban-echeverria'): Promise<Broadcast[]> => {
    try {
        const snap = await getDocs(collection(db, 'broadcastChannel'));
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Broadcast))
            .filter(b => (!b.targetTowns) ? true : b.targetTowns.includes('global') || b.targetTowns.includes(townId) || (b as any).townId === townId || (b as any).townId === 'global'); 
             // Mantiene compatibilidad con migraciones de datos viejos que usan townId
    } catch (error) {
        console.error("[BROADCAST] Error obteniendo:", error);
        return [];
    }
};

export const eliminarBroadcast = async (broadcastId: string) => {
    try {
        await deleteDoc(doc(db, 'broadcastChannel', broadcastId));
        console.log(`[BROADCAST] Transmisión ${broadcastId} eliminada.`);
    } catch (error) {
        console.error("[BROADCAST] Error eliminando:", error);
    }
};

export const toggleBroadcast = async (broadcastId: string, active: boolean) => {
    try {
        await updateDoc(doc(db, 'broadcastChannel', broadcastId), { active });
        console.log(`[BROADCAST] Transmisión ${broadcastId} → ${active ? 'ON' : 'OFF'}`);
    } catch (error) {
        console.error("[BROADCAST] Error toggle:", error);
    }
};

export const editarBroadcast = async (broadcastId: string, updates: Partial<Broadcast>) => {
    try {
        await updateDoc(doc(db, 'broadcastChannel', broadcastId), updates);
        console.log(`[BROADCAST] Transmisión ${broadcastId} editada.`);
    } catch (error) {
        console.error("[BROADCAST] Error editando:", error);
    }
};

// --- BITÁCORA DE MARKETING (ARI ASSISTANT) ---
import { MarketingCampaign } from './types';

export const guardarCampaniaMarketing = async (campaignData: Omit<MarketingCampaign, 'id' | 'createdAt'>) => {
    try {
        const colRef = collection(db, "bitacora_marketing");
        const docRef = await addDoc(colRef, {
            ...campaignData,
            createdAt: new Date().toISOString()
        });
        console.log("Campaña agendada en la Bitácora. ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar campaña en Bitácora:", error);
        throw error;
    }
};

export const suscribirseACampaniasMarketing = (shopId: string, callback: (campaigns: MarketingCampaign[]) => void) => {
    const colRef = collection(db, "bitacora_marketing");
    const q = query(
        colRef, 
        where("shopId", "==", shopId),
        orderBy("scheduledDate", "asc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const campaigns = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as any)
        })) as MarketingCampaign[];
        callback(campaigns);
    }, (error) => {
        console.error("Error en la suscripción de bitácora marketing:", error);
    });
};

export const actualizarEstadoCampania = async (campaignId: string, status: 'executed' | 'cancelled') => {
    try {
        const docRef = doc(db, "bitacora_marketing", campaignId);
        await updateDoc(docRef, { status });
        return true;
    } catch (error) {
        console.error("Error al actualizar estado de campaña:", error);
        throw error;
    }
};

// --- EXPANSIÓN REGIONAL ---
import { Region } from './types';

export const guardarRegion = async (region: Region) => {
    try {
        await setDoc(doc(db, 'regiones', region.id), region);
        console.log(`[EXPANSIÓN] Región ${region.name} forjada con éxito.`);
    } catch (error) {
        console.error("[EXPANSIÓN] Error guardando región:", error);
        throw error;
    }
};

export const suscribirseARegiones = (callback: (regions: Region[]) => void) => {
    const colRef = collection(db, 'regiones');
    return onSnapshot(colRef, (snapshot) => {
        const regions = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Region[];
        callback(regions.filter(r => r.isActive));
    });
};

export const obtenerRegionPorId = async (regionId: string): Promise<Region | null> => {
    try {
        const docSnap = await getDoc(doc(db, 'regiones', regionId));
        if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Region;
        return null;
    } catch (error) {
        console.error("[EXPANSIÓN] Error obteniendo región:", error);
        return null;
    }
};

export const obtenerTownsPorRegion = async (regionId: string) => {
    try {
        const region = await obtenerRegionPorId(regionId);
        if (!region) return [];
        const colRef = collection(db, 'towns');
        const snapshot = await getDocs(colRef);
        const allTowns = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return allTowns.filter((t: any) => region.towns.includes(t.id));
    } catch (error) {
        console.error("[EXPANSIÓN] Error obteniendo towns de región:", error);
        return [];
    }
};

// ==============================
// 📡 MENSAJERÍA BÚNKER -> EMBAJADOR (FRECUENCIA DIRECTIVA)
// ==============================
export interface BunkerMessage {
    id?: string;
    text: string;
    sender: 'director';
    recipientId: 'all' | string; // 'all' para todos, o ID del embajador
    recipientName: string;
    createdAt: string;
    isRead: boolean;
    readAt?: string;
}

export const enviarMensajeBunker = async (mensaje: Omit<BunkerMessage, 'id' | 'createdAt' | 'isRead'>) => {
    try {
        const docRef = await addDoc(collection(db, 'bunker_messages'), {
            ...mensaje,
            createdAt: new Date().toISOString(),
            isRead: false
        });
        console.log(`[BÚNKER] Mensaje enviado a ${mensaje.recipientName}. ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("[BÚNKER] Error enviando mensaje:", error);
        throw error;
    }
};

export const suscribirseAMensajesBunker = (ambassadorId: string, callback: (mensajes: BunkerMessage[]) => void) => {
    const colRef = collection(db, 'bunker_messages');
    // Escuchar mensajes dirigidos a todos o específicamente a este embajador
    const q = query(
        colRef,
        where("recipientId", "in", ['all', ambassadorId]),
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const mensajes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BunkerMessage[];
        callback(mensajes);
    }, (error) => {
        console.error("[BÚNKER] Error suscribiéndose a mensajes:", error);
    });
};

export const marcarMensajeComoLeido = async (messageId: string) => {
    try {
        const docRef = doc(db, 'bunker_messages', messageId);
        await updateDoc(docRef, { 
            isRead: true, 
            readAt: new Date().toISOString() 
        });
        console.log(`[BÚNKER] Mensaje ${messageId} marcado como leído.`);
    } catch (error) {
        console.error("[BÚNKER] Error marcando mensaje como leído:", error);
    }
};

// ==============================
// 🟢 MÓDULO DE EVENTOS LIVE (ShopDigital Live)
// ==============================
import { LiveEvent } from './types';

export const guardarEvento = async (event: LiveEvent) => {
    try {
        const id = event.id || `evt-${Date.now()}`;
        await setDoc(doc(db, "eventos_live", id), { ...event, id });
        console.log("Evento guardado con éxito. ID:", id);
        return id;
    } catch (error) {
        console.error("Error al guardar evento en Firestore:", error);
        throw error;
    }
};

export const suscribirseAEventos = (callback: (events: LiveEvent[]) => void) => {
    const colRef = collection(db, "eventos_live");
    return onSnapshot(colRef, (snapshot) => {
        const events = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        })) as LiveEvent[];
        callback(events);
    }, (error) => {
        console.error("Error en la suscripción de eventos live:", error);
    });
};

export const eliminarEvento = async (eventId: string) => {
    try {
        await deleteDoc(doc(db, "eventos_live", eventId));
        console.log("Evento eliminado con éxito. ID:", eventId);
        return true;
    } catch (error) {
        console.error("Error al eliminar evento de Firestore:", error);
        throw error;
    }
};

export const actualizarEntradaCliente = async (clientId: string, ticketData: any) => {
    try {
        const docRef = doc(db, "clientes", clientId);
        await updateDoc(docRef, { activeTicket: ticketData });
        console.log(`Entrada asignada a cliente ${clientId}`);
        return true;
    } catch (error) {
        console.error("Error al asignar entrada en Firestore:", error);
        throw error;
    }
};

// ── Image Processor: reutiliza el pipeline central de WebP ────────────────
import { processImageToBlob } from './utils/imageProcessor';

/** @deprecated Usa processImageToBlob('bunker') en su lugar. Mantenemos para compatibilidad. */
const compressBunkerImage = async (file: File): Promise<Blob | File> => {
    try {
        const { blob } = await processImageToBlob(file, 'bunker');
        return blob;
    } catch {
        console.warn('[ShopDigital] Compresión fallida, usando imagen original.');
        return file;
    }
};


export const subirArchivoBunker = async (file: File, path: string): Promise<string> => {
    let fileToUpload: Blob | File = file;
    if (file.type.startsWith('image/')) {
        try {
            fileToUpload = await compressBunkerImage(file);
        } catch (e) {
            console.warn("Image compression failed, using original file:", e);
        }
    }

    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, fileToUpload);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.warn("Storage upload failed, falling back to local base64:", error);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fileToUpload as Blob);
        });
    }
};

// ==============================
// 🧠 SISTEMA NERVIOSO CENTRAL (SNC) - DIRECTIVAS DE BÚNKER
// ==============================
import { BunkerDirective, BunkerReply } from './types';

export const enviarDirectivaBunker = async (directive: Omit<BunkerDirective, 'id' | 'fechaCreacion' | 'estado'> & { estado?: 'active' | 'archived' | 'pending_approval' }) => {
    try {
        const docRef = await addDoc(collection(db, 'bunker_directives'), {
            ...directive,
            fechaCreacion: new Date().toISOString(),
            estado: directive.estado || 'active',
            respuestas: []
        });
        console.log(`[SNC] Directiva creada: ${directive.title}. ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("[SNC] Error enviando directiva:", error);
        throw error;
    }
};

export const suscribirseADirectivasBunker = (bunkerId: string, callback: (directives: BunkerDirective[]) => void) => {
    const colRef = collection(db, 'bunker_directives');
    // Sin orderBy para evitar necesitar índice compuesto — se ordena en cliente
    const q = query(
        colRef,
        where("estado", "in", ["active", "pending_approval"])
    );
    
    return onSnapshot(q, (snapshot) => {
        const allDirectives = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BunkerDirective[];
        // Ordenar por fecha descendente en cliente
        allDirectives.sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''));
        const filtered = allDirectives.filter(d => 
            (Array.isArray(d.targetBunkers) && (d.targetBunkers.includes('all') || d.targetBunkers.includes(bunkerId))) || d.sender === bunkerId
        );
        callback(filtered);
    }, (error) => {
        console.error(`[SNC] Error suscribiéndose a directivas del búnker ${bunkerId}:`, error);
    });
};

export const suscribirseATodasDirectivas = (callback: (directives: BunkerDirective[]) => void) => {
    // Sin orderBy para evitar necesitar índice compuesto — se ordena en cliente
    const q = query(
        collection(db, 'bunker_directives'),
        where("estado", "in", ["active", "pending_approval"])
    );
    return onSnapshot(q, (snapshot) => {
        const directives = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BunkerDirective[];
        // Ordenar por fecha descendente en cliente
        directives.sort((a, b) => (b.fechaCreacion || '').localeCompare(a.fechaCreacion || ''));
        callback(directives);
    }, (error) => {
        console.error("[SNC] Error en suscripción maestra de directivas:", error);
    });
};

export const responderDirectivaBunker = async (directiveId: string, reply: BunkerReply) => {
    try {
        const docRef = doc(db, 'bunker_directives', directiveId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data() as BunkerDirective;
            const respuestas = data.respuestas || [];
            
            const filtered = respuestas.filter(r => r.bunkerId !== reply.bunkerId);
            filtered.push(reply);

            await updateDoc(docRef, { respuestas: filtered });
            console.log(`[SNC] Respuesta del búnker ${reply.bunkerId} registrada.`);
        }
    } catch (error) {
        console.error("[SNC] Error respondiendo directiva:", error);
        throw error;
    }
};

export const archivarDirectiva = async (directiveId: string) => {
    try {
        const docRef = doc(db, 'bunker_directives', directiveId);
        await updateDoc(docRef, { estado: 'archived' });
        console.log(`[SNC] Directiva ${directiveId} archivada.`);
    } catch (error) {
        console.error("[SNC] Error archivando directiva:", error);
        throw error;
    }
};

export const activarDirectiva = async (directiveId: string) => {
    try {
        const docRef = doc(db, 'bunker_directives', directiveId);
        await updateDoc(docRef, { estado: 'active' });
        console.log(`[SNC] Directiva ${directiveId} activada.`);
    } catch (error) {
        console.error("[SNC] Error activando directiva:", error);
        throw error;
    }
};

// ==============================
// 🌐 SNC NIVEL 3: MATRIZ DE SINCRONÍA (INTERCOMUNICADOR AGENTES)
// ==============================
export interface SncMessage {
    id?: string;
    role: 'user' | 'model' | 'system';
    agent: 'gemy' | 'luz' | 'ari' | 'director' | 'system';
    text: string;
    timestamp: string;
    contextTags?: string[];
}

export const enviarMensajeMatriz = async (mensaje: Omit<SncMessage, 'id' | 'timestamp'>) => {
    try {
        const docRef = await addDoc(collection(db, 'matriz_sincronia'), {
            ...mensaje,
            timestamp: new Date().toISOString()
        });
        console.log(`[SNC Nivel 3] Mensaje guardado en Matriz. ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("[SNC Nivel 3] Error guardando mensaje:", error);
        throw error;
    }
};

export const suscribirseAMatriz = (callback: (mensajes: SncMessage[]) => void, limitCount: number = 20) => {
    const qDesc = query(
        collection(db, 'matriz_sincronia'),
        orderBy("timestamp", "desc"),
        limit(limitCount)
    );
    
    return onSnapshot(qDesc, (snapshot) => {
        const mensajes = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SncMessage[];
        callback(mensajes.reverse()); // Devolver en orden cronológico normal (antiguo a nuevo)
    }, (error) => {
        console.error("[SNC Nivel 3] Error en suscripción de Matriz:", error);
    });
};

export const obtenerHistorialMatriz = async (limitCount: number = 20): Promise<SncMessage[]> => {
    try {
        const q = query(
            collection(db, 'matriz_sincronia'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snap = await getDocs(q);
        const mensajes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SncMessage[];
        return mensajes.reverse(); // Devolver en orden cronológico normal
    } catch (error) {
        console.error("[SNC Nivel 3] Error leyendo historial Matriz:", error);
        return [];
    }
};

export const guardarComerciosMasivos = async (comercios: any[], townId: string = 'esteban-echeverria') => {
    try {
        const promises = comercios.map(async (c) => {
            let slug = c.slug;
            if (!slug && c.name) {
                slug = c.name.toString().toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\-]+/g, '')
                    .replace(/\-\-+/g, '-')
                    .replace(/^-+/, '')
                    .replace(/-+$/, '');
            }
            const finalData = { 
                ...c, 
                slug, 
                townId: c.townId || townId,
                isActive: c.isActive !== undefined ? c.isActive : true,
                createdAt: c.createdAt || new Date().toISOString()
            };
            return setDoc(doc(db, "comercios", c.id), finalData);
        });
        await Promise.all(promises);
        console.log(`[Siembra] Guardados ${comercios.length} comercios masivamente.`);
        return true;
    } catch (e) {
        console.error("Error al guardar comercios masivos:", e);
        throw e;
    }
};

export const triggerOnboardingWebhook = async (shop: any, townId: string = 'esteban-echeverria'): Promise<boolean> => {
    if (shop.onboardingSent) {
        console.log(`[ONBOARDING] Webhook ya enviado anteriormente para ${shop.name}`);
        return true;
    }

    try {
        const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/b428rov524nlileo9bhjpxh3wpxzoynb';
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shopdigital.tech';
        
        const category = shop.category || 'comercios';
        const slug = shop.slug || '';
        
        const credencialUrl = `${origin}/${townId}/${category}/${slug}/credencial`;
        const landingUrl = `${origin}/${townId}/descubrir`;
        const descuentosUrl = `${origin}/${townId}/red-comercial/descuentos`;
        const facturaUrl = shop.invoiceSimulationUrl || `${origin}/${townId}/${category}/${slug}/factura`;
        
        const payload = {
            triggerType: "welcome_onboarding",
            shopId: shop.id,
            shopName: shop.name,
            ownerName: shop.ownerName || shop.contactName || '',
            phone: shop.phone || '',
            memberNumber: shop.memberNumber || shop.shopNumber || '001',
            credencialUrl,
            landingUrl,
            descuentosUrl,
            facturaUrl,
            canalComerciantesUrl: 'https://whatsapp.com/channel/0029VbCU0awK0IBrdkOWkR2I',
            canalClientesUrl: 'https://whatsapp.com/channel/0029VbCS4rvInlqNj9tcA40m',
            ariUrl: 'https://wa.me/5491140607059',
            townId,
            timestamp: new Date().toISOString()
        };

        console.log(`[ONBOARDING] Enviando webhook de activación para ${shop.name}...`, payload);
        
        const res = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        // Marcar en la base de datos que ya se envió
        const docRef = doc(db, "comercios", shop.id);
        await updateDoc(docRef, {
            onboardingSent: true,
            onboardingSentAt: new Date().toISOString()
        });

        console.log(`[ONBOARDING] Webhook enviado y registrado para ${shop.name}`);
        return true;
    } catch (err: any) {
        console.error('[ONBOARDING ERROR] Failed to send onboarding webhook:', err);
        return false;
    }
};

export default app;
