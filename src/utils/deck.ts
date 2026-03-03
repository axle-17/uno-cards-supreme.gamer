import { Card, CardColor, CardType } from '../types';

const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 0;

  // Add number cards (0-9)
  COLORS.forEach(color => {
    // One 0 card per color
    deck.push({
      id: `${idCounter++}`,
      color,
      type: 'number',
      value: 0
    });

    // Two of each 1-9 per color
    for (let value = 1; value <= 9; value++) {
      deck.push({
        id: `${idCounter++}`,
        color,
        type: 'number',
        value
      });
      deck.push({
        id: `${idCounter++}`,
        color,
        type: 'number',
        value
      });
    }
  });

  // Add special cards (2 of each per color)
  const specialTypes: CardType[] = ['skip', 'reverse', 'draw2'];
  COLORS.forEach(color => {
    specialTypes.forEach(type => {
      deck.push({
        id: `${idCounter++}`,
        color,
        type
      });
      deck.push({
        id: `${idCounter++}`,
        color,
        type
      });
    });
  });

  // Add wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `${idCounter++}`,
      color: 'wild',
      type: 'wild'
    });
    deck.push({
      id: `${idCounter++}`,
      color: 'wild',
      type: 'wild-draw4'
    });
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
