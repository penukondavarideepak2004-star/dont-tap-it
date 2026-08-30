import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Lock,
  Play,
  RefreshCw,
  Shield,
  Sliders,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { GameObjectView } from '../components/game/GameObjectView';
import { ChallengeGenerator } from '../engine/ChallengeGenerator';
import { ChallengeValidator } from '../engine/ChallengeValidator';
import { DifficultyManager } from '../engine/DifficultyManager';
import { LayoutEngine } from '../engine/LayoutEngine';
import { Challenge, ScreenName } from '../models/types';

interface AdminScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onLaunchLevel?: (level: number) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  onNavigate,
  onLaunchLevel,
}) => {
  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Level Inspector State
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(true);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);

  // Database / Sheets Preview State
  const [activeTab, setActiveTab] = useState<'inspector' | 'matrix' | 'database'>('inspector');
  const [sheetData, setSheetData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);

  // Generate or regenerate challenge when selectedLevel changes
  useEffect(() => {
    if (isAuthenticated) {
      regenerateChallenge(selectedLevel);
    }
  }, [selectedLevel, isAuthenticated]);

  // Load sheets data when tab is opened
  useEffect(() => {
    if (activeTab === 'database') {
      fetchSheetsPreview();
    }
  }, [activeTab]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Master Admin PINs: 'admin777', '7777', or 'admin'
    if (adminPin === 'admin777' || adminPin === '7777' || adminPin === 'admin') {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setAdminPin('');
    }
  };

  const regenerateChallenge = (level: number) => {
    const challenge = ChallengeGenerator.generate(level);
    setCurrentChallenge(challenge);
    setLastActionResult(`Generated Level ${level} challenge (${challenge.type})`);
  };

  const handleTestTap = (objId: string) => {
    if (!currentChallenge) return;
    const isTarget = currentChallenge.validTargetIds.includes(objId);
    if (isTarget) {
      setLastActionResult(`✅ Correct Tap on ${objId}! Advancing...`);
      setTimeout(() => {
        setSelectedLevel((prev) => prev + 1);
      }, 400);
    } else {
      setLastActionResult(`❌ Wrong Tap on ${objId}! (Target is: ${currentChallenge.validTargetIds.join(', ')})`);
    }
  };

  const handleAutoSolve = () => {
    if (!currentChallenge || currentChallenge.validTargetIds.length === 0) return;
    const targetId = currentChallenge.validTargetIds[0];
    handleTestTap(targetId);
  };

  const fetchSheetsPreview = async () => {
    setIsLoadingSheets(true);
    try {
      const res = await fetch('/api/sheets/preview');
      if (res.ok) {
        const data = await res.json();
        setSheetData(data);
      }
    } catch (e) {
      console.error('Failed to fetch sheets preview:', e);
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // =========================================================================
  // ADMIN LOGIN GATE (If not authenticated)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col items-center justify-center p-6 text-white relative">
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
        </div>

        <div className="w-full max-w-sm bg-[#131A29] border border-cyan-500/30 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black font-display text-white mb-1">Admin Level Inspector</h2>
          <p className="text-xs font-medium text-gray-400 mb-6">
            Authorized administrator access to test, view, and simulate all game levels.
          </p>

          <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-4">
            <div>
              <input
                type="password"
                placeholder="Enter Admin PIN (e.g. 7777)"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value);
                  setPinError(false);
                }}
                className={`w-full px-4 py-3 rounded-2xl bg-[#0D121D] border ${
                  pinError ? 'border-rose-500' : 'border-white/10 focus:border-cyan-400'
                } text-white text-center text-lg tracking-widest outline-none transition-colors`}
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-400 mt-2 font-semibold">
                  Invalid PIN. Use PIN: <span className="text-white font-mono font-bold">7777</span>
                </p>
              )}
            </div>

            <Button variant="primary" fullWidth size="lg" type="submit" icon={<Lock className="w-4 h-4 fill-black" />}>
              Authenticate Admin
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  const config = DifficultyManager.getConfigForRound(selectedLevel);
  const isValidChallenge = currentChallenge ? ChallengeValidator.validate(currentChallenge) : false;
  const positions = currentChallenge?.objects.map((o) => o.position) || [];
  const minDistance = LayoutEngine.calculateMinimumDistance(positions);

  return (
    <div className="min-h-screen w-full bg-[#0A0E17] flex flex-col text-white select-none overflow-x-hidden">
      {/* Top Admin Header */}
      <div className="w-full bg-[#131A29]/95 border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-30 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Exit to Home
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-black font-display tracking-wide text-white uppercase">
              Admin Level Inspector
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-[#0D121D] p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inspector' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Level Inspector
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matrix' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Progression Matrix
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'database' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            DB & Sheets
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'inspector' && (
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Live Sandbox Simulator (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Level Quick-Stepper Bar */}
            <div className="w-full bg-[#131A29] border border-white/10 rounded-2xl p-3 flex items-center justify-between">
              <button
                disabled={selectedLevel <= 1}
                onClick={() => setSelectedLevel((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-400 uppercase">LEVEL</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded-xl bg-[#0D121D] border border-cyan-400/40 text-center font-black text-cyan-400 text-lg outline-none"
                />
                <span className="text-xs font-bold text-gray-400">/ 50</span>
              </div>

              <button
                onClick={() => setSelectedLevel((prev) => prev + 1)}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Live Interactive Challenge Preview Screen */}
            <div className="w-full bg-[#0D121D] border border-white/15 rounded-3xl p-5 relative min-h-[440px] flex flex-col justify-between overflow-hidden shadow-2xl">
              {/* Header inside Sandbox */}
              <div className="w-full flex items-center justify-between text-xs font-extrabold text-gray-400 mb-2 z-20">
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  TIER: <span className="text-cyan-400">{config.tier}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  TIMER: <span className="text-amber-400">{config.timeLimitSeconds}s</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  OBJECTS: <span className="text-purple-400">{config.objectCount}</span>
                </span>
              </div>

              {/* Instruction Box */}
              {currentChallenge && (
                <div className="w-full px-4 py-3 rounded-2xl bg-[#131A29] border border-white/15 text-center shadow-lg my-2 z-20">
                  <h3
                    style={{ color: currentChallenge.highlightColor || '#FFFFFF' }}
                    className="text-xl sm:text-2xl font-black font-display tracking-tight uppercase"
                  >
                    {currentChallenge.instruction}
                  </h3>
                  {currentChallenge.subInstruction && (
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                      {currentChallenge.subInstruction}
                    </p>
                  )}
                </div>
              )}

              {/* Interactive Arena */}
              <div className="relative flex-1 w-full min-h-[260px] my-2">
                {currentChallenge?.objects.map((obj) => {
                  const isTarget = currentChallenge.validTargetIds.includes(obj.id);
                  return (
                    <div key={obj.id} className="relative">
                      {/* Debug Green Target Ring if overlay enabled */}
                      {showDebugOverlay && isTarget && (
                        <div
                          style={{
                            left: `${obj.position.x}%`,
                            top: `${obj.position.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/80 bg-emerald-400/10 pointer-events-none animate-pulse z-0"
                        />
                      )}

                      <GameObjectView
                        object={obj}
                        onTap={handleTestTap}
                        showColorBlindLabel={true}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Action Log / Feedback Bar */}
              {lastActionResult && (
                <div className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-semibold text-gray-300 z-20">
                  {lastActionResult}
                </div>
              )}
            </div>

            {/* Sandbox Action Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => regenerateChallenge(selectedLevel)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Reroll
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAutoSolve}
                icon={<Bot className="w-3.5 h-3.5 fill-black" />}
              >
                Auto-Solve
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDebugOverlay(!showDebugOverlay)}
                icon={<Eye className="w-3.5 h-3.5" />}
              >
                {showDebugOverlay ? 'Hide Target' : 'Show Target'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (onLaunchLevel) {
                    onLaunchLevel(selectedLevel);
                  } else {
                    onNavigate('game');
                  }
                }}
                icon={<Play className="w-3.5 h-3.5" />}
              >
                Play Level
              </Button>
            </div>
          </div>

          {/* RIGHT: Challenge Specifications & Object Inspector (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Quick Level Jump Tiers */}
            <div className="w-full bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tier Quick-Jump</span>
              </span>

              <div className="flex flex-col gap-2">
                {/* Tier 1: Levels 1–5 */}
                <div className="flex items-center justify-between bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-400">Levels 1–5: Color Detection</span>
                    <span className="text-[10px] text-gray-400">Basic, Pairs, Distractors</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                          selectedLevel === lvl
                            ? 'bg-emerald-400 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier 2: Levels 6–10 */}
                <div className="flex items-center justify-between bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-400">Levels 6–10: Odd-One-Out</span>
                    <span className="text-[10px] text-gray-400">Shape, Color, Subtle Difference</span>
                  </div>
                  <div className="flex gap-1">
                    {[6, 7, 8, 9, 10].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                          selectedLevel === lvl
                            ? 'bg-amber-400 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier 3: Levels 11+ */}
                <div className="flex items-center justify-between bg-[#0D121D] p-2.5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-cyan-400">Levels 11+: Position Detection</span>
                    <span className="text-[10px] text-gray-400">Leftmost, Rightmost, Motion</span>
                  </div>
                  <div className="flex gap-1">
                    {[11, 12, 13, 14, 15].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                          selectedLevel === lvl
                            ? 'bg-cyan-400 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & Geometric Spacing Status */}
            <div className="w-full bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Layout & Validation Metrics</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Rule Integrity</span>
                  <span className="font-bold text-emerald-400 mt-0.5">
                    {isValidChallenge ? '✅ 1 Target Valid' : '❌ Invalid'}
                  </span>
                </div>

                <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Min Distance</span>
                  <span className="font-bold text-cyan-400 mt-0.5">
                    {minDistance.toFixed(1)}% (≥10% safe)
                  </span>
                </div>

                <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Target ID</span>
                  <span className="font-bold text-amber-400 mt-0.5">
                    {currentChallenge?.validTargetIds[0] || 'None'}
                  </span>
                </div>

                <div className="bg-[#0D121D] p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Object Size</span>
                  <span className="font-bold text-purple-400 mt-0.5 uppercase">
                    {config.objectSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Object Hierarchy Tree */}
            <div className="w-full bg-[#131A29] border border-white/10 rounded-2xl p-4 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider">
                Objects in Scene ({currentChallenge?.objects.length || 0})
              </span>

              <div className="flex flex-col gap-1.5">
                {currentChallenge?.objects.map((obj) => {
                  const isTarget = currentChallenge.validTargetIds.includes(obj.id);
                  return (
                    <div
                      key={obj.id}
                      className={`p-2 rounded-xl text-[11px] font-mono flex items-center justify-between border ${
                        isTarget
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-[#0D121D] border-white/5 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{obj.id}</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] uppercase font-sans">
                          {obj.shape}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] uppercase font-sans text-amber-300">
                          {obj.color}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>X:{Math.round(obj.position.x)}% Y:{Math.round(obj.position.y)}%</span>
                        {isTarget && <span className="text-emerald-400 font-bold font-sans">🎯 TARGET</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATRIX TAB: Full Level Progression Breakdown */}
      {activeTab === 'matrix' && (
        <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black font-display text-white">Master Level Progression Matrix</h3>
            <p className="text-xs text-gray-400">Complete curriculum and difficulty scaling from Level 1 to Level 50+.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-[#131A29] border border-emerald-500/30 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                  TIER 1 (LEVELS 1–5)
                </span>
                <span className="text-xs font-bold text-gray-400">Color Detection</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-2">
                <li><strong className="text-white">L1:</strong> Basic Color (2–3 objs, 5.0s timer)</li>
                <li><strong className="text-white">L2:</strong> 3–4 Colors (Orange, Purple, 4.0s)</li>
                <li><strong className="text-white">L3:</strong> Similar Colors (Blue/Cyan, Red/Pink, 3.2s)</li>
                <li><strong className="text-white">L4:</strong> Color + Distractors (5–7 objs, 2.6s)</li>
                <li><strong className="text-white">L5:</strong> Advanced Recognition (6–8 objs, 2.2s)</li>
              </ul>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedLevel(1); setActiveTab('inspector'); }}>
                Inspect Tier 1
              </Button>
            </div>

            {/* Card 2 */}
            <div className="bg-[#131A29] border border-amber-500/30 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">
                  TIER 2 (LEVELS 6–10)
                </span>
                <span className="text-xs font-bold text-gray-400">Odd-One-Out</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-2">
                <li><strong className="text-white">L6:</strong> Simple Odd One (4 objs, 3.5s)</li>
                <li><strong className="text-white">L7:</strong> Shape Odd One (5 objs, 3.0s)</li>
                <li><strong className="text-white">L8:</strong> Subtle Shapes (Triangle/Diamond, 2.6s)</li>
                <li><strong className="text-white">L9:</strong> Visual Distractors (6–7 objs, 2.2s)</li>
                <li><strong className="text-white">L10:</strong> Advanced Odd One (6–8 objs, 1.9s)</li>
              </ul>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedLevel(6); setActiveTab('inspector'); }}>
                Inspect Tier 2
              </Button>
            </div>

            {/* Card 3 */}
            <div className="bg-[#131A29] border border-cyan-500/30 rounded-3xl p-5 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black">
                  TIER 3 (LEVELS 11+)
                </span>
                <span className="text-xs font-bold text-gray-400">Position Detection</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-2">
                <li><strong className="text-white">L11:</strong> SELECT THE LEFTMOST (4 objs, 3.2s)</li>
                <li><strong className="text-white">L12:</strong> SELECT THE RIGHTMOST (4 objs, 3.0s)</li>
                <li><strong className="text-white">L13:</strong> Mixed Left/Right (4–5 objs, 2.6s)</li>
                <li><strong className="text-white">L14:</strong> Position + Distractors (5–6 objs, 2.2s)</li>
                <li><strong className="text-white">L15+:</strong> Master Intensity (1.8s down to 1.1s)</li>
              </ul>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedLevel(11); setActiveTab('inspector'); }}>
                Inspect Tier 3
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DATABASE TAB: Google Sheets & User Database Live Viewer */}
      {activeTab === 'database' && (
        <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-2xl font-black font-display text-white">Database & Google Sheets Viewer</h3>
              <p className="text-xs text-gray-400">Live inspection of all registered users and Google Sheets synced records.</p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={fetchSheetsPreview}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />}
            >
              Refresh Data
            </Button>
          </div>

          <div className="w-full bg-[#131A29] border border-white/10 rounded-3xl p-5 overflow-x-auto shadow-2xl">
            {sheetData && sheetData.rows.length > 0 ? (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    {sheetData.headers.map((h, i) => (
                      <th key={i} className="pb-3 px-3 uppercase font-sans font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sheetData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3 text-gray-200">
                          {cIdx === 1 ? (
                            <span className="text-cyan-400 font-bold">{cell}</span>
                          ) : cIdx === 2 ? (
                            <span className="text-amber-400">{cell}</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
                <Database className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-sm font-semibold">No registered users in preview yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
