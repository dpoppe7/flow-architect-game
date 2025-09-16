import * as Phaser from 'phaser';
import { Tile, TileType, GridPosition, GridUtils } from '../core/GameTypes';

export class TileSystem {
  private scene: Phaser.Scene;
  //private tiles: GameTile[][] = [];
  private tileGraphics: Phaser.GameObjects.Graphics[] = [];
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;
  private grid: Tile[][] = []
  private tileSpriteSheet?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, tileSize: number, gridWidth: number, gridHeight: number) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.initializeTiles();
  }

  private initializeTiles() {
    // this.tiles = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight));
    // this.tileGraphics = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight));

    this.grid = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight));

    for (let y = 0; y < this.gridWidth; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridHeight; x++) {
        let type = TileType.DIRT;
        if (Math.random() > 0.9) {
            type = TileType.ROCK;
        }
        if (y < 2) {
          type = TileType.EMPTY;
        }
        
        this.grid[y]![x] = {
            type: type,
            waterLevel: 0,
            graphics: null
        };
      }
    }
  }

  public createTileGraphics(container: Phaser.GameObjects.Container) {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const pixelPos = GridUtils.positionToPixel({ x, y }, this.tileSize);
        const tileData = this.grid[y]![x]!;
        const graphics = this.scene.add.graphics();

        container.add(graphics);
        this.tileGraphics.push(graphics);
        tileData.graphics = graphics;
        
        this.drawTile(tileData, x, y);
      }
    }
  }

  private drawTile(tile: Tile, x: number, y: number) {
    if (!tile.graphics) return;

    const graphics = tile.graphics;
    graphics.clear();
    graphics.fillStyle(this.getTileColor(tile.type));
    graphics.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
    graphics.lineStyle(1, 0x000000, 0.2);
    graphics.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

    // Draw water level on top
    if (tile.waterLevel > 0) {
      graphics.fillStyle(0x4A90E2, 0.8);
      const waterHeight = tile.waterLevel * this.tileSize;
      graphics.fillRect(x * this.tileSize, y * this.tileSize + this.tileSize - waterHeight, this.tileSize, waterHeight);
    }
  }

  private getTileColor(type: TileType): number {
    switch (type) {
        case TileType.DIRT:
            return 0x8B4513; // Brown
        case TileType.ROCK:
            return 0x808080; // Gray
        case TileType.EMPTY:
            return 0xF5F5DC; // Beige
        default:
            return 0xFFFFFF;
    }
  }

  public getTile(pos: GridPosition): Tile | null {
    if (!GridUtils.isValidPosition(pos, this.gridWidth, this.gridHeight)) {
        return null;
    }
    return this.grid[pos.y]?.[pos.x] || null;
  }

  public digTile(pos: GridPosition): boolean {
    const tile = this.getTile(pos);
    if (tile && (tile.type === TileType.DIRT || tile.type === TileType.ROCK)) {
        tile.type = TileType.EMPTY;
        this.drawTile(tile, pos.x, pos.y);
        return true;
    }
    return false;
  }

  public canWaterFlowTo(pos: GridPosition): boolean {
    const tile = this.getTile(pos);
    return tile !== null && (tile.type === TileType.EMPTY || tile.type === TileType.WATER);
  }

  public setTileWater(pos: GridPosition, level: number) {
    const tile = this.getTile(pos);
    if (tile) {
      tile.waterLevel = level;
      this.drawTile(tile, pos.x, pos.y);
    }
  }
}