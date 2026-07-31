import React, { useEffect, useRef } from 'react';

export const CyberCircuitBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        let rafId: number;

        interface CircuitNode {
            x: number;
            y: number;
            r: number;
            pulsePhase: number;
            bright: boolean;
        }

        interface CircuitEdge {
            a: CircuitNode;
            b: CircuitNode;
            midX: number;
            midY: number;
            bright: boolean;
        }

        interface LightPulse {
            edge: CircuitEdge;
            t: number;
            speed: number;
            size: number;
            alpha: number;
        }

        let nodes: CircuitNode[] = [];
        let edges: CircuitEdge[] = [];
        let pulses: LightPulse[] = [];

        const rand = (a: number, b: number) => Math.random() * (b - a) + a;
        const randInt = (a: number, b: number) => Math.floor(rand(a, b));

        const COLORS = {
            line: 'rgba(190, 155, 255, 0.4)',
            lineBright: 'rgba(225, 195, 255, 0.75)',
            nodeOuter: 'rgba(200, 165, 255, 0.55)',
            nodeInner: 'rgba(255, 255, 255, 0.95)',
        };

        const resize = () => {
            if (!canvas) return;
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            build();
        };

        const build = () => {
            nodes = [];
            edges = [];
            pulses = [];

            const cols = Math.ceil(W / 100) + 1;
            const rows = Math.ceil(H / 100) + 1;
            const stepX = W / (cols - 1);
            const stepY = H / (rows - 1);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    nodes.push({
                        x: c * stepX + rand(-stepX * 0.35, stepX * 0.35),
                        y: r * stepY + rand(-stepY * 0.35, stepY * 0.35),
                        r: rand(2.5, 4.5),
                        pulsePhase: rand(0, Math.PI * 2),
                        bright: Math.random() > 0.55,
                    });
                }
            }

            const maxDist = Math.max(stepX, stepY) * 1.8;
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    if (Math.hypot(b.x - a.x, b.y - a.y) < maxDist && Math.random() > 0.4) {
                        const midX = Math.random() > 0.5 ? b.x : a.x;
                        const midY = Math.random() > 0.5 ? a.y : b.y;
                        edges.push({ a, b, midX, midY, bright: a.bright && b.bright });
                    }
                }
            }

            for (let k = 0; k < 25; k++) spawnPulse();
        };

        const spawnPulse = () => {
            if (!edges.length) return;
            const edge = edges[randInt(0, edges.length)];
            pulses.push({
                edge,
                t: rand(0, 1),
                speed: rand(0.003, 0.009),
                size: rand(3, 6),
                alpha: 0,
            });
        };

        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const getPulsePos = (e: CircuitEdge, t: number) => {
            if (t <= 0.5) {
                const s = t * 2;
                return { x: lerp(e.a.x, e.midX, s), y: lerp(e.a.y, e.midY, s) };
            }
            const s = (t - 0.5) * 2;
            return { x: lerp(e.midX, e.b.x, s), y: lerp(e.midY, e.b.y, s) };
        };

        const draw = (ts: number) => {
            ctx.clearRect(0, 0, W, H);

            // Dibujar líneas de circuitos
            for (const e of edges) {
                ctx.beginPath();
                ctx.moveTo(e.a.x, e.a.y);
                ctx.lineTo(e.midX, e.midY);
                ctx.lineTo(e.b.x, e.b.y);
                ctx.strokeStyle = e.bright ? COLORS.lineBright : COLORS.line;
                ctx.lineWidth = e.bright ? 1.5 : 1.0;
                ctx.stroke();
            }

            // Nodos de los circuitos
            for (const n of nodes) {
                const pulse = 0.7 + 0.3 * Math.sin(ts * 0.0015 + n.pulsePhase);

                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 1.8 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.nodeOuter;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = n.bright ? COLORS.nodeInner : COLORS.nodeOuter;
                ctx.fill();

                if (n.bright) {
                    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6 * pulse);
                    g.addColorStop(0, 'rgba(255,255,255,0.35)');
                    g.addColorStop(1, 'rgba(190,150,255,0)');
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * 6 * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = g;
                    ctx.fill();
                }
            }

            // Pulsos de luz viajando por las líneas
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.t += p.speed;

                if (p.t < 0.15) p.alpha = p.t / 0.15;
                else if (p.t > 0.85) p.alpha = (1 - p.t) / 0.15;
                else p.alpha = 1;

                if (p.t >= 1) {
                    pulses.splice(i, 1);
                    spawnPulse();
                    continue;
                }

                const pos = getPulsePos(p.edge, p.t);

                const gO = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 4);
                gO.addColorStop(0, `rgba(230,200,255,${p.alpha * 0.6})`);
                gO.addColorStop(1, 'rgba(230,200,255,0)');
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, p.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = gO;
                ctx.fill();

                const gI = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size);
                gI.addColorStop(0, `rgba(255,255,255,${p.alpha * 0.95})`);
                gI.addColorStop(0.5, `rgba(210,180,255,${p.alpha * 0.7})`);
                gI.addColorStop(1, 'rgba(210,180,255,0)');
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gI;
                ctx.fill();
            }

            rafId = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener('resize', resize);
        rafId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-br from-[#9b7fc7] via-[#7B5EA7] to-[#5a3d8a]">
            {/* Canvas dinámico de circuitos */}
            <canvas ref={canvasRef} className="w-full h-full opacity-75" />

            {/* Partículas de luz flotantes */}
            <div className="sd-particle" style={{ '--sdx': '12%', '--sdy': '18%', '--sdd': '3.2s', '--sds': '0.7' } as any} />
            <div className="sd-particle" style={{ '--sdx': '82%', '--sdy': '14%', '--sdd': '2.1s', '--sds': '0.5' } as any} />
            <div className="sd-particle" style={{ '--sdx': '7%', '--sdy': '55%', '--sdd': '4.0s', '--sds': '0.9' } as any} />
            <div className="sd-particle" style={{ '--sdx': '91%', '--sdy': '48%', '--sdd': '2.8s', '--sds': '0.6' } as any} />
            <div className="sd-particle" style={{ '--sdx': '25%', '--sdy': '80%', '--sdd': '3.5s', '--sds': '0.8' } as any} />
            <div className="sd-particle" style={{ '--sdx': '70%', '--sdy': '78%', '--sdd': '1.9s', '--sds': '0.7' } as any} />
            <div className="sd-particle" style={{ '--sdx': '45%', '--sdy': '10%', '--sdd': '3.1s', '--sds': '0.4' } as any} />
            <div className="sd-particle" style={{ '--sdx': '60%', '--sdy': '90%', '--sdd': '2.6s', '--sds': '0.6' } as any} />
            <div className="sd-particle" style={{ '--sdx': '15%', '--sdy': '35%', '--sdd': '4.2s', '--sds': '0.5' } as any} />
            <div className="sd-particle" style={{ '--sdx': '88%', '--sdy': '65%', '--sdd': '2.3s', '--sds': '0.8' } as any} />
        </div>
    );
};
