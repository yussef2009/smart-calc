import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
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
    
    const symbols = ['π', 'e', 'Σ', '∫', '∞', '√', 'α', 'β', 'θ', 'λ', '∆', '∇', 'δ', 'ψ', 'ζ', 'η', 'φ', 'ω'];
    const colors = [
      'rgba(6, 182, 212, 0.2)', // Neon Cyan
      'rgba(168, 85, 247, 0.15)', // Subtle Purple
      'rgba(34, 197, 94, 0.15)',   // Electric Green
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 18000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(true));
      }
    };

    const createParticle = (isInitial = false): Particle => {
      const isWireframe = Math.random() > 0.85;
      const type = isWireframe ? 'wireframe' : 'symbol';
      const wireframeTypes: ('cube' | 'wave' | 'sphere')[] = ['cube', 'wave', 'sphere'];
      const wireType = wireframeTypes[Math.floor(Math.random() * wireframeTypes.length)];
      
      const size = type === 'symbol' ? 14 + Math.random() * 20 : 40 + Math.random() * 50;
      
      let x, y;
      if (isInitial) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } else {
        // Drift from bottom-left to top-right
        if (Math.random() > 0.5) {
          x = -size * 2;
          y = Math.random() * canvas.height;
        } else {
          x = Math.random() * canvas.width;
          y = canvas.height + size * 2;
        }
      }

      return {
        x,
        y,
        size,
        text: symbols[Math.floor(Math.random() * symbols.length)],
        type,
        wireframeType: wireType,
        opacity: 0,
        speedX: 0.3 + Math.random() * 0.4,
        speedY: -0.3 - Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.008
      };
    };

    const drawCube = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      const s = size / 2;
      ctx.beginPath();
      ctx.rect(-s/2, -s/2, s, s);
      ctx.moveTo(-s/2, -s/2);
      ctx.lineTo(-s/4, -s);
      ctx.lineTo(s*0.75, -s);
      ctx.lineTo(s/2, -s/2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s/2, -s/2);
      ctx.lineTo(s*0.75, -s);
      ctx.lineTo(s*0.75, -s/4);
      ctx.lineTo(s/2, s/2);
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
      // Ellipses for wireframe look
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.3, r, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const drawWave = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = -size/2; i < size/2; i++) {
        const sineY = Math.sin(i * 0.15) * (size/6);
        if (i === -size/2) ctx.moveTo(i, sineY);
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
        maxR: Math.max(canvas.width, canvas.height) * 0.8,
        opacity: 0.5
      });
      // Temporarily speed up particles
      particles.forEach(p => {
        p.speedX *= 2.5;
        p.speedY *= 2.5;
        setTimeout(() => {
          p.speedX /= 2.5;
          p.speedY /= 2.5;
        }, 600);
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Ripples
      ripples.forEach((rip, i) => {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${rip.opacity * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        rip.r += 15;
        rip.opacity -= 0.01;
        if (rip.opacity <= 0) ripples.splice(i, 1);
      });

      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        if (p.opacity < 1) p.opacity += 0.005;
        
        if (p.x > canvas.width + p.size || p.y < -p.size) {
          particles[index] = createParticle(false);
        }

        ctx.globalAlpha = Math.min(p.opacity, 1) * 0.15;
        ctx.strokeStyle = colors[index % colors.length];
        ctx.fillStyle = colors[index % colors.length];
        ctx.lineWidth = 1;

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
      style={{ background: 'linear-gradient(135deg, #020205 0%, #070b14 100%)' }}
    />
  );
};
