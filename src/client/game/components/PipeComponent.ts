import * as Phaser from 'phaser';
import { ComponentType, PipeType, GridPosition } from '../core/GameTypes';

export class PipeComponent extends Phaser.GameObjects.Container {
  private componentType: ComponentType;
  private pipeType: PipeType;
  private gridPosition: GridPosition;
  private rotation: number = 0;
  private pipeGraphic: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    componentType: ComponentType,
    pipeType: PipeType,
    gridPosition: GridPosition,
    tileSize: number
  ) {
    super(scene, x, y);
    
    this.componentType = componentType;
    this.pipeType = pipeType;
    this.gridPosition = gridPosition;
    this.tileSize = tileSize;
    
    this.createPipeGraphic();
    scene.add.existing(this);
  }

  private createPipeGraphic() {
    this.pipeGraphic = new Phaser.GameObjects.Graphics(this.scene);
    this.add(this.pipeGraphic);
    this.drawPipe();
  }

  private drawPipe() {
    this.pipeGraphic.clear();
    
    const color = this.getPipeColor();
    const halfTile = this.tileSize / 2;
    const pipeWidth = 8;
    
    this.pipeGraphic.fillStyle(color);
    this.pipeGraphic.lineStyle(2, 0x000000, 0.3);

    switch (this.componentType) {
      case ComponentType.STRAIGHT_PIPE:
        // Horizontal pipe
        this.pipeGraphic.fillRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
        this.pipeGraphic.strokeRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
        break;
        
      case ComponentType.CORNER_PIPE:
        // L-shaped pipe (top-right corner)
        this.pipeGraphic.fillRect(-pipeWidth/2, -halfTile, pipeWidth, halfTile + pipeWidth/2);
        this.pipeGraphic.fillRect(-pipeWidth/2, -pipeWidth/2, halfTile + pipeWidth/2, pipeWidth);
        this.pipeGraphic.strokeRect(-pipeWidth/2, -halfTile, pipeWidth, halfTile + pipeWidth/2);
        this.pipeGraphic.strokeRect(-pipeWidth/2, -pipeWidth/2, halfTile + pipeWidth/2, pipeWidth);
        break;
        
      case ComponentType.T_JUNCTION:
        // T-shaped pipe
        this.pipeGraphic.fillRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
        this.pipeGraphic.fillRect(-pipeWidth/2, -pipeWidth/2, pipeWidth, halfTile + pipeWidth/2);
        this.pipeGraphic.strokeRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
        this.pipeGraphic.strokeRect(-pipeWidth/2, -pipeWidth/2, pipeWidth, halfTile + pipeWidth/2);
        break;
        
      default:
        // Default to straight pipe
        this.pipeGraphic.fillRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
        this.pipeGraphic.strokeRect(-halfTile, -pipeWidth/2, this.tileSize, pipeWidth);
    }
  }

  private getPipeColor(): number {
    switch (this.pipeType) {
      case PipeType.GLASS: return 0x87CEEB;
      case PipeType.METAL: return 0x708090;
      case PipeType.CERAMIC: return 0xDEB887;
      default: return 0x4A90E2; // Standard pipe
    }
  }

  public rotatePipe() {
    this.rotation = (this.rotation + 90) % 360;
    this.setRotation(Phaser.Math.DegToRad(this.rotation));
  }

  public getComponentType(): ComponentType {
    return this.componentType;
  }

  public getPipeType(): PipeType {
    return this.pipeType;
  }

  public getGridPosition(): GridPosition {
    return this.gridPosition;
  }
}