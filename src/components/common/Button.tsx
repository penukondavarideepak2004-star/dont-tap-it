import React from 'react';
import { soundEngine } from '../../audio/SoundEngine';
import { hapticEngine } from '../../audio/HapticEngine';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    soundEngine.playButtonTap();
    hapticEngine.light();
    if (onClick) onClick(e);
  };

  // Base styling for 48dp touch targets and smooth micro-interactions
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold font-display rounded-2xl transition-all duration-150 active:scale-[0.97] focus:outline-none select-none touch-manipulation disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-md';

  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-sm gap-1.5',
    md: 'min-h-[50px] px-6 py-3 text-base gap-2',
    lg: 'min-h-[58px] px-8 py-4 text-lg font-black tracking-wide gap-3',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#00D2FC] to-[#00F0FF] text-black shadow-[0_4px_16px_rgba(0,240,255,0.35)] hover:brightness-110 active:shadow-inner',
    secondary:
      'bg-[#131A29] text-white border border-white/15 hover:bg-[#1A2338] active:bg-[#101622] shadow-sm',
    danger:
      'bg-gradient-to-r from-rose-600 to-[#FF2E63] text-white shadow-[0_4px_16px_rgba(255,46,99,0.35)] hover:brightness-110',
    ghost:
      'bg-transparent text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10 shadow-none',
    glass:
      'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/15 active:bg-white/5',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
