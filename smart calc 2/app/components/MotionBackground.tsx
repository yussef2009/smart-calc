import { motion } from 'motion/react';

const mathShapes = [
  { type: 'text', content: '+', size: '4rem' },
  { type: 'text', content: '−', size: '5rem' },
  { type: 'text', content: '×', size: '4rem' },
  { type: 'text', content: '÷', size: '4.5rem' },
  { type: 'text', content: '=', size: '5rem' },
  { type: 'text', content: '∫', size: '5.5rem' },
  { type: 'text', content: '∑', size: '4.5rem' },
  { type: 'text', content: 'π', size: '4rem' },
  { type: 'text', content: '√', size: '4.5rem' },
  { type: 'text', content: '∞', size: '6rem' },
  { type: 'text', content: 'θ', size: '4rem' },
  { type: 'text', content: 'λ', size: '4.5rem' },
  { type: 'text', content: 'Δ', size: '3.5rem' },
  { type: 'text', content: '∂', size: '4rem' },
  { type: 'text', content: 'dx', size: '3.5rem' },
  { type: 'text', content: '≠', size: '4rem' },
  { type: 'text', content: '≈', size: '4.5rem' },
  { type: 'text', content: 'f(x)', size: '3.5rem' },
  { type: 'text', content: '!', size: '4rem' },
  { type: 'text', content: '∮', size: '5rem' },
  { type: 'text', content: 'α', size: '3.5rem' },
  { type: 'text', content: 'β', size: '3.5rem' },
  { type: 'text', content: 'γ', size: '3.5rem' },
  { type: 'text', content: 'φ', size: '4.5rem' },
  { type: 'text', content: '±', size: '4rem' },
  { type: 'text', content: '≤', size: '4rem' },
  { type: 'text', content: '≥', size: '4rem' },
  { type: 'text', content: '∝', size: '4.5rem' },
  { type: 'text', content: '∩', size: '4rem' },
  { type: 'text', content: '∪', size: '4rem' },
  { type: 'text', content: '∈', size: '3.5rem' },
  { type: 'text', content: '∉', size: '3.5rem' },
  { type: 'text', content: '∇', size: '4.5rem' },
  { type: 'text', content: '∃', size: '4rem' },
  { type: 'text', content: '∀', size: '4rem' },
  { type: 'text', content: '∏', size: '4.5rem' },
  { type: 'text', content: '∯', size: '5rem' },
  { type: 'text', content: 'ω', size: '3.5rem' },
  { type: 'text', content: 'Ω', size: '4rem' },
  { type: 'text', content: 'μ', size: '3.5rem' },
  { type: 'text', content: 'ρ', size: '3.5rem' },
  { type: 'text', content: 'σ', size: '3.5rem' },
  { type: 'text', content: 'τ', size: '3.5rem' },
  { type: 'shape', content: 'circle', size: 'w-24 h-24 rounded-full border-4' },
  { type: 'shape', content: 'square', size: 'w-20 h-20 border-4' },
  { type: 'shape', content: 'triangle', size: 'w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[69px] border-b-current' },
  { type: 'shape', content: 'circle', size: 'w-16 h-16 rounded-full border-2' },
  { type: 'shape', content: 'square', size: 'w-12 h-12 border-2' },
  { type: 'shape', content: 'circle', size: 'w-32 h-32 rounded-full border-[6px]' },
  { type: 'shape', content: 'square', size: 'w-28 h-28 border-[6px]' },
  { type: 'shape', content: 'triangle', size: 'w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[43px] border-b-current' },
];

export const MotionBackground = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`fixed inset-0 z-0 overflow-hidden transition-colors duration-700 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-white'}`}>
      {/* Background Blobs */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${isDarkMode ? 'opacity-100' : 'opacity-100'}`}>
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full filter blur-[120px] transition-colors duration-700 ${isDarkMode ? 'mix-blend-screen opacity-30 bg-blue-900' : 'mix-blend-multiply opacity-25 bg-blue-300'}`}
        />
        <motion.div
          animate={{
            x: [0, -120, 100, 0],
            y: [0, 120, -100, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full filter blur-[120px] transition-colors duration-700 ${isDarkMode ? 'mix-blend-screen opacity-30 bg-purple-900' : 'mix-blend-multiply opacity-25 bg-indigo-300'}`}
        />
        <motion.div
          animate={{
            x: [0, 80, -80, 0],
            y: [0, 80, -80, 0],
            scale: [1, 1.1, 0.8, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full filter blur-[140px] transition-colors duration-700 ${isDarkMode ? 'mix-blend-screen opacity-20 bg-emerald-900' : 'mix-blend-multiply opacity-20 bg-sky-300'}`}
        />
      </div>

      {/* Floating 3D Math Shapes */}
      <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1200px' }}>
        {mathShapes.map((item, index) => {
          // Wider distribution across the screen
          const initialX = (index * 37) % 90 + 5; 
          const initialY = (index * 29) % 90 + 5;
          const randomDuration = (12 + ((index * 5) % 15)) * 0.8; // Faster by 20%
          const randomDelay = (index * 1.5) % 8;
          
          // Randomize 3D motion paths
          const xPath = index % 2 === 0 ? [0, 60, -60, 0] : [0, -70, 70, 0];
          const yPath = index % 3 === 0 ? [0, -80, 80, 0] : [0, 90, -90, 0];
          const zPath = index % 4 === 0 ? [0, 200, -100, 0] : [0, -150, 150, 0];

          // Dynamic colors over time
          const getPalette = () => {
            const base = isDarkMode 
              ? ['#93c5fd', '#c4b5fd', '#6ee7b7', '#f9a8d4'] // Vibrant pastels for dark
              : ['#3b82f6', '#8b5cf6', '#10b981', '#ec4899']; // Deeper colors for light
            const o = index % base.length;
            return [base[o], base[(o+1)%base.length], base[(o+2)%base.length], base[(o+3)%base.length], base[o]];
          };

          return (
            <motion.div
              key={index}
              className="absolute font-mono font-bold flex items-center justify-center transition-colors duration-700"
              style={{
                left: `${initialX}%`,
                top: `${initialY}%`,
                transformStyle: 'preserve-3d',
              }}
              animate={{
                y: yPath,
                x: xPath,
                z: zPath,
                rotateX: index % 2 === 0 ? [0, 360] : [360, 0],
                rotateY: index % 3 === 0 ? [0, 360] : [360, 0],
                rotateZ: [0, 180, 360],
                opacity: [0.4, 0.8, 0.4], // Appear at 80% max
                color: getPalette(),
              }}
              transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {item.type === 'text' ? (
                <span style={{ fontSize: item.size }} className="leading-none drop-shadow-sm">{item.content}</span>
              ) : (
                <div 
                  className={`${item.size} ${item.content !== 'triangle' ? 'border-current' : ''} drop-shadow-sm`} 
                />
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Light noise texture overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isDarkMode ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};
