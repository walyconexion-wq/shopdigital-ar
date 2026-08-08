# ShopDigital Branding & 3D Physical Design Guidelines

Este documento define la identidad visual y las reglas de diseño para la interfaz de ShopDigital, aplicables tanto para páginas del cliente como del comerciante.

## 1. Modos de Visualización y Colores Base

La aplicación admite dos modos de visualización basados en la preferencia del tema almacenada en `localStorage.getItem('global_home_theme_mode')`.

### A. Modo Día (Frecuencia Caramelo)
*   **Fondo General (Page Canvas):** `#cda488` (Caramelo cálido).
*   **Contenedores y Tarjetas:** Fondo sólido `#faf8f5` (Hueso/Perla).
*   **Contornos y Sombras:** Bordes de relieve en `#855b3c` (Marrón medio).
*   **Textos Principales:** `#2d1e15` (Marrón oscuro profundo).
*   **Textos Secundarios/Muted:** `#2d1e15` con opacidades entre `40%` y `60%`.

### B. Modo Noche (Frecuencia Original Interestelar)
*   **Fondo General (Page Canvas):** `#060d1a` / `#000000` (Azul oscuro profundo / Negro).
*   **Contenedores y Tarjetas:** Fondo translúcido `bg-[#0f172a]/80` o `bg-cyan-950/20` con `backdrop-blur-md`.
*   **Contornos y Sombras:** Bordes finos de neón (`border-cyan-500/30` o `border-white/5`) con sombras difusas.
*   **Textos Principales:** `#ffffff` (Blanco) o `#e2e8f0` (Gris claro).
*   **Textos Secundarios:** Opacidades de blanco o gris al `40%` o `50%`.

---

## 2. Regla de Profundidad 3D Física (Efecto Cardboard)

Para dar la sensación de una interfaz física tridimensional y táctil, las tarjetas y paneles en **Modo Día** deben tener un relieve marcado en el borde inferior.

*   **Tarjetas Principales (Modo Día):** 
    `className="bg-[#faf8f5] border-[#855b3c] border-b-[8px] border-b-[#855b3c] rounded-[1.5rem] ..."`
*   **Tarjetas Secundarias/Login (Modo Día):**
    `className="bg-white/85 border-[#cbd5e1] border-b-[6px] border-b-[#cbd5e1] rounded-[2.5rem] ..."`
*   **Botones Físicos de Acción (Modo Día):**
    *   **Botón Primario:** `bg-gradient-to-b from-[#b58866] to-[#9c7151] text-white border-[#855b3c] border-b-[4px] border-b-[#734b2f] hover:brightness-105 active:translate-y-[3px] active:border-b-[1px] transition-all`
    *   **Botón Secundario:** `bg-white text-[#2d1e15] border-[#cbd5e1] border-b-[4px] border-b-[#cbd5e1] hover:bg-slate-50 active:translate-y-[3px] active:border-b-[1px] transition-all`

---

## 3. Botones y Elementos en Modo Noche (Estilo Cyberpunk/Neón)

En el modo nocturno, se prescinde del relieve marrón y se utiliza sombreado difuso y resplandor de neón.

*   **Botón Primario Neón:**
    `bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-95 active:bg-cyan-500 active:text-black transition-all`
*   **Botones Secundarios:**
    `bg-white/5 border border-white/10 text-white/70 hover:text-white active:scale-95 transition-all`

---

## 4. Normas Generales de Asistencia (Ari Assistant)

*   El avatar flotante o integrado de Ari siempre debe usar la ruta de imagen real: **`/ari-avatar.png`**.
*   No utilizar letras estáticas en degradé ("A") para Ari.
*   En páginas complejas, el cartel o burbuja de texto explicativo debe cargarse cerrado por defecto (`showAri = false`), mostrando únicamente la burbujita circular flotante de Ari con su avatar de 12x12/16x16, permitiendo al usuario abrir el diálogo al tocarla.

---

## 5. Molde de la Página de Beneficios VIP (VipBenefitsPage.tsx) para Clonación por Zonas

Para clonar o replicar la página de beneficios VIP en nuevas localidades, se debe seguir exactamente el siguiente molde estructural, de colores y de navegación:

### A. Estructura e Identidad de la Portada (Hero Card)
1. **Esquina Superior Izquierda (Badge de Zona)**:
   Muestra dinámicamente la localidad actual del parámetro `townId`:
   `ZONA {townId === 'esteban-echeverria' ? 'ESTEBAN ECHEVERRÍA' : townId.replace('-', ' ').toUpperCase()} 📍`
   *   **Modo Día**: `bg-[#2d1e15]/10 text-[#2d1e15]/70 rounded-br-2xl`
   *   **Modo Noche**: `bg-white/5 text-white/50 rounded-br-2xl`
2. **Esquina Superior Derecha (Badge VIP)**:
   `SOCIOS VIP 💎` (Marrón en Modo Día, Cian Neón en Modo Noche, con `rounded-bl-2xl`).
3. **Título Principal**:
   `Mis Beneficios Exclusivos` en mayúsculas.
4. **Burbuja de Diálogo Compacta de Ari**:
   - Ancho máximo ajustado a `max-w-[90%]`, padding de `py-2.5 px-4`, tipografía `text-[10px]`.
   - La palabra **`Ari`** dentro de la frase debe destacarse con la clase `text-[#22d3ee]` para coincidir con la tonalidad celeste exacta de los botones de la página.
5. **Avatar de Ari**:
   Ilustración animada (`/ari-pointing.png`) flotando en la base del Hero.

### B. Sistema de Navegación de Filtros (Tipos vs. Rubros)
1. **Selectores Principales de Tipo** (Descuento, Cupón, Oferta):
   - **Grid Estirado**: Deben estar distribuidos en una cuadrícula de tres columnas (`grid grid-cols-3 w-full gap-2`) para cubrir todo el ancho de la tarjeta.
   - **Estilo Inactivo (`.btn-3d-selector`)**:
     - **Modo Día**: Sombreado ámbar/oro (`shadow-[0_8px_22px_rgba(245,158,11,0.25)]`).
     - **Modo Noche**: Sombreado fucsia/púrpura (`shadow-[0_8px_25px_rgba(168,85,247,0.25)]`).
   - **Estilo Activo/Seleccionado**:
     - **Modo Día**: Fondo blanco `bg-white`, texto y bordes en ámbar oscuro (`text-[#78350f]`, `border-[#b45309]/30 border-b-[#b45309]/60`), con efecto presionado (`translate-y-[3px] shadow-inner`).
     - **Modo Noche**: Fondo fucsia sólido (`bg-fuchsia-500`), texto negro, borde fucsia oscuro y resplandor fucsia neón (`shadow-[0_0_15px_rgba(217,70,239,0.7)]`).

2. **Panel de Rubros/Categorías (Ahorro de Espacio)**:
   - **Contenedor Anidado**: Agrupar los 24 rubros dentro de una tarjeta interna sombreada (`bg-[#cda488]/15 border-[#855b3c]/15` en Modo Día; `bg-black/35 border-white/5` en Modo Noche) con bordes redondeados `rounded-3xl` para separarlo visualmente de los tipos principales.
   - **Botones Compactos (`btn-3d-celeste` inactivos)**:
     - Tamaño de texto reducido a `text-[7px]` y padding ajustado a `px-2.5 py-1.5`.
     - Esto permite que los 24 rubros envuelvan (`flex-wrap`) y se muestren completos de un vistazo sin ocupar gran altura vertical.
   - **Estilo Activo/Seleccionado (Rubros)**:
     - **Modo Día**: Fondo blanco `bg-white`, texto marrón oscuro (`text-[#2d1e15]`), borde marrón medio (`border-[#855b3c]/20 border-b-[#855b3c]/50`), efecto presionado (`translate-y-[3px] shadow-inner`).
     - **Modo Noche**: Fondo cian sólido (`bg-cyan-500`), texto negro, borde cian oscuro y resplandor neón cian.

3. **Lógica de Toggle de Filtros**:
   - No mostrar un botón visual de "Todos".
   - Al hacer clic en un botón de tipo o de rubro ya activo, el filtro se apaga (ej. `setActiveCategory(prev => prev === cat ? 'Todos' : cat)`), limpiando la selección visual e internamente volviendo a mostrar todas las tarjetas.

### C. Pie de Página (Footer)
*   **Orden de elementos**:
    1. Botón de compartir beneficios VIP (`Share2`).
    2. Botón 3D de "Regresar al inicio" (`ArrowLeft`).
    3. Bloque informativo "Ari dice..." con avatar mini.

---

## 6. Sistema de Diseño Neumórfico Crema HD + Acrílico Violeta Ciber-Digital (Credenciales y Nuevas Interfaces)

> **Regla Maestra de Transferencia**: Cuando el usuario mencione conversaciones o IDs de diseño (ej: `d4af3ab5-dc40-4c64-909a-d2b2ea376320` o `CRED-CLIENTE`), este es el sistema visual definitivo que debe aplicarse uniformemente.

### A. Paleta de Colores Fundamentales (Tokens Visuales)
*   **Fondo de Pantalla Base:** `CyberCircuitBackground` (Canvas con circuitos y partículas flotantes violeta ciber-digital `#9370db` / `#1a0933`).
*   **Contenedor Neumórfico Crema HD (`.neu-plate`):** `#f0ece6` (Crema claro mate con relieve 3D).
*   **Contenedor Hundido / Inset (`.neu-inset-title`):** `#f0ece6` con sombra interna `inset 4px 4px 10px rgba(180, 165, 148, 0.5)`.
*   **Tinta de Texto Principal:** `#2c2440` (Índigo oscuro profundo para máxima legibilidad).
*   **Tinta de Texto Secundario / Labels:** `#4a3d6a` (Violeta místico atenuado).
*   **Acento Coral Vibrante (Hero CTAs & Destacados):** `#ff6b6b` (Coral vibrante con resplandor `rgba(255, 107, 107, 0.45)`).

### B. Sistema de Botones 3D e Interfaces
1. **Control de Cabecera y Pods (`.neu-btn-pod`):**
   *   Material: Acrílico / Vidrio Esmerilado Violeta Delicado 3D.
   *   Estilo: `background: rgba(147, 112, 219, 0.14); backdrop-filter: blur(14px); border: 1.5px solid rgba(168, 130, 235, 0.45); border-radius: 16px;`
   *   Sombra 3D: `box-shadow: 4px 4px 12px rgba(130, 100, 180, 0.22), -4px -4px 10px rgba(255, 255, 255, 0.95);`
2. **Botón Principal Hero CTA (`.neu-btn-hero`):**
   *   Material: Acrílico Violeta con Borde Coral Brillante `#ff6b6b` + Barrido de Luz (*shimmer pass*).
   *   Uso: Botón de máxima prioridad (ej: *Explorar Beneficios VIP*, *Abrir POSNET*).
3. **Botón Secundario 3D (`.neu-btn-3d`):**
   *   Material: Acrílico Esmerilado Violeta Lavanda con relieve 3D (`background: rgba(147, 112, 219, 0.14)`).
   *   Uso: Navegación de nivel 2 (ej: *Volver al Inicio*, *Panel de Autogestión*).
4. **Modo Día / Noche:**
   *   Sincronizado vía `localStorage.getItem('global_home_theme_mode')` y evento global `theme_change`.
5. **Avatar de Asistencia (ARI):**
   *   Ilustración 3D flotante (`/ari-pointing.png` o `/ari-avatar.png`) con sombra ovalada pulsante (`.ari-3d-shadow`).

