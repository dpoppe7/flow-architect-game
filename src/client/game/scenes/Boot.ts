import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image('background', 'assets/bg.png');

    //simple particle texture
    this.createParticleTexture();
  }

  create() {
    //intializing global main scenes
    this.registry.set('currentLevel', null);
    this.registry.set('playerProgress', { levelCompleted: 0 });

    // Start the main preloader
    this.scene.start('Preloader');
    
  }

  private createParticleTexture() {
    //simple white circle for liquid particles
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 3);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }
}
