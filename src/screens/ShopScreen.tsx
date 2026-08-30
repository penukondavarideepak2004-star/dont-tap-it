import React, { useState } from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { HeaderBar } from '../components/common/HeaderBar';
import { AppSettings, ThemeId } from '../models/types';
import { THEMES } from '../utils/constants';
import { PurchaseService } from '../services/PurchaseService';
import { StorageService } from '../services/StorageService';
import { soundEngine } from '../audio/SoundEngine';

interface ShopScreenProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onBack: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeId[]>(() =>
    StorageService.loadUnlockedThemes()
  );
  const [hasNoAds, setHasNoAds] = useState<boolean>(() => StorageService.hasRemovedAds());
  const [msg, setMsg] = useState<string | null>(null);
  const [isBuyingAds, setIsBuyingAds] = useState(false);

  const handleBuyRemoveAds = async () => {
    setIsBuyingAds(true);
    const res = await PurchaseService.buyRemoveAds();
    setIsBuyingAds(false);
    if (res.success) {
      setHasNoAds(true);
      soundEngine.playPurchaseSuccess();
      setMsg(res.message);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleUnlockTheme = (themeId: ThemeId) => {
    const res = PurchaseService.unlockTheme(themeId);
    if (res.success) {
      setUnlockedThemes(StorageService.loadUnlockedThemes());
      soundEngine.playPurchaseSuccess();
      const updated = { ...settings, activeThemeId: themeId };
      onUpdateSettings(updated);
      StorageService.saveSettings(updated);
      setMsg(res.message);
    } else {
      soundEngine.playWrong();
      setMsg(res.message);
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEquipTheme = (themeId: ThemeId) => {
    const updated = { ...settings, activeThemeId: themeId };
    onUpdateSettings(updated);
    StorageService.saveSettings(updated);
    soundEngine.playButtonTap();
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Game Shop" onBack={onBack} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col gap-5 overflow-y-auto">
        {msg && (
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold text-center animate-pop-in">
            {msg}
          </div>
        )}

        {/* REMOVE ADS CARD */}
        <div className="bg-gradient-to-br from-[#131A29] via-[#1B2438] to-[#131A29] border border-cyan-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
                ONE-TIME UPGRADE
              </span>
              <h3 className="text-xl font-black font-display text-white mt-0.5">
                REMOVE ADS
              </h3>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <p className="text-xs text-gray-300 mb-4 leading-relaxed">
            Permanently remove all interstitial ads. Enjoy uninterrupted rapid gameplay forever!
          </p>

          {hasNoAds ? (
            <div className="w-full py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs text-center flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>ACTIVE • ADS REMOVED</span>
            </div>
          ) : (
            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={handleBuyRemoveAds}
              disabled={isBuyingAds}
            >
              {isBuyingAds ? 'Processing...' : 'Unlock ($1.99)'}
            </Button>
          )}
        </div>

        {/* COSMETIC THEMES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
              VISUAL THEMES
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Earn coins by scoring points!</span>
          </div>

          <div className="flex flex-col gap-3">
            {Object.values(THEMES).map((theme) => {
              const isUnlocked = unlockedThemes.includes(theme.id);
              const isActive = settings.activeThemeId === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`bg-[#131A29] border rounded-3xl p-4 transition-all ${
                    isActive ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-1.5">
                        {theme.previewColors.map((hex, i) => (
                          <div
                            key={i}
                            style={{ backgroundColor: hex }}
                            className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                          />
                        ))}
                      </div>
                      <h4 className="font-bold text-sm text-white">{theme.name}</h4>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-black text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 uppercase">
                        EQUIPPED
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 mb-3">{theme.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {isUnlocked ? (
                      <Button
                        variant={isActive ? 'glass' : 'secondary'}
                        size="sm"
                        disabled={isActive}
                        onClick={() => handleEquipTheme(theme.id)}
                      >
                        {isActive ? 'Active' : 'Equip'}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUnlockTheme(theme.id)}
                        icon={<Sparkles className="w-3.5 h-3.5 fill-black" />}
                      >
                        Unlock ({theme.priceCoins} Coins)
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
