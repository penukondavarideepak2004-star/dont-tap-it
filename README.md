# DON'T TAP IT! ⚡

> **Think fast. Tap smart. One mistake ends your run!**

A production-ready, ultra-fast casual reaction and puzzle mobile game built for iOS, Android, and mobile web. Engineered for seamless one-handed portrait gameplay, 60 FPS performance, offline-first reliability, and clean modular code architecture.

---

## 📱 Features & Highlights

* **Procedural Challenge Engine**: 8 distinct challenge types with strict uniqueness validation (`valid_targets === 1`) and rolling anti-repetition filter:
  1. `COLOR`: "TAP BLUE", "TAP GREEN", etc.
  2. `SIZE`: "TAP THE BIGGEST", "TAP THE SMALLEST"
  3. `ODD_ONE`: "TAP THE ODD SHAPE", "TAP THE ODD COLOR"
  4. `MOVEMENT`: "TAP THE MOVING ONE", "TAP THE PULSING ONE", "TAP THE SPINNING ONE"
  5. `POSITION`: "TAP THE TOP ONE", "TAP THE LEFTMOST ONE", etc.
  6. `COUNT`: "TAP THE UNIQUE COLOR", "TAP THE UNIQUE SHAPE"
  7. `MEMORY`: "TAP THE ONE THAT APPEARED FIRST / LAST"
  8. `NEGATION`: "DON'T TAP RED" (tap safe one), "DON'T TAP ANYTHING!" (wait out the timer!)
* **Dynamic Difficulty Curve**: Smooth progression from Level 1 (3 items, 3.2s) to Level 5+ (7 items, 1.1s, misdirection).
* **Speed Scoring & Combo System**: Up to +100 speed bonus per round; combo multipliers up to 2.0x.
* **Global Daily Challenge**: Deterministic daily sequence seeded by `YYYYMMDD` with streak tracking.
* **WebAudio Synthesizer**: Zero-latency procedural sound FX and synth ambiance with zero audio asset loading lag.
* **Full Authentication & Guest Mode**: Guest mode by default with instant local-to-cloud profile migration, email auth, and social sign-in integration points.
* **Ethical Monetization**: Optional Rewarded Ad "Second Chance" (1 per run), frequency-capped interstitials, and "Remove Ads" In-App Purchase.
* **Visual Themes**: Arcade Classic, Cyber Neon, Minimal OLED Dark, Deep Space, and Sweet Candy.
* **Accessibility**: Color-blind text labels, high contrast, comfortable 48dp+ touch targets, and haptic feedback toggles.

---

## 🏗️ Architecture & Project Structure

```
scratch/dont-tap-it/
├── capacitor.config.ts         # Cross-platform iOS & Android Capacitor bridge
├── store-assets/               # App Store & Google Play metadata, icons, copy
│   ├── app-icon.svg            # Master 512x512 vector icon
│   ├── google-play-listing.md  # Google Play descriptions, category & data safety
│   └── apple-app-store-listing.md # iOS App Store keywords, metadata & privacy
├── src/
│   ├── audio/
│   │   ├── SoundEngine.ts      # WebAudio zero-latency procedural synthesizer
│   │   └── HapticEngine.ts     # Mobile vibration & haptics controller
│   ├── core/
│   │   └── GameManager.ts      # Master game state machine and event coordinator
│   ├── engine/
│   │   ├── ChallengeGenerator.ts  # Procedural challenge generation
│   │   ├── ChallengeValidator.ts  # Strict uniqueness & validity validator
│   │   ├── DifficultyManager.ts   # Round-based difficulty curve
│   │   ├── AntiRepetitionBuffer.ts # Rolling history buffer
│   │   └── ScoreManager.ts        # Speed bonus & combo multiplier formulas
│   ├── models/
│   │   └── types.ts            # Master TypeScript types & data schemas
│   ├── services/
│   │   ├── AuthService.ts      # Auth, password hashing, guest migration, account deletion
│   │   ├── StorageService.ts   # Crash-safe persistence with in-memory fallback
│   │   ├── AdsService.ts       # Rewarded second chances & frequency-capped interstitials
│   │   ├── PurchaseService.ts  # IAP Remove Ads & Theme unlocks
│   │   ├── AnalyticsService.ts # Telemetry tracking (20+ events)
│   │   └── NotificationService.ts # Push / local daily reminder scheduling
│   ├── hooks/
│   │   └── useGameEngine.ts    # 60 FPS requestAnimationFrame game loop hook
│   ├── components/
│   │   ├── common/             # Button, HeaderBar, Modals
│   │   └── game/               # GameObjectView, TimerBar, ComboBadge
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── AuthScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── GameOverScreen.tsx
│   │   ├── DailyChallengeScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── StatisticsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── ShopScreen.tsx
│   │   ├── HowToPlayScreen.tsx
│   │   └── PrivacyTermsScreen.tsx
│   ├── utils/
│   │   ├── constants.ts        # Color palettes, theme styles, initial states
│   │   ├── random.ts           # Mulberry32 PRNG & non-overlapping layout algorithm
│   │   └── confetti.ts         # High-score celebratory visual effects
│   ├── App.tsx                 # Master view routing container
│   ├── main.tsx                # Entry point
│   └── index.css               # Mobile viewport & Tailwind rules
└── tests/
    ├── challenge.test.ts       # Generator, difficulty & scoring tests
    ├── services.test.ts        # Auth, storage & IAP tests
    └── game_engine.test.ts     # Loop, daily seed & second chance continuation tests
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ or 20+
* npm or pnpm / yarn

### Installation
```bash
cd scratch/dont-tap-it
npm install
```

### Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser or mobile device on the same local network.

### Run Automated Unit Tests
```bash
npm test
```

### Build Production Web Assets
```bash
npm run build
```

---

## 📱 Mobile Native Build & Release (Capacitor)

### 1. Android (Google Play Release)
```bash
# Build web bundle
npm run build

# Add Android native platform (first time)
npx cap add android

# Sync assets and plugins
npx cap sync android

# Open in Android Studio
npx cap open android
```
Inside Android Studio:
1. Go to **Build > Generate Signed Bundle / APK**.
2. Select **Android App Bundle (.aab)**.
3. Sign with your production keystore and upload to the Google Play Console.

### 2. iOS (Apple App Store Release)
```bash
# Build web bundle
npm run build

# Add iOS native platform (first time)
npx cap add ios

# Sync assets and plugins
npx cap sync ios

# Open in Xcode
npx cap open ios
```
Inside Xcode:
1. Select your Apple Developer Signing Team under **Signing & Capabilities**.
2. Select **Any iOS Device (arm64)** as build target.
3. Choose **Product > Archive** to upload to App Store Connect / TestFlight.

---

## ⚙️ Environment Variables & External Service Configuration

Create a `.env.production` file for production deployment:

```env
# Analytics (Google Analytics 4 / Firebase)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Sign-In Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# AdMob Ad Unit IDs (Optional for native packaging)
VITE_ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-3940256099942544/5224354917
VITE_ADMOB_INTERSTITIAL_AD_UNIT_ID=ca-app-pub-3940256099942544/1033173712
```

---

## 🧪 QA & Verification Checklist

- [x] **Procedural generation**: 100 consecutive challenges tested with strictly `valid_targets === 1`.
- [x] **Cognitive negations**: "DON'T TAP RED" (safe object tap) & "DON'T TAP ANYTHING" (timer wait) verified.
- [x] **Scoring accuracy**: Base 100 + Speed Bonus (0-100) with combo multipliers (1.25x, 1.5x, 2.0x).
- [x] **Offline storage**: Crash-safe handling for corrupted JSON and in-memory test fallback.
- [x] **Monetization**: Remove Ads IAP and Second Chance Rewarded Ad continuations tested.
- [x] **Audio & Haptics**: WebAudio synthesizer verified with zero latency.
- [x] **Accessibility**: Color-blind shape tags and high contrast modes verified.

---

## 📄 License
MIT License. © 2026 DON'T TAP IT! Team. All rights reserved.
