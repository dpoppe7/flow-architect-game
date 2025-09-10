import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { LevelData, DigTool, LIQUID_TYPES, GridUtils, GridPosition } from '../core/GameTypes';
import { TileSystem } from '../systems/TileSystem';
import { WaterPhysics } from '../systems/WaterPhysics';
import { Collectible } from '../entities/Collectible';
import { COLLECTIBLE_PRESETS, LEVEL_THEMES, LevelTheme } from '../data/CollectiblePresets';

export class FlowArchitectGame extends Scene {
  private gridContainer!: Phaser.GameObjects.Container;
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

  private collectibles: Collectible[] = [];
  private collectedCount: number = 0;
  private totalCollectibles: number = 0;
  private collectibleCounter!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBarBg!: Phaser.GameObjects.Graphics;
  private currentTheme: LevelTheme = LEVEL_THEMES.BATHTIME!;

  private isLevelComplete: boolean = false;
  private victoryText!: Phaser.GameObjects.Text;

  constructor() {
    super('FlowArchitectGame');
  }

  create() {
    this.setupCamera();
    this.createTileSystem();
    this.createWaterPhysics();
    this.createCollectibles();
    this.createUI();
    this.setupInput();
    this.addWaterSource();

    this.events.on('collectibleCollected', this.collectCollectible, this);
  }

  override update() {
    if (this.waterPhysics) {
      this.waterPhysics.update();
    }

    // Update all collectibles
    this.collectibles.forEach(collectible => collectible.update());

    // Check victory
    if (!this.isLevelComplete && this.collectedCount >= this.totalCollectibles && this.totalCollectibles > 0) {
      this.checkVictoryCondition();
    }
  }

  private setupCamera() {
    this.cameras.main.setBackgroundColor(this.currentTheme.backgroundColor);
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

  private createCollectibles() {
    // Clear existing collectibles
    this.collectibles.forEach(collectible => collectible.destroy());
    this.collectibles = [];
    this.collectedCount = 0;

    // Creates collectibles based on current theme
    const collectibleTypes = this.currentTheme.collectibles;
    const collectiblePositions = this.generateCollectiblePositions(collectibleTypes.length * 2);

    let collectibleIndex = 0;
    for (let i = 0; i < collectibleTypes.length * 2 && collectibleIndex < collectiblePositions.length; i++) {
      const collectibleType = collectibleTypes[i % collectibleTypes.length];
      
      if (!collectibleType) continue;
      
      const config = COLLECTIBLE_PRESETS[collectibleType];
      const position = collectiblePositions[collectibleIndex];
      
      if (config && position) {
        const collectible = new Collectible(
          this,
          position,
          this.tileSize,
          config,
          `${collectibleType}_${position.x}_${position.y}`
        );
        
        // Add to grid container so it moves with the grid
        this.gridContainer.add(collectible);
        this.collectibles.push(collectible);
        collectibleIndex++;
      }
    }

    this.totalCollectibles = this.collectibles.length;
    //console.log(`Created ${this.totalCollectibles} collectibles for theme: ${this.currentTheme.name}`);
  }

  private generateCollectiblePositions(count: number): GridPosition[] {
    const positions: GridPosition[] = [];
    const maxAttempts = 100;
    let attempts = 0;

    while (positions.length < count && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.gridWidth);
      const y = Math.floor(Math.random() * this.gridHeight);
      const position = { x, y };

      // Check if position
      if (this.isValidCollectiblePosition(position, positions)) {
        positions.push(position);
      }
      attempts++;
    }

    return positions;
  }

  private isValidCollectiblePosition(position: GridPosition, existingPositions: GridPosition[]): boolean {
    // Don't place on water source or drain
    if (GridUtils.arePositionsEqual(position, this.waterSource) || 
        GridUtils.arePositionsEqual(position, this.drain)) {
      return false;
    }

    // Don't place too close to water source or drain
    const sourceDistance = Math.abs(position.x - this.waterSource.x) + Math.abs(position.y - this.waterSource.y);
    const drainDistance = Math.abs(position.x - this.drain.x) + Math.abs(position.y - this.drain.y);
    
    if (sourceDistance < 2 || drainDistance < 2) {
      return false;
    }

    // Don't place on top of existing collectibles
    return !existingPositions.some(existing => 
      GridUtils.arePositionsEqual(position, existing)
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
    this.add.text(20, 20, this.currentTheme.name, {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 8 }
    });

    //description
    this.add.text(20, 60, this.currentTheme.description, {
      fontSize: '16px',
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

    this.collectibleCounter = this.add.text(20, 190, `Collected: ${this.collectedCount}/${this.totalCollectibles}`, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: { x: 15, y: 8 }
    });

    //progress bar background
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x333333);
    this.progressBarBg.fillRect(20, 230, 200, 20);
    this.progressBarBg.lineStyle(2, 0x666666);
    this.progressBarBg.strokeRect(20, 230, 200, 20);

    // Progress bar fill
    this.progressBar = this.add.graphics();
    this.updateProgressBar();

    // Theme selector buttons (for testing/demo purposes)
    this.createThemeButtons();

    // Victory text (hidden initially)
    this.victoryText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Level Complete!', {
      fontSize: '48px',
      color: '#FFD700',
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setVisible(false);
  }

  private createThemeButtons() {
    const themes = Object.keys(LEVEL_THEMES);
    let yOffset = 280;

    themes.forEach((themeKey, index) => {
      const theme = LEVEL_THEMES[themeKey];

      if (!theme) return;

      const isCurrentTheme = theme === this.currentTheme;
      
      const button = this.add.text(20, yOffset, theme.name, {
        fontSize: '14px',
        color: isCurrentTheme ? '#FFD700' : '#ffffff',
        backgroundColor: isCurrentTheme ? 'rgba(255,215,0,0.2)' : 'rgba(100,100,100,0.7)',
        padding: { x: 8, y: 4 }
      }).setInteractive({ useHandCursor: true });

      button.on('pointerdown', () => {
        this.switchTheme(themeKey);
      });

      yOffset += 30;
    });
  }

  private switchTheme(themeKey: string) {
    if (LEVEL_THEMES[themeKey] && LEVEL_THEMES[themeKey] !== this.currentTheme) {
      this.currentTheme = LEVEL_THEMES[themeKey];
      this.isLevelComplete = false;
      this.victoryText.setVisible(false);
      
      this.cameras.main.setBackgroundColor(this.currentTheme.backgroundColor);
      
      this.stopWaterFlow();
      this.waterPhysics.clearAllWater();
      
      this.createCollectibles();
      
      // Recreate UI to reflect new theme
      this.scene.restart();
    }
  }

  private updateProgressBar() {
    this.progressBar.clear();
    
    if (this.totalCollectibles > 0) {
      const progress = this.collectedCount / this.totalCollectibles;
      this.progressBar.fillStyle(0x00FF00);
      this.progressBar.fillRect(22, 232, (200 - 4) * progress, 16);
    }
  }

  private collectCollectible(collectible: Collectible) {
    if (collectible.collect()) {
      this.collectedCount++;
      
      // Update UI
      this.collectibleCounter.setText(`Collected: ${this.collectedCount}/${this.totalCollectibles}`);
      this.updateProgressBar();
      
      console.log(`Collected ${collectible.getType()}! Progress: ${this.collectedCount}/${this.totalCollectibles}`);
      
      // feedback
      this.createCollectionFeedback(collectible.getGridPosition());
    }
  }

  private createCollectionFeedback(gridPos: GridPosition) {
    const pixelPos = GridUtils.positionToPixel(gridPos, this.tileSize);
    const worldPos = {
      x: pixelPos.x + this.gridContainer.x,
      y: pixelPos.y + this.gridContainer.y
    };

    // Floating text
    const scoreText = this.add.text(worldPos.x, worldPos.y, '+1', {
      fontSize: '24px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Animate score text
    this.tweens.add({
      targets: scoreText,
      y: worldPos.y - 50,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => scoreText.destroy()
    });
  }

  private checkVictoryCondition() {
    // Check if water has reached the drain
    const drainWaterLevel = this.waterPhysics.getWaterLevelAt(this.drain);
    
    if (drainWaterLevel > 0.5) { // Water has reached the drain
      this.isLevelComplete = true;
      this.showVictoryScreen();
    }
  }

  private showVictoryScreen() {
    this.victoryText.setVisible(true);
    
    // Victory animation
    this.tweens.add({
      targets: this.victoryText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.stopWaterFlow();

    //console.log(`Level Complete! Theme: ${this.currentTheme.name}, Collectibles: ${this.collectedCount}/${this.totalCollectibles}`);
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

  public exportLevel(): LevelData {
    return {
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      waterSource: this.waterSource,
      drain: this.drain,
      collectibles: this.collectibles.map(c => ({
        position: c.getGridPosition(),
        type: c.getType(),
        id: c.getId()
      })),
      theme: this.currentTheme
    };
  }
}

