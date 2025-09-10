import { GridPosition } from '../core/GameTypes';
import { CollectibleConfig } from '../entities/Collectible';

export interface LevelTheme {
  name: string;
  description: string;
  backgroundColor: number;
  collectibles: string[];
}

export const COLLECTIBLE_PRESETS: { [key: string]: CollectibleConfig } = {
  // Bathtime theme
  DUCKY: {
    type: 'DUCKY',
    fillColor: 0xFFD700,
    textColor: 0x000000,
    icon: '🦆',
    collectionThreshold: 0.8
  },
  BUBBLE: {
    type: 'BUBBLE',
    fillColor: 0xADD8E6,
    textColor: 0x000000,
    icon: '🧼',
    collectionThreshold: 0.5
  },
  BOAT: {
    type: 'BOAT',
    fillColor: 0xA52A2A,
    textColor: 0xFFFFFF,
    icon: '⛵',
    collectionThreshold: 0.8
  },
  
  // Garden theme
  FLOWER: {
    type: 'FLOWER',
    fillColor: 0xFF69B4,
    textColor: 0xFFFFFF,
    icon: '🌸',
    collectionThreshold: 0.6
  },
  LEAF: {
    type: 'LEAF',
    fillColor: 0x228B22,
    textColor: 0xFFFFFF,
    icon: '🍃',
    collectionThreshold: 0.4
  },
  POT: {
    type: 'POT',
    fillColor: 0xCD853F,
    textColor: 0x000000,
    icon: '🏺',
    collectionThreshold: 0.8
  },

  // Desert theme
  CACTUS: {
    type: 'CACTUS',
    fillColor: 0x2E8B57,
    textColor: 0xFFFFFF,
    icon: '🌵',
    collectionThreshold: 1.0
  },
  GEM: {
    type: 'GEM',
    fillColor: 0x8A2BE2,
    textColor: 0xFFFFFF,
    icon: '💎',
    collectionThreshold: 0.9
  },
  BOTTLE: {
    type: 'BOTTLE',
    fillColor: 0xFFFFFF,
    textColor: 0x000000,
    icon: '🍶',
    collectionThreshold: 0.7
  },
};

export const LEVEL_THEMES: { [key: string]: LevelTheme } = {
  BATHTIME: {
    name: "Bathtime Fun",
    description: "Fill the tub to collect all the floating toys!",
    backgroundColor: 0x00BFFF,
    collectibles: ['DUCKY', 'BUBBLE', 'BOAT']
  },
  GARDEN: {
    name: "Secret Garden",
    description: "Water the plants to help them bloom and collect them!",
    backgroundColor: 0x8FBC8F,
    collectibles: ['FLOWER', 'LEAF', 'POT']
  },
  DESERT: {
    name: "Thirsty Desert",
    description: "Bring water to the parched land and find treasures.",
    backgroundColor: 0xDAA520,
    collectibles: ['CACTUS', 'GEM', 'BOTTLE']
  }
};