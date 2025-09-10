import { LevelTheme } from '../data/CollectiblePresets';
import * as Phaser from 'phaser'

export interface GridPosition {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  waterLevel: number; // 0 to 1
  graphics: Phaser.GameObjects.Graphics | null;
}

export enum TileType {
  EMPTY = 'EMPTY',
  DIRT = 'DIRT',
  ROCK = 'ROCK',
  WATER = 'WATER'
}

export enum DigTool {
  FINGER = 'FINGER',
  SHOVEL = 'SHOVEL'
}

export interface WaterDrop {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  gridX: number;
  gridY: number;
}

export const LIQUID_TYPES = {
  WATER: {
    color: 0x4A90E2
  }
};

export class GridUtils {
  public static positionToPixel(pos: GridPosition, tileSize: number): Phaser.Geom.Point {
    return new Phaser.Geom.Point(
      pos.x * tileSize + tileSize / 2,
      pos.y * tileSize + tileSize / 2
    );
  }
  
  public static pixelToPosition(x: number, y: number, tileSize: number): GridPosition {
    return {
      x: Math.floor(x / tileSize),
      y: Math.floor(y / tileSize)
    };
  }

  public static isValidPosition(pos: GridPosition, gridWidth: number, gridHeight: number): boolean {
    return pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight;
  }

  public static arePositionsEqual(pos1: GridPosition, pos2: GridPosition): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }
}

export interface LevelData {
  gridWidth: number;
  gridHeight: number;
  waterSource: GridPosition;
  drain: GridPosition;
  collectibles: {
    position: GridPosition;
    type: string;
    id: string;
  }[];
  theme: LevelTheme;
}