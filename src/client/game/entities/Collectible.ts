import * as Phaser from 'phaser';
import { GridPosition, GridUtils } from '../core/GameTypes';
import * as Matter from 'matter-js';

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
  private waterFillLevel: number = 0;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBarBg!: Phaser.GameObjects.Graphics;
  private iconText!: Phaser.GameObjects.Text;
  private textTween!: Phaser.Tweens.Tween;
  public matterBody!: Matter.Body;

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
    
    // Progress bar background
    this.progressBarBg = this.scene.add.graphics();
    this.progressBarBg.fillStyle(0x333333);
    this.progressBarBg.fillRect(-this.tileSize / 4, this.tileSize / 4 - 5, this.tileSize / 2, 5);
    this.add(this.progressBarBg);

    // Progress bar fill
    this.progressBar = this.scene.add.graphics();
    this.add(this.progressBar);
  }

  public override update() {
    if (this.collected) return;
    this.updateProgressBar();
  }
  
  private updateProgressBar() {
    this.progressBar.clear();
    const progress = this.waterFillLevel / this.config.collectionThreshold;
    if (progress > 0) {
      this.progressBar.fillStyle(0x4A90E2);
      this.progressBar.fillRect(-this.tileSize / 4, this.tileSize / 4 - 5, (this.tileSize / 2) * progress, 5);
    }
  }

  public fillWithWater() {
    if (this.collected) return;

    this.waterFillLevel += 0.05;

    if (this.waterFillLevel >= this.config.collectionThreshold) {
      this.collect();
    }
  }

  public collect(): boolean {
    if (this.collected) return false;
    
    this.collected = true;
    
    // Emit event for the game scene to handle
    this.scene.events.emit('collectibleCollected', this);
    
    // Animate to center and fade out
    this.scene.tweens.add({
      targets: this,
      x: this.scene.scale.width / 2 - this.x,
      y: this.scene.scale.height / 2 - this.y,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Animate text
    this.textTween = this.scene.tweens.add({
        targets: this.iconText,
        y: -30,
        alpha: 0,
        duration: 800,
        ease: 'Power1',
        onComplete: () => this.iconText.destroy()
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
