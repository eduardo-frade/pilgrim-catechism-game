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

// Cores que combinam com o visual da question.png (pergaminho + deserto)
const CLR_TEXT    = '#3a1f00'  // marrom escuro sobre pergaminho
const CLR_SUBTEXT = '#6b3d10'
const BTN_A = 0xd4a017   // amarelo — slot A
const BTN_B = 0x2d6bc4   // azul    — slot B
const BTN_C = 0xc0392b   // vermelho — slot C
const BTN_CORRECT = 0x27ae60
const BTN_WRONG   = 0xe74c3c

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

    // ── Fundo: imagem question.png ────────────────────────────────────
    this.add.image(width / 2, height / 2, 'question_bg')
      .setDisplaySize(width, height).setDepth(-1)

    // ── Barra superior: vidas + pontuação ─────────────────────────────
    this.add.text(14, 14, `${'❤️'.repeat(Math.max(0, this.lives))}`, { fontSize: '15px' })
      .setOrigin(0, 0.5)
    this.add.text(width - 14, 14, `⭐ ${this.score}`, {
      fontSize: '13px', color: CLR_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    // ── Área do pergaminho: título + texto da pergunta ────────────────
    // O pergaminho ocupa aprox. x:100–700, y:15–275 num canvas de 800×450
    const scrollCenterX = width / 2
    const scrollTop     = 22
    const scrollBottom  = 272

    this.add.text(scrollCenterX, scrollTop + 16, `Fase ${this.phaseIndex + 1} · ${phase.title}`, {
      fontSize: '11px', color: CLR_SUBTEXT, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(scrollCenterX, scrollTop + 36, `Pergunta ${this.question.number} do Catecismo`, {
      fontSize: '12px', color: '#c07010', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Texto da pergunta (simplificado) — centralizado no pergaminho
    this.add.text(scrollCenterX, (scrollTop + scrollBottom) / 2 + 8, this.question.simplified, {
      fontSize: '14px', color: CLR_TEXT, fontFamily: 'Arial',
      wordWrap: { width: 520 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5)

    // Botão ouvir — no canto inferior do pergaminho
    const speakBtn = this.add.text(width - 115, scrollBottom - 4, '🔊 Ouvir', {
      fontSize: '12px', color: '#c07010', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#fff8e133', padding: { x: 7, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    speakBtn.on('pointerdown', () => AudioManager.speak(this.question.simplified))
    speakBtn.on('pointerover', () => speakBtn.setColor('#e8a020'))
    speakBtn.on('pointerout',  () => speakBtn.setColor('#c07010'))

    // Auto-narrar
    this.time.delayedCall(400, () => AudioManager.play(`q${this.question.number}_text`))

    // ── Área dos botões de resposta (slots A/B/C da question.png) ─────
    // Pergunta de escolha
    this.add.text(scrollCenterX, scrollBottom + 8, 'Qual é a resposta certa?', {
      fontSize: '13px', color: '#fff8e1', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#3a1f00', strokeThickness: 3
    }).setOrigin(0.5)

    const answers = this.shuffle([
      { text: this.question.correct,  isCorrect: true,  color: BTN_A },
      { text: this.question.wrong[0], isCorrect: false, color: BTN_B },
      { text: this.question.wrong[1], isCorrect: false, color: BTN_C }
    ])

    // Layout 2×2 matching the image slots: A(top-left) B(top-right) C(bottom-left)
    const btnW    = 340
    const btnH    = 52
    const row1Y   = scrollBottom + 50   // ≈ 322
    const row2Y   = scrollBottom + 110  // ≈ 382
    const colL    = width * 0.26        // ≈ 208
    const colR    = width * 0.74        // ≈ 592

    const positions = [
      { x: colL, y: row1Y },   // A — top-left
      { x: colR, y: row1Y },   // B — top-right
      { x: width / 2, y: row2Y } // C — bottom-center
    ]

    answers.forEach((ans, i) => {
      this.createAnswerBtn(positions[i].x, positions[i].y, btnW, btnH, ans.text, ans.isCorrect, ans.color)
    })
  }

  private createAnswerBtn(
    x: number, y: number, bw: number, bh: number,
    text: string, isCorrect: boolean, baseColor: number
  ) {
    const c  = this.add.container(x, y)
    const bg = this.add.graphics()

    const draw = (fill: number, alpha = 1) => {
      bg.clear()
      bg.fillStyle(fill, alpha)
      bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 10)
      bg.lineStyle(2.5, 0xffffff, 0.5)
      bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 10)
    }
    draw(baseColor)

    const lbl = this.add.text(0, 0, text, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: bw - 24 }, align: 'center', stroke: '#00000055', strokeThickness: 2
    }).setOrigin(0.5)

    c.add([bg, lbl])
    c.setSize(bw, bh).setInteractive({ useHandCursor: true })

    c.on('pointerover', () => { draw(baseColor, 0.85); this.tweens.add({ targets: c, scaleX: 1.04, scaleY: 1.04, duration: 80 }) })
    c.on('pointerout',  () => { draw(baseColor, 1);    this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 80 }) })

    c.on('pointerdown', () => {
      c.disableInteractive()
      if (isCorrect) {
        draw(BTN_CORRECT)
        AudioManager.play('correct')
        StorageManager.markQuestionAnswered(this.question.number)
        StorageManager.save({ currentPhase: this.phaseIndex + 1 })
        this.time.delayedCall(900, () => {
          this.scene.start('GameScene', { phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
        })
      } else {
        this.attempts++
        draw(BTN_WRONG)
        const key = `wrong_${Math.min(this.attempts, 3)}` as 'wrong_1' | 'wrong_2' | 'wrong_3'
        AudioManager.play(key)
        const msgs = ['Quase! Tente de novo!', 'Não desista! Você consegue!', 'Pense bem e tente novamente!']
        this.showEncouragement(msgs[Math.min(this.attempts - 1, 2)])
        this.time.delayedCall(1400, () => {
          this.scene.restart({ phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
        })
      }
    })
  }

  private showEncouragement(msg: string) {
    const { width, height } = this.cameras.main
    const p = this.add.graphics().setDepth(20)
    p.fillStyle(0x3a1f00, 0.88)
    p.fillRoundedRect(width / 2 - 170, height / 2 - 34, 340, 68, 12)
    this.add.text(width / 2, height / 2, msg, {
      fontSize: '15px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial',
      align: 'center', wordWrap: { width: 310 }
    }).setOrigin(0.5).setDepth(21)
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
