import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  faceDown?: boolean;
  small?: boolean;
}

const COLOR_MAP = {
  red: '#E74C3C',
  yellow: '#F1C40F',
  green: '#27AE60',
  blue: '#3498DB',
  wild: '#2C3E50'
};

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, faceDown, small }) => {
  const getCardContent = () => {
    if (faceDown) return null;
    
    if (card.type === 'number') return card.value?.toString();
    if (card.type === 'skip') return '⊘';
    if (card.type === 'reverse') return '⇄';
    if (card.type === 'draw2') return '+2';
    if (card.type === 'wild') return '🌈';
    if (card.type === 'wild-draw4') return '🌈+4';
    return '?';
  };

  const cardSize = small ? '60px' : '90px';
  const fontSize = small ? '18px' : '28px';

  const isPlayable = !disabled && !faceDown;

  return (
    <button
      onClick={onClick}
      disabled={disabled || faceDown}
      style={{
        width: cardSize,
        height: small ? '90px' : '130px',
        borderRadius: '10px',
        border: isPlayable ? '4px solid rgba(255, 255, 255, 0.9)' : '3px solid rgba(255, 255, 255, 0.6)',
        backgroundColor: faceDown ? '#E74C3C' : COLOR_MAP[card.color],
        backgroundImage: faceDown ? 'url("images/card-back.png")' : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        fontSize,
        fontWeight: 'bold',
        cursor: disabled || faceDown ? 'default' : 'pointer',
        boxShadow: isPlayable 
          ? '0 6px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.3)' 
          : '0 4px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transform: 'translateY(0) scale(1)',
        opacity: disabled && !faceDown ? 0.4 : 1,
        filter: disabled && !faceDown ? 'grayscale(40%)' : 'none',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        textShadow: '2px 2px 4px rgba(0,0,0,0.4)'
      }}
      onMouseEnter={(e) => {
        if (isPlayable) {
          e.currentTarget.style.transform = 'translateY(-15px) scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.5)';
          e.currentTarget.style.zIndex = '10';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = isPlayable 
          ? '0 6px 12px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.3)' 
          : '0 4px 8px rgba(0,0,0,0.3)';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      {getCardContent()}
    </button>
  );
};
