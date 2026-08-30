import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Lock, Mail, Phone, Shield, User, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '../components/common/Button';
import { ScreenName, UserProfile } from '../models/types';
import { AuthService } from '../services/AuthService';
import { soundEngine } from '../audio/SoundEngine';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type AuthMode = 'register' | 'login' | 'otp';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
  onNavigate,
}) => {
  const [mode, setMode] = useState<AuthMode>('register');
  
  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false); // Unchecked by default
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [devDemoOtp, setDevDemoOtp] = useState<string | null>(null);

  // UI Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 30s Countdown Timer for Resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'otp' && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendCooldown]);

  const fullPhoneNumber = `${selectedCountry.code}${phoneNumber.trim()}`;

  // Field validation checks
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = phoneNumber.trim().replace(/\D/g, '').length >= 7;
  const isNameValid = firstName.trim().length >= 2;
  const numAge = Number(age);
  const isAgeValid = !Number.isNaN(numAge) && numAge >= 13 && numAge <= 120;

  const isRegisterFormValid = isNameValid && isPhoneValid && isEmailValid && isAgeValid && agreedToTerms;
  const isLoginFormValid = isPhoneValid;

  // 1. Submit Registration Form -> Send OTP
  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisterFormValid || isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText('Sending verification code...');
    soundEngine.playButtonTap();

    const res = await AuthService.requestOtp(fullPhoneNumber);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send OTP. Please check your phone number.');
      return;
    }

    if (res.devOtp) {
      setDevDemoOtp(res.devOtp);
    }

    setResendCooldown(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setMode('otp');

    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // 2. Submit Phone Login -> Send OTP
  const handleStartLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoginFormValid || isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText('Sending verification code...');
    soundEngine.playButtonTap();

    const res = await AuthService.requestOtp(fullPhoneNumber);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send OTP.');
      return;
    }

    if (res.devOtp) {
      setDevDemoOtp(res.devOtp);
    }

    setResendCooldown(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    setMode('otp');

    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // 3. Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText('Resending code...');

    const res = await AuthService.requestOtp(fullPhoneNumber);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to resend code.');
      return;
    }

    if (res.devOtp) {
      setDevDemoOtp(res.devOtp);
    }

    setResendCooldown(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    otpInputRefs.current[0]?.focus();
  };

  // 4. Handle Digit Change in 6-Digit OTP Box
  const handleOtpChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    if (!numeric && val !== '') return;

    const newDigits = [...otpDigits];

    if (numeric.length > 1) {
      // Handle paste
      const pasted = numeric.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = numeric;
    setOtpDigits(newDigits);

    if (numeric && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 5. Verify OTP & Finalize
  const handleVerifyOtp = async () => {
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 6 || isLoading) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingText('Verifying code...');
    soundEngine.playButtonTap();

    const verifyRes = await AuthService.verifyOtp(fullPhoneNumber, enteredCode);

    if (!verifyRes.success) {
      setIsLoading(false);
      setErrorMsg(verifyRes.error || 'Incorrect code. Please try again.');
      return;
    }

    // Existing user returning:
    if (verifyRes.isExistingUser && verifyRes.user) {
      triggerSuccessCelebration(verifyRes.user);
      return;
    }

    // New user registration flow:
    if (firstName && email && age) {
      setLoadingText('Creating your account...');
      const regRes = await AuthService.registerWithOtp({
        firstName: firstName.trim(),
        phoneNumber: fullPhoneNumber,
        email: email.trim(),
        age: Number(age),
        verificationToken: verifyRes.verificationToken || '',
        platform: 'web',
      });

      if (!regRes.success || !regRes.user) {
        setIsLoading(false);
        setErrorMsg(regRes.error || 'Registration failed. Please try again.');
        return;
      }

      triggerSuccessCelebration(regRes.user);
    } else {
      // Flow where user entered phone on login screen first, but is a new user
      setIsLoading(false);
      setMode('register');
    }
  };

  const triggerSuccessCelebration = (user: UserProfile) => {
    setIsLoading(false);
    setSuccessToast(true);
    soundEngine.playNewRecord();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      onLoginSuccess(user);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col justify-between p-6 select-none relative overflow-y-auto text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER / BACK NAVIGATION */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between z-10 pt-2">
        {mode !== 'register' ? (
          <button
            onClick={() => {
              setErrorMsg(null);
              setMode('register');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors py-2 px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-display font-black text-sm tracking-wider text-cyan-400">DON'T TAP IT!</span>
          </div>
        )}

        <button
          onClick={onContinueAsGuest}
          className="text-xs font-bold text-gray-400 hover:text-cyan-400 transition-colors py-2 px-1"
        >
          Play as Guest →
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center my-6 z-10">
        
        {/* ============================================================== */}
        {/* VIEW 1: REGISTRATION FLOW ("Welcome! Let's get you started.")    */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <div className="flex flex-col gap-5 animate-pop-in">
            <div className="text-center">
              <h1 className="text-3xl font-black font-display tracking-tight text-white">
                Welcome!
              </h1>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Let's get you started in 30 seconds.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2.5 rounded-2xl animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStartRegistration} className="flex flex-col gap-3.5">
              {/* 1. First Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 ml-1">
                  First Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    required
                    className="w-full bg-[#131A29] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* 2. Phone Number with Country Code Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 ml-1">
                  Phone Number
                </label>
                <div className="flex gap-2 relative">
                  {/* Country Selector Button */}
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="bg-[#131A29] border border-white/10 rounded-2xl px-3 py-3 flex items-center gap-1.5 text-sm font-bold text-white hover:border-cyan-400 transition-colors shrink-0"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Country Dropdown Modal */}
                  {showCountryDropdown && (
                    <div className="absolute top-14 left-0 w-64 max-h-48 overflow-y-auto bg-[#131A29] border border-white/20 rounded-2xl shadow-2xl z-30 flex flex-col p-1.5 backdrop-blur-xl">
                      {COUNTRY_CODES.map((c) => (
                        <button
                          key={c.code + c.country}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setShowCountryDropdown(false);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="font-bold text-cyan-400">{c.code}</span>
                          <span className="truncate">{c.country}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Phone Input */}
                  <div className="relative flex-1 flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      autoComplete="tel"
                      required
                      className="w-full bg-[#131A29] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                    className="w-full bg-[#131A29] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* 4. Age (Numeric 13 - 120) */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 ml-1">
                  Age
                </label>
                <input
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age (min. 13)"
                  required
                  className="w-full bg-[#131A29] border border-white/10 rounded-2xl py-3 px-4 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* 5. Terms & Privacy Consent Checkbox */}
              <div className="flex items-start gap-2.5 pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                    agreedToTerms
                      ? 'bg-cyan-400 border-cyan-400 text-black'
                      : 'bg-white/5 border-white/20 text-transparent hover:border-white/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <label
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="text-xs text-gray-300 font-medium leading-tight cursor-pointer"
                >
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('privacy_terms');
                    }}
                    className="text-cyan-400 underline font-bold"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('privacy_terms');
                    }}
                    className="text-cyan-400 underline font-bold"
                  >
                    Privacy Policy
                  </button>
                  .
                </label>
              </div>

              {/* Primary CONTINUE Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isRegisterFormValid || isLoading}
                className="w-full mt-3 font-display font-black tracking-wider text-base"
              >
                {isLoading ? loadingText : 'CONTINUE →'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-gray-400">Already registered? </span>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode('login');
                }}
                className="text-xs font-bold text-cyan-400 hover:underline"
              >
                Sign In with Phone
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: PHONE OTP VERIFICATION SCREEN                           */}
        {/* ============================================================== */}
        {mode === 'otp' && (
          <div className="flex flex-col gap-5 animate-pop-in">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                Verify your number
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-400 mt-1.5 px-2">
                Enter the 6-digit code sent to{' '}
                <span className="font-bold text-white">{fullPhoneNumber}</span>
              </p>
            </div>

            {devDemoOtp && (
              <div className="bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold p-2.5 rounded-2xl text-center">
                Development Simulator Code: <span className="font-mono text-sm tracking-widest">{devDemoOtp}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2.5 rounded-2xl text-center animate-shake">
                {errorMsg}
              </div>
            )}

            {/* 6 Auto-Advancing Digit Input Boxes */}
            <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black font-display rounded-2xl bg-[#131A29] border transition-all focus:outline-none ${
                    digit
                      ? 'border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'border-white/10 text-white focus:border-cyan-400'
                  }`}
                />
              ))}
            </div>

            {/* Resend Countdown */}
            <div className="text-center">
              {resendCooldown > 0 ? (
                <span className="text-xs font-medium text-gray-400">
                  Resend code in <span className="font-bold text-white">00:{resendCooldown.toString().padStart(2, '0')}</span>
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs font-extrabold text-cyan-400 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* Primary VERIFY Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleVerifyOtp}
              disabled={otpDigits.join('').length !== 6 || isLoading}
              className="w-full mt-2 font-display font-black tracking-wider text-base"
            >
              {isLoading ? loadingText : 'VERIFY & CONTINUE →'}
            </Button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: SIMPLE RETURNING USER PHONE LOGIN ("Welcome Back!")     */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div className="flex flex-col gap-5 animate-pop-in">
            <div className="text-center">
              <h1 className="text-3xl font-black font-display tracking-tight text-white">
                Welcome Back!
              </h1>
              <p className="text-sm font-medium text-gray-400 mt-1">
                Enter your phone number to sign in.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2.5 rounded-2xl animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStartLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 ml-1">
                  Phone Number
                </label>
                <div className="flex gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="bg-[#131A29] border border-white/10 rounded-2xl px-3 py-3 flex items-center gap-1.5 text-sm font-bold text-white hover:border-cyan-400 transition-colors shrink-0"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  <div className="relative flex-1 flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      autoComplete="tel"
                      required
                      className="w-full bg-[#131A29] border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isLoginFormValid || isLoading}
                className="w-full mt-2 font-display font-black tracking-wider text-base"
              >
                {isLoading ? loadingText : 'CONTINUE →'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-gray-400">Need a new account? </span>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setMode('register');
                }}
                className="text-xs font-bold text-cyan-400 hover:underline"
              >
                Register Now
              </button>
            </div>
          </div>
        )}

        {/* Success Modal / Toast */}
        {successToast && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 animate-pop-in">
            <div className="bg-[#131A29] border border-cyan-400/40 p-6 rounded-3xl flex flex-col items-center text-center max-w-xs shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-cyan-400/20 text-cyan-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black font-display text-white">You're all set! 🎉</h3>
              <p className="text-xs font-medium text-gray-300 mt-1">Starting your game now...</p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER PRIVACY NOTICE */}
      <div className="w-full max-w-sm mx-auto text-center z-10 pt-2">
        <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Your data is encrypted & secured. Zero dark patterns.</span>
        </p>
      </div>
    </div>
  );
};
