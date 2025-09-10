import * as Phaser from 'phaser';
import { TileType, GameTile, GridPosition, GridUtils } from '../core/GameTypes';

export class TileSystem {
  private scene: Phaser.Scene;
  private tiles: GameTile[][] = [];
  private tileGraphics: Phaser.GameObjects.Graphics[][] = [];
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;

  constructor(scene: Phaser.Scene, tileSize: number, gridWidth: number, gridHeight: number) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.initializeTiles();
  }

  private initializeTiles() {
    this.tiles = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight));
    this.tileGraphics = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight));

    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        // Create default dirt level
        let tileType = TileType.EMPTY;
        
        // Fill bottom half with dirt, leave top half empty
        if (y > this.gridHeight / 2) {
          tileType = TileType.DIRT;
        }
        
        // Add some rock layers
        if (y > this.gridHeight - 3) {
          tileType = TileType.ROCK;
        }

        const tile: GameTile = {
          type: tileType,
          position: { x, y },
          hasWater: false,
          waterAmount: 0,
          isDiggable: tileType === TileType.DIRT
        };

        const tileRow = this.tiles[x];
        if (tileRow) {
            tileRow[y] = tile;
        }
      }
    }
  }

  public createTileGraphics(container: Phaser.GameObjects.Container) {
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        const tileRow = this.tiles[x];
        if (!tileRow) continue;

        const tile = tileRow[y];
        if (!tile) continue;

        const pixelPos = GridUtils.positionToPixel(tile.position, this.tileSize);
        
        const graphic = this.scene.add.graphics();
        graphic.x = pixelPos.x - this.tileSize / 2;
        graphic.y = pixelPos.y - this.tileSize / 2;
        
        this.drawTile(graphic, tile);
        container.add(graphic);
        
        const graphicRow = this.tileGraphics[x];
        if (graphicRow) {
            graphicRow[y] = graphic;
        }
      }
    }
  }

  private drawTile(graphic: Phaser.GameObjects.Graphics, tile: GameTile) {
    graphic.clear();
    
    switch (tile.type) {
      case TileType.DIRT:
        graphic.fillStyle(0x8B4513); // Brown
        graphic.fillRect(0, 0, this.tileSize, this.tileSize);

        graphic.fillStyle(0x654321);
        for (let i = 0; i < 5; i++) {
          const dotX = Math.random() * this.tileSize;
          const dotY = Math.random() * this.tileSize;
          graphic.fillCircle(dotX, dotY, 1);
        }
        break;
        
      case TileType.ROCK:
        graphic.fillStyle(0x696969); // Gray
        graphic.fillRect(0, 0, this.tileSize, this.tileSize);
        graphic.lineStyle(1, 0x555555);
        graphic.strokeRect(0, 0, this.tileSize, this.tileSize);
        break;
        
      case TileType.EMPTY:
        break;
        
      case TileType.WATER:
        graphic.fillStyle(0x4A90E2, 0.8); // Semi-transparent blue
        graphic.fillRect(0, 0, this.tileSize, this.tileSize);
        break;
    }
  }

  public digTile(gridPos: GridPosition): boolean {
    if (!GridUtils.isValidPosition(gridPos, this.gridWidth, this.gridHeight)) {
      return false;
    }

    const tileRow = this.tiles[gridPos.x];
    if (!tileRow) return false;
    
    const tile = tileRow[gridPos.y];
    if (!tile) return false;
    
    if (tile.isDiggable && tile.type === TileType.DIRT) {
        tile.type = TileType.EMPTY;
        tile.isDiggable = false;
        
        // Redraw the tile
        const graphicRow = this.tileGraphics[gridPos.x];
        if (graphicRow) {
        const graphic = graphicRow[gridPos.y];
        if (graphic) {
            this.drawTile(graphic, tile);
        }
        }
        
        return true;
    }
    
    return false;
  }

  public getTile(gridPos: GridPosition): GameTile | null {
    if (!GridUtils.isValidPosition(gridPos, this.gridWidth, this.gridHeight)) {
      return null;
    }
    
    const tileRow = this.tiles[gridPos.x];
    if (!tileRow) return null;
    
    return tileRow[gridPos.y] || null;
  }

  public setTileWater(gridPos: GridPosition, amount: number) {
    const tile = this.getTile(gridPos);
    if (tile && tile.type === TileType.EMPTY) {
        tile.hasWater = amount > 0;
        tile.waterAmount = amount;
        tile.type = amount > 0 ? TileType.WATER : TileType.EMPTY;
        
        const graphicRow = this.tileGraphics[gridPos.x];
        if (graphicRow) {
        const graphic = graphicRow[gridPos.y];
        if (graphic) {
            this.drawTile(graphic, tile);
        }
        }
    }
  }

  public canWaterFlowTo(gridPos: GridPosition): boolean {
    const tile = this.getTile(gridPos);
    return tile !== null && (tile.type === TileType.EMPTY || tile.type === TileType.WATER);
  }
}