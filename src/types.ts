export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild-draw4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value?: number; // 0-9 for number cards
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isHuman: boolean;
  calledUno: boolean;
  finishPosition?: number;
  isOut: boolean;
}

export type GamePhase = 'menu' | 'mode-select' | 'playing' | 'gameover';
export type Direction = 'clockwise' | 'counterclockwise';

export type GameMode = 
  | 'classic' 
  | 'express' 
  | 'spin' 
  | 'showdown' 
  | 'stacko' 
  | 'splash' 
  | 'power-grab' 
  | 'teams' 
  | 'minimalista' 
  | 'wild-jackpot' 
  | 'minecraft' 
  | 'harry-potter' 
  | 'bts' 
  | 'clash-of-clans'
  | 'mobile-legends'
  | 'call-of-duty'
  | 'guitar'
  | 'code-vibes'
  | 'braille' 
  | 'giant' 
  | 'junior' 
  | 'dos' 
  | 'no-mercy' 
  | 'flip';

export interface SpinAction {
  type: 'draw' | 'skip' | 'reverse' | 'trade-hands' | 'discard-all-color' | 'everyone-draws';
  value?: number;
  color?: CardColor;
}

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
  maxPlayers: number;
  recommendedPlayers: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: 'standard' | 'themed' | 'special';
}

export interface PowerCard {
  id: string;
  name: string;
  icon: string;
  effect: string;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  score: number;
  color: string;
}
