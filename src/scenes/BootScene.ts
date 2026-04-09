import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Background
    this.cameras.main.setBackgroundColor('#1a0a2e')

    // Title
    this.add.text(width / 2, height / 2 - 80, 'O Peregrino do Catecismo', {
      fontSize: '28px',
      color: '#f5c842',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 40, 'Carregando...', {
      fontSize: '16px',
      color: '#fff8e1',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Progress bar background
    const barBg = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333)
    barBg.setOrigin(0.5)

    // Progress bar fill
    const barFill = this.add.rectangle(width / 2 - 200, height / 2, 0, 18, 0xf5c842)
    barFill.setOrigin(0, 0.5)

    // Percentage text
    const pctText = this.add.text(width / 2, height / 2 + 30, '0%', {
      fontSize: '14px',
      color: '#f5c842',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      barFill.width = 400 * value
      pctText.setText(Math.floor(value * 100) + '%')
    })

    this.load.on('complete', () => {
      pctText.setText('100%')
    })

    // Generate all placeholder textures programmatically
    this.generateTextures()
  }

  private generateTextures() {
    // Player — chibi pilgrim: bege/dourado
    this.makeRectTexture('player', 32, 48, 0xd4a055)
    this.makeRectTexture('player_walk1', 32, 48, 0xc8943f)
    this.makeRectTexture('player_walk2', 32, 48, 0xdaaa60)

    // Enemy — Confusão: roxo
    this.makeRectTexture('enemy', 36, 36, 0x9b59b6)

    // Collectibles
    this.makeRectTexture('fragment', 16, 16, 0xffe066)  // Fragmento de Luz
    this.makeRectTexture('life_item', 20, 20, 0xffffff)  // Luz da Verdade

    // Projectile — bolinha de luz
    this.makeRectTexture('projectile', 10, 10, 0xfff176)

    // Tiles
    this.makeRectTexture('ground', 32, 32, 0xc8a050)
    this.makeRectTexture('platform', 32, 16, 0xa07030)

    // Goal zone
    this.makeRectTexture('goal', 40, 60, 0xf5c842)
  }

  private makeRectTexture(key: string, w: number, h: number, color: number) {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(color, 1)
    g.fillRect(0, 0, w, h)
    // Add simple outline
    g.lineStyle(2, 0x000000, 0.3)
    g.strokeRect(0, 0, w, h)
    g.generateTexture(key, w, h)
    g.destroy()
  }

  create() {
    this.scene.start('MenuScene')
  }
}
