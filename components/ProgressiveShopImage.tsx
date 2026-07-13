import React, { useState, useRef, useEffect } from 'react';

interface ProgressiveShopImageProps {
    src: string;
    alt: string;
    className?: string;
    /** Si es true, carga eager con alta prioridad (primeras 4 tarjetas) */
    priority?: boolean;
    /** Color de fondo del skeleton mientras carga */
    skeletonColor?: string;
}

/**
 * ProgressiveShopImage
 * 
 * Solución al pop-in tardío en scroll:
 * - Muestra un skeleton shimmer animado mientras la imagen carga
 * - Fade-in suave (200ms) al aparecer, eliminando el parpadeo brusco
 * - Para las primeras tarjetas "above the fold": carga eager + fetchpriority high
 * - Para las demás: Intersection Observer para lazy load sin tirones
 */
const ProgressiveShopImage: React.FC<ProgressiveShopImageProps> = ({
    src,
    alt,
    className = '',
    priority = false,
    skeletonColor = 'rgba(255,255,255,0.08)',
}) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [inView, setInView] = useState(priority); // Si es priority, ya está "en vista"
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer para lazy load suave (solo para no-priority)
    useEffect(() => {
        if (priority) return; // Las prioritarias se cargan de inmediato

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                // rootMargin: pre-carga 400px antes en todas las direcciones
                // El margen horizontal (left/right) cubre el scroll lateral del carrusel
                rootMargin: '400px 400px',
                threshold: 0,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [priority]);

    // Si la imagen ya estaba en caché del navegador, marcarla como cargada
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            setLoaded(true);
        }
    }, [inView]);

    const handleLoad = () => setLoaded(true);
    const handleError = () => {
        setError(true);
        setLoaded(true); // Ocultar el skeleton aunque haya error
    };

    const buildMobileUrl = (url: string): string => {
        if (!url) return url;
        // Solo optimiza URLs de Unsplash — para Firebase Storage y otras fuentes, pasa sin cambios
        if (url.includes('unsplash.com') && !url.includes('&w=')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}w=400&q=70&fm=webp`;
        }
        return url;
    };

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: skeletonColor }}>
            {/* Skeleton shimmer — visible mientras la imagen no carga */}
            {!loaded && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(
                            90deg,
                            ${skeletonColor} 25%,
                            rgba(255,255,255,0.15) 50%,
                            ${skeletonColor} 75%
                        )`,
                        backgroundSize: '200% 100%',
                        animation: 'shimmer-slide 1.4s ease-in-out infinite',
                        zIndex: 1,
                    }}
                />
            )}

            {/* Imagen real — solo se renderiza al estar en viewport (o de inmediato si priority) */}
            {inView && !error && (
                <img
                    ref={imgRef}
                    src={buildMobileUrl(src)}
                    alt={alt}
                    // Para priority: eager + high. Para el resto: lazy nativo del navegador
                    loading={priority ? 'eager' : 'lazy'}
                    // @ts-ignore - fetchpriority es un atributo HTML5 válido
                    fetchpriority={priority ? 'high' : 'low'}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        // Fade-in suave: de invisible a visible en 250ms
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 250ms ease-in-out',
                        zIndex: 2,
                    }}
                />
            )}

            {/* Fallback si la imagen falla */}
            {error && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.2)',
                        zIndex: 2,
                    }}
                >
                    <span style={{ fontSize: '24px', opacity: 0.4 }}>🏪</span>
                </div>
            )}
        </div>
    );
};

export default ProgressiveShopImage;
