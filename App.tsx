import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './components/LanguageContext';
import { Shop, Client, Offer } from './types';
import { 
  suscribirseAComercios, suscribirseAClientes, suscribirseAOfertas, 
  subscribeToGlobalConfig, migrarDatosLegados 
} from './firebase';
import { subscribeToEnterpriseConfig } from './firebase_enterprise';
import { populateInvoices, rescueEzeizaData } from './dbFix';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CRITICAL PATH — Importaciones síncronas (se necesitan en el primer render)
// ─────────────────────────────────────────────────────────────────────────────
import Home from './pages/Home';
import GlobalHomePage from './pages/GlobalHomePage';
import LandingPage from './pages/LandingPage';

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ LAZY ROUTES — Cargadas sólo cuando el usuario navega a esa ruta
// ─────────────────────────────────────────────────────────────────────────────

// Páginas genéricas y públicas
const AboutPage               = React.lazy(() => import('./pages/AboutPage'));
const MerchantLandingPage     = React.lazy(() => import('./pages/MerchantLandingPage'));
const IndustrialLandingPage   = React.lazy(() => import('./pages/IndustrialLandingPage'));
const RegionSelectPage        = React.lazy(() => import('./pages/RegionSelectPage'));
const RegionSeedPage          = React.lazy(() => import('./pages/RegionSeedPage'));
const CategoryPage            = React.lazy(() => import('./pages/CategoryPage'));
const ShopDetailPage          = React.lazy(() => import('./pages/ShopDetailPage'));
const CredencialPage          = React.lazy(() => import('./pages/CredencialPage'));
const DiscountsPage           = React.lazy(() => import('./pages/DiscountsPage'));
const VipBenefitsPage         = React.lazy(() => import('./pages/VipBenefitsPage'));
const MerchantBenefitsPage    = React.lazy(() => import('./pages/MerchantBenefitsPage'));
const TermsPage               = React.lazy(() => import('./pages/TermsPage'));
const EventLandingPage        = React.lazy(() => import('./pages/EventLandingPage'));
const ShopMenuPage            = React.lazy(() => import('./pages/ShopMenuPage'));
const BusinessLandingPage     = React.lazy(() => import('./pages/BusinessLandingPage'));
const MuroNovedades           = React.lazy(() => import('./components/MuroNovedades'));

// Suscripciones y onboarding
const SubscriptionPage        = React.lazy(() => import('./pages/SubscriptionPage'));
const ShopOnboardingPage      = React.lazy(() => import('./pages/ShopOnboardingPage'));
const ValidationPage          = React.lazy(() => import('./pages/ValidationPage'));

// Paneles de administración (admin-panels chunk)
const AdminPanelPage          = React.lazy(() => import('./pages/AdminPanelPage'));
const MasterPanelPage         = React.lazy(() => import('./pages/MasterPanelPage'));
const ShopEditPage            = React.lazy(() => import('./pages/ShopEditPage'));
const ShopMasterPanelPage     = React.lazy(() => import('./pages/ShopMasterPanelPage'));
const GlobalConfigPage        = React.lazy(() => import('./pages/GlobalConfigPage'));
const MarketingPanelPage      = React.lazy(() => import('./pages/MarketingPanelPage'));
const CreditsPosnetPage       = React.lazy(() => import('./pages/CreditsPosnetPage'));

// Embajadores y academia (admin-panels chunk)
const AmbassadorPanelPage          = React.lazy(() => import('./pages/AmbassadorPanelPage'));
const AmbassadorAgendaPage         = React.lazy(() => import('./pages/AmbassadorAgendaPage'));
const AmbassadorRecruitPage1       = React.lazy(() => import('./pages/AmbassadorRecruitPage1'));
const AmbassadorRecruitPage2       = React.lazy(() => import('./pages/AmbassadorRecruitPage2'));
const AmbassadorRecruitmentAdminPage = React.lazy(() => import('./pages/AmbassadorRecruitmentAdminPage'));
const AcademyPage                  = React.lazy(() => import('./pages/AcademyPage'));

// Gestión de datos (management chunk)
const ShopManagementPage      = React.lazy(() => import('./pages/ShopManagementPage'));
const ClientManagementPage    = React.lazy(() => import('./pages/ClientManagementPage'));
const OfferManagementPage     = React.lazy(() => import('./pages/OfferManagementPage'));
const OfferFormPage           = React.lazy(() => import('./pages/OfferFormPage'));
const BillingManagementPage   = React.lazy(() => import('./pages/BillingManagementPage'));
const InvoiceViewerPage       = React.lazy(() => import('./pages/InvoiceViewerPage'));
const SurveyFormPage          = React.lazy(() => import('./pages/SurveyFormPage'));
const SurveyManagementPage    = React.lazy(() => import('./pages/SurveyManagementPage'));
const FactoryPanelPage        = React.lazy(() => import('./pages/FactoryPanelPage'));

// Flujo cliente / VIP (client-flow chunk)
const ClientSubscriptionPage  = React.lazy(() => import('./pages/ClientSubscriptionPage'));
const ClientsDatabasePage     = React.lazy(() => import('./pages/ClientsDatabasePage'));
const ClientOffersPage        = React.lazy(() => import('./pages/ClientOffersPage'));
const ClientLandingPage       = React.lazy(() => import('./pages/ClientLandingPage'));
const ClientManagementPage2   = React.lazy(() => import('./pages/ClientManagementPage'));
const ClientCredentialPage    = React.lazy(() => import('./pages/ClientCredentialPage'));
const ClientValidationPage    = React.lazy(() => import('./pages/ClientValidationPage'));
const ClientVipCredentialPage = React.lazy(() => import('./pages/ClientVipCredentialPage'));

// Enterprise (enterprise chunk)
const EnterpriseHomePage         = React.lazy(() => import('./pages/EnterpriseHomePage'));
const EnterpriseCategoryPage     = React.lazy(() => import('./pages/EnterpriseCategoryPage'));
const EnterpriseDetailPage       = React.lazy(() => import('./pages/EnterpriseDetailPage'));
const EnterpriseManagementPage   = React.lazy(() => import('./pages/EnterpriseManagementPage'));
const EnterpriseFormPage         = React.lazy(() => import('./pages/EnterpriseFormPage'));
const EnterpriseGlobalConfigPage = React.lazy(() => import('./pages/EnterpriseGlobalConfigPage'));
const EnterpriseMasterBoardPage  = React.lazy(() => import('./pages/EnterpriseMasterBoardPage'));
const EnterpriseSubscriptionPage = React.lazy(() => import('./pages/EnterpriseSubscriptionPage'));
const EnterpriseClientManagementPage = React.lazy(() => import('./pages/EnterpriseClientManagementPage'));

// Búnkers (bunkers chunk)
const DirectorBunkerPage      = React.lazy(() => import('./pages/DirectorBunkerPage').then(m => ({ default: m.DirectorBunkerPage })));
const AdminBunkerPage         = React.lazy(() => import('./pages/AdminBunkerPage').then(m => ({ default: m.AdminBunkerPage })));
const AccountingBunkerPage    = React.lazy(() => import('./pages/AccountingBunkerPage').then(m => ({ default: m.AccountingBunkerPage })));
const MarketingBunkerPage     = React.lazy(() => import('./pages/MarketingBunkerPage').then(m => ({ default: m.MarketingBunkerPage })));
const HRBunkerPage            = React.lazy(() => import('./pages/HRBunkerPage').then(m => ({ default: m.HRBunkerPage })));
const SystemsBunkerPage       = React.lazy(() => import('./pages/SystemsBunkerPage').then(m => ({ default: m.SystemsBunkerPage })));
const PlanningBunkerPage      = React.lazy(() => import('./pages/PlanningBunkerPage').then(m => ({ default: m.PlanningBunkerPage })));
const InvestmentBunkerPage    = React.lazy(() => import('./pages/InvestmentBunkerPage').then(m => ({ default: m.InvestmentBunkerPage })));
const MaintenanceBunkerPage   = React.lazy(() => import('./pages/MaintenanceBunkerPage').then(m => ({ default: m.MaintenanceBunkerPage })));
const SecOpsBunkerPage        = React.lazy(() => import('./pages/SecOpsBunkerPage').then(m => ({ default: m.SecOpsBunkerPage })));
const CloningBunkerPage       = React.lazy(() => import('./pages/CloningBunkerPage').then(m => ({ default: m.CloningBunkerPage })));
const LiveBroadcastPage       = React.lazy(() => import('./pages/LiveBroadcastPage'));

// ─────────────────────────────────────────────────────────────────────────────
// 💤 Suspense fallback — pantalla mínima mientras se descarga el chunk
// ─────────────────────────────────────────────────────────────────────────────
const PageFallback: React.FC = () => (
  <div className="h-screen w-full flex items-center justify-center bg-black">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60">Cargando</span>
    </div>
  </div>
);

import { TRASLASIERRA_REGION } from './data/regionalTemplates/traslasierraConfig';
import { PATAGONIA_7_LAGOS_REGION } from './data/regionalTemplates/patagonia7LagosConfig';


const DEFAULT_BANNER = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop";

// --- TOWN CONTROLLER COMPONENT ---
// Este componente extrae el townId de la URL y maneja toda la lógica de suscripciones
const TownController: React.FC = () => {
    // RESOLUCIÓN DE ZONA BLINDADA: Prioridad absoluta al parámetro de URL
    const params = useParams<{ townId: string }>();
    const townId = params.townId || 'esteban-echeverria';
    const location = useLocation();
    
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [allOffers, setAllOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLoader, setShowLoader] = useState(true);
    const [globalConfig, setGlobalConfig] = useState<any>({
        mainTitle: "ShopDigital",
        mainSubtitle: "Tu guía de ofertas locales",
        theme: 'default',
        primaryColor: '#22d3ee',
        townName: townId === 'esteban-echeverria' ? "Esteban Echeverría" : townId
    });

    const [enterpriseGlobalConfig, setEnterpriseGlobalConfig] = useState<any>({
        mainTitle: "Directorio Industrial",
        mainSubtitle: "Conectando la fuerza productiva",
        theme: 'default',
        primaryColor: '#f59e0b',
        townName: townId === 'esteban-echeverria' ? "Esteban Echeverría" : townId,
        bgColor: '#000000'
    });

    // --- REPAIR TRIGGER VIA URL (?repair=true) ---
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('repair') === 'true') {
            console.log("🛠️ ACTIVADOR MAESTRO DETECTADO: Iniciando reparación de emergencia...");
            migrarDatosLegados(townId)
                .then(async (result) => {
                    console.log("✅ REPARACIÓN EXITOSA:", result);
                    // Adicionalmente, ejecutar rescate de Ezeiza para asegurar multiverso
                    const rescue = await rescueEzeizaData();
                    console.log("🛡️ RESCATE ADICIONAL:", rescue);
                    alert(`¡SISTEMA REESTABLECIDO! Datos resucitados y ${rescue.clientsFixed} fantasmas capturados.`);
                    window.history.replaceState({}, '', window.location.pathname);
                })
                .catch(err => {
                    console.error("❌ ERROR EN REPARACIÓN:", err);
                    alert("Fallo en el rescate: " + err.message);
                });
        }
        
        if (params.get('inject') === 'true') {
            console.log("🔥 INYECCIÓN DE DATOS MAESTRA INICIADA...");
            populateInvoices()
                .then(() => {
                    alert("✅ INYECCIÓN COMPLETADA. Bóveda Pizzeería El Tano y E.Echeverría listas.");
                    window.history.replaceState({}, '', window.location.pathname);
                })
                .catch(err => {
                    alert("Fallo inyección: " + err.message);
                });
        }
    }, [location.search, townId]);

    useEffect(() => {
        // 🧹 LIMPIEZA DE CACHÉ: resetear estado al cambiar de zona para evitar mezcla de datos
        setAllShops([]);
        setAllClients([]);
        setAllOffers([]);
        setLoading(true);
        const fallbackTimer = setTimeout(() => setLoading(false), 8000);

        const unsubscribe = suscribirseAComercios((fbShops) => {
            const cleanedShops = fbShops
                .filter(shop => shop && shop.name)
                .map(shop => ({
                    ...shop,
                    bannerImage: shop.bannerImage || DEFAULT_BANNER,
                    image: shop.image || shop.bannerImage || DEFAULT_BANNER,
                    offers: shop.offers || []
                }));

            setAllShops(cleanedShops);
            setLoading(false);
            clearTimeout(fallbackTimer);
        }, townId, (error) => {
            console.error("Critical: failed to get shops.", error);
            setLoading(false);
            clearTimeout(fallbackTimer);
        });

        const unsubscribeClients = suscribirseAClientes((fbClients) => {
            setAllClients(fbClients as Client[]);
        }, townId);

        const unsubscribeOffers = suscribirseAOfertas((fbOffers) => {
            setAllOffers(fbOffers as Offer[]);
        }, townId);

        const unsubscribeGlobal = subscribeToGlobalConfig((config: any) => {
            if (config) setGlobalConfig(config);
        }, townId);

        const unsubscribeEnterprise = subscribeToEnterpriseConfig((config: any) => {
            if (config) setEnterpriseGlobalConfig(config);
        });

        return () => {
            unsubscribe();
            unsubscribeClients();
            unsubscribeOffers();
            unsubscribeGlobal();
            unsubscribeEnterprise();
        };
    }, [townId]);

    // Verificar si la zona actual pertenece a la región de Traslasierra o Patagonia 7 Lagos
    const isInTraslasierra = TRASLASIERRA_REGION.towns.some(t => t.id === townId);
    const isInPatagonia = PATAGONIA_7_LAGOS_REGION.towns.some(t => t.id === townId);

    // Forzar color celeste (#22d3ee) y nombre formateado para Esteban Echeverría, Ezeiza y Lomas de Zamora
    const currentTownName = townId === 'esteban-echeverria' ? "Esteban Echeverría" :
                            townId === 'ezeiza' ? "Ezeiza" :
                            townId === 'lomas-de-zamora' ? "Lomas de Zamora" :
                            townId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const baseGlobalConfig = (townId === 'esteban-echeverria' || townId === 'ezeiza' || townId === 'lomas-de-zamora')
        ? { ...globalConfig, primaryColor: '#22d3ee', themeColor: '#22d3ee', townName: currentTownName }
        : { ...globalConfig, townName: currentTownName };

    // Inyectar configuración regional si aplica
    const effectiveGlobalConfig = isInTraslasierra 
        ? { ...baseGlobalConfig, categories: TRASLASIERRA_REGION.categories }
        : isInPatagonia
        ? { ...baseGlobalConfig, categories: PATAGONIA_7_LAGOS_REGION.categories }
        : baseGlobalConfig;

    return (
        <>
            {showLoader && (
                <LoadingScreen ready={!loading} onDone={() => setShowLoader(false)} />
            )}

            <Routes>
                <Route path="/" element={<Layout allShops={allShops} globalConfig={effectiveGlobalConfig} />}>
                    <Route index element={<Navigate to="home" replace />} />
                    <Route path="home" element={<Home globalConfig={effectiveGlobalConfig} />} />
                    <Route path=":categorySlug" element={<CategoryPage allShops={allShops} globalConfig={effectiveGlobalConfig} />} />
                    <Route path=":categorySlug/:shopSlug" element={<ShopDetailPage allShops={allShops} globalConfig={effectiveGlobalConfig} />} />
                    <Route path=":categorySlug/:shopSlug/menu" element={<ShopMenuPage allShops={allShops} />} />
                    <Route path=":categorySlug/:shopSlug/credencial" element={<CredencialPage allShops={allShops} />} />
                    <Route path=":categorySlug/:shopSlug/panel-autogestion" element={<AdminPanelPage allShops={allShops} allClients={allClients} />} />
                    <Route path=":categorySlug/:shopSlug/validar" element={<ValidationPage allShops={allShops} />} />
                    <Route path="red-comercial/descuentos" element={<DiscountsPage allOffers={allOffers} />} />
                    <Route path="red-comercial/ofertas" element={<ClientOffersPage allOffers={allOffers} />} />
                    <Route path="beneficios-vip" element={<VipBenefitsPage />} />
                    <Route path="beneficios-comercios" element={<MerchantBenefitsPage />} />
                    <Route path="unirse" element={<LandingPage />} />
                    <Route path="negocios" element={<BusinessLandingPage />} />
                    <Route path="descubrir" element={<ClientLandingPage />} />
                    <Route path="subscripcion" element={<SubscriptionPage />} />
                    <Route path="reclutamiento" element={<AmbassadorRecruitPage1 />} />
                    <Route path="reclutamiento/alta/:id" element={<AmbassadorRecruitPage2 />} />
                    <Route path="embajador" element={<ProtectedRoute roles={['admin', 'ambassador']}><AmbassadorPanelPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path="embajador/agenda" element={<ProtectedRoute roles={['admin', 'ambassador']}><AmbassadorAgendaPage /></ProtectedRoute>} />
                    <Route path="embajador/gestion" element={<ProtectedRoute roles={['admin', 'ambassador']}><ShopManagementPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path="embajador/editar/:shopId" element={<ProtectedRoute roles={['admin', 'ambassador']}><ShopEditPage allShops={allShops} /></ProtectedRoute>} />
                    {/* 🚀 ONBOARDING BLITZKRIEG — Pantalla de Artillería */}
                    <Route path="embajador/onboarding/:shopId" element={<ProtectedRoute roles={['admin', 'ambassador']}><ShopOnboardingPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path=":categorySlug/:shopSlug/editar" element={<ShopEditPage allShops={allShops} />} />
                    <Route path="mi-catalogo/editar/:shopId" element={<ShopEditPage allShops={allShops} />} />
                    <Route path="embajador/clientes" element={<ProtectedRoute roles={['admin', 'ambassador']}><ClientManagementPage allShops={allShops} allClients={allClients} /></ProtectedRoute>} />
                    <Route path="embajador/ofertas/:target" element={<ProtectedRoute roles={['admin', 'ambassador']}><OfferManagementPage allOffers={allOffers} /></ProtectedRoute>} />
                    <Route path="embajador/ofertas/crear/:target" element={<ProtectedRoute roles={['admin', 'ambassador']}><OfferFormPage /></ProtectedRoute>} />
                    <Route path="embajador/ofertas/editar/:offerId" element={<ProtectedRoute roles={['admin', 'ambassador']}><OfferFormPage allOffers={allOffers} /></ProtectedRoute>} />
                    <Route path="nosotros" element={<AboutPage />} />
                    <Route path="eventos/:eventId" element={<EventLandingPage allShops={allShops} />} />
                    <Route path="cliente/:clientId/credencial" element={<ClientCredentialPage />} />
                    <Route path="cliente/:clientId/validar" element={<ClientValidationPage />} />
                    <Route path="validar/:clientId" element={<ClientValidationPage />} />
                    <Route path="mi-comercio/panel-de-gestion" element={<ProtectedRoute roles={['admin', 'ambassador']}><ShopMasterPanelPage /></ProtectedRoute>} />
                    <Route path=":categorySlug/:shopSlug/cliente-subscripcion" element={<ClientSubscriptionPage allShops={allShops} />} />

                    <Route path="tablero-maestro" element={<ProtectedRoute roles={['admin']}><MasterPanelPage /></ProtectedRoute>} />
                    <Route path="tablero-maestro/fabrica" element={<ProtectedRoute roles={['admin']}><FactoryPanelPage /></ProtectedRoute>} />
                    <Route path="tablero-maestro/configuracion" element={<ProtectedRoute roles={['admin']}><GlobalConfigPage /></ProtectedRoute>} />
                    <Route path="tablero-maestro/reclutamiento" element={<ProtectedRoute roles={['admin']}><AmbassadorRecruitmentAdminPage /></ProtectedRoute>} />
                    <Route path="marketing-inteligente" element={<ProtectedRoute roles={['admin']}><MarketingPanelPage /></ProtectedRoute>} />
                    <Route path="embajador/facturacion" element={<ProtectedRoute roles={['admin', 'ambassador']}><BillingManagementPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path=":categorySlug/:shopSlug/factura" element={<InvoiceViewerPage allShops={allShops} />} />
                    <Route path=":categorySlug/:shopSlug/credencial-vip/:clientId" element={<ClientVipCredentialPage allShops={allShops} allClients={allClients} />} />
                    <Route path=":categorySlug/:shopSlug/credencial-vip" element={<ClientVipCredentialPage allShops={allShops} allClients={allClients} />} />
                    <Route path="terminos" element={<TermsPage />} />
                    <Route path="embajador/relevamiento/nuevo" element={<ProtectedRoute roles={['admin', 'ambassador']}><SurveyFormPage /></ProtectedRoute>} />
                    <Route path="embajador/relevamiento/gestion" element={<ProtectedRoute roles={['admin', 'ambassador']}><SurveyManagementPage /></ProtectedRoute>} />
                    {/* 🏭 GESTOR DE EMPRESAS B2B */}
                    <Route path="embajador/empresas" element={<ProtectedRoute roles={['admin', 'ambassador']}><EnterpriseManagementPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path="embajador/empresas/nueva" element={<ProtectedRoute roles={['admin', 'ambassador']}><EnterpriseFormPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path="embajador/empresas/editar/:enterpriseId" element={<ProtectedRoute roles={['admin', 'ambassador']}><EnterpriseFormPage allShops={allShops} /></ProtectedRoute>} />
                    <Route path="embajador/clientes-comerciantes" element={<ProtectedRoute roles={['admin', 'ambassador']}><EnterpriseClientManagementPage allShops={allShops} allClients={allClients} /></ProtectedRoute>} />
                    {/* 💳 POSNET DE CRÉDITOS */}
                    <Route path="embajador/posnet" element={<ProtectedRoute roles={['admin', 'ambassador']}><CreditsPosnetPage /></ProtectedRoute>} />
                    <Route path="mi-comercio/posnet-virtual" element={<CreditsPosnetPage />} />
                    <Route path="*" element={<Navigate to="home" replace />} />
                </Route>
            </Routes>
        </>
    );
};

// --- Controlador del Nodo Industrial B2B (Global) ---
const EnterpriseController: React.FC = () => {
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [enterpriseGlobalConfig, setEnterpriseGlobalConfig] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = suscribirseAComercios((fbShops) => {
            const cleanedShops = fbShops
                .filter(shop => shop && shop.name)
                .map(shop => ({
                    ...shop,
                    bannerImage: shop.bannerImage || '',
                    image: shop.image || shop.bannerImage || '',
                    offers: shop.offers || []
                }));
            setAllShops(cleanedShops);
        });

        const unsubscribeEnterprise = subscribeToEnterpriseConfig((config: any) => {
            if (config) setEnterpriseGlobalConfig(config);
        });

        return () => {
            unsubscribe();
            unsubscribeEnterprise();
        };
    }, []);

    return (
        <Routes>
            <Route path="/" element={<Layout allShops={allShops} globalConfig={enterpriseGlobalConfig} />}>
                <Route index element={<EnterpriseHomePage globalConfig={enterpriseGlobalConfig} />} />
                <Route path="control-maestro" element={<Navigate to="/empresas/tablero-maestro" replace />} />
                <Route path="tablero-maestro" element={<ProtectedRoute roles={['admin']}><EnterpriseMasterBoardPage /></ProtectedRoute>} />
                <Route path="marketing-inteligente" element={<ProtectedRoute roles={['admin']}><MarketingPanelPage /></ProtectedRoute>} />
                <Route path="inscripcion" element={<EnterpriseSubscriptionPage />} />
                <Route path="configuracion" element={<ProtectedRoute roles={['admin']}><EnterpriseGlobalConfigPage /></ProtectedRoute>} />
                <Route path=":categorySlug" element={<EnterpriseCategoryPage allShops={allShops} />} />
                <Route path=":categorySlug/:enterpriseSlug" element={<EnterpriseDetailPage allShops={allShops} />} />
                <Route path=":categorySlug/:shopSlug/menu" element={<ShopMenuPage allShops={allShops} />} />
                <Route path=":categorySlug/:shopSlug/credencial" element={<CredencialPage allShops={allShops} />} />
            </Route>
        </Routes>
    );
};

const App: React.FC = () => {
    console.log("🧬 ROOT_CAMALEON_ACTIVE: El motor Multi-Zona está en marcha!");
    
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                <Routes>
                    {/* 🏭 Nodo Empresarial Global */}
                    <Route path="/empresas/*" element={<EnterpriseController />} />

                    {/* 🌐 HOME GLOBAL — Comando Central del Hormiguero */}
                    <Route path="/" element={<GlobalHomePage />} />

                    {/* 🌐 NOSOTROS INSTITUCIONAL — Genérico */}
                    <Route path="/nosotros" element={<AboutPage />} />

                    {/* 🌐 VENDER LANDING — Genérico para Comerciantes */}
                    <Route path="/vender" element={<MerchantLandingPage />} />

                    {/* 🌐 INDUSTRIAL LANDING — Promocionar el directorio industrial */}
                    <Route path="/industrial" element={<IndustrialLandingPage />} />

                    {/* 🗺️ SELECTOR DE LOCALIDAD POR REGIÓN */}
                    <Route path="/region/:regionId" element={<RegionSelectPage />} />
                    
                    {/* 🏔️ PORTAL IMPERIAL: TRASLASIERRA */}
                    <Route path="/traslasierra" element={<Navigate to="/region/traslasierra" replace />} />

                    {/* 🌱 SEMILLERO — Inyección de datos regionales (admin only) */}
                    <Route path="/:townId/semillero-regional" element={<ProtectedRoute roles={['admin']}><RegionSeedPage /></ProtectedRoute>} />

                    {/* Redirección directa para el Director Global (Tablero Maestro) */}
                    <Route path="/tablero-maestro" element={<Navigate to="/esteban-echeverria/tablero-maestro" replace />} />
                    <Route path="/tablero-maestro/*" element={<Navigate to="/esteban-echeverria/tablero-maestro" replace />} />
                    
                    {/* Bloqueo dimensional: Erradicar universo paralelo sin zona */}
                    <Route path="/embajador" element={<Navigate to="/" replace />} />
                    <Route path="/embajador/*" element={<Navigate to="/" replace />} />
                    
                    {/* 🛡️ BÚNKER DE MANDO Y TRANSMISIÓN (DIRECTOR) - Fuera de Layout mobile */}
                    <Route path="/:townId/bunker-waly" element={<DirectorBunkerPage />} />
                    <Route path="/:townId/director/transmision-en-vivo" element={<ProtectedRoute roles={['admin']}><LiveBroadcastPage /></ProtectedRoute>} />
                    {/* Alias sin townId — redirige al búnker de EE por defecto */}
                    <Route path="/director/transmision-en-vivo" element={<Navigate to="/esteban-echeverria/director/transmision-en-vivo" replace />} />
                    <Route path="/bunker-waly" element={<Navigate to="/esteban-echeverria/bunker-waly" replace />} />

                    {/* 🛡️ BÚNKERS DE CONTROL COMPARTIMENTADO */}
                    <Route path="/:townId/bunker/administracion" element={<AdminBunkerPage />} />
                    <Route path="/:townId/bunker/contable-legales" element={<AccountingBunkerPage />} />
                    <Route path="/:townId/bunker/marketing" element={<MarketingBunkerPage />} />
                    <Route path="/:townId/bunker/recursos-humanos" element={<HRBunkerPage />} />
                    <Route path="/:townId/bunker/sistemas" element={<SystemsBunkerPage />} />
                    <Route path="/:townId/bunker/planificacion-desarrollo" element={<PlanningBunkerPage />} />
                    <Route path="/:townId/bunker/inversion-exponencial" element={<InvestmentBunkerPage />} />
                    <Route path="/:townId/bunker/mantenimiento" element={<MaintenanceBunkerPage />} />
                    <Route path="/:townId/bunker/secops" element={<SecOpsBunkerPage />} />
                    <Route path="/:townId/bunker/clonacion" element={<CloningBunkerPage />} />
                    <Route path="/:townId/bunker-secops" element={<Navigate to={`/${window.location.pathname.split('/')[1] || 'esteban-echeverria'}/bunker/secops`} replace />} />

                    {/* Alias sin townId */}
                    <Route path="/bunker/administracion" element={<Navigate to="/esteban-echeverria/bunker/administracion" replace />} />
                    <Route path="/bunker/contable-legales" element={<Navigate to="/esteban-echeverria/bunker/contable-legales" replace />} />
                    <Route path="/bunker/marketing" element={<Navigate to="/esteban-echeverria/bunker/marketing" replace />} />
                    <Route path="/bunker/recursos-humanos" element={<Navigate to="/esteban-echeverria/bunker/recursos-humanos" replace />} />
                    <Route path="/bunker/sistemas" element={<Navigate to="/esteban-echeverria/bunker/sistemas" replace />} />
                    <Route path="/bunker/planificacion-desarrollo" element={<Navigate to="/esteban-echeverria/bunker/planificacion-desarrollo" replace />} />
                    <Route path="/bunker/inversion-exponencial" element={<Navigate to="/esteban-echeverria/bunker/inversion-exponencial" replace />} />
                    <Route path="/bunker/mantenimiento" element={<Navigate to="/esteban-echeverria/bunker/mantenimiento" replace />} />
                    <Route path="/bunker/secops" element={<Navigate to="/esteban-echeverria/bunker/secops" replace />} />
                    <Route path="/bunker/clonacion" element={<Navigate to="/esteban-echeverria/bunker/clonacion" replace />} />
                    <Route path="/bunker-secops" element={<Navigate to="/esteban-echeverria/bunker/secops" replace />} />

                    {/* 🧑‍💼 RECLUTAMIENTO RRHH — Pantalla Completa, fuera del Layout mobile */}
                    <Route path="/:townId/tablero-maestro/reclutamiento" element={<ProtectedRoute roles={['admin']}><AmbassadorRecruitmentAdminPage /></ProtectedRoute>} />

                    {/* 🏫 ACADEMIA SHOPDIGITAL — Bóveda de Entrenamiento */}
                    <Route path="/:townId/academia-embajadores" element={<AcademyPage />} />

                    {/* Ruteo Dinámico Multi-Zona */}
                    <Route path="/:townId/*" element={<TownController />} />
                    
                    {/* Manejo de rutas huérfanas */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
            </BrowserRouter>
        </LanguageProvider>
    );
};

export default App;