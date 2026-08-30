import React, { useEffect } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      onClick={() => {
        soundEngine.playButtonTap();
        onFinish();
      }}
      className="fixed inset-0 bg-[#0A0E17] flex flex-col items-center justify-center p-6 select-none cursor-pointer z-50 overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl -top-10 -left-10 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-rose-500/15 blur-3xl -bottom-10 -right-10 pointer-events-none" />

      {/* Main Logo & Icon */}
      <div className="relative flex items-center justify-center mb-8 animate-pop-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 to-fuchsia-500 p-0.5 shadow-[0_0_35px_rgba(0,240,255,0.4)]">
          <div className="w-full h-full bg-[#0A0E17] rounded-[22px] flex items-center justify-center">
            <Zap className="w-12 h-12 text-[#00F0FF] fill-[#00F0FF] animate-pulse" />
          </div>
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-yellow-400 fill-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2E63] text-center mb-3">
        DON'T TAP IT!
      </h1>

      {/* Tagline */}
      <p className="text-gray-400 font-medium tracking-wide text-base text-center max-w-xs">
        Think fast. Tap smart.
      </p>

      {/* Tap hint */}
      <div className="absolute bottom-10 text-xs font-bold tracking-widest text-gray-500 uppercase animate-pulse">
        Tap anywhere to start
      </div>
    </div>
  );
};
