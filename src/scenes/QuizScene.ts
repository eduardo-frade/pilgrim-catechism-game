import Phaser from 'phaser'
import catechism from '../data/catechism.json'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'

interface QuizData {
  phaseIndex: number
  score: number
}

export class QuizScene extends Phaser.Scene {
  private phaseIndex = 0
  private score = 0
  private attempts = 0
  private question!: typeof catechism[0]
  private world = worlds.worlds[0]

  constructor() {
    super({ key: 'QuizScene' })
  }

  init(data: QuizData) {
    this.phaseIndex = data.phaseIndex ?? 0
    this.score = data.score ?? StorageManager.load().totalScore
    this.question = catechism[this.phaseIndex % catechism.length]
    this.attempts = 0
  }

  create() {
    const { width, height } = this.cameras.main
    const phase = this.world.phases[this.phaseIndex]

    // Background — warm golden sky matching reference art
    this.drawBackground(width, height)

    // Phase title
    this.add.text(width / 2, 20, `Fase ${this.phaseIndex + 1}: ${phase.title}`, {
      fontSize: '14px', color: '#8b5e1a', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Question card
    const cardY = 90
    const card = this.add.graphics()
    card.fillStyle(0xfdf3c0, 0.97)
    card.fillRoundedRect(40, cardY - 10, width - 80, 120, 12)
    card.lineStyle(2, 0xe8a020, 1)
    card.strokeRoundedRect(40, cardY - 10, width - 80, 120, 12)

    this.add.text(width / 2, cardY + 10, `Pergunta ${this.question.number}`, {
      fontSize: '13px', color: '#e8a020', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, cardY + 32, this.question.simplified, {
      fontSize: '15px', color: '#1a0a2e', fontFamily: 'Arial',
      wordWrap: { width: width - 100 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5)

    // Speak button
    const speakBtn = this.add.text(width - 60, cardY + 92, '🔊 Ouvir', {
      fontSize: '13px', color: '#e8a020', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    speakBtn.on('pointerdown', () => this.narrate(this.question.simplified))
    speakBtn.on('pointerover', () => speakBtn.setColor('#f5c842'))
    speakBtn.on('pointerout', () => speakBtn.setColor('#e8a020'))

    // Auto-narrate
    this.time.delayedCall(500, () => this.narrate(this.question.simplified))

    // Answer label
    this.add.text(width / 2, 220, 'Qual é a resposta certa?', {
      fontSize: '16px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Shuffle answers
    const answers = this.shuffleAnswers([
      { text: this.question.correct, isCorrect: true },
      { text: this.question.wrong[0], isCorrect: false },
      { text: this.question.wrong[1], isCorrect: false }
    ])

    // Answer buttons
    answers.forEach((answer, i) => {
      this.createAnswerButton(width / 2, 265 + i * 58, answer.text, answer.isCorrect, i)
    })

    // Score display
    this.add.text(width - 20, 20, `⭐ ${this.score}`, {
      fontSize: '14px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5)
  }

  private drawBackground(width: number, height: number) {
    // Sky — warm cream/yellow gradient like reference
    const sky = this.add.graphics()
    sky.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d87a, 0xf5d87a, 1)
    sky.fillRect(0, 0, width, height)

    // Distant hills (light, soft)
    const hills = this.add.graphics()
    hills.fillStyle(0xe8d090, 0.6)
    hills.fillEllipse(150, height - 30, 500, 200)
    hills.fillEllipse(500, height - 10, 600, 220)
    hills.fillEllipse(750, height - 50, 400, 180)

    // Ground
    hills.fillStyle(0xc8a050, 1)
    hills.fillRect(0, height - 50, width, 50)

    // Golden path
    hills.fillStyle(0xf5c842, 0.5)
    hills.fillEllipse(width / 2, height - 30, 180, 30)
  }

  private createAnswerButton(x: number, y: number, text: string, isCorrect: boolean, _index: number) {
    const { width } = this.cameras.main
    const btnW = width - 100

    const container = this.add.container(x, y)

    const bg = this.add.graphics()
    bg.fillStyle(0xffffff, 1)
    bg.fillRoundedRect(-btnW / 2, -22, btnW, 44, 8)
    bg.lineStyle(2, 0xc8a050, 1)
    bg.strokeRoundedRect(-btnW / 2, -22, btnW, 44, 8)

    const label = this.add.text(0, 0, text, {
      fontSize: '13px', color: '#1a0a2e', fontFamily: 'Arial',
      wordWrap: { width: btnW - 20 }, align: 'center'
    }).setOrigin(0.5)

    container.add([bg, label])
    container.setSize(btnW, 44)
    container.setInteractive({ useHandCursor: true })

    container.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(0xfff3d0, 1)
      bg.fillRoundedRect(-btnW / 2, -22, btnW, 44, 8)
      bg.lineStyle(2, 0xe8a020, 1)
      bg.strokeRoundedRect(-btnW / 2, -22, btnW, 44, 8)
    })

    container.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(0xffffff, 1)
      bg.fillRoundedRect(-btnW / 2, -22, btnW, 44, 8)
      bg.lineStyle(2, 0xc8a050, 1)
      bg.strokeRoundedRect(-btnW / 2, -22, btnW, 44, 8)
    })

    container.on('pointerdown', () => {
      container.disableInteractive()
      this.handleAnswer(isCorrect, bg, label, btnW)
    })
  }

  private handleAnswer(
    isCorrect: boolean,
    bg: Phaser.GameObjects.Graphics,
    label: Phaser.GameObjects.Text,
    btnW: number
  ) {
    if (isCorrect) {
      // Green flash
      bg.clear()
      bg.fillStyle(0x27ae60, 1)
      bg.fillRoundedRect(-btnW / 2, -22, btnW, 44, 8)
      label.setColor('#ffffff')

      this.narrate('Muito bem! Resposta certa!')

      StorageManager.markQuestionAnswered(this.question.number)
      StorageManager.save({ currentPhase: this.phaseIndex + 1 })

      this.time.delayedCall(1200, () => {
        this.scene.start('GameScene', {
          phaseIndex: this.phaseIndex,
          score: this.score
        })
      })
    } else {
      this.attempts++
      bg.clear()
      bg.fillStyle(0xe74c3c, 1)
      bg.fillRoundedRect(-btnW / 2, -22, btnW, 44, 8)
      label.setColor('#ffffff')

      const messages = [
        'Quase! Tente de novo!',
        'Não desista! Você consegue!',
        'Pense bem... leia a pergunta novamente!'
      ]
      const msg = messages[Math.min(this.attempts - 1, messages.length - 1)]
      this.narrate(msg)

      // Show encouragement popup
      this.showEncouragement(msg)

      this.time.delayedCall(1500, () => {
        this.scene.restart({
          phaseIndex: this.phaseIndex,
          score: this.score
        })
      })
    }
  }

  private showEncouragement(message: string) {
    const { width, height } = this.cameras.main
    const popup = this.add.graphics()
    popup.fillStyle(0x1a0a2e, 0.9)
    popup.fillRoundedRect(width / 2 - 160, height / 2 - 40, 320, 80, 12)

    this.add.text(width / 2, height / 2, message, {
      fontSize: '16px', color: '#f5c842', fontFamily: 'Arial',
      fontStyle: 'bold', align: 'center', wordWrap: { width: 290 }
    }).setOrigin(0.5)
  }

  private shuffleAnswers<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  private narrate(text: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'pt-BR'
    utt.rate = 0.9
    utt.pitch = 1.1
    window.speechSynthesis.speak(utt)
  }
}
