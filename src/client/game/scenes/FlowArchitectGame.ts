import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { LevelData, DigTool, LIQUID_TYPES, GridUtils, GridPosition } from '../core/GameTypes';
import { TileSystem } from '../systems/TileSystem';
import { WaterPhysics } from '../systems/WaterPhysics';

export class FlowArchitectGame extends Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  // private gridBackground!: Phaser.GameObjects.Graphics;
  // private currentLevel: LevelData | null = null;
  private gridWidth: number = 12;
  private gridHeight: number = 12;
  private tileSize: number = 48;

  private tileSystem!: TileSystem;
  private selectedTool: DigTool = DigTool.FINGER;
  private isDragging: boolean = false;
  private waterSource: GridPosition = { x: 8, y: 2 };
  private drain: GridPosition = { x: 14, y: 10 };

  private waterPhysics!: WaterPhysics;
  private isWaterFlowing: boolean = false;
  private waterButton!: Phaser.GameObjects.Text;

  constructor() {
    super('FlowArchitectGame');
  }

  create() {
    this.setupCamera();
    this.createTileSystem();
    this.createWaterPhysics();
    this.createUI();
    this.setupInput();
    this.addWaterSource();
  }

  override update() {
    if (this.waterPhysics) {
      this.waterPhysics.update();
    }
  }

  private setupCamera() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
  }

  private createTileSystem() {
    this.tileSystem = new TileSystem(this, this.tileSize, this.gridWidth, this.gridHeight);
    
    // Create grid container
    this.gridContainer = this.add.container(0, 0);
    this.tileSystem.createTileGraphics(this.gridContainer);
    
    this.centerGrid();
  }

  private createWaterPhysics() {
    this.waterPhysics = new WaterPhysics(
      this,
      this.tileSystem,
      this.tileSize,
      this.gridWidth,
      this.gridHeight
    );
  }

  private centerGrid() {
    const gridPixelWidth = this.gridWidth * this.tileSize;
    const gridPixelHeight = this.gridHeight * this.tileSize;
    
    this.gridContainer.x = (this.scale.width - gridPixelWidth) / 2;
    this.gridContainer.y = (this.scale.height - gridPixelHeight) / 2;
  }

  private createUI() {
    // Simple instruction text
    this.add.text(20, 20, 'Dig paths to guide water to the drain!', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    });

    // Tool selection 
    this.add.text(20, 60, `Tool: ${this.selectedTool}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    });

    //water control button
    this.waterButton = this.add.text(20, 100, 'Start Water Flow', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 100, 200, 0.8)',
      padding: { x: 15, y: 8 }
    }).setInteractive({ useHandCursor: true });

    this.waterButton.on('pointerdown', () => {
      this.toggleWaterFlow();
    });

  }

  private addWaterSource() {
    // Add visual water source
    const sourcePixel = GridUtils.positionToPixel(this.waterSource, this.tileSize);
    const sourceGraphic = this.add.graphics();
    sourceGraphic.fillStyle(LIQUID_TYPES.WATER.color);
    sourceGraphic.fillCircle(sourcePixel.x, sourcePixel.y, this.tileSize / 2);
    
    // Add faucet-like appearance
    sourceGraphic.fillStyle(0x8B4513); // Brown pipe
    sourceGraphic.fillRect(sourcePixel.x - this.tileSize/4, sourcePixel.y - this.tileSize, 
                          this.tileSize/2, this.tileSize/2);
    
    this.gridContainer.add(sourceGraphic);

    // Add drain visual
    const drainPixel = GridUtils.positionToPixel(this.drain, this.tileSize);
    const drainGraphic = this.add.graphics();
    drainGraphic.lineStyle(4, 0x444444);
    drainGraphic.strokeCircle(drainPixel.x, drainPixel.y, this.tileSize / 2);
    drainGraphic.fillStyle(0x222222);
    drainGraphic.fillCircle(drainPixel.x, drainPixel.y, this.tileSize / 3);
    
    this.gridContainer.add(drainGraphic);
  }

  private setupInput() {
    // Mouse/touch input for digging
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.handleDig(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.handleDig(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // // Spacebar to release water
    // this.input.keyboard?.on('keydown-SPACE', () => {
    //   this.startWaterFlow();
    // });

    // Handle resize
    this.scale.on('resize', () => {
      this.centerGrid();
    });
  }

  private handleDig(screenX: number, screenY: number) {
    // Convert screen coordinates to grid coordinates
    const localX = screenX - this.gridContainer.x;
    const localY = screenY - this.gridContainer.y;
    
    const gridPos = GridUtils.pixelToPosition(localX, localY, this.tileSize);
    
    if (GridUtils.isValidPosition(gridPos, this.gridWidth, this.gridHeight)) {
      const success = this.tileSystem.digTile(gridPos);
      if (success) {
        console.log(`Dug tile at ${gridPos.x}, ${gridPos.y}`);
      }
    }
  }

  private startWaterFlow() {
    if (!this.isWaterFlowing) {
      console.log("Starting water flow...");
      this.waterPhysics.startWaterFlow(this.waterSource, this.gridContainer);
      this.isWaterFlowing = true;
      this.waterButton.setText('Stop Water Flow');
      this.waterButton.setStyle({ backgroundColor: 'rgba(200, 50, 50, 0.8)' });
    }
  }

  private stopWaterFlow() {
    console.log("Stopping water flow...");
    this.waterPhysics.stopWaterFlow();
    this.isWaterFlowing = false;
    this.waterButton.setText('Start Water Flow');
    this.waterButton.setStyle({ backgroundColor: 'rgba(0, 100, 200, 0.8)' });
  }

  private toggleWaterFlow() {
    if (this.isWaterFlowing) {
      this.stopWaterFlow();
    } else {
      this.startWaterFlow();
    }
  }
}