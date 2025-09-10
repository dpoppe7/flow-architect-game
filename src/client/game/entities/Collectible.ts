import * as Phaser from 'phaser';
import { GridPosition, GridUtils } from '../core/GameTypes';

export interface CollectibleConfig {
  type: string;
  fillColor: number;
  textColor: number;
  icon: string;
  collectionThreshold: number;
}

export class Collectible extends Phaser.GameObjects.Container {
  private id: string;
  private config: CollectibleConfig;
  private gridPosition: GridPosition;
  private tileSize: number;
  private collected: boolean = false;
  private progressBar!: Phaser.GameObjects.Graphics;
  private iconText!: Phaser.GameObjects.Text;
  private waterFillLevel: number = 0;

  constructor(scene: Phaser.Scene, position: GridPosition, tileSize: number, config: CollectibleConfig, id: string) {
    const pixelPos = GridUtils.positionToPixel(position, tileSize);
    super(scene, pixelPos.x, pixelPos.y);

    this.id = id;
    this.config = config;
    this.gridPosition = position;
    this.tileSize = tileSize;
    this.setSize(tileSize, tileSize);
    this.setInteractive();

    this.setupVisuals();
  }

  private setupVisuals() {
    // Collectible body
    const body = this.scene.add.graphics();
    body.fillStyle(this.config.fillColor);
    body.fillRoundedRect(
      -this.tileSize / 4,
      -this.tileSize / 4,
      this.tileSize / 2,
      this.tileSize / 2,
      4
    );
    this.add(body);

    // Icon/Text
    this.iconText = this.scene.add.text(0, 0, this.config.icon, {
      fontSize: '24px',
      color: `#${this.config.textColor.toString(16)}`,
    }).setOrigin(0.5);
    this.add(this.iconText);
    
    // Progress bar
    this.progressBar = this.scene.add.graphics();
    this.progressBar.lineStyle(2, 0x000000, 0.5);
    this.progressBar.strokeRect(-this.tileSize / 4, this.tileSize / 4 - 5, this.tileSize / 2, 5);
    this.add(this.progressBar);
  }

  public override update() {
    if (this.collected) return;

    // Redraw the progress bar to show the current fill level.
    this.progressBar.clear();
    if (this.waterFillLevel > 0) {
      this.progressBar.fillStyle(0x4A90E2);
      this.progressBar.fillRect(-this.tileSize / 4, this.tileSize / 4 - 5, (this.tileSize / 2) * this.waterFillLevel, 5);
    } else {
       this.progressBar.clear();
    }
  }

  public checkWaterContact(waterLevel: number): boolean {
    if (this.collected) return false;
    
    // Only increase fill level if water is present
    if (waterLevel > 0) {
      // Increment water fill level over time
      const waterIncrement = this.scene.game.loop.delta / 1000;
      this.waterFillLevel = Math.min(1.0, this.waterFillLevel + waterIncrement);
    }
    
    if (this.waterFillLevel >= this.config.collectionThreshold) {
      return true;
    }
    
    return false;
  }

  public collect(): boolean {
    if (this.collected) return false;
    
    this.collected = true;
    
    // Animate to center and fade out
    this.scene.tweens.add({
      targets: this,
      x: this.scene.scale.width / 2 - this.parentContainer.x,
      y: this.scene.scale.height / 2 - this.parentContainer.y,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    return true;
  }

  public isCollectedState(): boolean {
    return this.collected;
  }

  public getType(): string {
    return this.config.type;
  }

  public getId(): string {
    return this.id;
  }
  
  public getGridPosition(): GridPosition {
    return this.gridPosition;
  }
}