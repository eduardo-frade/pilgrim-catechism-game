import Phaser from 'phaser'
import catechism from '../data/catechism.json'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'
import { AudioManager } from '../data/AudioManager'

interface ResultData {
  phaseIndex: number
  score: number
  lives: number
  question: typeof catechism[0]
}

export class ResultScene extends Phaser.Scene {
  private phaseIndex = 0
  private score      = 0
  private lives      = 1
  private question!: typeof catechism[0]
  private world = worlds.worlds[0]

  constructor() { super({ key: 'ResultScene' }) }

  init(data: ResultData) {
    this.phaseIndex = data.phaseIndex
    this.score      = data.score
    this.lives      = data.lives ?? StorageManager.load().lives
    this.question   = data.question
  }

  create() {
    AudioManager.init(this)
    const { width, height } = this.cameras.main
    const isLastPhase = this.phaseIndex >= this.world.phases.length - 1

    // ── Fundo ─────────────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d060, 0xf5d060, 1)
    bg.fillRect(0, 0, width, height)

    const hills = this.add.graphics()
    hills.fillStyle(0xe0c070, 0.6)
    hills.fillEllipse(160, height - 18, 420, 160)
    hills.fillEllipse(640, height - 10, 520, 180)
    hills.fillStyle(0xc8a050, 1); hills.fillRect(0, height - 48, width, 48)
    hills.fillStyle(0x7ab030, 1); hills.fillRect(0, height - 48, width, 6)
    hills.fillStyle(0xf5c842, 0.4); hills.fillEllipse(width / 2, height - 28, 260, 38)

    // ── Cabeçalho: "Fase Completa!" ───────────────────────────────────
    this.drawStarBurst(width / 2, 58)

    const title = this.add.text(width / 2, 58, '🌟 Fase Completa! 🌟', {
      fontSize: '26px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0)
    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 420, ease: 'Back.easeOut' })

    // ── Card da resposta ──────────────────────────────────────────────
    const cardY = 98
    const card  = this.add.graphics()
    card.fillStyle(0x1a0a2e, 0.88)
    card.fillRoundedRect(30, cardY, width - 60, 158, 14)
    card.lineStyle(3, 0xf5c842, 1)
    card.strokeRoundedRect(30, cardY, width - 60, 158, 14)
    card.setAlpha(0)
    this.tweens.add({ targets: card, alpha: 1, duration: 500, delay: 350 })

    const items = [
      this.add.text(width / 2, cardY + 20, `Pergunta ${this.question.number}:`, {
        fontSize: '12px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0),

      this.add.text(width / 2, cardY + 45, this.question.question, {
        fontSize: '13px', color: '#fff8e1', fontFamily: 'Arial',
        wordWrap: { width: width - 90 }, align: 'center'
      }).setOrigin(0.5).setAlpha(0),

      this.add.text(width / 2, cardY + 100, 'Resposta:', {
        fontSize: '12px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0),

      this.add.text(width / 2, cardY + 128, (this.question as any).corretas?.[0] ?? '', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
        wordWrap: { width: width - 90 }, align: 'center'
      }).setOrigin(0.5).setAlpha(0)
    ]
    this.tweens.add({ targets: items, alpha: 1, duration: 400, delay: 650 })

    // Narrar a resposta pelo AudioManager
    this.time.delayedCall(900, () => {
      AudioManager.play(`q${this.question.number}_answer`)
    })

    // ── Pontuação + peregrino ─────────────────────────────────────────
    const scoreY = 272
    const scoreBox = this.add.graphics()
    scoreBox.fillStyle(0xf5c842, 0.92)
    scoreBox.fillRoundedRect(width / 2 - 90, scoreY - 18, 180, 38, 10)

    const scoreTxt = this.add.text(width / 2, scoreY, `⭐ ${this.score} pontos`, {
      fontSize: '15px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: [scoreBox, scoreTxt], alpha: 1, duration: 400, delay: 900 })

    // Peregrino celebrando (direita)
    this.drawPilgrimCelebration(width - 68, 275)

    // ── Botões ────────────────────────────────────────────────────────
    if (!isLastPhase) {
      const nextBtn = this.createButton(width / 2, height - 72, '▶  Próxima Fase', 0x27ae60)
      nextBtn.setAlpha(0)
      this.tweens.add({ targets: nextBtn, alpha: 1, duration: 400, delay: 1100 })
      nextBtn.on('pointerdown', () => {
        AudioManager.stop()
        this.scene.start('QuizScene', { phaseIndex: this.phaseIndex + 1, score: this.score, lives: this.lives })
      })
    } else {
      this.add.text(width / 2, height - 105, '🎉 Você completou o Mundo 1! 🎉', {
        fontSize: '17px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold',
        wordWrap: { width: width - 60 }, align: 'center'
      }).setOrigin(0.5)
      const menuBtn = this.createButton(width / 2, height - 62, 'Ir para o Menu', 0xe8a020)
      menuBtn.on('pointerdown', () => { StorageManager.reset(); this.scene.start('MenuScene') })
    }

    const menuBtn2 = this.createButton(width / 2, height - 24, 'Menu Principal', 0x7f8c8d)
    menuBtn2.setScale(0.78)
    menuBtn2.on('pointerdown', () => { AudioManager.stop(); this.scene.start('MenuScene') })
  }

  // ── Estrelas girando ──────────────────────────────────────────────
  private drawStarBurst(x: number, y: number) {
    const g = this.add.graphics()
    g.lineStyle(2.5, 0xf5c842, 0.55)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      g.lineBetween(x + Math.cos(a) * 28, y + Math.sin(a) * 28, x + Math.cos(a) * 48, y + Math.sin(a) * 48)
    }
    this.tweens.add({ targets: g, angle: 360, duration: 9000, repeat: -1, ease: 'Linear' })
  }

  // ── Peregrino comemorando ─────────────────────────────────────────
  private drawPilgrimCelebration(x: number, y: number) {
    const g = this.add.graphics()
    // cajado
    g.fillStyle(0x7a4f2a, 1); g.fillRect(x + 12, y - 42, 3, 42)
    // mochila
    g.fillStyle(0x8b5e3c, 1); g.fillRoundedRect(x - 14, y - 28, 8, 14, 2)
    // braços levantados (comemorando)
    g.fillStyle(0xd4a855, 1)
    g.fillRect(x - 18, y - 28, 8, 14)
    g.fillRect(x + 10, y - 28, 8, 14)
    // robe
    g.fillStyle(0xd4a855, 1); g.fillRoundedRect(x - 10, y - 28, 20, 28, 4)
    // cabeça
    g.fillStyle(0xf0c088, 1); g.fillCircle(x, y - 36, 14)
    // cabelo
    g.fillStyle(0x3a1f08, 1); g.fillEllipse(x, y - 45, 24, 12)
    // olhos felizes (arcos)
    g.lineStyle(2, 0x1a1a1a, 1)
    g.beginPath(); g.arc(x - 5, y - 38, 3, Math.PI, 0, false); g.strokePath()
    g.beginPath(); g.arc(x + 5, y - 38, 3, Math.PI, 0, false); g.strokePath()
    // bochechas
    g.fillStyle(0xffaaaa, 0.55); g.fillCircle(x - 9, y - 33, 3.5); g.fillCircle(x + 9, y - 33, 3.5)
    // sorriso grande
    g.lineStyle(2, 0x8b4513, 1)
    g.beginPath(); g.arc(x, y - 28, 6, 0.1, Math.PI - 0.1, false); g.strokePath()
    // estrelinhas
    g.fillStyle(0xf5c842, 1)
    g.fillTriangle(x - 22, y - 46, x - 26, y - 40, x - 18, y - 40)
    g.fillTriangle(x - 22, y - 34, x - 26, y - 40, x - 18, y - 40)
    g.fillTriangle(x + 22, y - 46, x + 26, y - 40, x + 18, y - 40)
    g.fillTriangle(x + 22, y - 34, x + 26, y - 40, x + 18, y - 40)

    this.tweens.add({ targets: g, y: '-=7', yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' })
  }

  private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    const c  = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 1); bg.fillRoundedRect(-112, -20, 224, 40, 10)
    const txt = this.add.text(0, 0, label, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)
    c.add([bg, txt])
    c.setSize(224, 40).setInteractive({ useHandCursor: true })
    c.on('pointerover', () => this.tweens.add({ targets: c, scaleX: 1.06, scaleY: 1.06, duration: 90 }))
    c.on('pointerout',  () => this.tweens.add({ targets: c, scaleX: 1,    scaleY: 1,    duration: 90 }))
    return c
  }
}
