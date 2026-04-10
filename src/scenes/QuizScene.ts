import Phaser from 'phaser'
import catechism from '../data/catechism.json'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'
import { AudioManager } from '../data/AudioManager'

interface QuizData {
  phaseIndex: number
  score: number
  lives?: number
}

export class QuizScene extends Phaser.Scene {
  private phaseIndex = 0
  private score      = 0
  private lives      = 1
  private attempts   = 0
  private question!: typeof catechism[0]
  private world = worlds.worlds[0]

  constructor() { super({ key: 'QuizScene' }) }

  init(data: QuizData) {
    this.phaseIndex = data.phaseIndex ?? 0
    this.score      = data.score  ?? StorageManager.load().totalScore
    this.lives      = data.lives  ?? StorageManager.load().lives
    this.question   = catechism[this.phaseIndex % catechism.length]
    this.attempts   = 0
  }

  create() {
    AudioManager.init(this)
    const { width, height } = this.cameras.main
    const phase = this.world.phases[this.phaseIndex % this.world.phases.length]

    this.drawBackground(width, height)

    // ── Peregrino decorativo no canto ────────────────────────────────
    this.drawSmallPilgrim(width - 60, height - 55)

    // ── Título da fase ────────────────────────────────────────────────
    this.add.text(width / 2, 18, `Fase ${this.phaseIndex + 1}: ${phase.title}`, {
      fontSize: '13px', color: '#7a4a00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    // ── Card da pergunta ──────────────────────────────────────────────
    const cardY = 38
    const card  = this.add.graphics()
    card.fillStyle(0xfdf6d0, 0.97)
    card.fillRoundedRect(30, cardY, width - 60, 130, 14)
    card.lineStyle(2.5, 0xe8a020, 1)
    card.strokeRoundedRect(30, cardY, width - 60, 130, 14)

    // Ícone livro
    this.add.text(52, cardY + 18, '📖', { fontSize: '20px' }).setOrigin(0.5)

    this.add.text(width / 2, cardY + 18, `Pergunta ${this.question.number} do Catecismo`, {
      fontSize: '12px', color: '#e8a020', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, cardY + 55, this.question.simplified, {
      fontSize: '14px', color: '#1a0a2e', fontFamily: 'Arial',
      wordWrap: { width: width - 80 }, align: 'center', lineSpacing: 5
    }).setOrigin(0.5)

    // Botão ouvir
    const speakBtn = this.add.text(width - 55, cardY + 112, '🔊 Ouvir', {
      fontSize: '12px', color: '#e8a020', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#fff8e155', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    speakBtn.on('pointerdown', () => AudioManager.speak(this.question.simplified))
    speakBtn.on('pointerover', () => speakBtn.setColor('#f5c842'))
    speakBtn.on('pointerout',  () => speakBtn.setColor('#e8a020'))

    // Auto-narrar
    this.time.delayedCall(400, () => {
      AudioManager.play(`q${this.question.number}_text`)
    })

    // ── Pergunta + botões de resposta ─────────────────────────────────
    this.add.text(width / 2, 188, 'Qual é a resposta certa?', {
      fontSize: '15px', color: '#1a0a2e', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    const answers = this.shuffle([
      { text: this.question.correct,  isCorrect: true  },
      { text: this.question.wrong[0], isCorrect: false },
      { text: this.question.wrong[1], isCorrect: false }
    ])

    answers.forEach((ans, i) => {
      this.createAnswerBtn(width / 2, 230 + i * 62, ans.text, ans.isCorrect)
    })

    // ── Indicador de vidas + pontuação ────────────────────────────────
    this.add.text(12, 18, `${'❤️'.repeat(this.lives)}`, {
      fontSize: '14px'
    }).setOrigin(0, 0.5)

    this.add.text(width - 12, 18, `⭐ ${this.score}`, {
      fontSize: '13px', color: '#7a4a00', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5)
  }

  private createAnswerBtn(x: number, y: number, text: string, isCorrect: boolean) {
    const { width } = this.cameras.main
    const bw = width - 80

    const c  = this.add.container(x, y)
    const bg = this.add.graphics()

    const drawBg = (fill: number, border: number) => {
      bg.clear()
      bg.fillStyle(fill, 1);   bg.fillRoundedRect(-bw / 2, -24, bw, 48, 9)
      bg.lineStyle(2, border, 1); bg.strokeRoundedRect(-bw / 2, -24, bw, 48, 9)
    }
    drawBg(0xffffff, 0xc8a050)

    const lbl = this.add.text(0, 0, text, {
      fontSize: '13px', color: '#1a0a2e', fontFamily: 'Arial',
      wordWrap: { width: bw - 24 }, align: 'center'
    }).setOrigin(0.5)

    c.add([bg, lbl])
    c.setSize(bw, 48).setInteractive({ useHandCursor: true })

    c.on('pointerover', () => drawBg(0xfff8e0, 0xe8a020))
    c.on('pointerout',  () => drawBg(0xffffff, 0xc8a050))
    c.on('pointerdown', () => {
      c.disableInteractive()
      if (isCorrect) {
        drawBg(0x27ae60, 0x1e8449); lbl.setColor('#ffffff')
        AudioManager.play('correct')
        StorageManager.markQuestionAnswered(this.question.number)
        StorageManager.save({ currentPhase: this.phaseIndex + 1 })
        this.time.delayedCall(1000, () => {
          this.scene.start('GameScene', { phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
        })
      } else {
        this.attempts++
        drawBg(0xe74c3c, 0xc0392b); lbl.setColor('#ffffff')
        const key = `wrong_${Math.min(this.attempts, 3)}` as 'wrong_1' | 'wrong_2' | 'wrong_3'
        AudioManager.play(key)
        const msgs = ['Quase! Tente de novo!', 'Não desista! Você consegue!', 'Pense bem e tente novamente!']
        this.showEncouragement(msgs[Math.min(this.attempts - 1, 2)])
        this.time.delayedCall(1600, () => {
          this.scene.restart({ phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
        })
      }
    })
  }

  private showEncouragement(msg: string) {
    const { width, height } = this.cameras.main
    const p = this.add.graphics().setDepth(20)
    p.fillStyle(0x1a0a2e, 0.92)
    p.fillRoundedRect(width / 2 - 170, height / 2 - 36, 340, 72, 14)
    this.add.text(width / 2, height / 2, msg, {
      fontSize: '16px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial',
      align: 'center', wordWrap: { width: 310 }
    }).setOrigin(0.5).setDepth(21)
  }

  private drawBackground(width: number, height: number) {
    // Usa a imagem question.png como fundo da tela de perguntas
    this.add.image(width / 2, height / 2, 'question_bg')
      .setDisplaySize(width, height).setDepth(-1)
  }

  private drawSmallPilgrim(x: number, y: number) {
    const g = this.add.graphics()
    // cajado
    g.fillStyle(0x7a4f2a, 1); g.fillRect(x + 10, y - 40, 3, 42)
    // robe
    g.fillStyle(0xd4a855, 1); g.fillRoundedRect(x - 10, y - 28, 20, 28, 4)
    // cabeça
    g.fillStyle(0xf0c088, 1); g.fillCircle(x, y - 34, 12)
    // cabelo
    g.fillStyle(0x3a1f08, 1); g.fillEllipse(x, y - 42, 20, 10)
    // olhos
    g.fillStyle(0x111111, 1); g.fillCircle(x - 4, y - 34, 2); g.fillCircle(x + 4, y - 34, 2)
    // bochechas
    g.fillStyle(0xffaaaa, 0.5); g.fillCircle(x - 8, y - 31, 3); g.fillCircle(x + 8, y - 31, 3)
    this.tweens.add({ targets: g, y: '-=5', yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' })
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
}
