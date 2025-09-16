import * as Phaser from 'phaser';
import * as Matter from 'matter-js';
import { GameMode, GameState } from '../core/GameTypes';
import { Collectible } from '../entities/Collectible';
import { LEVELS } from '../data/LEVELS';

interface LevelConfig {
    map: string[];
    waterSource: { x: number, y: number };
    waterDrain: { x: number, y: number };
}

export class FlowArchitectGame extends Phaser.Scene {
  private matterPhysics!: Phaser.Physics.Matter.World;
  private waterParticles: Matter.Body[] = [];
  private particleGraphics: Phaser.GameObjects.Graphics[] = [];
  private staticBodies: Matter.Body[] = [];
  private collectibles: Collectible[] = [];
  private levelConfig!: LevelConfig;
  private currentLevelIndex: number = 0;
  private collectedCount: number = 0;
  private totalCollectibles: number = 0;

  private isDragging: boolean = false;
  private dragGraphics!: Phaser.GameObjects.Graphics;
  private lastDragPosition: Phaser.Math.Vector2 | null = null;
  private waterSpawnTimer: Phaser.Time.TimerEvent | null = null;

  private gameMode: GameMode = GameMode.Play;
  private gameState: GameState = GameState.Loading;

  private startButton!: Phaser.GameObjects.Text;
  private messageBox!: Phaser.GameObjects.Text;

  private themeToggleButton!: Phaser.GameObjects.Text;
  private isDarkTheme: boolean = true;
  private themeBackground!: Phaser.GameObjects.Graphics;

  private collectedText!: Phaser.GameObjects.Text;

  constructor() {
    super('FlowArchitectGame');
  }

  preload() {
    this.gameState = GameState.Loading;
  }

  create() {
    this.matter.world.setBounds(0, 0, this.scale.width, this.scale.height);
    this.matterPhysics = this.matter.world;

    this.themeBackground = this.add.graphics({ fillStyle: { color: 0x1A202C } });
    this.themeBackground.fillRect(0, 0, this.scale.width, this.scale.height);

    this.dragGraphics = this.add.graphics();
    this.setupUI();
    this.loadLevel(this.currentLevelIndex);
    this.setupPhysicsEvents();
  }

  private setupUI() {
    // Top UI
    this.add.rectangle(0, 0, this.scale.width, 60, 0x1A202C, 0.8).setOrigin(0, 0);
    this.add.text(this.scale.width / 2, 30, 'Flow Architect', {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Arial Black',
    }).setOrigin(0.5);

    // Bottom UI
    this.add.rectangle(0, this.scale.height - 60, this.scale.width, 60, 0x1A202C, 0.8).setOrigin(0, 0);
    this.collectedText = this.add.text(10, this.scale.height - 40, 'Collected: 0/0', { fontSize: '24px', color: '#fff' });
    
    // UI elements
    this.startButton = this.add.text(this.scale.width - 200, this.scale.height - 40, 'Start Water Flow', { fontSize: '24px', color: '#fff', backgroundColor: '#4A90E2', padding: { x: 10, y: 5 } })
      .setInteractive()
      .setOrigin(0.5)
      .on('pointerdown', () => this.startWaterFlow());

    this.themeToggleButton = this.add.text(this.scale.width - 70, this.scale.height - 40, 'Theme', { fontSize: '24px', color: '#fff', backgroundColor: '#4A90E2', padding: { x: 10, y: 5 } })
      .setInteractive()
      .setOrigin(0.5)
      .on('pointerdown', () => this.toggleTheme());

    this.messageBox = this.add.text(this.scale.width / 2, this.scale.height - 100, '', {
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
      wordWrap: { width: this.scale.width - 40 }
    }).setOrigin(0.5).setVisible(false);

    // Set up mouse events for digging
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private loadLevel(index: number) {
    const levelData = LEVELS[index];
    if (!levelData) {
      this.displayMessage('Congratulations! You have completed all levels!');
      return;
    }

    this.levelConfig = levelData;
    this.totalCollectibles = this.levelConfig.map.reduce((count, row) => count + (row.match(/c/g) || []).length, 0);
    this.collectedCount = 0;
    this.collectedText.setText(`Collected: ${this.collectedCount}/${this.totalCollectibles}`);
    this.resetState();
    this.parseLevelMap();
    this.gameState = GameState.Playing;
  }

  private resetState() {
    this.matter.world.clear(false, true, true);
    this.staticBodies = [];
    this.waterParticles.forEach(p => Matter.World.remove(this.matterPhysics, p));
    this.waterParticles = [];
    this.particleGraphics.forEach(g => g.destroy());
    this.particleGraphics = [];
    this.collectibles.forEach(c => c.destroy());
    this.collectibles = [];
    this.isDragging = false;
    this.lastDragPosition = null;
    this.dragGraphics.clear();
    if (this.waterSpawnTimer) {
      this.waterSpawnTimer.destroy();
    }
  }

  private parseLevelMap() {
    const tileSize = 40;
    const map = this.levelConfig.map;
    const offsetX = (this.scale.width - map[0].length * tileSize) / 2;
    const offsetY = (this.scale.height - map.length * tileSize) / 2;

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const char = map[row][col];
        const pixelX = offsetX + col * tileSize + tileSize / 2;
        const pixelY = offsetY + row * tileSize + tileSize / 2;

        if (char === 'd') {
          // Dirt blocks
          const dirt = this.matter.add.rectangle(pixelX, pixelY, tileSize, tileSize, {
            isStatic: true,
            label: 'dirt',
            render: {
                fillStyle: '#5C3A21'
            }
          });
          this.staticBodies.push(dirt);
        } else if (char === 'c') {
            const collectibleId = `collectible-${this.collectibles.length}`;
            const collectible = new Collectible(
                this,
                { row, col },
                tileSize,
                {
                    type: 'emoji',
                    fillColor: 0xFEEA3B,
                    textColor: 0x000000,
                    icon: '🌟',
                    collectionThreshold: 10
                },
                collectibleId
            );
            this.add.existing(collectible);
            this.collectibles.push(collectible);
            this.matter.add.gameObject(collectible, { isStatic: true, label: 'collectible' });
            collectible.matterBody = collectible.body as Matter.Body;
        }
      }
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameMode === GameMode.Play && this.gameState === GameState.Playing) {
      this.isDragging = true;
      this.lastDragPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isDragging && this.lastDragPosition) {
      this.createDirtPath(this.lastDragPosition, new Phaser.Math.Vector2(pointer.x, pointer.y));
      this.lastDragPosition.set(pointer.x, pointer.y);
    }
  }

  private onPointerUp() {
    this.isDragging = false;
    this.lastDragPosition = null;
  }

  private createDirtPath(start: Phaser.Math.Vector2, end: Phaser.Math.Vector2) {
    const line = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);
    const length = Phaser.Geom.Line.Length(line);
    const angle = Phaser.Math.DegToRad(Phaser.Geom.Line.Angle(line) * 180 / Math.PI);
    const midPoint = Phaser.Geom.Line.GetPoint(line, 0.5);
    const width = 10;

    const dirtBody = this.matter.add.rectangle(midPoint.x, midPoint.y, length, width, {
        isStatic: true,
        angle: angle,
        label: 'dugPath'
    });
    this.dragGraphics.fillStyle(0x000000);
    this.dragGraphics.fillRect(midPoint.x - length / 2, midPoint.y - width / 2, length, width);
    
    this.staticBodies.push(dirtBody);
  }

  private startWaterFlow() {
    if (this.waterSpawnTimer) {
      this.waterSpawnTimer.destroy();
    }
    this.waterSpawnTimer = this.time.addEvent({
      delay: 50,
      callback: this.spawnWaterParticle,
      callbackScope: this,
      loop: true
    });
  }

  private spawnWaterParticle() {
    const waterSource = this.levelConfig.waterSource;
    const pixelPos = this.getPixelPosition(waterSource.y, waterSource.x);
    const particle = this.matter.add.circle(pixelPos.x, pixelPos.y, 4, {
      label: 'waterParticle',
      frictionAir: 0,
      restitution: 0.6,
      density: 0.001,
    });

    const graphics = this.add.graphics({ fillStyle: { color: 0x4A90E2 } });
    graphics.fillCircle(0, 0, 4);
    this.particleGraphics.push(graphics);

    this.waterParticles.push(particle);
  }

  private setupPhysicsEvents() {
    this.matter.world.on('collisionstart', (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach(pair => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        if (bodyA.label === 'waterParticle' && bodyB.label === 'collectible') {
          const collectible = this.collectibles.find(c => c.matterBody === bodyB);
          if (collectible) {
            collectible.fillWithWater();
          }
        } else if (bodyB.label === 'waterParticle' && bodyA.label === 'collectible') {
          const collectible = this.collectibles.find(c => c.matterBody === bodyA);
          if (collectible) {
            collectible.fillWithWater();
          }
        }
      });
    });
  }

  override update(time: number, delta: number) {
    if (this.gameState !== GameState.Playing) return;

    this.waterParticles.forEach((particle, index) => {
      this.particleGraphics[index].x = particle.position.x;
      this.particleGraphics[index].y = particle.position.y;
    });

    this.collectibles.forEach(collectible => collectible.update());
  }

  private getPixelPosition(row: number, col: number): { x: number, y: number } {
    const tileSize = 40;
    const map = this.levelConfig.map;
    const offsetX = (this.scale.width - map[0].length * tileSize) / 2;
    const offsetY = (this.scale.height - map.length * tileSize) / 2;
    return {
      x: offsetX + col * tileSize + tileSize / 2,
      y: offsetY + row * tileSize + tileSize / 2
    };
  }
  
  private displayMessage(message: string) {
    this.messageBox.setText(message);
    this.messageBox.setVisible(true);
    this.time.delayedCall(3000, () => {
      this.messageBox.setVisible(false);
    });
  }

  private toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    const backgroundColor = this.isDarkTheme ? 0x1A202C : 0xE5E5E5;
    this.themeBackground.fillStyle(backgroundColor);
    this.themeBackground.fillRect(0, 0, this.scale.width, this.scale.height);
  }
}
