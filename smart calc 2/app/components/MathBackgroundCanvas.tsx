import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number; // For parallax and blur
  size: number;
  text: string;
  type: 'symbol' | 'wireframe';
  wireframeType?: 'cube' | 'wave' | 'sphere';
  opacity: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  opacity: number;
}

export const MathBackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let ripples: Ripple[] = [];
    
    const symbols = ['π', 'e', 'Σ', '∫', '∞', '√', 'α', 'β', 'θ', 'λ', '∆', '∇', 'δ', 'ψ', 'ζ', 'η', 'φ', 'ω', 'Ξ', 'Ψ', 'Ω'];
    const colors = [
      'rgba(6, 182, 212, 0.25)', // Neon Cyan
      'rgba(168, 85, 247, 0.2)', // Subtle Purple
      'rgba(34, 197, 94, 0.2)',   // Electric Green
      'rgba(236, 72, 153, 0.15)',  // Pink
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(true));
      }
    };

    const createParticle = (isInitial = false): Particle => {
      const isWireframe = Math.random() > 0.88;
      const type = isWireframe ? 'wireframe' : 'symbol';
      const wireframeTypes: ('cube' | 'wave' | 'sphere')[] = ['cube', 'wave', 'sphere'];
      const wireType = wireframeTypes[Math.floor(Math.random() * wireframeTypes.length)];
      
      const z = Math.random() * 2; // Depth layer
      const size = (type === 'symbol' ? 12 + Math.random() * 18 : 30 + Math.random() * 40) * (z + 0.5);
      
      let x, y;
      if (isInitial) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } else {
        // Drift from bottom-left to top-right
        if (Math.random() > 0.5) {
          x = -size * 3;
          y = Math.random() * (canvas.height + size * 2);
        } else {
          x = Math.random() * (canvas.width + size * 2);
          y = canvas.height + size * 3;
        }
      }

      return {
        x, y, z, size,
        text: symbols[Math.floor(Math.random() * symbols.length)],
        type,
        wireframeType: wireType,
        opacity: 0,
        speedX: (0.15 + Math.random() * 0.25) * (z + 1),
        speedY: (-0.15 - Math.random() * 0.25) * (z + 1),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005 * (z + 1)
      };
    };

    const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      const s = size / 2;
      ctx.beginPath();
      ctx.rect(-s / 2, -s / 2, s, s);
      ctx.moveTo(-s / 2, -s / 2);
      ctx.lineTo(-s / 4, -s);
      ctx.lineTo(s * 0.75, -s);
      ctx.lineTo(s / 2, -s / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s / 2, -s / 2);
      ctx.lineTo(s * 0.75, -s);
      ctx.lineTo(s * 0.75, -s / 4);
      ctx.lineTo(s / 2, s / 2);
      ctx.stroke();
      ctx.restore();
    };

    const drawSphere = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      const r = size / 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.35, r, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const drawWave = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = -size / 2; i < size / 2; i++) {
        const sineY = Math.sin(i * 0.15) * (size / 6);
        if (i === -size / 2) ctx.moveTo(i, sineY);
        else ctx.lineTo(i, sineY);
      }
      ctx.stroke();
      ctx.restore();
    };

    const handlePulse = () => {
      ripples.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: 0,
        maxR: Math.max(canvas.width, canvas.height) * 1.2,
        opacity: 0.6
      });
      particles.forEach(p => {
        p.speedX *= 3;
        p.speedY *= 3;
        setTimeout(() => {
          p.speedX /= 3;
          p.speedY /= 3;
        }, 800);
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Connections (Neural Layer)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.1 * Math.min(p1.opacity, p2.opacity);
            ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Ripples
      ripples.forEach((rip, i) => {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${rip.opacity * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        rip.r += 18;
        rip.opacity -= 0.008;
        if (rip.opacity <= 0) ripples.splice(i, 1);
      });

      // Draw Particles with Parallax & Blur
      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        if (p.opacity < 1) p.opacity += 0.008;
        
        if (p.x > canvas.width + p.size * 2 || p.y < -p.size * 2) {
          particles[index] = createParticle(false);
        }

        // Depth of field effect
        const blurAmount = Math.max(0, (1 - p.z) * 2);
        ctx.filter = blurAmount > 0.5 ? `blur(${blurAmount}px)` : 'none';
        
        ctx.globalAlpha = Math.min(p.opacity, 1) * 0.18;
        ctx.strokeStyle = colors[index % colors.length];
        ctx.fillStyle = colors[index % colors.length];
        ctx.lineWidth = 1 + p.z;

        if (p.type === 'symbol') {
          ctx.font = `bold ${p.size}px "Outfit", sans-serif`;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillText(p.text, 0, 0);
          ctx.restore();
        } else {
          if (p.wireframeType === 'cube') drawCube(ctx, p.x, p.y, p.size, p.rotation);
          else if (p.wireframeType === 'sphere') drawSphere(ctx, p.x, p.y, p.size, p.rotation);
          else drawWave(ctx, p.x, p.y, p.size, p.rotation);
        }
      });
      ctx.filter = 'none';

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('math-calc-pulse', handlePulse);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('math-calc-pulse', handlePulse);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
      style={{ background: 'linear-gradient(135deg, #020205 0%, #080c18 100%)' }}
    />
  );
};
