import Phaser from 'phaser'
import { StorageManager } from '../data/StorageManager'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main
    const save = StorageManager.load()

    // ── Fundo — colinas douradas (estilo da arte de referência) ──────
    const sky = this.add.graphics()
    sky.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d87a, 0xf5d87a, 1)
    sky.fillRect(0, 0, width, height)

    const hills = this.add.graphics()
    hills.fillStyle(0xe8d090, 0.7)
    hills.fillEllipse(160,  height - 40, 480, 200)
    hills.fillEllipse(600,  height - 55, 500, 210)
    hills.fillStyle(0xd4a860, 0.9)
    hills.fillEllipse(380,  height - 30, 360, 160)
    hills.fillStyle(0xc8a050, 1)
    hills.fillRect(0, height - 55, width, 55)

    // Caminho dourado brilhante (detalhe das referências)
    const pathG = this.add.graphics()
    pathG.fillStyle(0xf5c842, 0.45)
    pathG.fillEllipse(width / 2, height - 30, 220, 38)
    pathG.fillStyle(0xfff8c0, 0.3)
    pathG.fillEllipse(width / 2, height - 30, 100, 18)

    // Árvores decorativas
    this.drawTree(hills, 100,  height - 80, 0.85)
    this.drawTree(hills, 680,  height - 90, 0.95)
    this.drawTree(hills, 760,  height - 75, 0.7)

    // ── Painel do título ──────────────────────────────────────────────
    const titleBg = this.add.graphics()
    titleBg.fillStyle(0x1a0a2e, 0.78)
    titleBg.fillRoundedRect(width / 2 - 230, 48, 460, 105, 16)

    this.add.text(width / 2, 82, 'O Peregrino do Catecismo', {
      fontSize: '26px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.add.text(width / 2, 126, 'Aprenda o Catecismo Menor de Westminster', {
      fontSize: '13px', color: '#fff8e1', fontFamily: 'Arial'
    }).setOrigin(0.5)

    // ── Peregrino chibi animado ───────────────────────────────────────
    const pilgrim = this.drawPilgrim(width / 2 + 145, height - 115)
    this.tweens.add({
      targets: pilgrim, y: '-=7', yoyo: true, repeat: -1, duration: 850, ease: 'Sine.easeInOut'
    })

    // ── Botões ────────────────────────────────────────────────────────
    const hasSave = save.currentPhase > 1 || save.totalScore > 0

    if (hasSave) {
      const continueBtn = this.createButton(width / 2, height - 215, '▶  Continuar Jornada', 0x27ae60)
      continueBtn.on('pointerdown', () => {
        this.scene.start('QuizScene', {
          phaseIndex: Math.max(0, save.currentPhase - 1),
          score: save.totalScore,
          lives: save.lives
        })
      })
    }

    const yNew = hasSave ? height - 158 : height - 185
    const newBtn = this.createButton(width / 2, yNew, hasSave ? '↺  Nova Jornada' : '▶  Iniciar Jornada', 0xe8a020)
    newBtn.on('pointerdown', () => {
      StorageManager.reset()
      this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
    })

    // ── Pontuação salva ───────────────────────────────────────────────
    if (save.totalScore > 0) {
      this.add.text(width / 2, height - 12, `Melhor pontuação: ${save.totalScore} pts`, {
        fontSize: '12px', color: '#5c3a00', fontFamily: 'Arial'
      }).setOrigin(0.5)
    }

    // ── Instruções ───────────────────────────────────────────────────
    this.add.text(width / 2, height - 100, '← → Mover  |  SPACE Pular  |  V Artefato  |  ↓ Agachar', {
      fontSize: '11px', color: '#5c3a00', fontFamily: 'Arial'
    }).setOrigin(0.5)
  }

  // ── Peregrino chibi desenhado (fiel ao concept art) ──────────────
  private drawPilgrim(x: number, y: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics()

    // Sombra
    g.fillStyle(0x000000, 0.12)
    g.fillEllipse(x, y + 38, 52, 12)

    // Cajado (vara de madeira)
    g.fillStyle(0x7a4f2a, 1)
    g.fillRect(x + 18, y - 46, 5, 84)
    g.fillStyle(0x5a3518, 1)
    g.fillRect(x + 18, y - 46, 5, 10)

    // Mochila
    g.fillStyle(0x8b5e3c, 1)
    g.fillRoundedRect(x - 24, y - 10, 12, 20, 3)
    g.fillStyle(0x6b4424, 1)
    g.fillRect(x - 24, y - 5, 12, 2)
    g.fillRect(x - 24, y + 2, 12, 2)

    // Robe (túnica bege/dourada)
    g.fillStyle(0xd4a855, 1)
    g.fillRoundedRect(x - 16, y - 12, 34, 46, 7)
    // Detalhe do cinto
    g.fillStyle(0xb88a3a, 1)
    g.fillRect(x - 14, y + 8, 30, 3)

    // Pernas
    g.fillStyle(0xc89040, 1)
    g.fillRect(x - 10, y + 32, 9, 10)
    g.fillRect(x + 4,  y + 32, 9, 10)
    // Sandálias
    g.fillStyle(0x7a4a24, 1)
    g.fillRect(x - 12, y + 40, 12, 4)
    g.fillRect(x + 3,  y + 40, 12, 4)

    // Capuz/gola
    g.fillStyle(0xc49040, 1)
    g.fillRoundedRect(x - 15, y - 16, 30, 14, 4)

    // Cabeça
    g.fillStyle(0xf0c088, 1)
    g.fillCircle(x, y - 28, 19)

    // Cabelo castanho escuro
    g.fillStyle(0x3a1f08, 1)
    g.fillEllipse(x, y - 40, 34, 18)
    g.fillRect(x - 17, y - 44, 12, 18)   // lateral esquerda
    g.fillRoundedRect(x - 19, y - 30, 6, 10, 3) // franja lateral

    // Olhos grandes chibi
    g.fillStyle(0x1a1a1a, 1)
    g.fillCircle(x - 6, y - 28, 3.5)
    g.fillCircle(x + 6, y - 28, 3.5)
    // brilho nos olhos
    g.fillStyle(0xffffff, 1)
    g.fillCircle(x - 5, y - 30, 1.2)
    g.fillCircle(x + 7, y - 30, 1.2)

    // Bochechas rosadas
    g.fillStyle(0xffaaaa, 0.55)
    g.fillCircle(x - 12, y - 23, 4.5)
    g.fillCircle(x + 12, y - 23, 4.5)

    // Sorriso
    g.lineStyle(2, 0x8b4513, 1)
    g.beginPath()
    g.arc(x, y - 21, 5.5, 0.1, Math.PI - 0.1, false)
    g.strokePath()

    return g
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1) {
    g.fillStyle(0x7a5530, 1)
    g.fillRect(x - 4 * scale, y, 8 * scale, 32 * scale)
    g.fillStyle(0x5a7a2c, 1)
    g.fillCircle(x, y - 18 * scale, 24 * scale)
    g.fillStyle(0x6a9034, 0.7)
    g.fillCircle(x - 14 * scale, y - 8 * scale, 15 * scale)
    g.fillCircle(x + 14 * scale, y - 10 * scale, 15 * scale)
  }

  private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    const c  = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-125, -24, 250, 48, 11)
    bg.lineStyle(2, 0x00000033, 1)
    bg.strokeRoundedRect(-125, -24, 250, 48, 11)

    const txt = this.add.text(0, 0, label, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)

    c.add([bg, txt])
    c.setSize(250, 48).setInteractive({ useHandCursor: true })

    c.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(Phaser.Display.Color.ValueToColor(color).brighten(25).color, 1)
      bg.fillRoundedRect(-125, -24, 250, 48, 11)
      this.tweens.add({ targets: c, scaleX: 1.05, scaleY: 1.05, duration: 90 })
    })
    c.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(color, 1)
      bg.fillRoundedRect(-125, -24, 250, 48, 11)
      this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 90 })
    })
    return c
  }
}
