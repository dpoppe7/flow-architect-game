import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { GridPosition, GAME_CONFIG, GridUtils, LevelData } from '../core/GameTypes';

export class FlowArchitectGame extends Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  private gridBackground!: Phaser.GameObjects.Graphics;
  private currentLevel: LevelData | null = null;
  private gridWidth: number = 12;
  private gridHeight: number = 12;
  private tileSize: number = 48;
  
  constructor() {
    super('FlowArchitectGame');
  }

  create() {
    this.setupCamera();
    this.createTestLevel();
    this.createGrid();
    this.setupInput();
  }

  private setupCamera() {
    this.cameras.main.setBackgroundColor(0x1a1a2e);
  }

  private createTestLevel(){
    this.currentLevel = {
      id: 'test-level-1',
      name: 'First Flow',
      gridSize: { width: this.gridWidth, height: this.gridHeight },
      difficulty: 'beginner',
      theme: 'water',
      sources: [],
      collectionPoints: [],
      staticElements: [],
      budget: {
        standardPipes: 10,
        glassPipes: 0,
        metalPipes: 0,
        ceramicPipes: 0,
        valves: 0,
        pumps: 0,
        filters: 0,
        heaters: 0,
        coolers: 0,
        mixers: 0,
        separators: 0,
        reservoirs: 0
      },
      winConditions: []
    };
  }

  private createGrid() {
    this.gridContainer = this.add.container(0, 0);

    this.gridBackground = this.add.graphics();
    this.drawGrid();
    this.gridContainer.add(this.gridBackground);

    this.centerGrid();
  }

  private drawGrid() {
    this.gridBackground.clear();
    this.gridBackground.lineStyle(1, 0x444466, 0.8);
    
    // Draw grid lines
    for (let x = 0; x <= this.gridWidth; x++) {
      this.gridBackground.moveTo(x * this.tileSize, 0);
      this.gridBackground.lineTo(x * this.tileSize, this.gridHeight * this.tileSize);
    }
    
    for (let y = 0; y <= this.gridHeight; y++) {
      this.gridBackground.moveTo(0, y * this.tileSize);
      this.gridBackground.lineTo(this.gridWidth * this.tileSize, y * this.tileSize);
    }
    
    this.gridBackground.strokePath();
  }

  private centerGrid() {
    const gridPixelWidth = this.gridWidth * this.tileSize;
    const gridPixelHeight = this.gridHeight * this.tileSize;
    
    this.gridContainer.x = (this.scale.width - gridPixelWidth) / 2;
    this.gridContainer.y = (this.scale.height - gridPixelHeight) / 2;
  }

  private setupInput() {
    // click handling for grid tiles
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleGridClick(pointer.x, pointer.y);
    });

    this.scale.on('resize', () => {
      this.centerGrid();
    });
  }

  private handleGridClick(screenX: number, screenY: number) {
    //grid coordinates
    const localX = screenX - this.gridContainer.x;
    const localY = screenY - this.gridContainer.y;
    
    const gridPos = GridUtils.pixelToPosition(localX, localY, this.tileSize);
    
    if (GridUtils.isValidPosition(gridPos, this.gridWidth, this.gridHeight)) {
      console.log(`Clicked grid tile: ${gridPos.x}, ${gridPos.y}`);
      this.placePipe(gridPos);
    }
  }

  private placePipe(gridPos: GridPosition) {
    const pipeGraphic = this.add.rectangle(
      gridPos.x * this.tileSize + this.tileSize / 2,
      gridPos.y * this.tileSize + this.tileSize / 2,
      this.tileSize - 4,
      this.tileSize - 4,
      0x4a90e2
    );
    
    this.gridContainer.add(pipeGraphic);
  }
}