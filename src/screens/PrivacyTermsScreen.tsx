import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { HeaderBar } from '../components/common/HeaderBar';

interface PrivacyTermsScreenProps {
  onBack: () => void;
}

export const PrivacyTermsScreen: React.FC<PrivacyTermsScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between text-white select-none relative">
      <HeaderBar title="Privacy & Terms" onBack={onBack} showCoins={false} />

      <div className="flex-1 w-full max-w-sm mx-auto p-6 flex flex-col gap-4 overflow-y-auto text-xs text-gray-300 leading-relaxed">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
          <ShieldCheck className="w-5 h-5" />
          <span>Our Privacy Commitment</span>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <h4 className="font-bold text-white text-sm">1. Zero Dark Patterns</h4>
          <p>
            DON'T TAP IT! is designed to be purely fun, challenging, and fair. We never trick users into accidental purchases or force mandatory account registrations.
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <h4 className="font-bold text-white text-sm">2. Data Collection & Guest Play</h4>
          <p>
            You can enjoy full offline and online gameplay as a Guest without providing any personal information. If you create an account, we securely store only your name and email to sync game records.
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <h4 className="font-bold text-white text-sm">3. Advertisements & In-App Purchases</h4>
          <p>
            Rewarded ads are 100% voluntary (Second Chance continuation). Interstitial ads are strictly frequency-capped and will never interrupt active gameplay. All purchases are securely processed through the Google Play Store or Apple App Store.
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <h4 className="font-bold text-white text-sm">4. Account & Data Deletion</h4>
          <p>
            You have complete control over your data. At any time, tapping "Reset All Data / Delete Account" in the Profile or Settings screen permanently purges all stored credentials, statistics, and high scores.
          </p>
        </div>

        <div className="bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <h4 className="font-bold text-white text-sm">5. Terms of Service</h4>
          <p>
            DON'T TAP IT! is provided as-is for personal entertainment. Reverse engineering, malicious leaderboard tampering, or automated bot play are prohibited.
          </p>
        </div>

        <div className="text-center text-gray-500 py-3">
          Contact: privacy@donttapit.game • Updated August 2026
        </div>
      </div>
    </div>
  );
};
