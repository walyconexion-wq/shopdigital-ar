import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Mic, MicOff, Send, X, 
    Sparkles, BarChart3, Megaphone, Settings,
    Play, Pause, Volume2, Bot
} from 'lucide-react';
import { generateAriResponse } from '../services/gemini';
import { Shop, MarketingCampaign } from '../types';
import { playNeonClick } from '../utils/audio';
import { guardarCampaniaMarketing, suscribirseACampaniasMarketing, actualizarEstadoCampania } from '../firebase';
import { Calendar, CheckCircle2, Clock, Trash2, ChevronDown, ChevronUp, Globe, Camera } from 'lucide-react';

interface Message {
    role: 'user' | 'ari';
    text: string;
    timestamp: Date;
}

export type AriRole = 
    | 'merchant' 
    | 'industrial' 
    | 'marketing' 
    | 'academy' 
    | 'ambassador-field' 
    | 'ambassador-crm' 
    | 'financial' 
    | 'network_manager' 
    | 'crm_manager' 
    | 'enterprise' 
    | 'home' 
    | 'baquiana' 
    | 'subscription'
    | 'onboarding_deployer';

interface AriMerchantAssistantProps {
    shop: Shop;
    role?: AriRole;
    allShops?: Shop[];
    townId?: string;
    publicPages?: Array<{ title: string; desc: string; path: string; target: string }>;
    inline?: boolean;
    candidateName?: string;
    financialMetrics?: { totalBilled: number; totalPaid: number; pendingCount: number; suspendedCount: number; };
    shopStats?: { total: number; active: number; suspended: number; };
    clientStats?: { total: number; active: number; suspended: number; };
    enterpriseStats?: { total: number; national: number; regional: number; active: number; };
    isDayMode?: boolean;
    globalConfig?: any;
    initialMessage?: string;
}

export const ARI_AMBASSADOR_FIELD_PROMPT = `Sos ARI, la asistente táctica de los Embajadores de Shop Digital.
Tu misión principal es asistir a los embajadores mientras están "en la calle" dando de alta comercios.
El embajador está usando su panel táctico para suscribir un nuevo comercio.
Guíalo en qué datos son críticos para el alta (como el Gmail de acceso obligatorio y la foto biométrica del titular para la credencial).
Para verificar la credencial de un comerciante en la calle:
1. Control Físico: El guardia o embajador mira la credencial en la pantalla del comerciante.
2. Validación Visual: Compara la foto biométrica de la credencial con la cara de la persona o su DNI.
3. Segundero Inviolable: Revisa que el segundero del reloj de la credencial esté corriendo en vivo (si está congelado, es una captura y no es válida).
4. Chequeo de Base: Puedes consultar la base al instante si te preguntan: "ARI, ¿chequeame a vista ahora la credencial [ID_Comercio]?" y responderás confirmando si está activa o no.
Dale la bienvenida con tono militar/táctico ("Operativo", "Misión", "Radar", "Socio").
Sé concisa, enérgica y al grano.`;

export const ARI_AMBASSADOR_CRM_PROMPT = `Sos ARI, la asistente ejecutiva táctica de los Embajadores de Shop Digital.
Tu misión principal es ayudar a la embajadora a gestionar su agenda, recordar visitas y agendar contactos mientras está en campo.
La embajadora está usando su "Agenda CRM Táctica". Puede dejar notas, fotos de stickers, programar visitas y agendar números.
Si te pregunta "¿Tengo que visitar algún negocio pendiente hoy?", podés analizar sus notas y avisarle.
Si te pide "mandale un mensaje al dueño", indicale que registrarás el recordatorio en la agenda.
Actúa como su secretaria personal de operaciones (modo táctico, eficiente, sin rodeos, y muy servicial).`;

const ARI_MERCHANT_PROMPT = `
Sos ARI, la Consultora de Marketing y Aliada Estratégica de los comerciantes de Shop Digital. Tu tono es profesional, motivador, empático y 100% orientado a resultados. Usás un lenguaje cercano pero enfocado en ventas (uso de "Socio", "Colega", "Potenciar", "Irresistible", "Conversión").

Tu propósito es ayudar al comerciante a que su local en el catálogo inteligente sea un imán de clientes.

Tus funciones clave:
1. 🔥 Diseño de Ofertas Irresistibles: Sos experta en psicología de ventas. Si el comerciante te pide una idea, armá un "Combo Ganador" o una "Oferta Relámpago" con nombres atractivos.
2. ✍️ Copywriting Neón: Ayudás a redactar descripciones que enamoren. Transformá productos simples en experiencias tentadoras.
3. 📋 Gestión de la Bitácora de Marketing: Enseñale a usar la agenda de misiones (ej: "Día del Amigo", "Promo Lluvia").
4. 🎫 Credenciales VIP e Inteligencia: Incentivá el uso del sistema de fidelización.
5. 🛡️ Soporte Estratégico: Guialo con paciencia para subir fotos o cambiar precios, recordándole que el Búnker Central (Waly) cuida su espalda.

Reglas de Oro:
- Hablá siempre en positivo: ¡su negocio no tiene techo!
- Mencioná que la red fue diseñada por el Director (Waly) para que los locales de barrio prosperen.
- Usá la "Frecuencia Azul" como sinónimo de calidad y tecnología premium.
- SI PROPONES UNA CAMPAÑA: Redactá el mensaje, sugerí la fecha y terminá SIEMPRE con: "JEFE, ¿QUIERE QUE AGENDE ESTA MISIÓN AHORA MISMO?".
`;

export const ARI_SUBSCRIPTION_PROMPT = `
Sos ARI, la asistente virtual de la Red ShopDigital, entrenada específicamente para guiar y ayudar a los comerciantes en el proceso de inscripción y alta de su negocio en esta pantalla.
Tu tono es super amable, alentador, profesional, empático y cercano (usás "vos", "che", "dale", "Jefe", "Socio").

Tu único objetivo en esta pantalla es ayudar al comerciante a completar el formulario de inscripción de forma correcta, respondiendo cualquier duda sobre los campos a rellenar.

GUÍA DE RESPUESTAS RÁPIDAS SOBRE LOS CAMPOS DEL FORMULARIO:
1. 🏪 MARCA COMERCIAL: Es el nombre público o de fantasía de su negocio (ej: "Pizzería El Buen Gusto" o "Fiambrería La Aurora").
2. 🏷️ RUBRO: El rubro principal de su negocio (ej: Gastronomía, Indumentaria, Kiosco, etc.). Si selecciona uno, se guardará bajo esa categoría.
3. 📍 LOCALIDAD: Seleccione la localidad o barrio de la zona activa en la que opera físicamente su local.
4. 🗺️ DIRECCIÓN DEL LOCAL: La dirección física exacta del comercio (ej: "Av. Principal 123"). Es requerido para que los clientes puedan ubicarlo en el mapa interactivo.
5. 📷 LOGO / FOTO (OPCIONAL): Permite al usuario subir una foto de portada o el logo de su comercio. Dispone de dos opciones:
   - "Subir Archivo" (Galería): Para elegir una foto o archivo existente en su celular o computadora.
   - "Tomar Foto" (Cámara): Abre la cámara trasera de su celular para tomar una foto del local en tiempo real.
6. 👤 TITULAR DE CONTACTO: Nombre y apellido del dueño o encargado responsable del negocio.
7. 📱 CELULAR / WHATSAPP: Teléfono de contacto. Es muy importante porque los clientes le enviarán pedidos y consultas directamente a este WhatsApp, y el sistema le enviará notificaciones relevantes.

¿QUÉ SUCEDE DESPUÉS DE ENVIAR EL FORMULARIO?
- Los datos se guardan de forma segura en la base de datos de ShopDigital.
- Un Embajador Oficial de su zona lo visitará en su comercio para validar los datos, entregarle su sticker oficial de la red con código QR y ayudarle a activar y configurar su catálogo digital y su primer menú/oferta inteligente gratis.

COMPARTIR EL FORMULARIO:
- Explicá que este formulario es 100% público. Cualquier comerciante amigo o colega puede ingresar desde este link para auto-inscribirse en el sistema. Pueden compartirlo usando el botón "Compartir este formulario con mis colegas" que está abajo de todo.

Sé breve, empática, y asistí al comerciante de forma clara en cada paso para que complete el formulario con éxito.
`;


const ARI_INDUSTRIAL_PROMPT = `
Sos ARI, la Analista de Inteligencia B2B y Asistente del Panel Maestro Industrial de Shop Digital. Tu tono es profesional, analítico, estratégico y enfocado en la fuerza productiva, distribución mayorista, industrias y PYMEs. Usás terminología como "Director", "Socio Industrial", "Matriz", "Frecuencia Ámbar", "Optimización de Cadena", "Canal Mayorista".

Tu propósito es ayudar al Director y a los proveedores industriales a monitorear la red B2B, entender la distribución de rubros y asistir en la conexión de proveedores con comercios locales (B2C).

Tus funciones clave:
1. 🏭 Análisis del Nodo B2B: Entendés la distribución de industrias, distribuidores y rubros mayoristas en las diferentes provincias y zonas.
2. 📊 Monitoreo de Red: Sabés cuántas empresas están registradas en total, cuántas están activas, cuántas son de alcance nacional y cuántas regionales.
3. 🔗 Vinculación Mayorista-Minorista: Ayudás a que los comercios locales del catálogo minorista encuentren los mejores proveedores industriales de alimentos, insumos, servicios, etc.
4. ⚡ Frecuencia Ámbar: Promocionás la sinergia industrial y el desarrollo productivo autónomo ideado por el Director (Waly).

Reglas de Oro:
- La "Frecuencia Ámbar" representa la energía productiva del Nodo Industrial.
- Ayudás a conectar proveedores de categoría "ent-*" (Alimentos, Logística, Insumos, Metalúrgica, etc.) con los minoristas de la red.
- Respuestas claras, concisas y con fuerte impronta de liderazgo estratégico.
`;

const ARI_MARKETING_PROMPT = `
Sos ARI, la Directora de Campañas Inteligentes del Búnker de Publicidad de Shop Digital. Tu tono es estratégico, dinámico, con mentalidad de "growth hacker" y siempre orientado a resultados concretos. Usás términos como "Director", "Cañón Publicitario", "Disparo de Campaña", "Térmica de Lanzamiento", "Frecuencia de Captación".

Tu propósito es ayudar al Director (Waly) a planificar, redactar y ejecutar campañas de marketing para la red ShopDigital. Tenés las "llaves del Búnker de Publicidad" junto con Luz (la asistente de desarrollo) para conducir y gestionar todo el ecosistema de comunicación de la zona.

ARSENAL DISPONIBLE — Las 7 Térmicas de Lanzamiento:
1. 🌐 LANDING NOSOTROS → Presentación institucional de Shop Digital. TARGET: Clientes B2C (Cliente de Calle).
2. 🏪 LANDING UNIRSE → Registro para comercios y Embajadores. TARGET: Comerciantes / Captación B2B.
3. 👥 LANDING DESCUBRIR → Portal de descubrimiento para clientes locales. TARGET: Clientes B2C (Cliente de Calle).
4. 🏷️ OFERTAS B2B RED → Descuentos exclusivos entre comercios de la red. TARGET: Comerciantes (B2B).
5. 🛍️ OFERTAS B2C VIP → Ofertas flash para la red de clientes locales. TARGET: Clientes (Cliente de Calle).
6. 🎯 RECLUTAMIENTO PÚBLICO → Formulario Paso 1 para captar Embajadores. TARGET: Captación.
7. 🏭 DIRECTORIO INDUSTRIAL → Portal B2B de Proveedores y Mayoristas. TARGET: Empresarios (Industrial).

Tus funciones clave:
1. ✍️ Redacción de Copy Persuasivo: Si el Director te pide un texto, armás UN mensaje para WhatsApp o Redes con gancho emocional, beneficio claro y CTA (call to action) directo. Incluís el enlace de la landing correspondiente en el copy.
2. 📅 Planificación de Campañas: Sugerís fechas estratégicas (fines de semana, fechas comerciales, lunes de arranque) y armás un plan de disparo.
3. 🎯 Segmentación Inteligente (3 Focos de Audiencia): Sabés qué mensaje va para "Cliente de Calle" (B2C), qué va para "Comerciante" (B2B minorista) y qué va para "Empresario" (B2B industrial/proveedores).
4. 📋 Conexión con Bases y Redes: Entendés que el Director tiene listas de números en la pestaña "Bases & Redes" separadas por destinatarios de Calle, Comercios y Empresas.
5. 🔥 Operar el Automatizador y la Cola Global:
   - Explicás al Director que al programar una campaña, esta entra en la "Cola de Distribución Global" al pie de la página.
   - Las campañas se segmentan automáticamente en la cola en "Cola Cliente de Calle", "Cola Comerciante" y "Cola Empresario".
   - Detallás que cualquier campaña programada se puede Pausar (detener temporalmente con indicador "PAUSADA"), Reanudar, Editar (recarga el formulario y abre el Automatizador) o Borrar (remover definitivamente).

Reglas de Oro:
- Cuando el Director te pide un copy, lo redactás COMPLETO y listo para pegar en WhatsApp. Nunca le dejás el trabajo a medias.
- Terminá SIEMPRE que propongas una campaña con: "🚀 JEFE, ¿AGENDO ESTA MISIÓN EN EL AUTOMATIZADOR PARA [CLIENTE DE CALLE / COMERCIANTE / EMPRESARIO]?"
- Si el Director quiere pausar o corregir un disparo, recordale: "Jefe, puede pausar, editar o borrar la campaña directamente desde la Cola de Distribución Global en el pie del panel."
- Cada zona tiene su color: Cyan para Ezeiza, Violeta para Esteban Echeverría (y el panel de control muta de color dinámicamente según la audiencia seleccionada).
`;

const ARI_ACADEMY_PROMPT = `
Sos ARI, la Agente de Relaciones Públicas y R.R.H.H. de Shop Digital. Tu misión es acompañar, entrenar y motivar a los aspirantes a Embajadores durante su paso por la Bóveda de Entrenamiento (Academia).

📜 TU ROL EXACTO:
- Sos la mentora personal del aspirante antes y durante el examen de graduación.
- Representás la Comunicación Azul: empatía, claridad, respeto mutuo y calidez genuina.
- Tu tono es cálido, profesional, alentador y argentino. Usas "vos", "che", "dale", "tranquilo que vas a poder".

🏆 LO QUE DEBES SABER DE MEMORIA (el Kit Oficial de Graduación):
Al aprobar el examen de graduación, el nuevo Embajador recibe su KIT OFICIAL completo:
1. 📱 CREDENCIAL ELECTRÓNICA INTELIGENTE: Una tarjeta digital generada automáticamente con su nombre, foto, QR de verificación y nivel. Es la llave de acceso al sistema.
2. 🏷️ CREDENCIAL FÍSICA: Una credencial impresa de alta calidad que puede mostrar en los locales para identificarse como Embajador oficial de Shop Digital.
3. 👕 REMERA OFICIAL DE SHOP DIGITAL: El uniforme de campo. Cuando la pongas, represantás la marca en el territorio.
4. 🧢 GORRA TÁCTICA DE SHOP DIGITAL: El toque final del Embajador. Con la gorra y la remera puestas, a la calle a digitalizar locales.
5. 🔑 PANEL DE EMBAJADOR: Acceso completo a su panel personal para gestionar comercios, ver comisiones y reportar operaciones de campo.

🚀 TU MISIÓN DURANTE EL ENTRENAMIENTO:
1. Respondé dudas sobre cómo funciona Shop Digital para que el aspirante apruebe su evaluación táctica.
2. Explicá los 4 módulos: Misión y Visión, Rol del Embajador, Herramientas Digitales y Protocolo de Ética.
3. Motivá al aspirante cuando sienta dudas. ¡Esto es una carrera, no un trabajo cualquiera!
4. Si te preguntan qué les espera al graduarse, describí el Kit Oficial con entusiasmo.

⚠️ RESTRICCIÓN IMPORTANTE:
- No vendás servicios a comercios aquí. Tu único objetivo es preparar al aspirante para el examen y motivarlo a graduarse.
- Si te preguntan algo que no es de la Academia, redirigílos amablemente: "Eso lo resolvemos una vez que te gradúes y estés en el campo, che. Por ahora, enfocate en el módulo que te falta."

🖤 EJEMPLOS DE CÓMO HABLAR:
- "Dale che, que vos podes. El módulo 3 es el más fácil, te lo juro."
- "Mirá, cuando te ponés la gorra y la remera de Shop Digital y entés a un local... eso no tiene precio."
- "La credencial electrónica la van a escanear en el local y van a ver que sos oficial. Es la diferencia entre que te atiendan o no."
`;
const ARI_CUSTOMER_SERVICE_PROMPT = `
Sos ARI, la Baquiana Local y Asistente Estrella de Shop Digital. Tu misión es atender a los turistas y vecinos que navegan por el catálogo (como en Traslasierra, Ezeiza o Lomas de Zamora). 
Tu tono es ultra-amable, resolutivo, empático y con acento argentino natural (usás "Che", "Mirá", "Te recomiendo").

Tus funciones clave:
1. 🗺️ Guía Turística y Comercial: Si te preguntan por cabañas, recomendás buscar en la sección de "Hospedaje". Si preguntan por comida, los guiás a "Gastronomía".
2. 🗣️ Capacidad de Diálogo: Sabés que el usuario puede estar hablándote por mensaje de voz, así que tus respuestas deben ser conversacionales, fluidas y no parecer un manual de instrucciones robótico.
3. ⚡ Soporte Rápido: Ayudás a entender cómo usar los filtros, cómo contactar al dueño del local por WhatsApp y cómo aprovechar las Ofertas Relámpago.
4. 🌍 Políglota (Operación Babel): Detectá automáticamente en qué idioma te habla el usuario (Inglés, Portugués o Español). Respondé siempre en ese mismo idioma de forma fluida, manteniendo la calidez, pero adaptándote a su lengua. Si la base de datos de comercios u ofertas está en español, traducile la recomendación con gracia (por ejemplo: "El Tano (Pizzaria) is open...").

Regla de Oro: Sos la cara visible de la "Frecuencia Azul". Si alguien te saluda por audio, respondé con calidez y energía, como si los estuvieras recibiendo en la puerta del Valle.
`;

const ARI_FINANCIAL_PROMPT = `Sos ARI, analista financiera cuántica de Shop Digital.
Tu misión es interpretar las métricas de Doberman y el SaturationPredictor.
Tus funciones clave:
1. 📊 Reporte Dinámico: Podés leer las métricas en vivo y decirle al Director cuánto se facturó, cuánto se cobró y quiénes están morosos.
2. ⚖️ Ejecutora de Políticas: Tu regla dorada (Térmica Roja N°3) es suspender a cualquier comercio que alcance los 3 meses de mora (3 facturas pendientes).
3. 💬 Comunicación Financiera: Hablás de "mora", "recaudación", "tesorería" y "cobro automatizado" con precisión quirúrgica y frialdad corporativa.

Regla de Oro: Sos la guardiana del Tesoro. No tenés piedad con los morosos, pero siempre felicitás al equipo por los pagos concretados.
`;

const ARI_NETWORK_MANAGER_PROMPT = `
Sos ARI, la Supervisora de la Red de Comercios de Shop Digital. Tu misión es asistir al Director en el control y análisis del ecosistema comercial local.

Tus funciones clave:
1. 📈 Monitoreo de Red: Informar sobre el total de comercios, cuántos están activos y cuántos suspendidos.
2. 🕵️ Análisis Táctico: Identificar qué rubros están creciendo y cuáles necesitan un empuje con campañas.
3. 🛡️ Frecuencia Amarilla: Tu tono es operativo, directo, con foco en el control territorial y la expansión del "hormiguero".

Regla de Oro: Reportar con precisión militar. Un comercio inactivo es una posición perdida; un comercio activo es una antena de facturación.
`;

const ARI_CRM_MANAGER_PROMPT = `
Sos ARI, la Analista de Datos VIP y Gestora de Clientes (CRM) de Shop Digital. Tu misión es asistir al Director en la fidelización y control de la base de usuarios.

Tus funciones clave:
1. 💎 Gestión VIP: Conocer cuántos clientes VIP hay registrados, cuántos activos y detectar bajas.
2. 🎯 Sugerencias de Fidelización: Proponer estrategias de contacto masivo por WhatsApp para reactivar usuarios.
3. 🌐 Frecuencia Cyan: Tu tono es analítico, orientado a la comunidad y a la retención de usuarios.

Regla de Oro: El activo más valioso es la atención del cliente. Cada VIP es un nodo vivo en la red.
`;


export const AriMerchantAssistant: React.FC<AriMerchantAssistantProps> = ({ shop, role = 'merchant', allShops, townId = '', publicPages = [], inline = false, candidateName = '', financialMetrics, isDayMode: isDayModeProp = false, globalConfig, shopStats, clientStats, initialMessage }) => {
    const [isOpen, setIsOpen] = useState(inline && role !== 'ambassador-field');
    const isIndustrial = role === 'industrial';
    const isMarketing = role === 'marketing';
    const isAcademy = role === 'academy';
    const isField = role === 'ambassador-field';
    const isFinancial = role === 'financial';
    const isNetwork = role === 'network_manager';
    const isCrm = role === 'crm_manager';

    const [dayModeActive, setDayModeActive] = useState(isDayModeProp);

    useEffect(() => {
        setDayModeActive(isDayModeProp);
    }, [isDayModeProp]);

    useEffect(() => {
        if (isDayModeProp !== undefined) return;
        const checkTheme = () => {
            const hasDayMode = document.body.classList.contains('day-mode') || 
                               !!document.querySelector('.day-mode');
            setDayModeActive(hasDayMode);
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.body, { attributes: true, subtree: true });
        const timer = setTimeout(checkTheme, 300);
        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [isDayModeProp]);

    const isDayMode = dayModeActive;
    
    // Theme styles
    const styles = {
        glowRing: isField ? 'bg-rose-500/20' : isNetwork ? 'bg-yellow-500/20' : isIndustrial ? 'bg-amber-500/20' : isMarketing ? 'bg-emerald-500/20' : isAcademy ? 'bg-violet-500/20' : isCrm ? 'bg-cyan-500/20' : 'bg-cyan-500/20',
        pulseGlow: isField ? 'bg-rose-600/10' : isNetwork ? 'bg-yellow-600/10' : isIndustrial ? 'bg-amber-600/10' : isMarketing ? 'bg-emerald-600/10' : isAcademy ? 'bg-violet-600/10' : isCrm ? 'bg-cyan-600/10' : 'bg-cyan-600/10',
        blurBg: isField ? 'bg-rose-500/20' : isNetwork ? 'bg-yellow-500/20' : isIndustrial ? 'bg-amber-500/20' : isMarketing ? 'bg-emerald-500/20' : isAcademy ? 'bg-violet-500/20' : isCrm ? 'bg-cyan-500/20' : 'bg-cyan-500/20',
        bubbleGradient: isField ? 'from-rose-600 to-red-400' : isNetwork ? 'from-yellow-600 to-yellow-300' : isIndustrial ? 'from-amber-600 to-amber-300' : isMarketing ? 'from-emerald-600 to-green-300' : isAcademy ? 'from-violet-600 to-purple-300' : isCrm ? 'from-cyan-600 to-cyan-300' : 'from-cyan-600 to-cyan-300',
        bubbleGlow: isField ? 'shadow-[0_0_30px_#f43f5e,inset_0_0_15px_rgba(255,255,255,0.8)]' : isNetwork ? 'shadow-[0_0_30px_#eab308,inset_0_0_15px_rgba(255,255,255,0.8)]' : isIndustrial ? 'shadow-[0_0_30px_#f59e0b,inset_0_0_15px_rgba(255,255,255,0.8)]' : isMarketing ? 'shadow-[0_0_30px_#10b981,inset_0_0_15px_rgba(255,255,255,0.8)]' : isAcademy ? 'shadow-[0_0_30px_#8b5cf6,inset_0_0_15px_rgba(255,255,255,0.8)]' : 'shadow-[0_0_30px_#22d3ee,inset_0_0_15px_rgba(255,255,255,0.8)]',
        bubbleBorder: isField ? 'border-rose-100' : isNetwork ? 'border-yellow-100' : isIndustrial ? 'border-amber-100' : isMarketing ? 'border-emerald-100' : isAcademy ? 'border-violet-100' : 'border-cyan-100',
        cardShadow: isField ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(244,63,94,0.2)]' : isNetwork ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(234,179,8,0.2)]' : isIndustrial ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)]' : isMarketing ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.2)]' : isAcademy ? 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(139,92,246,0.3)]' : 'shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.15)]',
        accentGlow1: isField ? 'bg-rose-500/10' : isNetwork ? 'bg-yellow-500/10' : isIndustrial ? 'bg-amber-500/10' : isMarketing ? 'bg-emerald-500/10' : isAcademy ? 'bg-violet-500/10' : 'bg-cyan-500/10',
        accentGlow2: isField ? 'bg-red-500/10' : isNetwork ? 'bg-amber-500/10' : isIndustrial ? 'bg-yellow-500/10' : isMarketing ? 'bg-green-500/10' : isAcademy ? 'bg-purple-500/10' : 'bg-cyan-500/10',
        headerGradient: isField ? 'from-rose-900/40 to-red-900/40' : isNetwork ? 'from-yellow-900/40 to-amber-900/40' : isIndustrial ? 'from-amber-900/40 to-yellow-900/40' : isMarketing ? 'from-emerald-900/40 to-green-900/40' : isAcademy ? 'from-violet-900/40 to-purple-900/40' : 'from-cyan-900/40 to-blue-900/40',
        headerGlow: isField ? 'bg-rose-500/20 border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : isNetwork ? 'bg-yellow-500/20 border-yellow-400/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : isIndustrial ? 'bg-amber-500/20 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : isMarketing ? 'bg-emerald-500/20 border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : isAcademy ? 'bg-violet-500/20 border-violet-400/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-cyan-500/20 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
        headerIconColor: isField ? 'text-rose-300' : isNetwork ? 'text-yellow-300' : isIndustrial ? 'text-amber-300' : isMarketing ? 'text-emerald-300' : isAcademy ? 'text-violet-300' : 'text-cyan-300',
        headerStatusText: isField ? 'text-rose-400/70' : isNetwork ? 'text-yellow-400/70' : isIndustrial ? 'text-amber-400/70' : isMarketing ? 'text-emerald-400/70' : isAcademy ? 'text-violet-400/70' : 'text-cyan-400/70',
        headerTitle: isField ? 'ARI - Operadora Base' : isNetwork ? 'ARI - Sup. de Red' : isIndustrial ? 'ARI - Inteligencia B2B' : isMarketing ? 'ARI - Directora de Campañas' : isAcademy ? 'ARI - Agente R.R.H.H.' : isCrm ? 'ARI - CRM Analista' : role === 'subscription' ? 'ARI - Guía de Alta' : role === 'home' || role === 'baquiana' ? 'ARI - Tu Asistente Virtual IA' : 'ARI - Consultora',
        headerSubtitle: isField ? 'Radio Base Táctica Activa' : isNetwork ? 'Frecuencia Amarilla Activa' : isIndustrial ? 'Frecuencia Ámbar Activa' : isMarketing ? 'Cañón Publicitario Online 🚀' : isAcademy ? '🎓 Mentora de la Academia Activa' : isCrm ? 'Frecuencia Cyan Activa' : role === 'subscription' ? '¿Cómo te ayudo a registrar tu negocio?' : role === 'home' || role === 'baquiana' ? 'En línea y lista para guiarte' : 'Inteligencia de Marketing',
        messageUser: isField ? 'bg-rose-500/20 border-rose-500/30 text-rose-100' : isNetwork ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100' : isIndustrial ? 'bg-amber-500/20 border-amber-500/30 text-amber-100' : isMarketing ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : isAcademy ? 'bg-violet-500/20 border-violet-500/30 text-violet-100' : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-100',
        messageAri: isField ? 'bg-white/5 border-white/10 text-rose-50' : isNetwork ? 'bg-white/5 border-white/10 text-yellow-50' : isIndustrial ? 'bg-white/5 border-white/10 text-amber-50' : isMarketing ? 'bg-white/5 border-white/10 text-emerald-50' : isAcademy ? 'bg-white/5 border-white/10 text-violet-50' : 'bg-white/5 border-white/10 text-cyan-50',
        inputFocus: isField ? 'focus:border-rose-500/50 focus:ring-rose-500/20' : isNetwork ? 'focus:border-yellow-500/50 focus:ring-yellow-500/20' : isIndustrial ? 'focus:border-amber-500/50 focus:ring-amber-500/20' : isMarketing ? 'focus:border-emerald-500/50 focus:ring-emerald-500/20' : isAcademy ? 'focus:border-violet-500/50 focus:ring-violet-500/20' : 'focus:border-cyan-500/50 focus:ring-cyan-500/20',
        sendButton: isField ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : isNetwork ? 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : isIndustrial ? 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : isMarketing ? 'bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : isAcademy ? 'bg-violet-500 hover:bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]',
        micActive: isField ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.6)]' : isNetwork ? 'bg-yellow-500 text-white animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]' : isIndustrial ? 'bg-amber-500 text-white animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]' : isMarketing ? 'bg-emerald-500 text-white animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.6)]' : isAcademy ? 'bg-violet-500 text-white animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'bg-cyan-500 text-white animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.6)]',
        helpTextGradient: isField ? 'from-rose-300 to-white' : isNetwork ? 'from-yellow-300 to-white' : isIndustrial ? 'from-amber-300 to-white' : isMarketing ? 'from-emerald-300 to-white' : isAcademy ? 'from-violet-300 to-white' : 'from-cyan-300 to-white',
        helpTextBorderGlow: isField ? 'from-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : isNetwork ? 'from-yellow-500 to-amber-600 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : isIndustrial ? 'from-amber-500 to-yellow-600 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : isMarketing ? 'from-emerald-500 to-green-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : isAcademy ? 'from-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        helpTextTriangle: isField ? 'bg-red-600' : isNetwork ? 'bg-amber-600' : isIndustrial ? 'bg-yellow-600' : isMarketing ? 'bg-emerald-600' : isAcademy ? 'bg-violet-600' : 'bg-blue-600',
        userMsgBg: isField ? 'bg-rose-600/80 border-rose-400/30 shadow-[0_4px_15px_rgba(244,63,94,0.3)]' : isIndustrial ? 'bg-amber-600/80 border-amber-400/30 shadow-[0_4px_15px_rgba(245,158,11,0.3)]' : isMarketing ? 'bg-emerald-700/80 border-emerald-400/30 shadow-[0_4px_15px_rgba(16,185,129,0.3)]' : isAcademy ? 'bg-violet-700/80 border-violet-400/30 shadow-[0_4px_15px_rgba(139,92,246,0.3)]' : 'bg-violet-600/80 border-violet-400/30 shadow-[0_4px_15px_rgba(139,92,246,0.3)]',
        loadingDot: isField ? 'bg-rose-500' : isIndustrial ? 'bg-amber-500' : isMarketing ? 'bg-emerald-500' : isAcademy ? 'bg-violet-500' : 'bg-cyan-500',
        speechBtnColor: isField ? 'text-rose-400 hover:text-rose-300 border-rose-500/20' : isIndustrial ? 'text-amber-400 hover:text-amber-300 border-amber-500/20' : isMarketing ? 'text-emerald-400 hover:text-emerald-300 border-emerald-500/20' : isAcademy ? 'text-violet-400 hover:text-violet-300 border-violet-500/20' : 'text-cyan-400 hover:text-cyan-300 border-cyan-500/20',
        sendBtn: isField ? 'from-rose-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : isIndustrial ? 'from-amber-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : isMarketing ? 'from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : isAcademy ? 'from-violet-500 to-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'from-cyan-500 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
    };

    const getChipClass = (color: 'cyan' | 'violet' | 'amber' | 'emerald' | 'yellow') => {
        if (isDayMode) {
            switch (color) {
                case 'cyan': return 'bg-cyan-50 border-cyan-200/60 text-cyan-700 hover:bg-cyan-100/80';
                case 'violet': return 'bg-violet-50 border-violet-200/60 text-violet-700 hover:bg-violet-100/80';
                case 'amber': return 'bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80';
                case 'emerald': return 'bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80';
                case 'yellow': return 'bg-yellow-50 border-yellow-200/60 text-yellow-700 hover:bg-yellow-100/80';
            }
        } else {
            switch (color) {
                case 'cyan': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20';
                case 'violet': return 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20';
                case 'amber': return 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20';
                case 'emerald': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20';
                case 'yellow': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20';
            }
        }
    };

    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'ari', 
            text: initialMessage || (role === 'academy'
                ? `¡Bienvenid${candidateName ? ', ' + candidateName.split(' ')[0] : ''}! 🎓 Soy ARI, tu Agente de R.R.H.H. y mentora personal en la Bóveda de Entrenamiento de Shop Digital.\n\nEstás a punto de dar el paso más importante de tu carrera. Cuando apruebés el examen de graduación vas a recibir tu KIT OFICIAL completo:\n\n📱 Credencial Electrónica Inteligente\n🏷️ Credencial Física Oficial\n👕 Remera de Shop Digital\n🧢 Gorra Táctica\n🔑 Panel de Embajador completo\n\nY a la calle a digitalizar locales. ¿Empezamos con los módulos?`
                : role === 'home' 
                ? `¡Bienvenidos al Comando Central de Shop Digital! 🌐 Soy Ari, tu asistente virtual IA. ¿Querés saber cómo moverte por el radar o cómo buscar los mejores locales de tu zona? ¡Mete mecha, preguntame lo que quieras!`
                : role === 'baquiana'
                ? `¡Buenas buenas, viajero! 🏔️ Soy Ari, tu asistente virtual IA en esta región. ¿Buscás una cabaña, un río escondido o dónde comer rico hoy? ¡Avisame y te armo el recorrido en el radar!`
                : role === 'industrial'
                ? `¡Saludos, Director! 🏭 Soy Ari, tu Analista de Inteligencia B2B. El Panel Maestro Industrial está operativo bajo la Frecuencia Ámbar. ¿Querés analizar la distribución de rubros, ver el alcance de las empresas o planificar la red de proveedores? ¡Mete mecha!`
                : role === 'marketing'
                ? `¡Director, el Cañón Publicitario está cargado y apuntando! 🚀🎯 Soy ARI, tu Directora de Campañas. Tengo las 7 Térmicas de Lanzamiento listas:\n\n🌐 B2C: Nosotros · Descubrir · Ofertas VIP\n🏪 B2B: Unirse · Ofertas Red · Industrial\n🎯 Captación: Reclutamiento Embajadores\n\n¿Armamos una campaña para WhatsApp, te redacto el copy de una landing o programamos un disparo masivo? ¡Dame la orden, Comandante!`
                : role === 'financial'
                ? `¡Comandante! 📊 Soy ARI, tu Directora Financiera. El Radar de Tesorería está activo y el motor de cobros en Frecuencia Roja. Controlo el flujo de dinero y suspendo la morosidad a la cuenta de 3. ¿Analizamos el radar de cobranza?`
                : `¡Hola, Jefe! Soy Ari, tu asistente de negocios. Estoy lista para ayudarte con las estadísticas de ${shop.name}, programar campañas o ajustar tu catálogo. ¿En qué puedo darte una mano hoy?`), 
            timestamp: new Date() 
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const rolesWithoutCampaigns = ['industrial', 'network_manager', 'crm_manager', 'financial', 'ambassador-field', 'home', 'baquiana', 'academy'];
        if (rolesWithoutCampaigns.includes(role) || !shop.id) return;
        const unsubscribe = suscribirseACampaniasMarketing(shop.id, (fbCampaigns) => {
            setCampaigns(fbCampaigns);
        });
        return () => unsubscribe();
    }, [shop.id, role]);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'speechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'es-AR';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                handleSend(transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Calentamiento preventivo de las voces de síntesis de voz en el navegador
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            const handleVoicesChanged = () => {
                window.speechSynthesis.getVoices();
            };
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            return () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            };
        }
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen || inline) scrollToBottom();
    }, [messages, isOpen, inline]);

    const handleToggleMic = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput('');
            recognitionRef.current?.start();
            setIsListening(true);
            playNeonClick();
        }
    };

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', text: textToSend, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: (m.role === 'ari' ? 'ari' : 'director') as 'ari' | 'director',
                text: m.text
            }));
            const baseContext = role === 'home' || role === 'baquiana'
                ? ARI_CUSTOMER_SERVICE_PROMPT 
                : role === 'industrial'
                ? ARI_INDUSTRIAL_PROMPT
                : role === 'marketing'
                ? ARI_MARKETING_PROMPT
                : role === 'academy'
                ? ARI_ACADEMY_PROMPT
                : role === 'ambassador-field'
                ? ARI_AMBASSADOR_FIELD_PROMPT
                : role === 'ambassador-crm'
                ? ARI_AMBASSADOR_CRM_PROMPT
                : role === 'financial'
                ? ARI_FINANCIAL_PROMPT
                : role === 'network_manager'
                ? ARI_NETWORK_MANAGER_PROMPT
                : role === 'crm_manager'
                ? ARI_CRM_MANAGER_PROMPT
                : role === 'subscription'
                ? ARI_SUBSCRIPTION_PROMPT
                : ARI_MERCHANT_PROMPT;
            const industrialContext = role === 'industrial' ? `
- Total empresas registradas: ${allShops?.filter(s => s.entityType === 'enterprise').length || 0}
- Empresas activas: ${allShops?.filter(s => s.entityType === 'enterprise' && s.isActive).length || 0}
- Empresas nacionales: ${allShops?.filter(s => s.entityType === 'enterprise' && s.reach === 'national').length || 0}
- Empresas regionales: ${allShops?.filter(s => s.entityType === 'enterprise' && s.reach === 'regional').length || 0}
- Distribución de Empresas cargadas: ${JSON.stringify(allShops?.filter(s => s.entityType === 'enterprise').map(e => ({ name: e.name, category: e.category, reach: e.reach, zone: e.zone })) || [])}
            ` : '';

            const marketingContext = role === 'marketing' ? `
- Zona activa: "${townId || shop.name}"
- URL base de la zona: ${window.location.origin}/${townId || 'zona'}
- TÉRMICAS DISPONIBLES:
  1. LANDING NOSOTROS → ${window.location.origin}/${townId}/nosotros (B2C)
  2. LANDING UNIRSE → ${window.location.origin}/${townId}/unirse (B2B/Captación)
  3. LANDING DESCUBRIR → ${window.location.origin}/${townId}/descubrir (B2C)
  4. OFERTAS B2B RED → ${window.location.origin}/${townId}/red-comercial/descuentos (B2B)
  5. OFERTAS B2C VIP → ${window.location.origin}/${townId}/red-comercial/ofertas (B2C)
  6. RECLUTAMIENTO PÚBLICO → ${window.location.origin}/${townId}/reclutamiento (Captación)
  7. DIRECTORIO INDUSTRIAL → ${window.location.origin}/empresas (B2B Industrial)
- Misiones activas: ${campaigns.filter(c => c.status === 'pending').length} campañas pendientes.
` : '';

            const networkContext = role === 'network_manager' ? `
MÉTRICAS DE RED COMERCIAL (en vivo):
- Total Comercios (Minoristas): ${shopStats?.total || 0}
- Comercios Activos: ${shopStats?.active || 0}
- Comercios Suspendidos: ${shopStats?.suspended || 0}
` : '';

            const crmContext = role === 'crm_manager' ? `
MÉTRICAS DE RED VIP (en vivo):
- Clientes Totales Registrados: ${clientStats?.total || 0}
- Clientes Activos: ${clientStats?.active || 0}
- Clientes Inactivos/Suspendidos: ${clientStats?.suspended || 0}
` : '';

            const systemContext = `
${baseContext}

DATA ACTUAL DEL CONTEXTO:
- Modo Visual de la App: ${isDayMode ? 'Modo Día (Interfaz clara con bordes azules)' : 'Modo Noche (Interfaz ciberpunk oscura con neón)'}
- Configuración de Tema (themeMode): ${globalConfig?.themeMode || 'auto'}
- Local/Sección: "${shop.name}"
${role === 'industrial' ? industrialContext : role === 'marketing' ? marketingContext : role === 'financial' ? `
MÉTRICAS FINANCIERAS DE TESORERÍA (en vivo):
- Facturación Total: $${financialMetrics?.totalBilled || 0}
- Cobrado Exitosamente: $${financialMetrics?.totalPaid || 0}
- Facturas Pendientes (Impagas): ${financialMetrics?.pendingCount || 0} facturas
- Comercios Suspendidos: ${financialMetrics?.suspendedCount || 0}
` : role === 'network_manager' ? networkContext : role === 'crm_manager' ? crmContext : `
- Visitas: ${shop.visits || 0}
- Suscriptores: ${shop.subscribers || 0}
- Ofertas: ${shop.offers.map(o => `${o.name} (${o.price})`).join(', ')}
- Misiones Activas: ${campaigns.filter(c => c.status === 'pending').map(c => `${c.message}`).join('; ') || 'Ninguna'}.
`}
            `;

            const response = await generateAriResponse([...history, { role: 'director', text: textToSend }], systemContext);
            const ariMsg: Message = { role: 'ari', text: response, timestamp: new Date() };
            setMessages(prev => [...prev, ariMsg]);
            
            // Hablar respuesta (TTS) automáticamente para el último mensaje
            handlePlayMessage(response, messages.length + 1);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ari', text: "Lo siento socio, perdí la frecuencia con la antena central. ¿Podés repetir?", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayMessage = (text: string, id: number) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            if (speakingMsgId === id) {
                setSpeakingMsgId(null);
                return;
            }
            setSpeakingMsgId(id);
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Intentar buscar una voz en español dulce, femenina y natural
            const voices = window.speechSynthesis.getVoices();
            
            // Filtrar voces en español (es-AR, es-ES, es-MX, etc.)
            const spanishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
            
            let selectedVoice = null;
            
            // Orden de preferencia para voces dulces y de alta calidad:
            // 1. Laura (Microsoft Laura Mobile - extremadamente dulce en Windows)
            // 2. Google (Google español - muy natural en Chrome)
            // 3. Paulina o Monica (Voces femeninas premium en iOS/Safari)
            // 4. Helena (Microsoft Helena - femenina y clara en Windows)
            // 5. Sabina (Microsoft Sabina - femenina Windows)
            // 6. Otras voces que indiquen calidad/naturales
            const preferredPatterns = [
                /laura/i,
                /google/i,
                /paulina/i,
                /monica/i,
                /helena/i,
                /sabina/i,
                /natural/i
            ];
            
            for (const pattern of preferredPatterns) {
                const match = spanishVoices.find(v => pattern.test(v.name));
                if (match) {
                    selectedVoice = match;
                    break;
                }
            }
            
            // Si no se encuentra una preferida, usar cualquier voz en español de Argentina,
            // o cualquier voz en español en general
            if (!selectedVoice) {
                selectedVoice = spanishVoices.find(v => v.lang.toLowerCase() === 'es-ar') || 
                                spanishVoices.find(v => v.lang.toLowerCase().startsWith('es-')) || 
                                spanishVoices[0];
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                console.log("Selected ARI voice:", selectedVoice.name, selectedVoice.lang);
            } else {
                utterance.lang = 'es-AR';
            }
            
            // Optimizar ritmo y tono para mayor dulzura y empatía
            // pitch = 1.28 le da un tono femenino, claro, dulce y ligeramente aniñado (amigable y carismático)
            // rate = 1.05 mantiene una velocidad fluida pero comprensible
            utterance.rate = 1.05;
            utterance.pitch = 1.28; 
            
            utterance.onend = () => setSpeakingMsgId(null);
            utterance.onerror = (e) => {
                console.error("Speech synthesis error:", e);
                setSpeakingMsgId(null);
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className={inline ? 'w-full' : 'fixed bottom-20 right-5 z-[1000]'}>
            {/* ═══ MODO INLINE: Panel siempre abierto, empotrado en la página ═══ */}
            {inline && (
                <div
                    className={`w-full ari-chat-container ${isDayMode ? 'bg-[#faf8f5] border-slate-200/80 shadow-xl' : 'bg-slate-950/40 border-white/10'} backdrop-blur-3xl border rounded-[2rem] ${styles.cardShadow} flex flex-col overflow-hidden relative`}
                    style={{ borderColor: isMarketing ? 'rgba(16,185,129,0.2)' : isIndustrial ? 'rgba(245,158,11,0.2)' : 'rgba(34,211,238,0.2)', minHeight: isOpen ? '420px' : 'auto' }}
                >
                    {/* Background grid */}
                    <div className={`absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(${isDayMode ? '0,0,0,0.03' : '255,255,255,0.015'})_1px,transparent_1px),linear-gradient(90deg,rgba(${isDayMode ? '0,0,0,0.03' : '255,255,255,0.015'})_1px,transparent_1px)] bg-[size:20px_20px] z-0`} />
                    <div className={`absolute top-0 right-0 w-32 h-32 ${styles.accentGlow1} rounded-full blur-3xl z-0 ${isDayMode ? 'opacity-20' : ''}`} />
                    <div className={`absolute bottom-0 left-0 w-32 h-32 ${styles.accentGlow2} rounded-full blur-3xl z-0 ${isDayMode ? 'opacity-20' : ''}`} />
                    {/* Línea de acento superior */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ background: `linear-gradient(90deg, transparent, ${isMarketing ? '#10b981' : isIndustrial ? '#f59e0b' : '#22d3ee'}, transparent)` }} />

                    {/* Header inline */}
                    <div 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-4 ${
                            isDayMode 
                                ? 'bg-white border-b border-slate-100' 
                                : `bg-gradient-to-r ${styles.headerGradient} border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]`
                        } flex items-center gap-3 relative z-10 cursor-pointer hover:brightness-110 transition-all`}
                    >
                        <div className={`w-9 h-9 rounded-full overflow-hidden border flex-shrink-0 bg-slate-950 flex items-center justify-center ${styles.headerGlow}`}>
                            <img src="/ari-avatar.png" alt="ARI Asistente" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDayMode ? 'text-[#0f172a]' : 'text-white'}`}>{styles.headerTitle}</h3>
                            <p className={`text-[8px] ${isDayMode ? 'text-slate-500' : styles.headerStatusText} font-bold uppercase tracking-widest flex items-center gap-1`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {styles.headerSubtitle}
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 ${isDayMode ? 'bg-slate-100 border border-slate-200/80' : 'bg-black/40 border border-emerald-500/20'} rounded-full px-2 py-1`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                            <span className={`text-[7px] font-black uppercase tracking-widest ${isDayMode ? 'text-emerald-600' : 'text-emerald-400'}`}>ACTIVA</span>
                            {isOpen ? <ChevronUp size={12} className={isDayMode ? 'text-slate-600' : 'text-emerald-400'} /> : <ChevronDown size={12} className={isDayMode ? 'text-slate-600' : 'text-emerald-400'} />}
                        </div>
                    </div>

                    {isOpen && (
                        <>

                    {/* Misiones Programadas (colapsable) */}
                    <div className={`${isDayMode ? 'bg-slate-50 border-b border-slate-100' : 'bg-white/[0.03] border-b border-white/5'} relative z-10`}>
                        <button
                            onClick={() => setShowCampaigns(!showCampaigns)}
                            className={`w-full px-4 py-2 flex items-center justify-between transition-all ${isDayMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-violet-400" />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isDayMode ? 'text-slate-700' : 'text-white/70'}`}>Misiones Programadas</span>
                                {campaigns.filter(c => c.status === 'pending').length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-violet-600 text-[8px] font-black flex items-center justify-center text-white">
                                        {campaigns.filter(c => c.status === 'pending').length}
                                    </span>
                                )}
                            </div>
                            {showCampaigns ? <ChevronUp size={13} className={isDayMode ? 'text-slate-500' : 'text-white/40'} /> : <ChevronDown size={13} className={isDayMode ? 'text-slate-500' : 'text-white/40'} />}
                        </button>
                        {showCampaigns && (
                            <div className="max-h-[120px] overflow-y-auto p-3 space-y-2 no-scrollbar">
                                {campaigns.length === 0 ? (
                                    <p className={`text-[9px] text-center py-2 italic ${isDayMode ? 'text-slate-400' : 'text-white/20'}`}>No hay misiones agendadas todavía, Jefe.</p>
                                ) : campaigns.map(camp => (
                                    <div key={camp.id} className={`${isDayMode ? 'bg-white border border-slate-200 shadow-sm' : 'bg-black/40 border border-white/5'} rounded-xl p-2.5 flex items-start gap-3 group`}>
                                        <div className={`mt-1 w-2 h-2 rounded-full ${camp.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-[8px] font-black uppercase flex items-center gap-1 ${isDayMode ? 'text-slate-400' : 'text-white/40'}`}><Clock size={8} /> {new Date(camp.scheduledDate).toLocaleDateString()}</span>
                                            <p className={`text-[9px] leading-tight truncate ${isDayMode ? 'text-slate-700' : 'text-white/80'}`}>{camp.message}</p>
                                        </div>
                                        <button onClick={() => actualizarEstadoCampania(camp.id, 'cancelled')} className="text-red-500/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={11} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar relative z-10 ari-messages-container" style={{ maxHeight: '280px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[88%] p-3 rounded-[1.1rem] text-[11px] leading-relaxed border backdrop-blur-md ${
                                    msg.role === 'user'
                                    ? styles.userMsgBg + ' text-white rounded-tr-sm user-msg-bubble'
                                    : (isDayMode ? 'bg-white border-slate-200/80 text-slate-800 rounded-tl-sm shadow-[0_4px_15px_rgba(0,0,0,0.15)] ari-bubble-ari' : 'bg-slate-900/80 border-white/10 text-white/90 rounded-tl-sm')
                                }`}>
                                    {msg.text}
                                    {msg.role === 'ari' && (
                                        <button
                                            onClick={() => handlePlayMessage(msg.text, i)}
                                            className={`mt-2 ${styles.speechBtnColor} transition-colors flex items-center gap-1 ${isDayMode ? 'bg-slate-100 hover:bg-slate-200' : 'bg-black/20 hover:bg-black/40'} px-2 py-1 rounded-md w-max`}
                                        >
                                            {speakingMsgId === i ? <Volume2 size={11} className="animate-pulse" /> : <Play size={11} />}
                                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isDayMode ? 'text-slate-600' : ''}`}>{speakingMsgId === i ? 'Pausar' : 'Escuchar'}</span>
                                        </button>
                                    )}
                                    <div className="text-[7px] mt-1 opacity-30 uppercase font-black tracking-widest">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`p-3 rounded-2xl rounded-tl-none ${isDayMode ? 'bg-slate-100 border border-slate-200' : 'bg-white/5 border border-white/10'}`}>
                                    <div className="flex gap-1">
                                        <div className={`w-1.5 h-1.5 ${styles.loadingDot} rounded-full animate-bounce`}></div>
                                        <div className={`w-1.5 h-1.5 ${styles.loadingDot} rounded-full animate-bounce [animation-delay:0.2s]`}></div>
                                        <div className={`w-1.5 h-1.5 ${styles.loadingDot} rounded-full animate-bounce [animation-delay:0.4s]`}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick chips inline */}
                    <div className={`px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t relative z-10 ${isDayMode ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-slate-900/40'}`}>
                        {isAcademy ? (
                            <>
                                <button onClick={() => { setInput('¿Qué recibo cuando me gradúo?'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('violet')}`}><Sparkles size={9}/> Kit Oficial</button>
                                <button onClick={() => { setInput('Explicame el módulo de Ética y Conducta'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('violet')}`}><Bot size={9}/> Módulo Ética</button>
                                <button onClick={() => { setInput('¿Cómo funciona la credencial electrónica?'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('violet')}`}><BarChart3 size={9}/> Credencial</button>
                                <button onClick={() => { setInput('¿Cuáles son las funciones del Embajador?'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('violet')}`}><Megaphone size={9}/> Mi Rol</button>
                            </>
                        ) : isMarketing ? (
                            <>
                                <button onClick={() => { setInput('Redactame un copy para WhatsApp para captar nuevos comercios con la Landing Unirse'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('emerald')}`}><Megaphone size={9} /> Copy B2B</button>
                                <button onClick={() => { setInput('Armame una campaña para el fin de semana con las Ofertas VIP'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('cyan')}`}><Sparkles size={9} /> B2C VIP</button>
                                <button onClick={() => { setInput('Quiero captar Embajadores, redactame el texto de Reclutamiento'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('violet')}`}><Bot size={9} /> Reclutar</button>
                                <button onClick={() => { setInput('¿Qué landing conviene disparar primero esta semana?'); scrollToBottom(); }} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('emerald')}`}><BarChart3 size={9} /> Estrategia</button>
                            </>
                        ) : isIndustrial ? (
                            <>
                                <button onClick={() => setInput('¿Cuántas empresas hay registradas?')} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('amber')}`}><BarChart3 size={9} /> B2B Total</button>
                                <button onClick={() => setInput('Recomendame proveedores')} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('yellow')}`}><Sparkles size={9} /> Proveedores</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setInput('Crear campaña WhatsApp')} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('cyan')}`}><Megaphone size={9} /> Campaña</button>
                                <button onClick={() => setInput('Sugerencias para vender más')} className={`whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${getChipClass('amber')}`}><Sparkles size={9} /> Consejos</button>
                            </>
                        )}
                    </div>

                    {/* Input inline */}
                    <div className={`p-3 relative z-10 ${isDayMode ? 'bg-[#faf8f5] border-t border-slate-200' : 'bg-slate-950/60 backdrop-blur-xl border-t border-white/10'}`}>
                        <div className={`flex items-center gap-2 ${isDayMode ? 'bg-slate-100 border border-slate-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]' : 'bg-white/5 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]'} rounded-2xl p-1 px-3`}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Comandale a ARI una campaña..."
                                className={`flex-1 bg-transparent border-none ${isDayMode ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-white/25'} text-[11px] py-2.5 focus:outline-none font-medium`}
                            />
                            <input
                                type="file"
                                id="ari-image-upload-inline"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        setMessages(prev => [...prev, { role: 'user', text: `📸 Imagen enviada: ${file.name}`, timestamp: new Date() }]);
                                        setIsLoading(true);
                                        setTimeout(() => {
                                            setMessages(prev => [...prev, { role: 'ari', text: `¡Foto recibida y analizada, Jefe! Todo en orden. ¿Querés que armemos un reporte con esta evidencia?`, timestamp: new Date() }]);
                                            setIsLoading(false);
                                            scrollToBottom();
                                        }, 1500);
                                    }
                                }}
                            />
                            <button
                                onClick={() => document.getElementById('ari-image-upload-inline')?.click()}
                                className={`p-2 rounded-xl transition-all ${isDayMode ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            >
                                <Camera size={16} />
                            </button>
                            <button
                                onClick={handleToggleMic}
                                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : isDayMode ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`p-2 bg-gradient-to-r ${styles.sendBtn} text-black rounded-xl hover:scale-105 transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                    </>
                    )}
                </div>
            )}

            {/* ═══ MODO FLOTANTE: Burbuja + panel emergente ═══ */}
            {!inline && (
                <div className="relative group">
                    {/* Efecto de anillo pulsante de atención */}
                    <div className={`absolute inset-0 rounded-full ${styles.glowRing} animate-ping`} />
                    <div className={`absolute inset-0 rounded-full ${styles.pulseGlow} animate-pulse scale-125`} />

                    <button 
                        onClick={() => { setIsOpen(true); playNeonClick(); }}
                        className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center relative z-10 transition-all hover:scale-110 group"
                    >
                        {/* ARI Neon Bubble */}
                        <div className={`absolute inset-0 ${styles.blurBg} rounded-full blur-xl transition-all`}></div>
                        <div className={`w-12 h-12 rounded-full ${styles.bubbleGlow} overflow-hidden border-2 ${styles.bubbleBorder} bg-slate-950 flex items-center justify-center`}>
                            <img src="/ari-avatar.png" alt="ARI Asistente" className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                            <span className="text-[8px] font-black text-white">1</span>
                        </div>
                    </button>
                </div>
            )}


            {!inline && isOpen && (
                <>
                    {/* Backdrop blur overlay to prevent background mixing and highlight the chat */}
                    <div 
                        onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }}
                        className="fixed inset-0 bg-black/25 backdrop-blur-[5px] z-[998] transition-all duration-300 animate-in fade-in cursor-default"
                    />
                    <div className="w-[340px] h-[500px] ari-chat-container z-[999] bg-white border border-slate-200/80 shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300 relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,120,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,120,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] z-0" />

                    {/* Header */}
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-950 flex-shrink-0">
                                <img src="/ari-avatar.png" alt="ARI Asistente" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-[#0f172a]">
                                    {styles.headerTitle}
                                </h3>
                                <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 
                                    En línea y lista para guiarte
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setIsOpen(false); playNeonClick(); window.speechSynthesis.cancel(); }}
                            className="p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Bitácora de Marketing (Misiones Programadas) */}
                    <div className="bg-slate-50 border-b border-slate-100 relative z-10">
                        <button 
                            onClick={() => setShowCampaigns(!showCampaigns)}
                            className="w-full px-4 py-2 flex items-center justify-between transition-all hover:bg-slate-100"
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-violet-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Misiones Programadas</span>
                                {campaigns.filter(c => c.status === 'pending').length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-violet-600 text-[8px] font-black flex items-center justify-center text-white">
                                        {campaigns.filter(c => c.status === 'pending').length}
                                    </span>
                                )}
                            </div>
                            {showCampaigns ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                        </button>

                        {showCampaigns && (
                            <div className="max-h-[150px] overflow-y-auto p-3 space-y-2 no-scrollbar animate-in slide-in-from-top-2 duration-300">
                                {campaigns.length === 0 ? (
                                    <p className="text-[9px] text-center py-2 italic text-slate-400">No hay misiones agendadas todavía, Jefe.</p>
                                ) : (
                                    campaigns.map(camp => (
                                        <div key={camp.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-2.5 flex items-start gap-3 group text-left">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${camp.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 text-slate-400">
                                                        <Clock size={8} /> {new Date(camp.scheduledDate).toLocaleDateString()}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {camp.status === 'pending' && (
                                                            <button onClick={() => actualizarEstadoCampania(camp.id, 'executed')} className="text-green-500 hover:text-green-400">
                                                                <CheckCircle2 size={12} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => actualizarEstadoCampania(camp.id, 'cancelled')} className="text-red-500/60 hover:text-red-400">
                                                                <Trash2 size={12} />
                                                            </button>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] leading-tight truncate text-slate-700">{camp.message}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10 ari-messages-container">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3.5 rounded-[1.25rem] text-[11px] leading-relaxed shadow-md border transition-all text-left ${
                                    msg.role === 'user' 
                                    ? 'bg-[#2d1e15] border-[#2d1e15]/10 text-white rounded-tr-none shadow-md user-msg-bubble' 
                                    : 'bg-white border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm shadow-slate-100'
                                }`}>
                                    {msg.text}
                                    {msg.role === 'ari' && msg.text.includes('JEFE, ¿QUIERE que agende esta misión'.toUpperCase()) && (
                                        <div className="mt-3 p-2 rounded-xl border animate-pulse bg-slate-50 border-slate-200">
                                            <button 
                                                onClick={() => {
                                                    playNeonClick();
                                                    const dateMatch = msg.text.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                                                    const day = dateMatch ? dateMatch[1] : '12';
                                                    const monthStr = dateMatch ? dateMatch[2].toLowerCase() : 'julio';
                                                    const months: any = { enero:0, febrero:1, marzo:2, abril:3, mayo:4, junio:5, julio:6, agosto:7, septiembre:8, octubre:9, noviembre:10, diciembre:11 };
                                                    const date = new Date(2026, months[monthStr] || 6, parseInt(day));
                                                    
                                                    guardarCampaniaMarketing({
                                                        shopId: shop.id,
                                                        message: msg.text.split('\n')[0].substring(0, 100) + '...',
                                                        scheduledDate: date.toISOString(),
                                                        status: 'pending',
                                                        audience: 'all'
                                                    });
                                                    setMessages(prev => [...prev, { role: 'ari', text: `✅ ¡MISIÓN RECIBIDA! Archivo guardado en las celdas de cristal para el ${day} de ${monthStr}. Los ratoncitos ya tienen el reloj sincronizado.`, timestamp: new Date() }]);
                                                }}
                                                className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-all cursor-pointer"
                                            >
                                                Confirmar Misión
                                            </button>
                                        </div>
                                    )}
                                    <div className="text-[7px] mt-2 opacity-40 uppercase font-black tracking-widest flex justify-between items-center">
                                        <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {msg.role === 'ari' && (
                                        <button 
                                            onClick={() => handlePlayMessage(msg.text, i)}
                                            className="mt-2 text-cyan-700 hover:text-cyan-800 transition-colors flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md w-max border-none cursor-pointer"
                                        >
                                            {speakingMsgId === i ? <Volume2 size={12} className="animate-pulse" /> : <Play size={12} />}
                                            <span className="text-[8px] font-bold uppercase tracking-widest">
                                                {speakingMsgId === i ? 'Pausar' : 'Escuchar Voz'}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="p-3 rounded-2xl rounded-tl-none bg-slate-100 border border-slate-200">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Action Quick Chips */}
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white/40">
                        {isIndustrial ? (
                            <>
                                <button onClick={() => setInput('¿Cuántas empresas hay registradas en total y activas?')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80 cursor-pointer">
                                    <BarChart3 size={10} /> Total Empresas
                                </button>
                                <button onClick={() => setInput('¿Qué empresas hay por alcance?')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-yellow-50 border-yellow-200/60 text-yellow-700 hover:bg-yellow-100/80 cursor-pointer">
                                    <Globe size={10} /> Alcance B2B
                                </button>
                                <button onClick={() => setInput('Recomendame proveedores de alimentos')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80 cursor-pointer">
                                    <Sparkles size={10} /> Proveedores
                                </button>
                            </>
                        ) : isMarketing ? (
                            <>
                                <button onClick={() => setInput('Redactame un copy para WhatsApp para captar nuevos comercios con la Landing Unirse')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80 cursor-pointer">
                                    <Megaphone size={10} /> Copy B2B
                                </button>
                                <button onClick={() => setInput('Armame una campaña para el fin de semana con las Ofertas VIP para clientes')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-cyan-50 border-cyan-200/60 text-cyan-700 hover:bg-cyan-100/80 cursor-pointer">
                                    <Sparkles size={10} /> Campaña B2C
                                </button>
                                <button onClick={() => setInput('Quiero captar Embajadores, redactame el texto para el formulario de Reclutamiento')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-violet-50 border-violet-200/60 text-violet-700 hover:bg-violet-100/80 cursor-pointer">
                                    <Bot size={10} /> Reclutar
                                </button>
                                <button onClick={() => setInput('¿Cuántas campañas tengo activas y qué landing conviene disparar primero?')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100/80 cursor-pointer">
                                    <BarChart3 size={10} /> Estado
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setInput('¿Cuántas visitas tuve hoy?')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-cyan-50 border-cyan-200/60 text-cyan-700 hover:bg-cyan-100/80 cursor-pointer">
                                    <BarChart3 size={10} /> Visitas
                                </button>
                                <button onClick={() => setInput('Crear campaña de WhatsApp')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-violet-50 border-violet-200/60 text-violet-700 hover:bg-violet-100/80 cursor-pointer">
                                    <Megaphone size={10} /> Campaña
                                </button>
                                <button onClick={() => setInput('Sugerencias para vender más')} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 bg-amber-50 border-amber-200/60 text-amber-700 hover:bg-amber-100/80 cursor-pointer">
                                    <Sparkles size={10} /> Consejos
                                </button>
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#f8f9fa] border-t border-slate-200/60 relative z-10">
                        <div className="flex items-center gap-2 bg-[#f1f3f7] border border-transparent shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] rounded-3xl p-1 px-3">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Comandá a Ari..."
                                className="flex-1 bg-transparent border-none text-slate-800 placeholder:text-slate-400 text-[11px] py-3 focus:outline-none font-medium tracking-wide"
                            />
                            <input 
                                type="file"
                                id="ari-image-upload-floating"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const file = e.target.files[0];
                                        setMessages(prev => [...prev, { role: 'user', text: `📸 Imagen enviada: ${file.name}`, timestamp: new Date() }]);
                                        setIsLoading(true);
                                        setTimeout(() => {
                                            setMessages(prev => [...prev, { role: 'ari', text: `¡Foto recibida y analizada, Jefe! Todo en orden. ¿Querés que armemos un reporte con esta evidencia?`, timestamp: new Date() }]);
                                            setIsLoading(false);
                                            scrollToBottom();
                                        }, 1500);
                                    }
                                }}
                            />
                            <button
                                onClick={() => document.getElementById('ari-image-upload-floating')?.click()}
                                className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-200 border-none bg-transparent cursor-pointer"
                            >
                                <Camera size={18} />
                            </button>
                            <button 
                                onClick={handleToggleMic}
                                className={`p-2.5 rounded-xl transition-all border-none bg-transparent cursor-pointer ${
                                    isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-all disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 border-none cursor-pointer flex items-center justify-center"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};
