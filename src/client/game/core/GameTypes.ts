import * as Phaser from 'phaser'
import * as Matter from 'matter-js';

// Defines the current mode of the game, which determines how player input is handled.
export enum GameMode {
  Play = 'Play',
  Edit = 'Edit',
}

// Defines the overall state of the game, used to control scene flow and UI.
export enum GameState {
  Loading = 'Loading',
  Playing = 'Playing',
  Paused = 'Paused',
  LevelComplete = 'LevelComplete',
  GameOver = 'GameOver',
}

// Defines the physics body for the dirt path created by the player.
export interface DirtBody {
  body: Matter.Body;
  graphics: Phaser.GameObjects.Graphics;
}

// Defines a position in the tile grid.
export interface GridPosition {
  row: number;
  col: number;
}
