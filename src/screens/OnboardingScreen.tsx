import React, { useState } from 'react';
import { ChevronRight, Play, Sparkles, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { soundEngine } from '../audio/SoundEngine';
import { StorageService } from '../services/StorageService';
import { analytics } from '../services/AnalyticsService';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [tappedBlue, setTappedBlue] = useState(false);

  const handleFinish = () => {
    StorageService.setOnboardingCompleted(true);
    analytics.logEvent('onboarding_completed');
    onComplete();
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <div className="fixed inset-0 bg-[#0A0E17] flex flex-col justify-between p-6 text-white select-none z-40">
      {/* Top Bar with Skip */}
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-[#00F0FF]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 active:scale-95"
        >
          SKIP
        </button>
      </div>

      {/* Screen 1: Vision */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop-in">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            <Zap className="w-10 h-10 text-[#00F0FF] fill-[#00F0FF]" />
          </div>
          <h2 className="text-3xl font-black font-display tracking-tight mb-3">
            DON'T TAP IT!
          </h2>
          <p className="text-gray-300 font-medium text-base max-w-xs leading-relaxed">
            A fast game of speed, focus, and deception.
          </p>
        </div>
      )}

      {/* Screen 2: Interactive Tutorial */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop-in">
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
            PRACTICE CHALLENGE
          </span>
          <h2 className="text-3xl font-black font-display tracking-tight text-[#00D2FC] mb-8">
            TAP BLUE
          </h2>

          <div className="flex items-center justify-center gap-6 my-6">
            {/* Red circle */}
            <div
              onClick={() => soundEngine.playWrong()}
              className="w-16 h-16 rounded-full bg-[#FF2E63] border-2 border-white/40 shadow-[0_0_15px_rgba(255,46,99,0.3)] active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
            >
              <span className="text-[10px] font-black">RED</span>
            </div>

            {/* Blue circle (Correct) */}
            <div
              onClick={() => {
                soundEngine.playCorrect();
                setTappedBlue(true);
              }}
              className={`w-20 h-20 rounded-full bg-[#00D2FC] border-4 border-white shadow-[0_0_25px_rgba(0,210,252,0.6)] active:scale-90 transition-all cursor-pointer flex flex-col items-center justify-center ${
                !tappedBlue ? 'animate-pulse ring-4 ring-cyan-400/50' : 'scale-110'
              }`}
            >
              <span className="text-xs font-black text-black">BLUE</span>
              {tappedBlue && <span className="text-[10px] font-bold text-black">✓ Great!</span>}
            </div>

            {/* Green circle */}
            <div
              onClick={() => soundEngine.playWrong()}
              className="w-16 h-16 rounded-full bg-[#00E676] border-2 border-white/40 shadow-[0_0_15px_rgba(0,230,118,0.3)] active:scale-90 transition-transform cursor-pointer flex items-center justify-center"
            >
              <span className="text-[10px] font-black">GRN</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 max-w-xs mt-4">
            Tap the target before the timer expires. Be careful when asked <strong>NOT</strong> to tap!
          </p>
        </div>
      )}

      {/* Screen 3: Ready */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop-in">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-10 h-10 text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-4xl font-black font-display tracking-tight mb-3">
            Ready?
          </h2>
          <p className="text-gray-300 font-medium text-base max-w-xs leading-relaxed">
            One mistake ends your run. How high can you score?
          </p>
        </div>
      )}

      {/* Bottom Button */}
      <div className="w-full max-w-md mx-auto">
        {step < 3 ? (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setStep(step + 1)}
            icon={<ChevronRight className="w-5 h-5" />}
          >
            {step === 2 && tappedBlue ? 'Continue' : 'Next'}
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleFinish}
            icon={<Play className="w-6 h-6 fill-black" />}
          >
            PLAY NOW
          </Button>
        )}
      </div>
    </div>
  );
};
