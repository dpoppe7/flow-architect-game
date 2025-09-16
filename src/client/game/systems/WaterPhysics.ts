import * as Phaser from 'phaser';
import { GridPosition, GridUtils, TileType, WaterDrop } from '../core/GameTypes';
import { TileSystem } from './TileSystem';
import { Collectible } from '../entities/Collectible';

export class WaterPhysics {
  private scene: Phaser.Scene;
  private tileSystem: TileSystem;
  private waterDrops: WaterDrop[] = [];
  private dropGraphics: Phaser.GameObjects.Graphics[] = [];
  private tileSize: number;
  private gridWidth: number;
  private gridHeight: number;
  private gravity: number = 0.3;
  private flowTimer: Phaser.Time.TimerEvent | null = null;
  private collectibles: Collectible[] = [];

  private waterPools: Map<string, number> = new Map(); // Tracks water amount
  private maxWaterPerTile: number = 10;
  private flowRate: number = 2;

  constructor(scene: Phaser.Scene, tileSystem: TileSystem, tileSize: number, gridWidth: number, gridHeight: number) {
    this.scene = scene;
    this.tileSystem = tileSystem;
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }

  public setCollectibles(collectibles: Collectible[]) {
    this.collectibles = collectibles;
  }

  public updateWaterFlow() {
    // Process water flow between tiles
    const tilesToUpdate = new Set<string>();
    
    this.waterPools.forEach((waterAmount, tileKey) => {
      if (waterAmount <= 0) return;
      
      const [x, y] = tileKey.split(',').map(Number) as [number, number];
      const currentPos: GridPosition = { x, y };
      
      this.tryFlowDirection(currentPos, { x, y: y + 1 }, tilesToUpdate);

      if (waterAmount > 1) { // horizontal flow if not flow direction
        this.tryFlowDirection(currentPos, { x: x - 1, y }, tilesToUpdate);
        this.tryFlowDirection(currentPos, { x: x + 1, y }, tilesToUpdate);
      }
    });
    
    // Update visual representation for changed tiles
    tilesToUpdate.forEach(tileKey => {
      const [x, y] = tileKey.split(',').map(Number) as [number, number];
      this.updateTileWaterVisual({ x, y });
    });
  }

  private tryFlowDirection(fromPos: GridPosition, toPos: GridPosition, tilesToUpdate: Set<string>) {
    if (!GridUtils.isValidPosition(toPos, this.gridWidth, this.gridHeight)) return;
    
    const fromKey = `${fromPos.x},${fromPos.y}`;
    const toKey = `${toPos.x},${toPos.y}`;
    
    const fromWater = this.waterPools.get(fromKey) || 0;
    const toWater = this.waterPools.get(toKey) || 0;
    
    if (!this.tileSystem.canWaterFlowTo(toPos)) return;
    
    // Calculate flow amount
    const pressureDiff = fromWater - toWater;
    if (pressureDiff <= 0.1) return;
    
    const flowAmount = Math.min(
      this.flowRate,
      pressureDiff * 0.5,
      fromWater * 0.3,
      this.maxWaterPerTile - toWater
    );
    
    if (flowAmount > 0.05) {
      this.waterPools.set(fromKey, Math.max(0, fromWater - flowAmount));
      this.waterPools.set(toKey, Math.min(this.maxWaterPerTile, toWater + flowAmount));
      
      tilesToUpdate.add(fromKey);
      tilesToUpdate.add(toKey);
    }
  }

  private updateTileWaterVisual(gridPos: GridPosition) {
    const key = `${gridPos.x},${gridPos.y}`;
    const waterAmount = this.waterPools.get(key) || 0;
    
    if (waterAmount > 0.1) {
      this.tileSystem.setTileWater(gridPos, waterAmount / this.maxWaterPerTile);
    } else {
      this.tileSystem.setTileWater(gridPos, 0);
      this.waterPools.delete(key);
    }
  }

  public startWaterFlow(sourcePos: GridPosition, container: Phaser.GameObjects.Container) {
    this.flowTimer = this.scene.time.addEvent({
      delay: 150, // Drop every 150ms
      callback: () => {
        this.createWaterDrop(sourcePos, container);
      },
      loop: true
    });
  }

  public stopWaterFlow() {
    if (this.flowTimer) {
      this.flowTimer.destroy();
      this.flowTimer = null;
    }
  }

  private createWaterDrop(sourcePos: GridPosition, container: Phaser.GameObjects.Container) {
    const sourcePixel = GridUtils.positionToPixel(sourcePos, this.tileSize);
    
    const drop: WaterDrop = {
      x: sourcePixel.x + (Math.random() - 0.5) * 10, // Add slight randomness
      y: sourcePixel.y + this.tileSize / 2,
      velocityX: (Math.random() - 0.5) * 0.5, // Small horizontal variance
      velocityY: 0,
      gridX: sourcePos.x,
      gridY: sourcePos.y + 1
    };

    // visual drop
    const dropGraphic = this.scene.add.graphics();
    dropGraphic.fillStyle(0x4A90E2, 0.9);
    dropGraphic.fillCircle(0, 0, 3);
    dropGraphic.x = drop.x;
    dropGraphic.y = drop.y;

    container.add(dropGraphic);
    
    this.waterDrops.push(drop);
    this.dropGraphics.push(dropGraphic);
  }

  public update() {
    // Update all water drops
    for (let i = this.waterDrops.length - 1; i >= 0; i--) {
      const drop = this.waterDrops[i];
      const graphic = this.dropGraphics[i];
      
      if (!drop || !graphic) continue;
      
      //gravity
      drop.velocityY += this.gravity;
      
      //position
      drop.x += drop.velocityX;
      drop.y += drop.velocityY;
      
      //visual position
      graphic.x = drop.x;
      graphic.y = drop.y;
      
      //grid position
      const newGridPos = GridUtils.pixelToPosition(drop.x, drop.y, this.tileSize);
      drop.gridX = newGridPos.x;
      drop.gridY = newGridPos.y;
      
      if (this.checkDropCollision(drop, i)) {
        continue; // Drop was handled (removed or settled)
      }
      
      //remove drops that fall off screen
      if (drop.y > this.gridHeight * this.tileSize + 50) {
        this.removeDrop(i);
      }
    }

    this.updateWaterFlow(); //between files
    this.checkWaterWithCollectibles();
  }

  private checkDropCollision(drop: WaterDrop, dropIndex: number): boolean {
    const gridPos: GridPosition = { x: drop.gridX, y: drop.gridY };
    
    // Check if drop is out of bounds
    if (!GridUtils.isValidPosition(gridPos, this.gridWidth, this.gridHeight)) {
      return false;
    }

    const currentTile = this.tileSystem.getTile(gridPos);
    if (!currentTile) return false;

    // Check what's below the drop
    const belowPos: GridPosition = { x: gridPos.x, y: gridPos.y + 1 };
    const belowTile = this.tileSystem.getTile(belowPos);
    
    // If there's solid ground below, settle the water
    if (!belowTile || (belowTile.type !== TileType.EMPTY && belowTile.type !== TileType.WATER)) {
      if (currentTile.type === TileType.EMPTY) {
        this.settleWater(gridPos);
        this.removeDrop(dropIndex);
        return true;
      }
    }
    
    // Check for horizontal flow if water hits solid surface
    if (currentTile.type === TileType.DIRT || currentTile.type === TileType.ROCK) {
      const flowDirection = drop.velocityX > 0 ? 1 : -1;
      const sidePos: GridPosition = { x: gridPos.x + flowDirection, y: gridPos.y };
      
      if (this.tileSystem.canWaterFlowTo(sidePos)) {
        drop.gridX = sidePos.x;
        drop.x = GridUtils.positionToPixel(sidePos, this.tileSize).x;
        drop.velocityX *= 0.8; // Reduce horizontal speed
      } else {
        // Try the other direction
        const otherSidePos: GridPosition = { x: gridPos.x - flowDirection, y: drop.gridY };
        if (this.tileSystem.canWaterFlowTo(otherSidePos)) {
          drop.gridX = otherSidePos.x;
          drop.x = GridUtils.positionToPixel(otherSidePos, this.tileSize).x;
          drop.velocityX = -drop.velocityX * 0.8;
        } else {
          // When can't flow anywhere, settle here if possible
          const abovePos: GridPosition = { x: gridPos.x, y: gridPos.y - 1 };
          if (this.tileSystem.canWaterFlowTo(abovePos)) {
            this.settleWater(abovePos);
          }
          this.removeDrop(dropIndex);
          return true;
        }
      }
    }

    return false;
  }

  private settleWater(gridPos: GridPosition) {
    const key = `${gridPos.x},${gridPos.y}`;
    const currentWater = this.waterPools.get(key) || 0;
    const newAmount = Math.min(this.maxWaterPerTile, currentWater + 1);
    
    this.waterPools.set(key, newAmount);
    this.updateTileWaterVisual(gridPos);
    
    //splash effect
    this.createSplashEffect(gridPos);
  }

  private createSplashEffect(gridPos: GridPosition) {
    const pixelPos = GridUtils.positionToPixel(gridPos, this.tileSize);
    
    // splash particles
    for (let i = 0; i < 3; i++) {
      const splash = this.scene.add.graphics();
      splash.fillStyle(0x4A90E2, 0.6);
      splash.fillCircle(0, 0, 2);
      splash.x = pixelPos.x + (Math.random() - 0.5) * 20;
      splash.y = pixelPos.y + (Math.random() - 0.5) * 10;
      
      // splash
      this.scene.tweens.add({
        targets: splash,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          splash.destroy();
        }
      });
    }
  }

  private removeDrop(index: number) {
    const graphic = this.dropGraphics[index];
    if (graphic) {
      graphic.destroy();
    }
    
    this.waterDrops.splice(index, 1);
    this.dropGraphics.splice(index, 1);
  }

  public clearAllWater() {
    // Remove all drops
    this.waterDrops.forEach((_, index) => {
      const graphic = this.dropGraphics[index];
      if (graphic) {
        graphic.destroy();
      }
    });
    
    this.waterDrops = [];
    this.dropGraphics = [];
    
    this.stopWaterFlow();

    this.waterPools.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number) as [number, number];
      this.tileSystem.setTileWater({ x, y }, 0);
    });
    this.waterPools.clear();
  }

  // Public method to get water level at specific grid position
  public getWaterLevelAt(gridPos: GridPosition): number {
    const key = `${gridPos.x},${gridPos.y}`;
    const waterAmount = this.waterPools.get(key) || 0;
    return waterAmount / this.maxWaterPerTile; // Return normalized value (0-1)
  }

  // Public method to check if water has reached a specific position
  public hasWaterReached(gridPos: GridPosition, threshold: number = 0.1): boolean {
    return this.getWaterLevelAt(gridPos) >= threshold;
  }

  public checkWaterWithCollectibles() {
    this.collectibles.forEach(collectible => {
      if (!collectible.isCollectedState()) {
        const gridPos = collectible.getGridPosition();
        const waterLevel = this.getWaterLevelAt(gridPos);
        
        if (collectible.checkWaterContact(waterLevel)) {
          // The main scene is listening for this event.
          this.scene.events.emit('collectibleCollected', collectible);
        }
      }
    });
  }
}