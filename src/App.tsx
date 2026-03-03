import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card as CardType, Player, GamePhase, Direction, CardColor, GameMode, SpinAction, GameModeConfig, PowerCard } from './types';
import { Card } from './components/Card';
import { createDeck, shuffleDeck } from './utils/deck';
import './styles.css';

// Helper function for position suffixes
function getPositionSuffix(position: number): string {
  const j = position % 10;
  const k = position % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [playerCount, setPlayerCount] = useState(4);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>('clockwise');
  const [currentColor, setCurrentColor] = useState<CardColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<CardType | null>(null);
  const [gameMessage, setGameMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');
  const [finishOrder, setFinishOrder] = useState<Player[]>([]);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  
  // Mode-specific state
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerResult, setSpinnerResult] = useState<SpinAction | null>(null);
  const [showdownTimer, setShowdownTimer] = useState<number | null>(null);
  const [jackpotSlots, setJackpotSlots] = useState<string[]>(['?', '?', '?']);
  const [stackHeight, setStackHeight] = useState<number>(0);
  const [splashActive, setSplashActive] = useState<boolean>(false);
  const [powerCards, setPowerCards] = useState<PowerCard[]>([]);
  const [flipSide, setFlipSide] = useState<'light' | 'dark'>('light');
  const [dosSecondCard, setDosSecondCard] = useState<CardType | null>(null);
  const [noMercyStack, setNoMercyStack] = useState<number>(0);
  const [lastPlayerWithOneCard, setLastPlayerWithOneCard] = useState<string | null>(null);
  const [unoChallengePending, setUnoChallengePending] = useState<boolean>(false);
  const [spinWheelActive, setSpinWheelActive] = useState<boolean>(false);
  const [tradeHandsTarget, setTradeHandsTarget] = useState<string | null>(null);
  
  // Audio context
  const audioContextRef = useRef<AudioContext | null>(null);
  const themeMusicRef = useRef<HTMLAudioElement | null>(null);

  // Theme music generator using Web Audio API
  const playThemeMusic = useCallback((theme: 'minecraft' | 'harry-potter' | 'bts' | 'clash-of-clans' | 'mobile-legends' | 'call-of-duty' | 'guitar' | 'code-vibes' | 'stop') => {
    // Stop existing theme music
    if (themeMusicRef.current) {
      themeMusicRef.current.pause();
      themeMusicRef.current = null;
    }

    if (theme === 'stop' || !soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Create a simple melodic loop for each theme
      const playMelody = (notes: number[], duration: number, waveType: OscillatorType = 'sine') => {
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = waveType;
          osc.frequency.value = freq;
          
          const startTime = now + (i * duration);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.05, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        });
      };

      // Different melodies for each theme
      if (theme === 'minecraft') {
        // Calm, blocky melody (C major pentatonic)
        const minecraftMelody = [
          523.25, 659.25, 783.99, 659.25, // C E G E
          523.25, 392.00, 523.25, 659.25, // C G C E
          783.99, 659.25, 523.25, 392.00, // G E C G
          523.25, 659.25, 523.25, 392.00  // C E C G
        ];
        playMelody(minecraftMelody, 0.4, 'square');
        
        // Loop the theme
        const loopInterval = setInterval(() => {
          if (gameMode === 'minecraft' && soundEnabled) {
            playMelody(minecraftMelody, 0.4, 'square');
          } else {
            clearInterval(loopInterval);
          }
        }, minecraftMelody.length * 400);
        
      } else if (theme === 'harry-potter') {
        // Magical, mysterious melody (inspired by Hedwig's theme)
        const harryPotterMelody = [
          493.88, 659.25, 622.25, 554.37, // B E D# C#
          739.99, 659.25, 587.33, 659.25, // F# E D E
          493.88, 739.99, 698.46, 622.25, // B F# F D#
          554.37, 493.88, 440.00, 369.99  // C# B A F#
        ];
        playMelody(harryPotterMelody, 0.5, 'triangle');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'harry-potter' && soundEnabled) {
            playMelody(harryPotterMelody, 0.5, 'triangle');
          } else {
            clearInterval(loopInterval);
          }
        }, harryPotterMelody.length * 500);
        
      } else if (theme === 'bts') {
        // Upbeat K-Pop melody
        const btsMelody = [
          659.25, 659.25, 783.99, 880.00, // E E G A
          783.99, 659.25, 783.99, 659.25, // G E G E
          587.33, 659.25, 783.99, 659.25, // D E G E
          587.33, 523.25, 659.25, 523.25  // D C E C
        ];
        playMelody(btsMelody, 0.3, 'sawtooth');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'bts' && soundEnabled) {
            playMelody(btsMelody, 0.3, 'sawtooth');
          } else {
            clearInterval(loopInterval);
          }
        }, btsMelody.length * 300);
        
      } else if (theme === 'clash-of-clans') {
        // Epic battle melody
        const clashMelody = [
          392.00, 523.25, 587.33, 659.25, // G C D E
          659.25, 587.33, 523.25, 392.00, // E D C G
          440.00, 523.25, 587.33, 698.46, // A C D F
          698.46, 659.25, 587.33, 523.25  // F E D C
        ];
        playMelody(clashMelody, 0.35, 'sawtooth');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'clash-of-clans' && soundEnabled) {
            playMelody(clashMelody, 0.35, 'sawtooth');
          } else {
            clearInterval(loopInterval);
          }
        }, clashMelody.length * 350);
        
      } else if (theme === 'mobile-legends') {
        // MOBA action melody
        const mobaEl = [
          659.25, 783.99, 880.00, 1046.50, // E G A C
          1046.50, 880.00, 783.99, 659.25, // C A G E
          739.99, 880.00, 987.77, 1174.66, // F# A B D
          987.77, 880.00, 739.99, 659.25  // B A F# E
        ];
        playMelody(mobaEl, 0.25, 'square');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'mobile-legends' && soundEnabled) {
            playMelody(mobaEl, 0.25, 'square');
          } else {
            clearInterval(loopInterval);
          }
        }, mobaEl.length * 250);
        
      } else if (theme === 'call-of-duty') {
        // Military tactical melody
        const codMelody = [
          329.63, 392.00, 440.00, 493.88, // E G A B
          440.00, 392.00, 329.63, 293.66, // A G E D
          349.23, 392.00, 440.00, 523.25, // F G A C
          440.00, 392.00, 349.23, 329.63  // A G F E
        ];
        playMelody(codMelody, 0.4, 'triangle');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'call-of-duty' && soundEnabled) {
            playMelody(codMelody, 0.4, 'triangle');
          } else {
            clearInterval(loopInterval);
          }
        }, codMelody.length * 400);
        
      } else if (theme === 'guitar') {
        // Rock guitar riff
        const guitarMelody = [
          659.25, 659.25, 698.46, 739.99, // E E F F#
          783.99, 783.99, 739.99, 698.46, // G G F# F
          659.25, 587.33, 523.25, 493.88, // E D C B
          523.25, 587.33, 659.25, 783.99  // C D E G
        ];
        playMelody(guitarMelody, 0.25, 'sawtooth');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'guitar' && soundEnabled) {
            playMelody(guitarMelody, 0.25, 'sawtooth');
          } else {
            clearInterval(loopInterval);
          }
        }, guitarMelody.length * 250);
        
      } else if (theme === 'code-vibes') {
        // Digital/Tech melody
        const codeMelody = [
          523.25, 587.33, 659.25, 783.99, // C D E G
          783.99, 659.25, 587.33, 523.25, // G E D C
          587.33, 659.25, 739.99, 880.00, // D E F# A
          880.00, 739.99, 659.25, 587.33  // A F# E D
        ];
        playMelody(codeMelody, 0.2, 'sine');
        
        const loopInterval = setInterval(() => {
          if (gameMode === 'code-vibes' && soundEnabled) {
            playMelody(codeMelody, 0.2, 'sine');
          } else {
            clearInterval(loopInterval);
          }
        }, codeMelody.length * 200);
      }
    } catch (error) {
      console.warn('Theme music playback failed:', error);
    }
  }, [soundEnabled, gameMode]);

  // Sound effects using Web Audio API
  const playSound = useCallback((type: 'card' | 'draw' | 'uno' | 'win' | 'special' | 'button' | 'shuffle') => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      switch (type) {
        case 'card':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.1);
          break;
        case 'draw':
          oscillator.frequency.value = 300;
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case 'uno':
          oscillator.frequency.value = 800;
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case 'win':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;
        case 'special':
          oscillator.frequency.value = 500;
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case 'button':
          oscillator.frequency.value = 350;
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.08);
          break;
        case 'shuffle':
          oscillator.frequency.value = 250;
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [soundEnabled]);

  // Game modes configuration
  const gameModes: GameModeConfig[] = [
    // Standard Modes
    {
      id: 'classic',
      name: 'Classic UNO',
      description: 'Traditional UNO rules',
      icon: '🎴',
      features: ['Standard rules', 'All card types', 'Classic gameplay'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'beginner',
      category: 'standard'
    },
    {
      id: 'express',
      name: 'UNO Express',
      description: 'Faster gameplay with fewer cards',
      icon: '🚀',
      features: ['Half the cards', 'Quick matches', '5 starting cards'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'standard'
    },
    {
      id: 'spin',
      name: 'UNO Spin',
      description: 'Spin the wheel for special actions!',
      icon: '🎡',
      features: ['Spinner wheel', 'Random effects', 'Unpredictable chaos'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'special'
    },
    {
      id: 'showdown',
      name: 'UNO Showdown',
      description: 'Race against the timer!',
      icon: '⏱️',
      features: ['Timed rounds', 'Fast-paced', 'Pressure gameplay'],
      maxPlayers: 8,
      recommendedPlayers: 4,
      difficulty: 'advanced',
      category: 'special'
    },
    {
      id: 'stacko',
      name: 'UNO Stacko',
      description: 'Stack cards to win!',
      icon: '🏗️',
      features: ['Stack building', 'Strategic placement', 'Tower mechanics'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'special'
    },
    {
      id: 'splash',
      name: 'UNO Splash',
      description: 'Water-themed chaos mode!',
      icon: '💦',
      features: ['Splash effects', 'Random soaking', 'Wet wild cards'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'special'
    },
    {
      id: 'power-grab',
      name: 'UNO Power Grab',
      description: 'Grab power cards for advantages!',
      icon: '⚡',
      features: ['Power card collection', 'Special abilities', 'Strategic powers'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'advanced',
      category: 'special'
    },
    {
      id: 'teams',
      name: 'UNO Teams',
      description: '2v2 cooperative gameplay',
      icon: '🤝',
      features: ['Team play', 'Shared victory', 'Cooperative strategy'],
      maxPlayers: 4,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'special'
    },
    {
      id: 'minimalista',
      name: 'UNO Minimalista',
      description: 'Simplified, minimalist rules',
      icon: '⚪',
      features: ['Fewer card types', 'Simple rules', 'Quick learning'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'beginner',
      category: 'standard'
    },
    {
      id: 'wild-jackpot',
      name: 'UNO Wild Jackpot',
      description: 'Slot machine wild cards!',
      icon: '🎰',
      features: ['Slot machine', 'Jackpot rewards', 'Lucky spins'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'special'
    },
    {
      id: 'flip',
      name: 'UNO Flip',
      description: 'Double-sided cards with light & dark sides',
      icon: '🔄',
      features: ['Flip mechanic', 'Dark side rules', 'Double strategy'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'advanced',
      category: 'special'
    },
    {
      id: 'no-mercy',
      name: 'UNO No Mercy',
      description: 'Brutal stacking rules - show no mercy!',
      icon: '😈',
      features: ['Card stacking', 'Extreme penalties', 'Ruthless gameplay'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'expert',
      category: 'special'
    },
    {
      id: 'dos',
      name: 'UNO Dos',
      description: 'Match TWO cards at once!',
      icon: '2️⃣',
      features: ['Double matching', 'Two card plays', 'New strategy'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'advanced',
      category: 'special'
    },
    // Themed Modes
    {
      id: 'minecraft',
      name: 'UNO Minecraft',
      description: 'Blocky adventure with Creeper cards!',
      icon: '⛏️',
      features: ['Minecraft theme', 'Creeper explosions', 'Block building'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'themed'
    },
    {
      id: 'harry-potter',
      name: 'UNO Harry Potter',
      description: 'Magical spells and house colors!',
      icon: '🪄',
      features: ['Magic spells', 'House sorting', 'Wizard duels'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'themed'
    },
    {
      id: 'bts',
      name: 'UNO BTS',
      description: 'K-Pop themed with dance battles!',
      icon: '💜',
      features: ['BTS theme', 'Dance moves', 'Army power'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'themed'
    },
    {
      id: 'clash-of-clans',
      name: 'UNO Clash of Clans',
      description: 'Build your village and raid opponents!',
      icon: '🏰',
      features: ['Troop deployment', 'Village raids', 'Clan wars'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'themed'
    },
    {
      id: 'mobile-legends',
      name: 'UNO Mobile Legends',
      description: 'MOBA action with hero powers!',
      icon: '⚔️',
      features: ['Hero abilities', 'Team battles', 'Epic combos'],
      maxPlayers: 10,
      recommendedPlayers: 5,
      difficulty: 'advanced',
      category: 'themed'
    },
    {
      id: 'call-of-duty',
      name: 'UNO Call of Duty',
      description: 'Tactical warfare with loadouts!',
      icon: '🎯',
      features: ['Military tactics', 'Weapon loadouts', 'Combat zones'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'advanced',
      category: 'themed'
    },
    {
      id: 'guitar',
      name: 'UNO Guitar Hero',
      description: 'Rock out with musical combos!',
      icon: '🎸',
      features: ['Musical notes', 'Combo streaks', 'Rock n roll'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'intermediate',
      category: 'themed'
    },
    {
      id: 'code-vibes',
      name: 'UNO Code Vibes',
      description: 'Programming themed for developers!',
      icon: '💻',
      features: ['Code syntax', 'Debug mode', 'Compile wins'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'expert',
      category: 'themed'
    },
    {
      id: 'braille',
      name: 'UNO Braille',
      description: 'Accessible gameplay for all!',
      icon: '👆',
      features: ['Braille support', 'Accessible design', 'Tactile feedback'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'beginner',
      category: 'standard'
    },
    {
      id: 'giant',
      name: 'UNO Giant',
      description: 'Oversized cards, oversized fun!',
      icon: '🎴',
      features: ['Giant cards', 'Larger visuals', 'Party mode'],
      maxPlayers: 10,
      recommendedPlayers: 4,
      difficulty: 'beginner',
      category: 'standard'
    },
    {
      id: 'junior',
      name: 'UNO Junior',
      description: 'Kid-friendly simplified rules',
      icon: '👶',
      features: ['Simple rules', 'Kid-friendly', 'Animal cards'],
      maxPlayers: 4,
      recommendedPlayers: 3,
      difficulty: 'beginner',
      category: 'standard'
    }
  ];

  // Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem('uno-sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('uno-sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Preload images
  useEffect(() => {
    const imagesToLoad = [
      'images/uno-logo.png',
      'images/card-back.png',
      'images/game-background.png',
      'images/player-avatars.png'
    ];

    let loadedCount = 0;
    imagesToLoad.forEach(src => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setAssetsLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setAssetsLoaded(true);
        }
      };
      img.src = src;
    });
  }, []);

  // UNO Showdown Timer
  useEffect(() => {
    if (gamePhase !== 'playing' || gameMode !== 'showdown') return;
    
    // Initialize timer if not set
    if (showdownTimer === null) {
      setShowdownTimer(30); // 30 seconds per turn
    }
    
    if (showdownTimer === null || showdownTimer <= 0) return;
    
    const timerInterval = setInterval(() => {
      setShowdownTimer(prev => {
        if (prev === null || prev <= 0) return prev;
        
        const newTime = prev - 1;
        
        // Play warning sound at 5 seconds
        if (newTime === 5) {
          playSound('special');
        }
        
        // Time's up! Force draw and skip turn
        if (newTime === 0) {
          const currentPlayer = players[currentPlayerIndex];
          if (currentPlayer && !currentPlayer.isOut) {
            if (currentPlayer.isHuman) {
              showMessage('⏱️ Time\'s up! Drawing card and passing turn!', 'error');
            }
            drawCard(currentPlayer, 1);
            setTimeout(() => nextPlayer(), 500);
          }
          return 30; // Reset timer for next player
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [gamePhase, gameMode, showdownTimer, currentPlayerIndex, players]);

  // Reset timer when player changes in Showdown mode
  useEffect(() => {
    if (gameMode === 'showdown' && gamePhase === 'playing') {
      setShowdownTimer(30);
    }
  }, [currentPlayerIndex, gameMode, gamePhase]);

  const showMessage = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setGameMessage(message);
    setMessageType(type);
    setTimeout(() => setGameMessage(''), 2000);
  };

  const createConfetti = () => {
    const colors = ['#E74C3C', '#F1C40F', '#27AE60', '#3498DB', '#9B59B6', '#E67E22'];
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
      }, i * 30);
    }
  };

  const startGame = () => {
    playSound('shuffle');
    
    // Start theme music for themed modes
    if (gameMode === 'minecraft' || gameMode === 'harry-potter' || gameMode === 'bts' || 
        gameMode === 'clash-of-clans' || gameMode === 'mobile-legends' || gameMode === 'call-of-duty' ||
        gameMode === 'guitar' || gameMode === 'code-vibes') {
      setTimeout(() => {
        playThemeMusic(gameMode as any);
      }, 500);
    }
    
    // Adjust deck size based on mode and player count
    const isExpress = gameMode === 'express';
    // Use more decks for larger player counts to ensure enough cards
    const numDecks = isExpress ? 1 : Math.max(2, Math.ceil(playerCount / 3.5));
    
    let allCards: CardType[] = [];
    for (let i = 0; i < numDecks; i++) {
      const deck = createDeck();
      // Update card IDs to be unique across decks
      deck.forEach(card => {
        card.id = `${i}-${card.id}`;
      });
      allCards = [...allCards, ...deck];
    }
    
    // For Express mode, use only half the deck
    if (isExpress) {
      allCards = allCards.slice(0, Math.floor(allCards.length / 2));
    }
    
    const newDeck = shuffleDeck(allCards);
    const newPlayers: Player[] = [
      { id: '0', name: 'You', hand: [], isHuman: true, calledUno: false, isOut: false }
    ];

    for (let i = 1; i < playerCount; i++) {
      newPlayers.push({
        id: `${i}`,
        name: `Player ${i + 1}`,
        hand: [],
        isHuman: false,
        calledUno: false,
        isOut: false
      });
    }

    // Deal cards (5 for Express, 7 for others)
    const cardsPerPlayer = isExpress ? 5 : 7;
    let currentDeck = [...newDeck];
    newPlayers.forEach(player => {
      player.hand = currentDeck.slice(0, cardsPerPlayer);
      currentDeck = currentDeck.slice(cardsPerPlayer);
    });

    // Find first non-wild card for discard pile
    let firstCard = currentDeck[0];
    let deckIndex = 0;
    while (firstCard.color === 'wild' && deckIndex < currentDeck.length - 1) {
      deckIndex++;
      firstCard = currentDeck[deckIndex];
    }

    currentDeck.splice(deckIndex, 1);

    setPlayers(newPlayers);
    setDeck(currentDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color);
    setCurrentPlayerIndex(0);
    setDirection('clockwise');
    setFinishOrder([]);
    setShowSpinner(false);
    setSpinnerResult(null);
    setShowdownTimer(null);
    setJackpotSlots(['?', '?', '?']);
    setStackHeight(0);
    setSplashActive(false);
    setPowerCards([]);
    setFlipSide('light');
    setDosSecondCard(null);
    setNoMercyStack(0);
    setGamePhase('playing');
  };

  const canPlayCard = (card: CardType): boolean => {
    if (!discardPile.length) return false;
    const topCard = discardPile[discardPile.length - 1];
    
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
    if (card.type === topCard.type && card.type !== 'number') return true;
    
    return false;
  };

  const drawCard = (player: Player, count: number = 1): CardType[] => {
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];
    let totalDrawn: CardType[] = [];
    
    // Keep drawing until we have enough cards or run out
    while (totalDrawn.length < count) {
      // If deck is empty, reshuffle discard pile
      if (currentDeck.length === 0 && currentDiscard.length > 1) {
        const topCard = currentDiscard[currentDiscard.length - 1];
        const cardsToShuffle = currentDiscard.slice(0, -1);
        currentDeck = shuffleDeck(cardsToShuffle);
        currentDiscard = [topCard];
        showMessage('♻️ Auto-reshuffling deck...', 'info');
        playSound('shuffle');
      }
      
      // If still no cards available, stop
      if (currentDeck.length === 0) {
        if (totalDrawn.length === 0) {
          showMessage('No more cards available!', 'error');
        }
        break;
      }
      
      // Draw one card at a time
      const cardsNeeded = count - totalDrawn.length;
      const cardsToDraw = Math.min(cardsNeeded, currentDeck.length);
      totalDrawn.push(...currentDeck.slice(0, cardsToDraw));
      currentDeck = currentDeck.slice(cardsToDraw);
    }
    
    // Update game state
    setDeck(currentDeck);
    setDiscardPile(currentDiscard);
    
    setPlayers(prev => prev.map(p => 
      p.id === player.id 
        ? { ...p, hand: [...p.hand, ...totalDrawn], calledUno: false }
        : p
    ));

    return totalDrawn;
  };

  const nextPlayer = useCallback(() => {
    setCurrentPlayerIndex(prev => {
      let nextIdx = prev;
      let attempts = 0;
      
      do {
        if (direction === 'clockwise') {
          nextIdx = (nextIdx + 1) % players.length;
        } else {
          nextIdx = nextIdx === 0 ? players.length - 1 : nextIdx - 1;
        }
        attempts++;
      } while (players[nextIdx]?.isOut && attempts < players.length);
      
      return nextIdx;
    });
  }, [direction, players]);

  const playCard = (player: Player, card: CardType, chosenColor?: CardColor) => {
    // Validate the card can be played
    if (!canPlayCard(card) && card.color !== 'wild') {
      showMessage("Invalid card play!", 'error');
      return;
    }
    
    const newHand = player.hand.filter(c => c.id !== card.id);
    
    // Update player's hand
    setPlayers(prev => prev.map(p => 
      p.id === player.id ? { ...p, hand: newHand } : p
    ));

    // Check if player forgot to call UNO (has 1 card left after playing, didn't call UNO)
    if (newHand.length === 1 && !player.calledUno) {
      setLastPlayerWithOneCard(player.id);
      setUnoChallengePending(true);
      
      if (player.isHuman) {
        showMessage('⚠️ You have 1 card left - Call UNO!', 'error');
      }
      
      // Give 0.5 seconds for someone to challenge
      setTimeout(() => {
        setUnoChallengePending(false);
      }, 500);
    } else {
      setLastPlayerWithOneCard(null);
      setUnoChallengePending(false);
    }

    let actualCard = card;
    if (chosenColor && card.color === 'wild') {
      actualCard = { ...card, color: chosenColor };
      setCurrentColor(chosenColor);
      showMessage(`${player.isHuman ? 'You' : player.name} chose ${chosenColor.toUpperCase()}!`, 'info');
    } else {
      setCurrentColor(card.color);
    }

    setDiscardPile(prev => [...prev, actualCard]);

    // Check for win
    if (newHand.length === 0) {
      const currentPosition = finishOrder.length + 1;
      
      playSound('win');
      
      // Mark player as finished
      setPlayers(prev => prev.map(p => 
        p.id === player.id 
          ? { ...p, isOut: true, finishPosition: currentPosition }
          : p
      ));
      
      // Add to finish order
      const finishedPlayer = { ...player, finishPosition: currentPosition, isOut: true };
      setFinishOrder(prev => [...prev, finishedPlayer]);
      
      showMessage(`${player.name} finishes in position #${currentPosition}!`);
      
      if (currentPosition === 1) {
        createConfetti();
      }
      
      // Check if only one player remains (game over)
      const remainingPlayers = players.filter(p => !p.isOut && p.id !== player.id);
      if (remainingPlayers.length === 1) {
        // Last player automatically gets last place
        const lastPlayer = remainingPlayers[0];
        setPlayers(prev => prev.map(p => 
          p.id === lastPlayer.id 
            ? { ...p, isOut: true, finishPosition: playerCount }
            : p
        ));
        setFinishOrder(prev => [...prev, { ...lastPlayer, finishPosition: playerCount, isOut: true }]);
        
        setTimeout(() => {
          setGamePhase('gameover');
          createConfetti();
        }, 2000);
        return;
      }
      
      // Continue game with remaining players
      setTimeout(() => nextPlayer(), 1000);
      return;
    }

    // Handle special cards
    let skipNext = false;
    
    // Themed messages
    const getThemedMessage = (baseType: string, playerName: string) => {
      if (gameMode === 'minecraft') {
        if (baseType === 'skip') return `⛏️ ${playerName} placed a TNT Block! Next player skipped!`;
        if (baseType === 'reverse') return `🔄 ${playerName} used a Minecart! Direction reversed!`;
        if (baseType === 'draw2') return `💎 ${playerName} mined diamonds! Next player draws 2!`;
        if (baseType === 'wild-draw4') return `🌋 ${playerName} found Ancient Debris! Draw 4!`;
      } else if (gameMode === 'harry-potter') {
        if (baseType === 'skip') return `⚡ ${playerName} cast Petrificus Totalus! Player frozen!`;
        if (baseType === 'reverse') return `🔮 ${playerName} used Time-Turner! Direction reversed!`;
        if (baseType === 'draw2') return `🪄 ${playerName} cast Expelliarmus! Draw 2 cards!`;
        if (baseType === 'wild-draw4') return `⚡ ${playerName} unleashed Avada Kedavra! Draw 4!`;
      } else if (gameMode === 'bts') {
        if (baseType === 'skip') return `🎤 ${playerName} performed Dynamite! Player skipped!`;
        if (baseType === 'reverse') return `💜 ${playerName} did the Mic Drop! Direction reversed!`;
        if (baseType === 'draw2') return `🎵 ${playerName} sang Butter! Draw 2 cards!`;
        if (baseType === 'wild-draw4') return `🌟 ${playerName} dropped Permission to Dance! Draw 4!`;
      } else if (gameMode === 'clash-of-clans') {
        if (baseType === 'skip') return `🏰 ${playerName} deployed Wall Breakers! Base skipped!`;
        if (baseType === 'reverse') return `🔄 ${playerName} used Recall Spell! Direction reversed!`;
        if (baseType === 'draw2') return `⚡ ${playerName} cast Lightning Spell! Draw 2 troops!`;
        if (baseType === 'wild-draw4') return `💣 ${playerName} deployed P.E.K.K.A! Draw 4 troops!`;
      } else if (gameMode === 'mobile-legends') {
        if (baseType === 'skip') return `⚔️ ${playerName} used Hero Skill! Enemy stunned!`;
        if (baseType === 'reverse') return `🔄 ${playerName} activated Flicker! Direction reversed!`;
        if (baseType === 'draw2') return `💥 ${playerName} landed Ultimate! Enemy draws 2!`;
        if (baseType === 'wild-draw4') return `🌟 ${playerName} got Savage! Draw 4 cards!`;
      } else if (gameMode === 'call-of-duty') {
        if (baseType === 'skip') return `🎯 ${playerName} called UAV! Target skipped!`;
        if (baseType === 'reverse') return `🔄 ${playerName} used Tactical Insert! Direction reversed!`;
        if (baseType === 'draw2') return `💣 ${playerName} threw Flashbang! Draw 2 cards!`;
        if (baseType === 'wild-draw4') return `💥 ${playerName} called Airstrike! Draw 4 cards!`;
      } else if (gameMode === 'guitar') {
        if (baseType === 'skip') return `🎸 ${playerName} hit Star Power! Next solo skipped!`;
        if (baseType === 'reverse') return `🔄 ${playerName} reversed the setlist! Direction changed!`;
        if (baseType === 'draw2') return `🎵 ${playerName} nailed a solo! Draw 2 notes!`;
        if (baseType === 'wild-draw4') return `🌟 ${playerName} hit 100% combo! Draw 4 notes!`;
      } else if (gameMode === 'code-vibes') {
        if (baseType === 'skip') return `💻 ${playerName} executed break; Next iteration skipped!`;
        if (baseType === 'reverse') return `🔄 ${playerName} called reverse()! Order inverted!`;
        if (baseType === 'draw2') return `⚠️ ${playerName} threw Exception! Catch 2 errors!`;
        if (baseType === 'wild-draw4') return `🔥 ${playerName} caused Stack Overflow! Draw 4!`;
      }
      
      // Default messages
      if (baseType === 'skip') return `⏭️ ${playerName} played Skip!`;
      if (baseType === 'reverse') return `🔄 ${playerName} played Reverse!`;
      if (baseType === 'draw2') return `🎴 ${playerName} played Draw 2!`;
      if (baseType === 'wild-draw4') return `🌈 ${playerName} played Wild Draw 4!`;
      return `${playerName} played a card!`;
    };
    
    if (card.type === 'skip') {
      skipNext = true;
      showMessage(getThemedMessage('skip', player.name), 'success');
    } else if (card.type === 'reverse') {
      setDirection(prev => prev === 'clockwise' ? 'counterclockwise' : 'clockwise');
      showMessage(getThemedMessage('reverse', player.name), 'success');
      const activePlayers = players.filter(p => !p.isOut);
      if (activePlayers.length === 2) {
        skipNext = true;
      }
    } else if (card.type === 'draw2') {
      // Find next active player
      let nextIdx = currentPlayerIndex;
      let attempts = 0;
      do {
        nextIdx = direction === 'clockwise' 
          ? (nextIdx + 1) % players.length
          : nextIdx === 0 ? players.length - 1 : nextIdx - 1;
        attempts++;
      } while (players[nextIdx]?.isOut && attempts < players.length);
      
      const nextPlayerObj = players[nextIdx];
      if (nextPlayerObj && !nextPlayerObj.isOut) {
        // No Mercy mode: Stack draw cards
        if (gameMode === 'no-mercy') {
          setNoMercyStack(prev => prev + 2);
          showMessage(`😈 +2 added to stack! Total: ${noMercyStack + 2}`, 'error');
        } else {
          setTimeout(() => {
            drawCard(nextPlayerObj, 2);
            showMessage(getThemedMessage('draw2', player.name), 'info');
          }, 500);
        }
      }
      skipNext = true;
    } else if (card.type === 'wild-draw4') {
      // Find next active player
      let nextIdx = currentPlayerIndex;
      let attempts = 0;
      do {
        nextIdx = direction === 'clockwise' 
          ? (nextIdx + 1) % players.length
          : nextIdx === 0 ? players.length - 1 : nextIdx - 1;
        attempts++;
      } while (players[nextIdx]?.isOut && attempts < players.length);
      
      const nextPlayerObj = players[nextIdx];
      if (nextPlayerObj && !nextPlayerObj.isOut) {
        // No Mercy mode: Stack draw cards
        if (gameMode === 'no-mercy') {
          setNoMercyStack(prev => prev + 4);
          showMessage(`😈 +4 added to stack! Total: ${noMercyStack + 4}`, 'error');
        } else {
          setTimeout(() => {
            drawCard(nextPlayerObj, 4);
            showMessage(getThemedMessage('wild-draw4', player.name), 'info');
          }, 500);
        }
      }
      skipNext = true;
    }

    // Move to next player
    setTimeout(() => {
      nextPlayer();
      if (skipNext) {
        setTimeout(() => nextPlayer(), 100);
      }
    }, 600);
  };

  const handlePlayerCardClick = (card: CardType) => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer.isHuman) return;
    if (currentPlayer.isOut) return;

    if (!canPlayCard(card)) {
      showMessage("Can't play that card!", 'error');
      playSound('draw');
      return;
    }

    // Check for same-number combo opportunity
    if (card.type === 'number') {
      const sameNumberCards = currentPlayer.hand.filter(c => 
        c.type === 'number' && c.value === card.value
      );
      
      if (sameNumberCards.length > 1) {
        // Automatically play all same-number cards
        playSound('special');
        showMessage(`🎯 Combo! Playing ${sameNumberCards.length} cards with number ${card.value}!`, 'success');
        
        // Remove all same-number cards from hand
        const newHand = currentPlayer.hand.filter(c => 
          !(c.type === 'number' && c.value === card.value)
        );
        
        // Update player hand
        setPlayers(prev => prev.map(p => 
          p.id === currentPlayer.id ? { ...p, hand: newHand } : p
        ));
        
        // Add all cards to discard pile (last card determines the color)
        const lastCard = sameNumberCards[sameNumberCards.length - 1];
        setDiscardPile(prev => [...prev, ...sameNumberCards]);
        setCurrentColor(lastCard.color);
        
        // Check for win
        if (newHand.length === 0) {
          const currentPosition = finishOrder.length + 1;
          playSound('win');
          setPlayers(prev => prev.map(p => 
            p.id === currentPlayer.id 
              ? { ...p, isOut: true, finishPosition: currentPosition }
              : p
          ));
          const finishedPlayer = { ...currentPlayer, finishPosition: currentPosition, isOut: true };
          setFinishOrder(prev => [...prev, finishedPlayer]);
          showMessage(`${currentPlayer.name} finishes in position #${currentPosition}!`);
          if (currentPosition === 1) createConfetti();
          
          const remainingPlayers = players.filter(p => !p.isOut && p.id !== currentPlayer.id);
          if (remainingPlayers.length === 1) {
            const lastPlayer = remainingPlayers[0];
            setPlayers(prev => prev.map(p => 
              p.id === lastPlayer.id 
                ? { ...p, isOut: true, finishPosition: playerCount }
                : p
            ));
            setFinishOrder(prev => [...prev, { ...lastPlayer, finishPosition: playerCount, isOut: true }]);
            setTimeout(() => {
              setGamePhase('gameover');
              createConfetti();
            }, 2000);
            return;
          }
          setTimeout(() => nextPlayer(), 1000);
          return;
        }
        
        // UNO check
        if (newHand.length === 1 && !currentPlayer.calledUno) {
          setLastPlayerWithOneCard(currentPlayer.id);
          setUnoChallengePending(true);
          showMessage('⚠️ You have 1 card left - Call UNO!', 'error');
          setTimeout(() => {
            setUnoChallengePending(false);
          }, 500);
        }
        
        // Move to next player
        setTimeout(() => nextPlayer(), 600);
        return;
      }
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      playSound('special');
    } else {
      if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw2' || card.type === 'wild-draw4') {
        playSound('special');
      } else {
        playSound('card');
      }
      playCard(currentPlayer, card);
    }
  };

  const handleColorChoice = (color: CardColor) => {
    if (pendingWildCard) {
      playSound('special');
      const currentPlayer = players[currentPlayerIndex];
      playCard(currentPlayer, pendingWildCard, color);
    }
    setShowColorPicker(false);
    setPendingWildCard(null);
  };

  const handleDrawCard = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer.isHuman) return;
    if (currentPlayer.isOut) return;

    // Check if player has any playable cards before drawing
    const hasPlayableCard = currentPlayer.hand.some(card => canPlayCard(card));
    
    if (hasPlayableCard) {
      showMessage('⚠️ You have playable cards! Play one first.', 'error');
      playSound('draw');
      return;
    }

    // No playable cards - notify and draw
    showMessage('💡 No playable cards - drawing from deck...', 'info');
    playSound('draw');
    const drawn = drawCard(currentPlayer, 1);
    
    if (drawn.length > 0) {
      const drawnCard = drawn[0];
      
      // Check if the drawn card is playable
      if (canPlayCard(drawnCard)) {
        // Automatically play the drawn card
        showMessage(`✅ Drew playable card - playing it now!`, 'success');
        setTimeout(() => {
          handlePlayerCardClick(drawnCard);
        }, 800);
      } else {
        // Drawn card is not playable - auto-pass turn
        showMessage('❌ Drawn card is not playable - turn passed', 'info');
        setTimeout(() => nextPlayer(), 1200);
      }
    }
  };

  const handleCallUno = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer.isHuman) return;
    if (currentPlayer.isOut) return;

    if (currentPlayer.hand.length === 1) {
      playSound('uno');
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayer.id ? { ...p, calledUno: true } : p
      ));
      setLastPlayerWithOneCard(null);
      setUnoChallengePending(false);
      showMessage('🔥 UNO!', 'success');
    } else if (currentPlayer.hand.length === 0) {
      showMessage('You already finished!', 'info');
    } else {
      showMessage(`Can't call UNO with ${currentPlayer.hand.length} cards!`, 'error');
    }
  };

  const handleChallengeUno = (challengerName?: string) => {
    if (!unoChallengePending || !lastPlayerWithOneCard) return;
    
    const challengedPlayer = players.find(p => p.id === lastPlayerWithOneCard);
    if (!challengedPlayer || challengedPlayer.calledUno || challengedPlayer.hand.length !== 1) return;
    
    // Challenge successful - player forgot to call UNO
    playSound('draw');
    drawCard(challengedPlayer, 2);
    
    const challengerText = challengerName || 'Someone';
    showMessage(`⚡ ${challengerText} caught ${challengedPlayer.isHuman ? 'you' : challengedPlayer.name}! Draw 2 penalty cards!`, 'error');
    
    setUnoChallengePending(false);
    setLastPlayerWithOneCard(null);
  };

  // Check if human player needs hint for no playable cards
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isHuman || currentPlayer.isOut) return;

    // Show a hint if no playable cards
    const hasPlayableCard = currentPlayer.hand.some(card => canPlayCard(card));
    
    if (!hasPlayableCard && deck.length > 0) {
      const hintTimeout = setTimeout(() => {
        showMessage('💡 No playable cards available - you must draw from the deck', 'info');
      }, 1500);

      return () => clearTimeout(hintTimeout);
    }
  }, [currentPlayerIndex, gamePhase, players]);

  // AI Challenge UNO Logic
  useEffect(() => {
    if (!unoChallengePending || !lastPlayerWithOneCard) return;
    
    const challengedPlayer = players.find(p => p.id === lastPlayerWithOneCard);
    if (!challengedPlayer || challengedPlayer.calledUno) return;
    
    // ALL AI players can try to challenge
    const aiPlayers = players.filter(p => !p.isHuman && !p.isOut && p.id !== lastPlayerWithOneCard);
    
    if (aiPlayers.length === 0) return;
    
    // Each AI has a chance to challenge based on difficulty
    const challengeChance = aiDifficulty === 'hard' ? 0.95 : aiDifficulty === 'medium' ? 0.7 : 0.4;
    
    // Pick random AI to potentially challenge (simulates speed race)
    const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
    
    if (Math.random() < challengeChance) {
      // Reaction time based on difficulty
      const reactionTime = aiDifficulty === 'hard' ? 100 : aiDifficulty === 'medium' ? 500 : 1000;
      
      const timeout = setTimeout(() => {
        // Double-check conditions still valid
        if (unoChallengePending && challengedPlayer.hand.length === 1 && !challengedPlayer.calledUno) {
          showMessage(`⚡ ${randomAI.name} is challenging!`, 'info');
          setTimeout(() => {
            handleChallengeUno(randomAI.name);
          }, 300);
        }
      }, reactionTime);
      
      return () => clearTimeout(timeout);
    }
  }, [unoChallengePending, lastPlayerWithOneCard, players, aiDifficulty]);

  // AI Turn Logic
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.isHuman || currentPlayer.isOut) return;

    const aiTurn = setTimeout(() => {
      // Auto-call UNO for AI when they have 2 cards (before playing)
      if (currentPlayer.hand.length === 2 && !currentPlayer.calledUno) {
        setPlayers(prev => prev.map(p => 
          p.id === currentPlayer.id ? { ...p, calledUno: true } : p
        ));
        showMessage(`${currentPlayer.name} calls UNO!`, 'info');
      }

      // Smart AI with difficulty levels
      const playableCards = currentPlayer.hand.filter(card => canPlayCard(card));
      
      let playableCard: CardType | undefined;
      
      if (aiDifficulty === 'hard') {
        // Hard AI: Strategic play
        const wildDraw4 = playableCards.find(c => c.type === 'wild-draw4');
        const draw2 = playableCards.find(c => c.type === 'draw2');
        const skip = playableCards.find(c => c.type === 'skip');
        const reverse = playableCards.find(c => c.type === 'reverse');
        const wild = playableCards.find(c => c.type === 'wild');
        
        // Check if any opponent is close to winning
        const opponentsCloseToWin = players.some(p => !p.isOut && p.hand.length <= 2 && p.id !== currentPlayer.id);
        
        if (opponentsCloseToWin && (wildDraw4 || draw2 || skip)) {
          playableCard = wildDraw4 || draw2 || skip;
        } else if (currentPlayer.hand.length === 2) {
          // About to win, play safe
          playableCard = playableCards.find(c => c.type === 'number') || playableCards[0];
        } else {
          // Play strategically
          playableCard = playableCards.find(c => c.type === 'number') || reverse || skip || draw2 || wild || wildDraw4 || playableCards[0];
        }
      } else if (aiDifficulty === 'medium') {
        // Medium AI: Prioritize action cards
        const actionCard = playableCards.find(c => 
          c.type === 'wild-draw4' || c.type === 'draw2' || c.type === 'skip' || c.type === 'reverse'
        );
        playableCard = actionCard || playableCards[0];
      } else {
        // Easy AI: Random valid card
        playableCard = playableCards[Math.floor(Math.random() * playableCards.length)];
      }

      if (playableCard) {
        if (playableCard.color === 'wild') {
          // AI chooses most common color in hand
          const colorCounts = { red: 0, yellow: 0, green: 0, blue: 0 };
          currentPlayer.hand.forEach(c => {
            if (c.color !== 'wild') {
              colorCounts[c.color as keyof typeof colorCounts]++;
            }
          });
          const chosenColor = (Object.keys(colorCounts) as CardColor[])
            .reduce((a, b) => colorCounts[a as keyof typeof colorCounts] > colorCounts[b as keyof typeof colorCounts] ? a : b) as CardColor;
          playCard(currentPlayer, playableCard, chosenColor);
        } else {
          playCard(currentPlayer, playableCard);
        }
      } else {
        const drawn = drawCard(currentPlayer, 1);
        if (drawn.length > 0) {
          showMessage(`${currentPlayer.name} draws a card`, 'info');
        }
        setTimeout(() => nextPlayer(), 800);
      }
    }, 1200);

    return () => clearTimeout(aiTurn);
  }, [currentPlayerIndex, gamePhase, players, aiDifficulty]);

  // Stop theme music when leaving playing phase
  useEffect(() => {
    if (gamePhase !== 'playing') {
      playThemeMusic('stop');
    }
  }, [gamePhase, playThemeMusic]);

  // Restart theme music when sound is toggled
  useEffect(() => {
    if (gamePhase === 'playing' && (gameMode === 'minecraft' || gameMode === 'harry-potter' || gameMode === 'bts' ||
        gameMode === 'clash-of-clans' || gameMode === 'mobile-legends' || gameMode === 'call-of-duty' ||
        gameMode === 'guitar' || gameMode === 'code-vibes')) {
      if (soundEnabled) {
        playThemeMusic(gameMode as any);
      } else {
        playThemeMusic('stop');
      }
    }
  }, [soundEnabled, gamePhase, gameMode, playThemeMusic]);

  if (gamePhase === 'menu') {
    return (
      <div className="game-container">
        {!assetsLoaded && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}
        <div className="menu-screen">
          <div className={assetsLoaded ? 'menu-title' : 'menu-title text-only'}>UNO</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
            <button 
              className="menu-button" 
              onClick={() => {
                playSound('button');
                setGamePhase('mode-select');
              }}
              style={{ 
                width: '100%', 
                maxWidth: '300px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '18px',
                padding: '15px 30px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🎮 Play Game
            </button>
            
            <button 
              className="menu-button" 
              onClick={() => {
                playSound('button');
                setSoundEnabled(!soundEnabled);
              }}
              style={{ 
                width: '100%', 
                maxWidth: '300px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                fontSize: '18px',
                padding: '15px 30px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
            </button>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
              <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                🎴 How to Play
              </strong>
              <div style={{ fontSize: '13px', opacity: 0.9, textAlign: 'left' }}>
                • Match cards by color or number<br />
                • Use action cards strategically<br />
                • Call UNO when you have one card!<br />
                • First to empty their hand wins
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'mode-select') {
    const standardModes = gameModes.filter(m => m.category === 'standard');
    const specialModes = gameModes.filter(m => m.category === 'special');
    const themedModes = gameModes.filter(m => m.category === 'themed');

    return (
      <div className="game-container">
        <div className="mode-select-screen">
          <div className="mode-select-header">
            <button className="back-button" onClick={() => {
              playSound('button');
              setGamePhase('menu');
            }}>
              ← Back
            </button>
            <h2 className="mode-select-title">Game Setup</h2>
          </div>
          
          <div className="player-count-section" style={{ marginBottom: '30px' }}>
            <div className="section-title">Number of Players</div>
            <div className="player-count-selector">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(count => (
                <button
                  key={count}
                  className={`player-count-button ${playerCount === count ? 'active' : ''}`}
                  onClick={() => {
                    playSound('button');
                    setPlayerCount(count);
                  }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="player-count-section" style={{ marginBottom: '30px' }}>
            <div className="section-title">AI Difficulty</div>
            <div className="player-count-selector">
              {(['easy', 'medium', 'hard'] as const).map(difficulty => (
                <button
                  key={difficulty}
                  className={`player-count-button ${aiDifficulty === difficulty ? 'active' : ''}`}
                  onClick={() => {
                    playSound('button');
                    setAiDifficulty(difficulty);
                  }}
                  style={{ minWidth: '100px', textTransform: 'capitalize' }}
                >
                  {difficulty === 'easy' && '😊 '}
                  {difficulty === 'medium' && '🤔 '}
                  {difficulty === 'hard' && '🧠 '}
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          {/* Standard Modes */}
          <div className="mode-category">
            <div className="category-title">📘 Standard Modes</div>
            <div className="mode-grid">
              {standardModes.map(mode => (
                <div
                  key={mode.id}
                  className={`mode-card ${gameMode === mode.id ? 'selected' : ''}`}
                  onClick={() => {
                    playSound('button');
                    setGameMode(mode.id);
                  }}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-description">{mode.description}</div>
                  <div className="mode-features">
                    {mode.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="mode-feature">✓ {feature}</div>
                    ))}
                  </div>
                  <div className="mode-difficulty">{mode.difficulty}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Modes */}
          <div className="mode-category">
            <div className="category-title">⚡ Special Modes</div>
            <div className="mode-grid">
              {specialModes.map(mode => (
                <div
                  key={mode.id}
                  className={`mode-card ${gameMode === mode.id ? 'selected' : ''}`}
                  onClick={() => {
                    playSound('button');
                    setGameMode(mode.id);
                  }}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-description">{mode.description}</div>
                  <div className="mode-features">
                    {mode.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="mode-feature">✓ {feature}</div>
                    ))}
                  </div>
                  <div className="mode-difficulty">{mode.difficulty}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Themed Modes */}
          <div className="mode-category">
            <div className="category-title">🎨 Themed Modes</div>
            <div className="mode-grid">
              {themedModes.map(mode => (
                <div
                  key={mode.id}
                  className={`mode-card ${gameMode === mode.id ? 'selected' : ''}`}
                  onClick={() => {
                    playSound('button');
                    setGameMode(mode.id);
                  }}
                >
                  <div className="mode-icon">{mode.icon}</div>
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-description">{mode.description}</div>
                  <div className="mode-features">
                    {mode.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="mode-feature">✓ {feature}</div>
                    ))}
                  </div>
                  <div className="mode-difficulty">{mode.difficulty}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="menu-button start-button" onClick={() => {
            playSound('shuffle');
            startGame();
          }}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'gameover') {
    const getMedalEmoji = (position: number) => {
      if (position === 1) return '🥇';
      if (position === 2) return '🥈';
      if (position === 3) return '🥉';
      return '🏁';
    };

    const getPositionSuffix = (position: number) => {
      const j = position % 10;
      const k = position % 100;
      if (j === 1 && k !== 11) return 'st';
      if (j === 2 && k !== 12) return 'nd';
      if (j === 3 && k !== 13) return 'rd';
      return 'th';
    };

    // Sort finish order by position
    const sortedFinishOrder = [...finishOrder].sort((a, b) => 
      (a.finishPosition || 999) - (b.finishPosition || 999)
    );

    const humanPlayer = sortedFinishOrder.find(p => p.isHuman);

    return (
      <div className="game-container">
        <div className="gameover-screen">
          <div className="menu-title text-only">Game Complete!</div>
          
          {humanPlayer && (
            <div className="rp-reward-card">
              <div className="rp-reward-title">
                {humanPlayer.finishPosition === 1 ? '🎉 Victory!' : 
                 humanPlayer.finishPosition === 2 ? '��� Great Job!' :
                 humanPlayer.finishPosition === 3 ? '🥉 Well Played!' : '💪 Good Try!'}
              </div>
              <div style={{ fontSize: '48px', margin: '10px 0' }}>
                {getMedalEmoji(humanPlayer.finishPosition || 4)}
              </div>
              <div style={{ fontSize: '18px', color: '#fff', opacity: 0.9 }}>
                You finished {humanPlayer.finishPosition || 'last'}{getPositionSuffix(humanPlayer.finishPosition || playerCount)}!
              </div>
            </div>
          )}
          
          <div className="leaderboard">
            <div className="leaderboard-title">🏆 Final Rankings ��</div>
            {sortedFinishOrder.map((player, idx) => (
              <div 
                key={player.id} 
                className={`leaderboard-row ${player.isHuman ? 'player-row' : ''} ${idx === 0 ? 'winner-row' : ''}`}
              >
                <div className="leaderboard-position">
                  {getMedalEmoji(player.finishPosition || idx + 1)}
                </div>
                <div className="leaderboard-name">
                  {player.name}
                  {player.isHuman && ' (You)'}
                </div>
                <div className="leaderboard-rank">
                  {player.finishPosition || idx + 1}{getPositionSuffix(player.finishPosition || idx + 1)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className="menu-button" 
              onClick={() => {
                playSound('button');
                startGame();
              }}
            >
              Play Again
            </button>
            <button 
              className="menu-button" 
              onClick={() => {
                playSound('button');
                setGamePhase('menu');
              }}
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex];
  const humanPlayer = players.find(p => p.isHuman);

  // Get themed styles based on game mode
  const getThemeStyles = () => {
    switch (gameMode) {
      case 'minecraft':
        return {
          background: 'linear-gradient(135deg, #4A7C59 0%, #6B8E23 100%)',
          filter: 'contrast(1.1) saturate(1.2)',
          fontFamily: 'monospace'
        };
      case 'harry-potter':
        return {
          background: 'linear-gradient(135deg, #2C1810 0%, #5D4037 100%)',
          filter: 'sepia(0.2) saturate(1.3)',
          fontFamily: 'Georgia, serif'
        };
      case 'bts':
        return {
          background: 'linear-gradient(135deg, #7B2CBF 0%, #C77DFF 100%)',
          filter: 'saturate(1.4) brightness(1.1)',
          fontFamily: 'system-ui'
        };
      case 'clash-of-clans':
        return {
          background: 'linear-gradient(135deg, #1B5E20 0%, #4CAF50 50%, #81C784 100%)',
          filter: 'contrast(1.15)',
          fontFamily: 'Impact, fantasy'
        };
      case 'mobile-legends':
        return {
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)',
          filter: 'saturate(1.5) brightness(1.05)',
          fontFamily: 'Arial Black, sans-serif'
        };
      case 'call-of-duty':
        return {
          background: 'linear-gradient(135deg, #1A1A1A 0%, #2C2C2C 50%, #3E3E3E 100%)',
          filter: 'contrast(1.2) brightness(0.9)',
          fontFamily: 'Impact, sans-serif'
        };
      case 'guitar':
        return {
          background: 'linear-gradient(135deg, #D32F2F 0%, #F44336 50%, #FF5252 100%)',
          filter: 'saturate(1.6) contrast(1.1)',
          fontFamily: 'Comic Sans MS, cursive'
        };
      case 'code-vibes':
        return {
          background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 50%, #2A2F4A 100%)',
          filter: 'contrast(1.3)',
          fontFamily: 'Consolas, Monaco, monospace'
        };
      default:
        return {};
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div 
      className="game-container"
      style={gamePhase === 'playing' ? themeStyles : {}}>
      {gameMessage && (
        <div 
          className="game-message"
          style={{
            background: messageType === 'success' 
              ? 'linear-gradient(135deg, #27AE60 0%, #229954 100%)'
              : messageType === 'error'
              ? 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
              : 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)'
          }}
        >
          {gameMessage}
        </div>
      )}
      
      {/* Sound toggle button */}
      <button
        className="sound-toggle-button"
        onClick={() => {
          setSoundEnabled(!soundEnabled);
          if (!soundEnabled) playSound('button');
        }}
        title={soundEnabled ? 'Sound On' : 'Sound Off'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Theme music indicator */}
      {soundEnabled && (gameMode === 'minecraft' || gameMode === 'harry-potter' || gameMode === 'bts' || 
       gameMode === 'clash-of-clans' || gameMode === 'mobile-legends' || gameMode === 'call-of-duty' ||
       gameMode === 'guitar' || gameMode === 'code-vibes') && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          padding: '8px 12px',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <span style={{ animation: 'bounce 1s ease-in-out infinite' }}>🎵</span>
          <span>
            {gameMode === 'minecraft' && 'Minecraft Theme'}
            {gameMode === 'harry-potter' && 'Wizarding World Theme'}
            {gameMode === 'bts' && 'BTS Theme'}
            {gameMode === 'clash-of-clans' && 'Clash of Clans Theme'}
            {gameMode === 'mobile-legends' && 'Mobile Legends Theme'}
            {gameMode === 'call-of-duty' && 'Call of Duty Theme'}
            {gameMode === 'guitar' && 'Guitar Hero Theme'}
            {gameMode === 'code-vibes' && 'Code Vibes Theme'}
          </span>
        </div>
      )}
      
      {/* Pause/Menu button */}
      <button
        className="sound-toggle-button"
        style={{ top: '10px', left: '70px' }}
        onClick={() => {
          playSound('button');
          setShowPauseMenu(true);
        }}
        title="Pause Menu"
      >
        ⏸️
      </button>
      
      <div className="game-area">
        {/* Game Mode Badge */}
        <div className="game-mode-badge">
          {gameModes.find(m => m.id === gameMode)?.icon} {gameModes.find(m => m.id === gameMode)?.name}
        </div>

        {/* Finished Players */}
        {finishOrder.length > 0 && (
          <div className="finished-players">
            <span className="finished-players-title">Finished:</span>
            {finishOrder.map(player => (
              <div key={player.id} className="finished-player-badge">
                {player.finishPosition === 1 ? '🥇' : player.finishPosition === 2 ? '🥈' : player.finishPosition === 3 ? '🥉' : '🏁'}
                {player.name}
              </div>
            ))}
          </div>
        )}

        {/* Opponents Area */}
        <div className="opponents-area">
          {players.filter(p => !p.isHuman && !p.isOut).map((opponent, idx) => {
            const avatarEmojis = ['🤖', '👾', '🎮', '🎯', '🦾', '🦿', '👽', '��'];
            const isCurrentTurn = currentPlayer?.id === opponent.id;
            const avatarIndex = parseInt(opponent.id) % avatarEmojis.length;
            return (
              <div 
                key={opponent.id} 
                className="opponent"
                style={{
                  border: isCurrentTurn ? '3px solid #F1C40F' : '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isCurrentTurn ? '0 0 20px rgba(241, 196, 15, 0.6)' : 'none'
                }}
              >
                <div className="opponent-name">
                  <div className="opponent-avatar">{avatarEmojis[avatarIndex]}</div>
                  <span>
                    {opponent.name} ({opponent.hand.length})
                    {opponent.calledUno && ' 🔥'}
                  </span>
                </div>
                <div className="opponent-cards">
                  {opponent.hand.slice(0, Math.min(5, opponent.hand.length)).map((card, cardIdx) => (
                    <Card key={`${opponent.id}-card-${cardIdx}`} card={{ id: '', color: 'red', type: 'number' }} faceDown small />
                  ))}
                  {opponent.hand.length > 5 && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#fff', 
                      marginLeft: '5px', 
                      alignSelf: 'center',
                      background: 'rgba(0,0,0,0.5)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}>
                      +{opponent.hand.length - 5}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Area */}
        <div className="center-area">
          <div className="current-turn-indicator">
            {currentPlayer?.isHuman ? 'Your' : currentPlayer?.name + "'s"} Turn
            {currentColor && discardPile.length > 0 && discardPile[discardPile.length - 1].color === 'wild' && (
              <span style={{ marginLeft: '8px' }}>
                ({currentColor.toUpperCase()})
              </span>
            )}
            {/* Showdown Timer */}
            {gameMode === 'showdown' && showdownTimer !== null && (
              <div style={{
                marginLeft: '20px',
                background: showdownTimer <= 5 ? 'rgba(231,76,60,0.9)' : 'rgba(52,152,219,0.9)',
                padding: '8px 15px',
                borderRadius: '8px',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '16px',
                border: '2px solid rgba(255,255,255,0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: showdownTimer <= 5 ? 'pulse 0.5s infinite' : 'none'
              }}>
                ⏱️ {showdownTimer}s
              </div>
            )}
          </div>
          
          {/* Deck and Discard Piles */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div className="deck-pile">
              <div className="pile-label">Draw Pile ({deck.length})</div>
              <Card 
                card={{ id: 'deck', color: 'red', type: 'number' }}
                faceDown
                onClick={currentPlayer?.isHuman && deck.length > 0 ? handleDrawCard : undefined}
                disabled={!currentPlayer?.isHuman || deck.length === 0}
              />
              {currentPlayer?.isHuman && deck.length > 0 && (
                <button
                  className="draw-card-button"
                  onClick={handleDrawCard}
                  style={{
                    position: 'absolute',
                    bottom: '-45px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                >
                  ➕ Draw Card
                </button>
              )}
            </div>

            <div className="discard-pile">
              <div className="pile-label">
                Discard Pile
                {currentColor && discardPile.length > 0 && discardPile[discardPile.length - 1].color === 'wild' && (
                  <span style={{ 
                    marginLeft: '6px', 
                    color: currentColor === 'red' ? '#E74C3C' : currentColor === 'yellow' ? '#F1C40F' : currentColor === 'green' ? '#27AE60' : '#3498DB',
                    fontWeight: 'bold'
                  }}>
                    ({currentColor.toUpperCase()})
                  </span>
                )}
              </div>
              {discardPile.length > 0 && (
                <Card card={discardPile[discardPile.length - 1]} disabled />
              )}
            </div>
          </div>

          {/* Mode-specific info displays */}
          {gameMode === 'no-mercy' && noMercyStack > 0 && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255,0,0,0.8)',
                padding: '10px 15px',
                borderRadius: '8px',
                color: '#fff',
                border: '2px solid #FF0000',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                😈 No Mercy Stack: +{noMercyStack} cards
              </div>
            </div>
          )}

          {gameMode === 'dos' && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <div style={{
                background: 'rgba(0,150,255,0.7)',
                padding: '10px 15px',
                borderRadius: '8px',
                color: '#fff',
                display: 'inline-block'
              }}>
                2️⃣ DOS Mode: Play TWO matching cards!
                {dosSecondCard && <span style={{ marginLeft: '10px', fontSize: '12px' }}>✓ First card selected</span>}
              </div>
            </div>
          )}

          {/* Themed Mode Special UI */}
          {gameMode === 'minecraft' && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #4A7C59 0%, #3D5A40 100%)',
              padding: '12px 18px',
              borderRadius: '8px',
              border: '3px solid #8B4513',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              ⛏️ MINECRAFT EDITION<br/>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>🧱 Build • Mine • Win</span>
            </div>
          )}
          
          {gameMode === 'harry-potter' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #740001 0%, #AE0001 100%)',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '3px solid #D4AF37',
                color: '#FFDD57',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Georgia, serif',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                🪄 WIZARDING WORLD<br/>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>⚡ Cast Spells • Win Glory</span>
              </div>
              {/* Floating stars effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(15)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 10 + 10}px`,
                    animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.6
                  }}>
                    ✨
                  </div>
                ))}
              </div>
            </>
          )}
          
          {gameMode === 'bts' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #7B2CBF 0%, #9D4EDD 100%)',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '3px solid #C77DFF',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'system-ui',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                boxShadow: '0 4px 20px rgba(199, 125, 255, 0.6)'
              }}>
                💜 BTS EDITION<br/>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>🎤 Dance • Sing • Win ARMY!</span>
              </div>
              {/* Floating hearts effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(20)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 15 + 15}px`,
                    animation: `floatUp ${Math.random() * 4 + 3}s ease-in infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: 0.7
                  }}>
                    💜
                  </div>
                ))}
              </div>
            </>
          )}
          
          {gameMode === 'clash-of-clans' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #1B5E20 0%, #388E3C 100%)',
                padding: '12px 18px',
                borderRadius: '8px',
                border: '3px solid #FFD700',
                color: '#FFD700',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Impact, fantasy',
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)'
              }}>
                🏰 CLASH OF CLANS<br/>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>⚔️ Deploy • Raid • Conquer</span>
              </div>
              {/* Floating troops and resources */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(15)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 18 + 12}px`,
                    animation: `marchTroops ${Math.random() * 8 + 5}s linear infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: 0.5
                  }}>
                    {['🏰', '⚔️', '🛡️', '💎', '⚡', '💣', '🧙'][Math.floor(Math.random() * 7)]}
                  </div>
                ))}
              </div>
              {/* Battle effect overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.2) 100%)',
                animation: 'pulseGlow 3s ease-in-out infinite',
                zIndex: 1
              }} />
            </>
          )}
          
          {gameMode === 'mobile-legends' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #42A5F5 100%)',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '3px solid #00E5FF',
                color: '#00E5FF',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Arial Black, sans-serif',
                textShadow: '0 0 10px #00E5FF, 2px 2px 6px rgba(0,0,0,0.9)',
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.6)',
                animation: 'pulseNeon 2s ease-in-out infinite'
              }}>
                ⚔️ MOBILE LEGENDS<br/>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>🏹 MOBA • Ultimate • Victory!</span>
              </div>
              {/* Energy particles and skill effects */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(20)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 16 + 10}px`,
                    animation: `energyBurst ${Math.random() * 2 + 1}s ease-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.7,
                    filter: 'drop-shadow(0 0 8px #00E5FF)'
                  }}>
                    {['⚔️', '✨', '💥', '⚡', '🌟', '💫'][Math.floor(Math.random() * 6)]}
                  </div>
                ))}
              </div>
              {/* Battle arena grid */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.1) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                opacity: 0.3,
                zIndex: 1
              }} />
            </>
          )}
          
          {gameMode === 'call-of-duty' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #1A1A1A 0%, #2C2C2C 100%)',
                padding: '12px 18px',
                borderRadius: '4px',
                border: '2px solid #00FF00',
                color: '#00FF00',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'Impact, sans-serif',
                textShadow: '0 0 10px #00FF00',
                boxShadow: '0 4px 20px rgba(0, 255, 0, 0.3)',
                letterSpacing: '1px'
              }}>
                🎯 CALL OF DUTY<br/>
                <span style={{ fontSize: '11px', opacity: 0.9 }}>🔫 Tactical • Combat • Mission Complete</span>
              </div>
              {/* Tactical HUD elements */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '60px',
                height: '60px',
                border: '2px solid rgba(0, 255, 0, 0.3)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 2
              }}>
                <div style={{
                  position: 'absolute',
                  width: '20px',
                  height: '2px',
                  background: 'rgba(0, 255, 0, 0.6)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }} />
                <div style={{
                  position: 'absolute',
                  width: '2px',
                  height: '20px',
                  background: 'rgba(0, 255, 0, 0.6)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }} />
              </div>
              {/* Smoke and battle debris */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 100 + 50}px`,
                    height: `${Math.random() * 100 + 50}px`,
                    background: 'radial-gradient(circle, rgba(100, 100, 100, 0.2), transparent)',
                    borderRadius: '50%',
                    animation: `driftSmoke ${Math.random() * 15 + 10}s linear infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: 0.3
                  }} />
                ))}
              </div>
              {/* Scanline effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 0, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 0, 0.03) 3px)',
                zIndex: 1
              }} />
            </>
          )}
          
          {gameMode === 'guitar' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #D32F2F 0%, #F44336 50%, #FF5252 100%)',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '3px solid #FFEB3B',
                color: '#FFEB3B',
                fontSize: '18px',
                fontWeight: 'bold',
                fontFamily: 'Comic Sans MS, cursive',
                textShadow: '0 0 10px #FF5252, 2px 2px 6px rgba(0,0,0,0.9)',
                boxShadow: '0 4px 20px rgba(255, 235, 59, 0.5)',
                animation: 'rockShake 0.5s ease-in-out infinite'
              }}>
                🎸 GUITAR HERO<br/>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>🎵 Shred • Solo • Rock!</span>
              </div>
              {/* Musical notes cascade */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(25)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '-50px',
                    left: `${(i * 4)}%`,
                    fontSize: `${Math.random() * 20 + 15}px`,
                    animation: `notesFall ${Math.random() * 3 + 2}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.6,
                    filter: 'drop-shadow(0 0 5px #FFEB3B)'
                  }}>
                    {['🎵', '🎶', '🎸', '🎤', '🥁'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>
              {/* Stage lights effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '200px',
                pointerEvents: 'none',
                background: 'radial-gradient(ellipse at top, rgba(255, 235, 59, 0.2), transparent)',
                animation: 'stageLights 3s ease-in-out infinite',
                zIndex: 1
              }} />
            </>
          )}
          
          {gameMode === 'code-vibes' && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
                padding: '12px 18px',
                borderRadius: '6px',
                border: '2px solid #00FF41',
                color: '#00FF41',
                fontSize: '14px',
                fontWeight: 'bold',
                fontFamily: 'Consolas, Monaco, monospace',
                textShadow: '0 0 10px #00FF41',
                boxShadow: '0 4px 20px rgba(0, 255, 65, 0.4)',
                letterSpacing: '0.5px'
              }}>
                {'<💻 CODE VIBES />'}<br/>
                <span style={{ fontSize: '11px', opacity: 0.9 }}>⌨️ function() {'{'}win();{'}'}</span>
              </div>
              {/* Matrix-style code rain */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0
              }}>
                {[...Array(20)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '-100px',
                    left: `${(i * 5)}%`,
                    fontSize: '12px',
                    color: '#00FF41',
                    fontFamily: 'monospace',
                    animation: `codeRain ${Math.random() * 5 + 3}s linear infinite`,
                    animationDelay: `${Math.random() * 3}s`,
                    opacity: 0.5,
                    textShadow: '0 0 5px #00FF41'
                  }}>
                    {['{', '}', '<', '>', '/', '=', '(', ')', ';', '[', ']', '0', '1'][Math.floor(Math.random() * 13)]}
                  </div>
                ))}
              </div>
              {/* Terminal-style grid */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 65, 0.03) 0px, transparent 1px, transparent 2px)',
                zIndex: 1
              }} />
              {/* Cursor blink */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '10px',
                height: '20px',
                background: '#00FF41',
                animation: 'blink 1s step-end infinite',
                pointerEvents: 'none',
                zIndex: 2
              }} />
            </>
          )}
        </div>

        {/* Player Area */}
        {humanPlayer && !humanPlayer.isOut && (
          <div className="player-area">
            <div className="player-controls">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '10px 20px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: currentPlayer?.isHuman ? '2px solid #F1C40F' : '2px solid rgba(255,255,255,0.3)'
              }}>
                <span style={{ fontSize: '24px' }}>👤</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>
                  You ({humanPlayer.hand.length} {humanPlayer.hand.length === 1 ? 'card' : 'cards'})
                </span>
              </div>
              
              <button
                className={`uno-button ${humanPlayer.calledUno ? 'called' : ''}`}
                onClick={handleCallUno}
                disabled={humanPlayer.hand.length !== 1 || humanPlayer.calledUno || !currentPlayer?.isHuman}
              >
                {humanPlayer.calledUno ? '✓ UNO!' : 'Call UNO'}
              </button>
              


              {/* Mode-Specific Action Buttons */}
              {currentPlayer?.isHuman && gameMode === 'spin' && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    setSpinWheelActive(true);
                    
                    // Random spinner outcomes
                    const outcomes: SpinAction[] = [
                      { type: 'draw', value: 1 },
                      { type: 'draw', value: 2 },
                      { type: 'skip' },
                      { type: 'reverse' },
                      { type: 'trade-hands' },
                      { type: 'discard-all-color', color: 'red' },
                      { type: 'everyone-draws' }
                    ];
                    
                    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
                    setSpinnerResult(result);
                    setShowSpinner(true);
                    
                    // Execute spinner result after showing animation
                    setTimeout(() => {
                      switch (result.type) {
                        case 'draw':
                          drawCard(currentPlayer, result.value || 1);
                          break;
                        case 'skip':
                          nextPlayer();
                          break;
                        case 'reverse':
                          setDirection(prev => prev === 'clockwise' ? 'counterclockwise' : 'clockwise');
                          break;
                        case 'trade-hands':
                          // Trade with random opponent
                          const opponents = players.filter(p => !p.isOut && !p.isHuman);
                          if (opponents.length > 0) {
                            const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
                            setPlayers(prev => prev.map(p => {
                              if (p.id === currentPlayer.id) return { ...p, hand: randomOpponent.hand };
                              if (p.id === randomOpponent.id) return { ...p, hand: currentPlayer.hand };
                              return p;
                            }));
                            showMessage(`🔀 Traded hands with ${randomOpponent.name}!`, 'info');
                          }
                          break;
                        case 'discard-all-color':
                          setPlayers(prev => prev.map(p => {
                            if (p.id === currentPlayer.id) {
                              const discarded = p.hand.filter(c => c.color === result.color);
                              showMessage(`🎨 Discarded ${discarded.length} ${result.color} cards!`, 'success');
                              return { ...p, hand: p.hand.filter(c => c.color !== result.color) };
                            }
                            return p;
                          }));
                          break;
                        case 'everyone-draws':
                          players.forEach(p => {
                            if (!p.isOut) drawCard(p, 1);
                          });
                          showMessage('🃏 Everyone draws 1 card!', 'info');
                          break;
                      }
                      
                      setTimeout(() => {
                        setShowSpinner(false);
                        setSpinWheelActive(false);
                      }, 2000);
                    }, 2000);
                  }}
                  disabled={spinWheelActive}
                  style={{
                    background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
                    fontSize: '16px',
                    padding: '12px 24px',
                    opacity: spinWheelActive ? 0.6 : 1
                  }}
                >
                  🎡 Spin Wheel
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'no-mercy' && noMercyStack > 0 && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('draw');
                    drawCard(currentPlayer, noMercyStack);
                    showMessage(`😈 Drew ${noMercyStack} cards from No Mercy stack!`, 'error');
                    setNoMercyStack(0);
                    setTimeout(() => nextPlayer(), 1000);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
                    fontSize: '16px',
                    padding: '12px 24px',
                    animation: 'pulse 1s infinite'
                  }}
                >
                  😈 Draw {noMercyStack} Cards
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'stacko' && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    setStackHeight(prev => prev + 1);
                    showMessage(`Stack height: ${stackHeight + 1}/10`, 'info');
                    if (stackHeight + 1 >= 10) {
                      showMessage('🏗️ Stack complete! Draw bonus card!', 'success');
                      drawCard(currentPlayer, 1);
                      setStackHeight(0);
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                    fontSize: '16px',
                    padding: '12px 24px'
                  }}
                >
                  🏗️ Stack ({stackHeight}/10)
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'splash' && !splashActive && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    setSplashActive(true);
                    showMessage('💦 Splash activated!', 'success');
                    setTimeout(() => setSplashActive(false), 3000);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                    fontSize: '16px',
                    padding: '12px 24px'
                  }}
                >
                  💦 Activate Splash
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'wild-jackpot' && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    const symbols = ['🍒', '🍋', '🍊', '🔔', '💎', '⭐'];
                    const newSlots = [
                      symbols[Math.floor(Math.random() * symbols.length)],
                      symbols[Math.floor(Math.random() * symbols.length)],
                      symbols[Math.floor(Math.random() * symbols.length)]
                    ];
                    setJackpotSlots(newSlots);
                    if (newSlots[0] === newSlots[1] && newSlots[1] === newSlots[2]) {
                      showMessage('🎰 JACKPOT! All players draw 3!', 'success');
                      players.forEach(p => {
                        if (!p.isOut) drawCard(p, 3);
                      });
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    fontSize: '16px',
                    padding: '12px 24px'
                  }}
                >
                  🎰 Spin Jackpot
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'power-grab' && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    showMessage('⚡ Grabbed a power card!', 'success');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
                    fontSize: '16px',
                    padding: '12px 24px'
                  }}
                >
                  ⚡ Grab Power Card
                </button>
              )}

              {currentPlayer?.isHuman && gameMode === 'flip' && (
                <button
                  className="uno-button"
                  onClick={() => {
                    playSound('special');
                    const newSide = flipSide === 'light' ? 'dark' : 'light';
                    setFlipSide(newSide);
                    
                    // Transform all cards to their flip side equivalent
                    setPlayers(prev => prev.map(p => ({
                      ...p,
                      hand: p.hand.map(card => {
                        // Dark side cards are more powerful
                        if (newSide === 'dark') {
                          if (card.type === 'draw2') {
                            return { ...card, type: 'wild-draw4' as any }; // Upgrade to draw 4
                          }
                          if (card.type === 'skip') {
                            return { ...card, type: 'draw2' as any }; // Skip becomes draw 2
                          }
                        } else {
                          // Light side - downgrade back
                          if (card.type === 'wild-draw4' && card.color !== 'wild') {
                            return { ...card, type: 'draw2' as any };
                          }
                        }
                        return card;
                      })
                    })));
                    
                    // Also transform discard pile
                    setDiscardPile(prev => prev.map(card => {
                      if (newSide === 'dark') {
                        if (card.type === 'draw2') return { ...card, type: 'wild-draw4' as any };
                        if (card.type === 'skip') return { ...card, type: 'draw2' as any };
                      }
                      return card;
                    }));
                    
                    showMessage(
                      `🔄 Flipped to ${newSide === 'dark' ? 'Dark' : 'Light'} side! ${newSide === 'dark' ? 'Cards upgraded!' : 'Cards normalized'}`, 
                      'success'
                    );
                  }}
                  style={{
                    background: flipSide === 'light' 
                      ? 'linear-gradient(135deg, #34495E 0%, #2C3E50 100%)'
                      : 'linear-gradient(135deg, #ECF0F1 0%, #BDC3C7 100%)',
                    fontSize: '16px',
                    padding: '12px 24px',
                    color: flipSide === 'light' ? '#fff' : '#000'
                  }}
                >
                  🔄 Flip to {flipSide === 'light' ? 'Dark' : 'Light'} ({flipSide === 'light' ? '🌙' : '☀️'})
                </button>
              )}
            </div>
            <div className="player-hand">
              {humanPlayer.hand.map(card => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() => handlePlayerCardClick(card)}
                  disabled={!currentPlayer?.isHuman || !canPlayCard(card)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Player finished message */}
        {humanPlayer?.isOut && (
          <div className="player-area" style={{ padding: '20px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              {humanPlayer.finishPosition === 1 && '🥇 You finished 1st! Congratulations! 🥇'}
              {humanPlayer.finishPosition === 2 && '🥈 You finished 2nd! Great job! 🥈'}
              {humanPlayer.finishPosition === 3 && '🥉 You finished 3rd! Well done! 🥉'}
              {humanPlayer.finishPosition && humanPlayer.finishPosition > 3 && 
                `🏁 You finished ${humanPlayer.finishPosition}${getPositionSuffix(humanPlayer.finishPosition)}!`}
              <br />
              <span style={{ fontSize: '14px', opacity: 0.9, marginTop: '10px', display: 'block' }}>
                Waiting for others to finish...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <>
          <div className="color-picker-overlay" onClick={() => {}} />
          <div className="color-picker">
            <div className="color-picker-title">Choose a Color</div>
            <div className="color-options">
              {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map(color => (
                <button
                  key={color}
                  className="color-option"
                  style={{ backgroundColor: color === 'red' ? '#E74C3C' : color === 'yellow' ? '#F1C40F' : color === 'green' ? '#27AE60' : '#3498DB' }}
                  onClick={() => handleColorChoice(color)}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Jackpot Slots Display */}
      {gameMode === 'wild-jackpot' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #FFD700 0%, #FF6B6B 50%, #9B59B6 100%)',
          padding: '15px 30px',
          borderRadius: '15px',
          display: 'flex',
          gap: '15px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '3px solid #FFD700',
          zIndex: 100
        }}>
          {jackpotSlots.map((slot, i) => (
            <div key={i} style={{
              background: '#fff',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              fontSize: '36px',
              fontWeight: 'bold',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2)'
            }}>
              {slot}
            </div>
          ))}
        </div>
      )}

      {/* Pause Menu */}
      {showPauseMenu && (
        <>
          <div className="color-picker-overlay" onClick={() => setShowPauseMenu(false)} />
          <div className="color-picker" style={{ minWidth: '320px' }}>
            <div className="color-picker-title">⏸️ Game Paused</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <button
                className="menu-button"
                onClick={() => {
                  playSound('button');
                  setShowPauseMenu(false);
                }}
                style={{ width: '100%', fontSize: '18px', padding: '14px' }}
              >
                ▶️ Resume Game
              </button>
              <button
                className="menu-button secondary-button"
                onClick={() => {
                  playSound('button');
                  if (confirm('Start a new game? Current progress will be lost.')) {
                    setShowPauseMenu(false);
                    startGame();
                  }
                }}
                style={{ width: '100%', fontSize: '18px', padding: '14px' }}
              >
                🔄 Restart Game
              </button>
              <button
                className="menu-button secondary-button"
                onClick={() => {
                  playSound('button');
                  if (confirm('Return to main menu? Current progress will be lost.')) {
                    setShowPauseMenu(false);
                    setGamePhase('menu');
                  }
                }}
                style={{ width: '100%', fontSize: '18px', padding: '14px' }}
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </>
      )}

      {/* Spinner Modal */}
      {showSpinner && spinnerResult && (
        <>
          <div className="color-picker-overlay" />
          <div className="spinner-modal" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '30px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 1000,
            minWidth: '300px'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
              🎡 Spinner Result!
            </div>
            <div style={{ fontSize: '60px', margin: '20px 0' }}>
              {spinnerResult.type === 'draw' && '🎴'}
              {spinnerResult.type === 'skip' && '⏭️'}
              {spinnerResult.type === 'reverse' && '🔄'}
              {spinnerResult.type === 'trade-hands' && '🔀'}
              {spinnerResult.type === 'discard-all-color' && '🎨'}
              {spinnerResult.type === 'everyone-draws' && '🃏'}
            </div>
            <div style={{ fontSize: '18px', color: '#fff', opacity: 0.9 }}>
              {spinnerResult.type === 'draw' && `Draw ${spinnerResult.value} cards!`}
              {spinnerResult.type === 'skip' && 'Skip next player!'}
              {spinnerResult.type === 'reverse' && 'Reverse direction!'}
              {spinnerResult.type === 'trade-hands' && 'Trade hands!'}
              {spinnerResult.type === 'discard-all-color' && `Discard all ${spinnerResult.color}!`}
              {spinnerResult.type === 'everyone-draws' && 'Everyone draws!'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
