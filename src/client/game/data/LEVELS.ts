// This file contains all the level configurations for the game.
// The UGC platform will add new levels to this file.

export const LEVELS = [
  // Level 1: A simple path to get started.
  {
    map: [
      'wwwwwwwwwwwwww',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wdddddcddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wwwwwwwwwwwwww',
    ],
    waterSource: { x: 3, y: 3 },
    waterDrain: { x: 10, y: 8 },
  },
  // Level 2: An example of a more complex path with multiple collectibles.
  {
    map: [
      'wwwwwwwwwwwwww',
      'wddddddddddddw',
      'wddddcdcwddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddcddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddddddddddw',
      'wddddcdcdcdcw',
      'wwwwwwwwwwwwww',
    ],
    waterSource: { x: 2, y: 1 },
    waterDrain: { x: 11, y: 9 },
  },
];
