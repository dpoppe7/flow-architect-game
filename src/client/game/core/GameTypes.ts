// Core game types and interfaces, enums and utilities
export interface GridPosition {
  x: number;
  y: number;
}

export interface LiquidType {
  id: string;
  name: string;
  color: number;
  viscosity: number;
  temperature: number;
  speed: number;
  properties: LiquidProperty[];
}

export enum LiquidProperty {
  CORROSIVE = 'corrosive',
  FLAMMABLE = 'flammable',
  TOXIC = 'toxic',
  CONDUCTIVE = 'conductive',
  FREEZABLE = 'freezable'
}

export enum PipeType {
  STANDARD = 'standard',
  GLASS = 'glass',
  METAL = 'metal',
  CERAMIC = 'ceramic'
}

export enum ComponentType {
  STRAIGHT_PIPE = 'straight_pipe',
  CORNER_PIPE = 'corner_pipe',
  T_JUNCTION = 't_junction',
  CROSS_JUNCTION = 'cross_junction',
  VALVE = 'valve',
  PUMP = 'pump',
  FILTER = 'filter',
  HEATER = 'heater',
  COOLER = 'cooler',
  MIXER = 'mixer',
  SEPARATOR = 'separator',
  RESERVOIR = 'reservoir'
}

export interface GameElement {
  id: string;
  type: ComponentType;
  position: GridPosition;
  rotation: number;
  material?: PipeType;
  active?: boolean;
}

export interface LiquidSource {
  id: string;
  position: GridPosition;
  liquidType: LiquidType;
  flowRate: number;
  pressure: number;
  direction: number;
}

export interface CollectionPoint {
  id: string;
  position: GridPosition;
  requiredLiquid: LiquidType;
  requiredVolume?: number;
  collected: number;
  mixtures?: { [key: string]: number };
}

export interface ResourceBudget {
  standardPipes: number;
  glassPipes: number;
  metalPipes: number;
  ceramicPipes: number;
  valves: number;
  pumps: number;
  filters: number;
  heaters: number;
  coolers: number;
  mixers: number;
  separators: number;
  reservoirs: number;
}

export interface LevelData {
  id: string;
  name: string;
  gridSize: { width: number; height: number };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  theme: string;
  sources: LiquidSource[];
  collectionPoints: CollectionPoint[];
  staticElements: GameElement[];
  budget: ResourceBudget;
  winConditions: WinCondition[];
  timeLimit?: number;
  parScore?: number;
}

export interface WinCondition {
  type: 'collection' | 'time' | 'efficiency' | 'purity';
  target: number;
  completed: boolean;
}

// Predefined liquid types
export const LIQUID_TYPES = {
  WATER: {
    id: 'water',
    name: 'Water',
    color: 0x4A90E2,
    viscosity: 1.0,
    temperature: 20,
    speed: 5,
    properties: [LiquidProperty.CONDUCTIVE, LiquidProperty.FREEZABLE]
  },
  OIL: {
    id: 'oil',
    name: 'Oil',
    color: 0x8B4513,
    viscosity: 2.5,
    temperature: 25,
    speed: 3,
    properties: [LiquidProperty.FLAMMABLE]
  },
  ACID: {
    id: 'acid',
    name: 'Acid',
    color: 0x32CD32,
    viscosity: 1.2,
    temperature: 35,
    speed: 4,
    properties: [LiquidProperty.CORROSIVE, LiquidProperty.TOXIC]
  },
  LAVA: {
    id: 'lava',
    name: 'Lava',
    color: 0xFF4500,
    viscosity: 0.5,
    temperature: 800,
    speed: 7,
    properties: [LiquidProperty.CORROSIVE]
  }
} as const satisfies Record<string, LiquidType>;

// Game configuration
export const GAME_CONFIG = {
  GRID_SIZES: {
    BEGINNER: { width: 8, height: 8 },
    STANDARD: { width: 12, height: 12 },
    ADVANCED: { width: 16, height: 16 },
    EXPERT: { width: 20, height: 20 }
  },
  TILE_SIZE: 32,
  ANIMATION_DURATION: 300,
  FLOW_SPEED: 100, // pixels per second
  PARTICLE_COUNT: 50
};

// Utility functions
export class GridUtils {
  static positionToPixel(gridPos: GridPosition, tileSize: number): { x: number; y: number } {
    return {
      x: gridPos.x * tileSize + tileSize / 2,
      y: gridPos.y * tileSize + tileSize / 2
    };
  }

  static pixelToPosition(pixelX: number, pixelY: number, tileSize: number): GridPosition {
    return {
      x: Math.floor(pixelX / tileSize),
      y: Math.floor(pixelY / tileSize)
    };
  }

  static isValidPosition(pos: GridPosition, gridWidth: number, gridHeight: number): boolean {
    return pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight;
  }

  static getNeighbors(pos: GridPosition): GridPosition[] {
    return [
      { x: pos.x - 1, y: pos.y }, // Left
      { x: pos.x + 1, y: pos.y }, // Right
      { x: pos.x, y: pos.y - 1 }, // Up
      { x: pos.x, y: pos.y + 1 }  // Down
    ];
  }
}

// Add these new enums and interfaces
export enum TileType {
  EMPTY = 'empty',
  DIRT = 'dirt',
  ROCK = 'rock',
  WATER = 'water',
  POISON = 'poison',
  ALGAE = 'algae',
  DRAIN = 'drain'
}

export enum DigTool {
  FINGER = 'finger',
  BOMB = 'bomb'
}

export interface GameTile {
  type: TileType;
  position: GridPosition;
  hasWater: boolean;
  waterAmount: number;
  isDiggable: boolean;
}

export interface WaterDrop {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  gridX: number;
  gridY: number;
}

// Component compatibility matrix
export class ComponentCompatibility {
  private static PIPE_MATERIAL_RESISTANCE = {
    [PipeType.STANDARD]: [LiquidProperty.CONDUCTIVE, LiquidProperty.FREEZABLE],
    [PipeType.GLASS]: [LiquidProperty.CORROSIVE, LiquidProperty.CONDUCTIVE],
    [PipeType.METAL]: [LiquidProperty.CONDUCTIVE, LiquidProperty.FLAMMABLE],
    [PipeType.CERAMIC]: [LiquidProperty.CORROSIVE, LiquidProperty.FLAMMABLE]
  };

  static canLiquidFlowThroughPipe(liquid: LiquidType, pipeType: PipeType): boolean {
    const resistances = this.PIPE_MATERIAL_RESISTANCE[pipeType];
    return !liquid.properties.some(prop => 
      !resistances.includes(prop) && 
      (prop === LiquidProperty.CORROSIVE || prop === LiquidProperty.TOXIC)
    );
  }

  static getLiquidInteraction(liquid1: LiquidType, liquid2: LiquidType): 'mix' | 'separate' | 'react' | 'explode' {
    // Simplified interaction matrix
    if (liquid1.id === liquid2.id) return 'mix';
    
    if (liquid1.properties.includes(LiquidProperty.FLAMMABLE) && liquid2.temperature > 100) {
      return 'explode';
    }
    
    if (liquid1.properties.includes(LiquidProperty.CORROSIVE) && 
        liquid2.properties.includes(LiquidProperty.TOXIC)) {
      return 'react';
    }
    
    // Oil and water separate
    if ((liquid1.id === 'oil' && liquid2.id === 'water') ||
        (liquid1.id === 'water' && liquid2.id === 'oil')) {
      return 'separate';
    }
    
    return 'mix';
  }
}