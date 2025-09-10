import * as Phaser from 'phaser';
import { GridPosition, GridUtils, WaterDrop } from '../core/GameTypes';
import { TileSystem } from './TileSystem';

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

  private waterPools: Map<string, number> = new Map(); // Track water amounts in each tile
  private maxWaterPerTile: number = 10;
  private flowRate: number = 2; // Water units that flow between tiles per update

  constructor(scene: Phaser.Scene, tileSystem: TileSystem, tileSize: number, gridWidth: number, gridHeight: number) {
    this.scene = scene;
    this.tileSystem = tileSystem;
    this.tileSize = tileSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
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
    if (!belowTile || (belowTile.type !== 'empty' && belowTile.type !== 'water')) {
      if (currentTile.type === 'empty') {
        this.settleWater(gridPos);
        this.removeDrop(dropIndex);
        return true;
      }
    }
    
    // Check for horizontal flow if water hits solid surface
    if (currentTile.type === 'dirt' || currentTile.type === 'rock') {
      const flowDirection = drop.velocityX > 0 ? 1 : -1;
      const sidePos: GridPosition = { x: gridPos.x + flowDirection, y: gridPos.y };
      
      if (this.tileSystem.canWaterFlowTo(sidePos)) {
        drop.gridX = sidePos.x;
        drop.x = GridUtils.positionToPixel(sidePos, this.tileSize).x;
        drop.velocityX *= 0.8; // Reduce horizontal speed
      } else {
        // Try the other direction
        const otherSidePos: GridPosition = { x: gridPos.x - flowDirection, y: gridPos.y };
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
    this.tileSystem.setTileWater(gridPos, 1);
    
    //effect
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
  }
}