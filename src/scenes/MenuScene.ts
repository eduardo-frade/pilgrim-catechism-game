import Phaser from 'phaser'
import { StorageManager } from '../data/StorageManager'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // Sky gradient background
    const sky = this.add.graphics()
    sky.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5c842, 0xf5c842, 1)
    sky.fillRect(0, 0, width, height)

    // Rolling hills (decorative)
    const hills = this.add.graphics()
    hills.fillStyle(0xd4a860, 1)
    hills.fillEllipse(200, height - 50, 500, 200)
    hills.fillEllipse(650, height - 70, 400, 180)
    hills.fillStyle(0xc8a050, 1)
    hills.fillRect(0, height - 60, width, 60)

    // Golden path
    const path = this.add.graphics()
    path.fillStyle(0xf5c842, 0.6)
    path.fillEllipse(width / 2, height - 20, 200, 30)

    // Title panel
    const titleBg = this.add.graphics()
    titleBg.fillStyle(0x1a0a2e, 0.75)
    titleBg.fillRoundedRect(width / 2 - 220, 60, 440, 100, 16)

    this.add.text(width / 2, 95, 'O Peregrino do Catecismo', {
      fontSize: '26px',
      color: '#f5c842',
      fontStyle: 'bold',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    this.add.text(width / 2, 135, 'Aprenda o Catecismo Menor de Westminster', {
      fontSize: '13px',
      color: '#fff8e1',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5)

    // Pilgrim placeholder (chibi boy shape)
    this.drawPilgrimChiabi(width / 2, height - 120)

    // Continue button (if save exists)
    const save = StorageManager.load()
    if (save.currentPhase > 1 || save.totalScore > 0) {
      const continueBtn = this.createButton(width / 2, height - 230, 'Continuar Jornada', 0x27ae60)
      continueBtn.on('pointerdown', () => {
        this.scene.start('QuizScene', {
          phaseIndex: save.currentPhase - 1,
          score: save.totalScore
        })
      })
    }

    // New game button
    const startBtn = this.createButton(width / 2, height - 170, 'Nova Jornada', 0xe8a020)
    startBtn.on('pointerdown', () => {
      StorageManager.reset()
      this.scene.start('QuizScene', { phaseIndex: 0, score: 0 })
    })

    // Phase counter
    const save2 = StorageManager.load()
    this.add.text(width / 2, height - 20, `Melhor pontuação: ${save2.totalScore} pts`, {
      fontSize: '13px',
      color: '#1a0a2e',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    // Animate pilgrim bob
    this.tweens.add({
      targets: this.children.getByName('pilgrim_group'),
      y: '-=8',
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    })
  }

  private drawPilgrimChiabi(x: number, y: number) {
    const g = this.add.graphics()
    g.setName('pilgrim_group')

    // Shadow
    g.fillStyle(0x000000, 0.15)
    g.fillEllipse(x, y + 36, 50, 12)

    // Robe (beige/golden — matching reference image)
    g.fillStyle(0xd4a055, 1)
    g.fillRoundedRect(x - 16, y - 10, 32, 40, 6)

    // Legs
    g.fillStyle(0xc8943f, 1)
    g.fillRect(x - 10, y + 28, 8, 10)
    g.fillRect(x + 2, y + 28, 8, 10)

    // Sandals
    g.fillStyle(0x8b5e3c, 1)
    g.fillRect(x - 12, y + 36, 10, 4)
    g.fillRect(x + 2, y + 36, 10, 4)

    // Body hood/scarf
    g.fillStyle(0xc49040, 1)
    g.fillRoundedRect(x - 14, y - 14, 28, 14, 4)

    // Head
    g.fillStyle(0xf0c080, 1)
    g.fillCircle(x, y - 26, 18)

    // Hair — dark brown
    g.fillStyle(0x4a2c0a, 1)
    g.fillEllipse(x, y - 38, 32, 16)
    g.fillRect(x - 16, y - 38, 10, 14)

    // Eyes
    g.fillStyle(0x1a1a1a, 1)
    g.fillCircle(x - 6, y - 26, 3)
    g.fillCircle(x + 6, y - 26, 3)

    // Cheeks
    g.fillStyle(0xffaaaa, 0.5)
    g.fillCircle(x - 11, y - 22, 4)
    g.fillCircle(x + 11, y - 22, 4)

    // Smile
    g.lineStyle(2, 0x8b4513, 1)
    g.beginPath()
    g.arc(x, y - 20, 5, 0, Math.PI, false)
    g.strokePath()

    // Staff (wooden stick)
    g.fillStyle(0x8b5e3c, 1)
    g.fillRect(x + 16, y - 44, 4, 80)
    g.fillStyle(0x6b4424, 1)
    g.fillRect(x + 16, y - 44, 4, 8)

    // Backpack
    g.fillStyle(0x8b5e3c, 1)
    g.fillRoundedRect(x - 22, y - 8, 10, 18, 3)
    g.fillStyle(0x6b4424, 1)
    g.fillRect(x - 22, y - 4, 10, 2)
  }

  private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-120, -22, 240, 44, 10)
    bg.lineStyle(2, 0x000000, 0.3)
    bg.strokeRoundedRect(-120, -22, 240, 44, 10)

    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(240, 44)
    container.setInteractive()

    container.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(Phaser.Display.Color.ValueToColor(color).brighten(20).color, 1)
      bg.fillRoundedRect(-120, -22, 240, 44, 10)
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 })
    })

    container.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(color, 1)
      bg.fillRoundedRect(-120, -22, 240, 44, 10)
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 })
    })

    return container
  }
}
