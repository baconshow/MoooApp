
"use client";

interface AmbientBackgroundProps {
  variant: 'vibe' | 'sono' | 'ciclo' | 'dor' | 'grana' | 'rango' | 'home';
}

export function AmbientBackground({ variant }: AmbientBackgroundProps) {
  const configs = {
    vibe: {
      blob1: 'bg-gradient-to-br from-pink-500/15 to-red-500/10',
      blob2: 'bg-gradient-to-tl from-rose-400/10 to-pink-500/8',
      pos1: 'top-[-10%] right-[-15%]',
      pos2: 'bottom-[-10%] left-[-15%]',
    },
    sono: {
      blob1: 'bg-gradient-to-br from-blue-600/15 to-indigo-500/10',
      blob2: 'bg-gradient-to-tl from-amber-500/12 to-yellow-600/8',
      pos1: 'top-[-15%] left-[-10%]',
      pos2: 'bottom-[-10%] right-[-15%]',
    },
    ciclo: {
      blob1: 'bg-gradient-to-br from-pink-500/15 to-rose-400/10',
      blob2: 'bg-gradient-to-tl from-purple-500/10 to-violet-400/8',
      pos1: 'top-[-10%] right-[-10%]',
      pos2: 'bottom-[-15%] left-[-10%]',
    },
    dor: {
      blob1: 'bg-gradient-to-br from-green-500/12 to-emerald-400/8',
      blob2: 'bg-gradient-to-tl from-teal-500/8 to-green-400/6',
      pos1: 'top-[-10%] left-[-15%]',
      pos2: 'bottom-[-10%] right-[-10%]',
    },
    grana: {
      blob1: 'bg-gradient-to-br from-emerald-500/15 to-green-400/10',
      blob2: 'bg-gradient-to-tl from-white/8 to-slate-200/5',
      pos1: 'top-[-15%] left-[-10%]',
      pos2: 'bottom-[-10%] right-[-15%]',
    },
    rango: {
      blob1: 'bg-gradient-to-br from-pink-500/12 to-rose-400/8',
      blob2: 'bg-gradient-to-tl from-violet-500/10 to-purple-400/8',
      pos1: 'top-[-10%] right-[-15%]',
      pos2: 'bottom-[-15%] left-[-10%]',
    },
    home: {
      blob1: 'bg-gradient-to-br from-purple-500/12 to-violet-400/8',
      blob2: 'bg-gradient-to-tl from-pink-400/8 to-rose-300/6',
      pos1: 'top-[-10%] right-[-10%]',
      pos2: 'bottom-[-10%] left-[-15%]',
    },
  };

  const config = configs[variant];

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Blob 1 */}
      <div
        className={`
          absolute w-[60vw] h-[60vw] max-w-[500px] max-h-[500px]
          rounded-full blur-[100px]
          ${config.blob1} ${config.pos1}
          animate-blob-float-1
        `}
      />
      {/* Blob 2 */}
      <div
        className={`
          absolute w-[50vw] h-[50vw] max-w-[400px] max-h-[400px]
          rounded-full blur-[80px]
          ${config.blob2} ${config.pos2}
          animate-blob-float-2
        `}
      />
    </div>
  );
}
