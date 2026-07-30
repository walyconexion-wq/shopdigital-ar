/**
 * 📰 MURO DE NOVEDADES — Búnker de Melisa (Marketing)
 * Componente React con Glassmorphism 3D para la aplicación Enterprise V1.2.2.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  procesarNovedad,
  NOVEDADES_DEMO,
  type MelisaOutput,
  type Categoria,
} from '../services/melisaMarketingService';
import './muroNovedades.css';

interface Novedad extends MelisaOutput {
  id: string;
  imagenUrl: string;
  comercioNombre?: string;
}

const SkeletonCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line corto" />
      <div className="skeleton-line largo" style={{ height: '18px', marginBottom: '10px' }} />
      <div className="skeleton-line" style={{ width: '90%' }} />
    </div>
  </div>
);

interface NovedadCardProps {
  novedad: Novedad;
  onAmpliar: (novedad: Novedad) => void;
  animDelay?: number;
}

const NovedadCard: React.FC<NovedadCardProps> = ({ novedad, onAmpliar, animDelay = 0 }) => (
  <div
    className="novedad-card"
    style={{ '--card-color': novedad.color, animationDelay: `${animDelay}ms` } as React.CSSProperties}
    onClick={() => onAmpliar(novedad)}
  >
    <div className="card-imagen-wrapper">
      <img src={novedad.imagenUrl} alt={novedad.titulo} className="card-imagen" loading="lazy" />
      <div className="card-imagen-overlay" />
      <span className="card-tag" style={{ background: novedad.color }}>{novedad.tag}</span>
      <span className="card-emoji">{novedad.emoji}</span>
    </div>
    <div className="card-body">
      <div className="card-categoria-pill" style={{ color: novedad.color }}>
        <span>{novedad.emoji}</span>
        <span>{novedad.categoria}</span>
        {novedad.comercioNombre && <span style={{ opacity: 0.6, fontWeight: 700 }}> · {novedad.comercioNombre}</span>}
      </div>
      <h3 className="card-titulo">{novedad.titulo}</h3>
      <p className="card-microcopy">{novedad.microcopy}</p>
      <button className="btn-ampliar" onClick={(e) => { e.stopPropagation(); onAmpliar(novedad); }}>
        AMPLIAR <span className="btn-ampliar-icono">→</span>
      </button>
    </div>
  </div>
);

const FILTROS: Array<{ label: string; value: Categoria | 'Todas' }> = [
  { label: '✨ Todas', value: 'Todas' },
  { label: '🎭 Espectáculos', value: 'Espectáculos' },
  { label: '🍕 Gastronomía', value: 'Gastronomía' },
  { label: '⚡ Ofertas Flash', value: 'Ofertas Flash' },
  { label: '🏔️ Turismo', value: 'Turismo' },
];

export default function MuroNovedades() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState<Categoria | 'Todas'>('Todas');
  const [modalNovedad, setModalNovedad] = useState<Novedad | null>(null);

  useEffect(() => {
    const cargarDemos = async () => {
      setCargando(true);
      try {
        const resultados = await Promise.all(
          NOVEDADES_DEMO.map(async (demo) => {
            const melisaOut = await procesarNovedad({ textoLibre: demo.textoLibre, comercioNombre: demo.comercioNombre });
            return { ...melisaOut, id: demo.id, imagenUrl: demo.imagenUrl, comercioNombre: demo.comercioNombre } as Novedad;
          })
        );
        setNovedades(resultados);
      } catch {
        // Fallback handled inside
      } finally {
        setCargando(false);
      }
    };
    cargarDemos();
  }, []);

  const novedadesFiltradas = filtroActivo === 'Todas' ? novedades : novedades.filter((n) => n.categoria === filtroActivo);

  return (
    <div className="muro-wrapper">
      {modalNovedad && (
        <div className="modal-overlay" onClick={() => setModalNovedad(null)}>
          <div className="modal-card" style={{ '--card-color': modalNovedad.color } as React.CSSProperties}>
            <div className="modal-handle" />
            <img src={modalNovedad.imagenUrl} alt={modalNovedad.titulo} className="modal-imagen" />
            <div className="modal-body">
              <span className="modal-tag" style={{ background: modalNovedad.color }}>{modalNovedad.tag}</span>
              <h2 className="modal-titulo">{modalNovedad.emoji} {modalNovedad.titulo}</h2>
              <p className="modal-microcopy">{modalNovedad.microcopy}</p>
              <button className="btn-modal-accion">APROVECHAR NOVEDAD</button>
              <button className="btn-modal-cerrar" onClick={() => setModalNovedad(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}

      <div className="muro-header">
        <h2 className="muro-titulo">Muro de <span>Novedades</span></h2>
        <span className="muro-badge">Melisa IA</span>
      </div>

      <div className="muro-filtros">
        {FILTROS.map((f) => (
          <button key={f.value} className={`filtro-btn${filtroActivo === f.value ? ' activo' : ''}`} onClick={() => setFiltroActivo(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="muro-grid">
        {cargando ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          novedadesFiltradas.map((novedad, idx) => (
            <NovedadCard key={novedad.id} novedad={novedad} onAmpliar={setModalNovedad} animDelay={idx * 60} />
          ))
        )}
      </div>
    </div>
  );
}
