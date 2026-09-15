import React from 'react';
import { COLLEGE_CONFIG } from '../../config/collegeConfig';

export const CampuSentryShield = ({ size = 36, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={className}
    style={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="shieldGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="goldGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    
    {/* Outer Shield */}
    <path d="M50 8 L88 22 C88 58 50 88 50 88 C50 88 12 58 12 22 Z" fill="url(#shieldGradMain)" stroke="#60a5fa" strokeWidth="2.5" />
    
    {/* Inner Shield Line */}
    <path d="M50 15 L82 27 C82 54 50 80 50 80 C50 80 18 54 18 27 Z" fill="none" stroke="#93c5fd" strokeWidth="1.2" opacity="0.6" />
    
    {/* Central Sentry Crest */}
    <path d="M50 25 L65 35 L62 60 L50 68 L38 60 L35 35 Z" fill="#ffffff" opacity="0.95" />
    
    {/* Emblem letter A / C */}
    <path d="M50 32 L42 55 L47 55 L48 50 L52 50 L53 55 L58 55 Z M49 42 L51 42 L52 46 L48 46 Z" fill="#1e40af" />
    
    {/* Gold Star */}
    <polygon points="50,68 53,74 59,75 55,79 56,85 50,82 44,85 45,79 41,75 47,74" fill="url(#goldGradMain)" />
  </svg>
);

const CollegeBrandLogo = ({ 
  size = 36, 
  variant = 'full', // 'full', 'compact', 'minimal', 'hero'
  theme = 'light' // 'light', 'dark'
}) => {
  const isDark = theme === 'dark';

  if (variant === 'minimal') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
        <CampuSentryShield size={size} />
        <span style={{ 
          fontSize: '1.25rem', 
          fontWeight: 800, 
          color: isDark ? '#ffffff' : 'var(--color-slate-900)',
          letterSpacing: '-0.02em',
          fontFamily: "'Outfit', sans-serif"
        }}>
          {COLLEGE_CONFIG.PROJECT_NAME}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
        <CampuSentryShield size={size} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            fontSize: '1.05rem', 
            fontWeight: 800, 
            color: isDark ? '#ffffff' : 'var(--color-slate-900)',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            fontFamily: "'Outfit', sans-serif"
          }}>
            {COLLEGE_CONFIG.PROJECT_NAME}
          </div>
          <div style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            color: isDark ? '#94a3b8' : 'var(--color-slate-500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {COLLEGE_CONFIG.COLLEGE_SHORT_NAME} &bull; Helpdesk
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
      <CampuSentryShield size={size} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          fontSize: variant === 'hero' ? '1.75rem' : '1.15rem', 
          fontWeight: 800, 
          color: isDark ? '#ffffff' : 'var(--color-slate-900)',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          fontFamily: "'Outfit', sans-serif"
        }}>
          {COLLEGE_CONFIG.PROJECT_NAME}
        </div>
        <div style={{ 
          fontSize: variant === 'hero' ? '0.875rem' : '0.75rem', 
          fontWeight: 600, 
          color: isDark ? '#93c5fd' : 'var(--color-brand-600)',
          lineHeight: 1.2
        }}>
          {COLLEGE_CONFIG.COLLEGE_NAME}
        </div>
        <div style={{ 
          fontSize: '0.68rem', 
          color: isDark ? '#94a3b8' : 'var(--color-slate-500)',
          fontWeight: 500
        }}>
          {COLLEGE_CONFIG.PROJECT_TAGLINE}
        </div>
      </div>
    </div>
  );
};

export default CollegeBrandLogo;
