import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { GridPosition, GAME_CONFIG, GridUtils, LevelData } from '../core/GameTypes';
import { ComponentType, PipeType } from '../core/GameTypes';
import { PipeComponent } from '../components/PipeComponent';

export class FlowArchitectGame extends Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  private gridBackground!: Phaser.GameObjects.Graphics;
  private currentLevel: LevelData | null = null;
  private gridWidth: number = 12;
  private gridHeight: number = 12;
  private tileSize: number = 48;

  private placedPipes: Map<string, PipeComponent> = new Map();
  private selectedPipeType: ComponentType = ComponentType.STRAIGHT_PIPE;
  private selectedMaterial: PipeType = PipeType.STANDARD;
  
  private toolbar!: Phaser.GameObjects.Container;
  private toolbarBackground!: Phaser.GameObjects.Graphics;
  private pipeButtons: Phaser.GameObjects.Container[] = [];
  private selectedButton: Phaser.GameObjects.Container | null = null;

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

    this.createToolbar();

    this.centerGrid();
  }

  //ui
  private createToolbar() {
    const toolbarHeight = 80;
    const toolbarY = this.scale.height - toolbarHeight;
    
    this.toolbar = this.add.container(0, toolbarY);
    
    //toolbar background
    this.toolbarBackground = this.add.graphics();
    this.toolbarBackground.fillStyle(0x2d3748, 0.9);
    this.toolbarBackground.fillRect(0, 0, this.scale.width, toolbarHeight);
    this.toolbar.add(this.toolbarBackground);
    
    this.createPipeButtons();
  }

  private createPipeButtons() {
    const buttonSize = 60;
    const buttonSpacing = 70;
    const startX = 50;
    const buttonY = 40;
    
    const pipeTypes = [
      { type: ComponentType.STRAIGHT_PIPE, label: '—', color: 0x4A90E2 },
      { type: ComponentType.CORNER_PIPE, label: '⌐', color: 0x4A90E2 },
      { type: ComponentType.T_JUNCTION, label: '⊥', color: 0x4A90E2 },
    ];
    
    pipeTypes.forEach((pipeInfo, index) => {
      const buttonX = startX + (index * buttonSpacing);
      
      const button = this.add.container(buttonX, buttonY);
      
      //Button background
      const bg = this.add.graphics();
      bg.fillStyle(0x4a5568);
      bg.lineStyle(2, 0x718096);
      bg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
      bg.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
      button.add(bg);
      
      // Button icon
      const icon = this.add.text(0, 0, pipeInfo.label, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      button.add(icon);
      
      button.setSize(buttonSize, buttonSize);
      button.setInteractive({ useHandCursor: true });
      
      button.on('pointerdown', () => {
        this.selectPipeType(pipeInfo.type, button);
      });
      
      button.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x5a6578);
        bg.lineStyle(2, 0x718096);
        bg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
        bg.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
      });
      
      button.on('pointerout', () => {
        if (this.selectedButton !== button) {
          bg.clear();
          bg.fillStyle(0x4a5568);
          bg.lineStyle(2, 0x718096);
          bg.fillRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
          bg.strokeRoundedRect(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize, 8);
        }
      });
      
      this.toolbar.add(button);
      this.pipeButtons.push(button);
      
      //default selection: first button
      if (index === 0) {
        this.selectPipeType(pipeInfo.type, button);
      }
    });
  }

  private selectPipeType(type: ComponentType, button: Phaser.GameObjects.Container) {
    // Reset previous selection
    if (this.selectedButton) {
      const prevBg = this.selectedButton.list[0] as Phaser.GameObjects.Graphics;
      prevBg.clear();
      prevBg.fillStyle(0x4a5568);
      prevBg.lineStyle(2, 0x718096);
      prevBg.fillRoundedRect(-30, -30, 60, 60, 8);
      prevBg.strokeRoundedRect(-30, -30, 60, 60, 8);
    }
    
    //Highlight new selection
    const bg = button.list[0] as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0x3182ce);
    bg.lineStyle(2, 0x2b6cb0);
    bg.fillRoundedRect(-30, -30, 60, 60, 8);
    bg.strokeRoundedRect(-30, -30, 60, 60, 8);
    
    this.selectedButton = button;
    this.selectedPipeType = type;
    console.log(`Selected pipe type: ${type}`);
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
    const toolbarHeight = 80;
    
    this.gridContainer.x = (this.scale.width - gridPixelWidth) / 2;
    this.gridContainer.y = (this.scale.height - gridPixelHeight - toolbarHeight) / 2;
  }

  private setupInput() {
    // click handling for grid tiles
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.handleGridClick(pointer.x, pointer.y);
      } else if (pointer.rightButtonDown()) {
        this.handleRotateClick(pointer.x, pointer.y);
      }
    });

    this.scale.on('resize', () => {
      this.centerGrid();
    });

    this.input.keyboard?.on('keydown-ONE', () => {
      this.selectedPipeType = ComponentType.STRAIGHT_PIPE;
      console.log('Selected: Straight Pipe');
    });

    this.input.keyboard?.on('keydown-TWO', () => {
      this.selectedPipeType = ComponentType.CORNER_PIPE;
      console.log('Selected: Corner Pipe');
    });

    this.input.keyboard?.on('keydown-THREE', () => {
      this.selectedPipeType = ComponentType.T_JUNCTION;
      console.log('Selected: T-Junction');
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

  private handleRotateClick(screenX: number, screenY: number) {
    const localX = screenX - this.gridContainer.x;
    const localY = screenY - this.gridContainer.y;
    
    const gridPos = GridUtils.pixelToPosition(localX, localY, this.tileSize);
    const key = `${gridPos.x},${gridPos.y}`;
    
    if (this.placedPipes.has(key)) {
      this.placedPipes.get(key)!.rotatePipe();
    }
  }

  private placePipe(gridPos: GridPosition) {
    const key = `${gridPos.x},${gridPos.y}`;
  
    // if pipe exists remove it
    if (this.placedPipes.has(key)) {
      const existingPipe = this.placedPipes.get(key)!;
      existingPipe.destroy();
      this.placedPipes.delete(key);
    }
  
    // Create new pipe
    const pixelPos = GridUtils.positionToPixel(gridPos, this.tileSize);
    const pipe = new PipeComponent(
      this,
      pixelPos.x,
      pixelPos.y,
      this.selectedPipeType,
      this.selectedMaterial,
      gridPos,
      this.tileSize
    );
    
    this.gridContainer.add(pipe);
    this.placedPipes.set(key, pipe);
  }
}