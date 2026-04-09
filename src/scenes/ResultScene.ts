import Phaser from 'phaser'
import catechism from '../data/catechism.json'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'

interface ResultData {
  phaseIndex: number
  score: number
  question: typeof catechism[0]
}

export class ResultScene extends Phaser.Scene {
  private phaseIndex = 0
  private score = 0
  private question!: typeof catechism[0]
  private world = worlds.worlds[0]

  constructor() {
    super({ key: 'ResultScene' })
  }

  init(data: ResultData) {
    this.phaseIndex = data.phaseIndex
    this.score = data.score
    this.question = data.question
  }

  create() {
    const { width, height } = this.cameras.main
    const isLastPhase = this.phaseIndex >= this.world.phases.length - 1

    // Background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d87a, 0xf5d87a, 1)
    bg.fillRect(0, 0, width, height)

    // Decorative hills
    const hills = this.add.graphics()
    hills.fillStyle(0xd4a860, 0.6)
    hills.fillEllipse(150, height - 20, 400, 160)
    hills.fillEllipse(650, height - 10, 500, 180)
    hills.fillStyle(0xc8a050, 1)
    hills.fillRect(0, height - 50, width, 50)

    // Golden path glow
    hills.fillStyle(0xf5c842, 0.4)
    hills.fillEllipse(width / 2, height - 30, 250, 40)

    // Victory star burst
    this.drawStarBurst(width / 2, 70)

    // Phase complete text — animate in
    const completeText = this.add.text(width / 2, 70, '🌟 Fase Completa! 🌟', {
      fontSize: '26px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setScale(0)

    this.tweens.add({
      targets: completeText,
      scaleX: 1, scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })

    // Answer card
    const cardY = 120
    const cardH = 155
    const card = this.add.graphics()
    card.fillStyle(0x1a0a2e, 0.88)
    card.fillRoundedRect(40, cardY, width - 80, cardH, 14)
    card.lineStyle(3, 0xf5c842, 1)
    card.strokeRoundedRect(40, cardY, width - 80, cardH, 14)
    card.setAlpha(0)

    this.tweens.add({ targets: card, alpha: 1, duration: 600, delay: 300 })

    const questionLabel = this.add.text(width / 2, cardY + 22, `Pergunta ${this.question.number}:`, {
      fontSize: '13px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)

    const questionText = this.add.text(width / 2, cardY + 48, this.question.question, {
      fontSize: '14px', color: '#fff8e1', fontFamily: 'Arial',
      wordWrap: { width: width - 110 }, align: 'center'
    }).setOrigin(0.5).setAlpha(0)

    const answerLabel = this.add.text(width / 2, cardY + 95, 'Resposta:', {
      fontSize: '13px', color: '#f5c842', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)

    const answerText = this.add.text(width / 2, cardY + 122, this.question.correct, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: width - 110 }, align: 'center'
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({ targets: [questionLabel, questionText, answerLabel, answerText], alpha: 1, duration: 400, delay: 600 })

    // Narrate the answer
    this.time.delayedCall(800, () => {
      this.narrate(`Muito bem! A resposta é: ${this.question.correct}`)
    })

    // Score display
    const scoreBox = this.add.graphics()
    scoreBox.fillStyle(0xf5c842, 0.9)
    scoreBox.fillRoundedRect(width / 2 - 80, 290, 160, 40, 10)

    this.add.text(width / 2, 310, `⭐ Pontuação: ${this.score}`, {
      fontSize: '15px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setName('scoreText')

    this.tweens.add({
      targets: this.children.getByName('scoreText'),
      alpha: 1, duration: 400, delay: 800
    })

    // Pilgrim celebration drawing
    this.drawPilgrimCelebration(width / 2 + 130, 305)

    // Buttons
    if (!isLastPhase) {
      const nextBtn = this.createButton(width / 2, height - 85, 'Próxima Fase →', 0x27ae60)
      nextBtn.setAlpha(0)
      this.tweens.add({ targets: nextBtn, alpha: 1, duration: 400, delay: 1000 })
      nextBtn.on('pointerdown', () => {
        this.scene.start('QuizScene', {
          phaseIndex: this.phaseIndex + 1,
          score: this.score
        })
      })
    } else {
      // Last phase — world complete
      this.add.text(width / 2, height - 115, '🎉 Você completou o Mundo 1! 🎉', {
        fontSize: '18px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold', align: 'center',
        wordWrap: { width: width - 60 }
      }).setOrigin(0.5)

      const menuBtn = this.createButton(width / 2, height - 60, 'Ir para o Menu', 0xe8a020)
      menuBtn.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('MenuScene')
      })
    }

    // Menu button
    const menuBtn2 = this.createButton(width / 2, height - 30, 'Menu Principal', 0x7f8c8d)
    menuBtn2.setScale(0.8)
    menuBtn2.on('pointerdown', () => this.scene.start('MenuScene'))
  }

  private drawStarBurst(x: number, y: number) {
    const g = this.add.graphics()
    g.lineStyle(3, 0xf5c842, 0.6)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const r1 = 30, r2 = 50
      g.lineBetween(
        x + Math.cos(angle) * r1, y + Math.sin(angle) * r1,
        x + Math.cos(angle) * r2, y + Math.sin(angle) * r2
      )
    }

    this.tweens.add({
      targets: g, angle: 360, duration: 8000, repeat: -1, ease: 'Linear'
    })
  }

  private drawPilgrimCelebration(x: number, y: number) {
    const g = this.add.graphics()

    // Robe
    g.fillStyle(0xd4a055, 1)
    g.fillRoundedRect(x - 14, y - 10, 28, 34, 5)

    // Arms up (celebrating)
    g.fillStyle(0xd4a055, 1)
    g.fillRect(x - 22, y - 22, 8, 16)
    g.fillRect(x + 14, y - 22, 8, 16)

    // Head
    g.fillStyle(0xf0c080, 1)
    g.fillCircle(x, y - 24, 16)

    // Hair
    g.fillStyle(0x4a2c0a, 1)
    g.fillEllipse(x, y - 34, 28, 14)

    // Eyes (happy)
    g.fillStyle(0x1a1a1a, 1)
    g.fillCircle(x - 5, y - 24, 2.5)
    g.fillCircle(x + 5, y - 24, 2.5)

    // Big smile
    g.lineStyle(2, 0x8b4513, 1)
    g.beginPath()
    g.arc(x, y - 18, 7, 0, Math.PI, false)
    g.strokePath()

    // Stars around (simple diamond shapes)
    g.fillStyle(0xf5c842, 1)
    g.fillTriangle(x - 26, y - 42, x - 30, y - 36, x - 22, y - 36)
    g.fillTriangle(x - 26, y - 30, x - 30, y - 36, x - 22, y - 36)
    g.fillTriangle(x + 26, y - 42, x + 30, y - 36, x + 22, y - 36)
    g.fillTriangle(x + 26, y - 30, x + 30, y - 36, x + 22, y - 36)

    // Bounce animation
    this.tweens.add({
      targets: g, y: '-=8', yoyo: true, repeat: -1, duration: 400, ease: 'Sine.easeInOut'
    })
  }

  private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 1)
    bg.fillRoundedRect(-110, -20, 220, 40, 10)

    const text = this.add.text(0, 0, label, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)

    container.add([bg, text])
    container.setSize(220, 40)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => { this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 }) })
    container.on('pointerout', () => { this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 }) })

    return container
  }

  private narrate(text: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'pt-BR'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }
}
