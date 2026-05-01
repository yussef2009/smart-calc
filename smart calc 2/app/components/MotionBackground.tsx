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
  { type: 'shape', content: 'circle', size: 'w-24 h-24 rounded-full border-4' },
  { type: 'shape', content: 'square', size: 'w-20 h-20 border-4' },
  { type: 'shape', content: 'triangle', size: 'w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[69px] border-b-current' },
];

export const MotionBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-slate-100 dark:bg-[#0B0F19] transition-colors duration-700">
      {/* Background Blobs */}
      <div className="absolute inset-0 opacity-50 dark:opacity-100">
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
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50 dark:opacity-30 bg-blue-400 dark:bg-blue-900"
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
          className="absolute top-[20%] -right-[10%] w-[45vw] h-[45vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50 dark:opacity-30 bg-purple-400 dark:bg-purple-900"
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
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[140px] opacity-40 dark:opacity-20 bg-emerald-400 dark:bg-emerald-900"
        />
      </div>

      {/* Floating Math Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {mathShapes.map((item, index) => {
          // Wider distribution across the screen
          const initialX = (index * 37) % 90 + 5; 
          const initialY = (index * 29) % 90 + 5;
          const randomDuration = 12 + ((index * 5) % 15); // Faster, more visible motion
          const randomDelay = (index * 1.5) % 8;
          
          // Randomize motion paths
          const xPath = index % 2 === 0 ? [0, 60, -60, 0] : [0, -70, 70, 0];
          const yPath = index % 3 === 0 ? [0, -80, 80, 0] : [0, 90, -90, 0];

          return (
            <motion.div
              key={index}
              className="absolute text-slate-800 dark:text-blue-300 font-mono font-bold flex items-center justify-center"
              style={{
                left: `${initialX}%`,
                top: `${initialY}%`,
              }}
              animate={{
                y: yPath,
                x: xPath,
                rotate: [0, 180, 360],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {item.type === 'text' ? (
                <span style={{ fontSize: item.size }} className="leading-none">{item.content}</span>
              ) : (
                <div 
                  className={`${item.size} ${item.content === 'triangle' ? 'text-slate-800 dark:text-blue-300' : 'border-slate-800 dark:border-blue-300'} opacity-60`} 
                />
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Light noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
    </div>
  );
};
