import Phaser from 'phaser'
import worlds from '../data/worlds.json'

interface HUDData {
  lives: number
  score: number
  phaseIndex: number
}

export class HUDScene extends Phaser.Scene {
  private heartIcons: Phaser.GameObjects.Text[] = []
  private scoreText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private world = worlds.worlds[0]

  // Touch control buttons
  private btnLeft!: Phaser.GameObjects.Container
  private btnRight!: Phaser.GameObjects.Container
  private btnJump!: Phaser.GameObjects.Container
  private btnShoot!: Phaser.GameObjects.Container

  constructor() {
    super({ key: 'HUDScene' })
  }

  init(data: HUDData) {
    this.data.set('lives', data.lives ?? 3)
    this.data.set('score', data.score ?? 0)
    this.data.set('phaseIndex', data.phaseIndex ?? 0)
  }

  create() {
    const { width, height } = this.cameras.main
    const phase = this.world.phases[this.data.get('phaseIndex')]

    // Semi-transparent top bar
    const topBar = this.add.graphics()
    topBar.fillStyle(0x1a0a2e, 0.7)
    topBar.fillRect(0, 0, width, 36)

    // Phase name
    this.phaseText = this.add.text(width / 2, 18, `Fase ${(this.data.get('phaseIndex') as number) + 1}: ${phase.title}`, {
      fontSize: '13px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5)

    // Hearts
    this.drawHearts(this.data.get('lives') as number)

    // Score
    this.scoreText = this.add.text(width - 10, 18, `⭐ ${this.data.get('score') as number}`, {
      fontSize: '14px', color: '#fff8e1', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    // Touch controls (bottom of screen)
    this.createTouchControls(width, height)

    // Listen for updates from GameScene
    this.events.on('updateLives', (lives: number) => this.drawHearts(lives))
    this.events.on('updateScore', (score: number) => {
      this.scoreText.setText(`⭐ ${score}`)
    })
  }

  private drawHearts(lives: number) {
    this.heartIcons.forEach(h => h.destroy())
    this.heartIcons = []

    for (let i = 0; i < 3; i++) {
      const heart = this.add.text(14 + i * 24, 18, i < lives ? '❤️' : '🖤', {
        fontSize: '16px'
      }).setOrigin(0.5, 0.5)
      this.heartIcons.push(heart)
    }
  }

  private createTouchControls(width: number, height: number) {
    const btnY = height - 40
    const btnSize = 52
    const alpha = 0.55

    this.btnLeft = this.makeTouchBtn(50, btnY, '◀', btnSize, alpha)
    this.btnRight = this.makeTouchBtn(120, btnY, '▶', btnSize, alpha)
    this.btnJump = this.makeTouchBtn(width - 120, btnY, '▲', btnSize, alpha)
    this.btnShoot = this.makeTouchBtn(width - 50, btnY, '✦', btnSize, alpha)

    // Wire touch events to GameScene player
    this.setupTouchBtn(this.btnLeft, 'left')
    this.setupTouchBtn(this.btnRight, 'right')
    this.setupTouchBtn(this.btnJump, 'jump')
    this.setupTouchBtn(this.btnShoot, 'shoot')
  }

  private makeTouchBtn(x: number, y: number, label: string, size: number, alpha: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x1a0a2e, alpha)
    bg.fillCircle(0, 0, size / 2)
    bg.lineStyle(2, 0xf5c842, 0.8)
    bg.strokeCircle(0, 0, size / 2)

    const txt = this.add.text(0, 0, label, {
      fontSize: '20px', color: '#f5c842', fontFamily: 'Arial'
    }).setOrigin(0.5)

    c.add([bg, txt])
    c.setSize(size, size)
    c.setInteractive()
    return c
  }

  private setupTouchBtn(btn: Phaser.GameObjects.Container, action: string) {
    btn.on('pointerdown', () => this.sendAction(action, true))
    btn.on('pointerup', () => this.sendAction(action, false))
    btn.on('pointerout', () => this.sendAction(action, false))
  }

  private sendAction(action: string, active: boolean) {
    const gameScene = this.scene.get('GameScene') as Phaser.Scene & {
      player?: {
        moveLeft: (b: boolean) => void
        moveRight: (b: boolean) => void
        jump: () => void
        shootNow: () => void
      }
    }
    if (!gameScene?.['player']) return
    const p = gameScene['player']
    if (action === 'left') p.moveLeft(active)
    if (action === 'right') p.moveRight(active)
    if (action === 'jump' && active) p.jump()
    if (action === 'shoot' && active) p.shootNow()
  }
}
