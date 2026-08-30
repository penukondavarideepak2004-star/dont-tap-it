import React from 'react';
import { GameObject } from '../../models/types';
import { GAME_COLORS } from '../../utils/constants';

interface GameObjectViewProps {
  object: GameObject;
  onTap: (id: string) => void;
  showColorBlindLabel?: boolean;
}

export const GameObjectView: React.FC<GameObjectViewProps> = ({
  object,
  onTap,
  showColorBlindLabel = true,
}) => {
  const colorDef = GAME_COLORS[object.color] || GAME_COLORS.red;

  // Size mapping (px)
  let sizePx = 70;
  if (object.size === 'small') sizePx = 52;
  if (object.size === 'large') sizePx = 94;

  // Movement animation class
  let movementClass = '';
  if (object.movement === 'pulse') movementClass = 'animate-pulse-fast';
  if (object.movement === 'spin') movementClass = 'animate-spin';
  if (object.movement === 'wiggle') movementClass = 'animate-shake';

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTap(object.id);
  };

  return (
    <div
      style={{
        left: `${object.position.x}%`,
        top: `${object.position.y}%`,
        transform: 'translate(-50%, -50%)',
        animationDelay: `${object.spawnDelayMs}ms`,
        touchAction: 'none',
      }}
      className="absolute cursor-pointer select-none touch-none transition-transform active:scale-90"
      onPointerDown={handlePointerDown}
    >
      <div
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          boxShadow: `0 0 20px ${colorDef.glow}`,
        }}
        className={`relative flex items-center justify-center transition-all duration-150 animate-pop-in ${movementClass}`}
      >
        {/* Render geometric shape from 10-shape library */}
        {renderShape(object.shape, colorDef.hex)}

        {/* Accessibility text label or special badge */}
        {showColorBlindLabel && (
          <span className="absolute bottom-1 px-1.5 py-0.5 rounded-full bg-black/60 text-[9px] font-black tracking-wider text-white backdrop-blur-xs uppercase pointer-events-none">
            {colorDef.label}
          </span>
        )}
      </div>
    </div>
  );
};

export function renderShape(shape: GameObject['shape'], colorHex: string) {
  switch (shape) {
    case 'circle':
      return (
        <div
          style={{ backgroundColor: colorHex }}
          className="w-full h-full rounded-full border-2 border-white/40 shadow-inner"
        />
      );

    case 'square':
      return (
        <div
          style={{ backgroundColor: colorHex }}
          className="w-full h-full rounded-2xl border-2 border-white/40 shadow-inner"
        />
      );

    case 'rectangle':
      return (
        <div
          style={{ backgroundColor: colorHex }}
          className="w-full h-[65%] rounded-xl border-2 border-white/40 shadow-inner"
        />
      );

    case 'oval':
      return (
        <div
          style={{ backgroundColor: colorHex }}
          className="w-[74%] h-full rounded-[50%/38%] border-2 border-white/40 shadow-inner"
        />
      );

    case 'diamond':
      return (
        <div
          style={{ backgroundColor: colorHex }}
          className="w-[78%] h-[78%] rounded-xl rotate-45 border-2 border-white/40 shadow-inner"
        />
      );

    case 'triangle':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
          <polygon
            points="50,10 90,85 10,85"
            fill={colorHex}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'pentagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
          <polygon
            points="50,8 95,40 78,92 22,92 5,40"
            fill={colorHex}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'hexagon':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
          <polygon
            points="50,6 92,28 92,72 50,94 8,72 8,28"
            fill={colorHex}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
          <polygon
            points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"
            fill={colorHex}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'heart':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
          <path
            d="M50,88 C20,60 5,40 5,25 A20,20 0 0,1 50,22 A20,20 0 0,1 95,25 C95,40 80,60 50,88 Z"
            fill={colorHex}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return <div style={{ backgroundColor: colorHex }} className="w-full h-full rounded-full" />;
  }
}
