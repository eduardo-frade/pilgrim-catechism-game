import Phaser from 'phaser'
import worlds from '../data/worlds.json'

interface HUDData {
  hearts: number
  lives: number
  score: number
  phaseIndex: number
}

export class HUDScene extends Phaser.Scene {
  private heartIcons: Phaser.GameObjects.Text[] = []
  private livesText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private world = worlds.worlds[0]

  constructor() {
    super({ key: 'HUDScene' })
  }

  init(data: HUDData) {
    this.data.set('hearts',     data.hearts     ?? 3)
    this.data.set('lives',      data.lives      ?? 1)
    this.data.set('score',      data.score      ?? 0)
    this.data.set('phaseIndex', data.phaseIndex ?? 0)
  }

  create() {
    const { width, height } = this.cameras.main
    const phaseIdx = this.data.get('phaseIndex') as number
    const phase    = this.world.phases[phaseIdx]

    // Barra superior semitransparente
    const topBar = this.add.graphics()
    topBar.fillStyle(0x1a0a2e, 0.72)
    topBar.fillRect(0, 0, width, 38)

    // ── Corações (tentativa atual) — canto superior esquerdo ─────────
    this.drawHearts(this.data.get('hearts') as number)

    // ── Vidas (globais) — logo após os corações ──────────────────────
    this.livesText = this.add.text(90, 19, this.livesLabel(this.data.get('lives') as number), {
      fontSize: '13px', color: '#ffaaaa', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0, 0.5)

    // ── Nome da fase — centro ─────────────────────────────────────────
    this.add.text(width / 2, 19, `Fase ${phaseIdx + 1}: ${phase.title}`, {
      fontSize: '13px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    // ── Pontuação — direita ───────────────────────────────────────────
    this.scoreText = this.add.text(width - 8, 19, `⭐ ${this.data.get('score') as number}`, {
      fontSize: '14px', color: '#fff8e1', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    // ── Botões de toque (mobile) ──────────────────────────────────────
    this.createTouchControls(width, height)

    // ── Ouvir eventos do GameScene ────────────────────────────────────
    this.events.on('updateHearts', (h: number)  => this.drawHearts(h))
    this.events.on('updateLives',  (l: number)  => this.livesText.setText(this.livesLabel(l)))
    this.events.on('updateScore',  (s: number)  => this.scoreText.setText(`⭐ ${s}`))
  }

  // ── Desenha os 3 ícones de coração ────────────────────────────────
  private drawHearts(hearts: number) {
    this.heartIcons.forEach(h => h.destroy())
    this.heartIcons = []
    for (let i = 0; i < 3; i++) {
      const icon = this.add.text(14 + i * 24, 19, i < hearts ? '❤️' : '🖤', {
        fontSize: '16px'
      }).setOrigin(0.5)
      this.heartIcons.push(icon)
    }
  }

  private livesLabel(lives: number) {
    return `× ${lives} vida${lives !== 1 ? 's' : ''}`
  }

  // ── Botões de toque ───────────────────────────────────────────────
  private createTouchControls(width: number, height: number) {
    const btnY  = height - 40
    const alpha = 0.55

    const btnLeft  = this.makeTouchBtn(50,         btnY, '◀', alpha)
    const btnRight = this.makeTouchBtn(120,         btnY, '▶', alpha)
    const btnJump  = this.makeTouchBtn(width - 120, btnY, '▲ Pular', alpha)
    const btnShoot = this.makeTouchBtn(width - 48,  btnY, 'V', alpha)

    this.setupTouchBtn(btnLeft,  'left')
    this.setupTouchBtn(btnRight, 'right')
    this.setupTouchBtn(btnJump,  'jump')
    this.setupTouchBtn(btnShoot, 'shoot')
  }

  private makeTouchBtn(x: number, y: number, label: string, alpha: number): Phaser.GameObjects.Container {
    const c  = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(0x1a0a2e, alpha)
    bg.fillCircle(0, 0, 26)
    bg.lineStyle(2, 0xf5c842, 0.8)
    bg.strokeCircle(0, 0, 26)
    const txt = this.add.text(0, 0, label, {
      fontSize: '14px', color: '#f5c842', fontFamily: 'Arial'
    }).setOrigin(0.5)
    c.add([bg, txt])
    c.setSize(52, 52).setInteractive()
    return c
  }

  private setupTouchBtn(btn: Phaser.GameObjects.Container, action: string) {
    btn.on('pointerdown', () => this.sendAction(action, true))
    btn.on('pointerup',   () => this.sendAction(action, false))
    btn.on('pointerout',  () => this.sendAction(action, false))
  }

  private sendAction(action: string, active: boolean) {
    const gs = this.scene.get('GameScene') as Phaser.Scene & {
      playerRef?: {
        moveLeft:  (b: boolean) => void
        moveRight: (b: boolean) => void
        jump:      () => void
        shootNow:  () => void
      }
    }
    const p = gs?.playerRef
    if (!p) return
    if (action === 'left')  p.moveLeft(active)
    if (action === 'right') p.moveRight(active)
    if (action === 'jump'  && active) p.jump()
    if (action === 'shoot' && active) p.shootNow()
  }
}
