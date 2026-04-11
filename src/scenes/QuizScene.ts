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

const CLR_TEXT    = '#3a1f00'
const CLR_SUBTEXT = '#6b3d10'
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

    // ── Fundo: landscape + question2 por cima ─────────────────────────
    this.add.image(width / 2, height / 2, 'landscape')
      .setDisplaySize(width, height).setDepth(-2)
    this.add.image(width / 2, height / 2, 'question2')
      .setDisplaySize(width, height).setDepth(0)

    // ── HUD: vidas + pontuação ────────────────────────────────────────
    this.add.text(14, 8, `${'❤️'.repeat(Math.max(0, this.lives))}`, { fontSize: '15px' })
      .setDepth(10)
    this.add.text(width - 14, 8, `⭐ ${this.score}`, {
      fontSize: '13px', color: CLR_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10)

    // ── Texto no pergaminho ───────────────────────────────────────────
    // Os botões A/B/C ficam na esquerda (~x=108); o texto vai para a direita
    const textCX = Math.round(width * 0.55)         // ~440
    const textT  = Math.round(height * 0.09)         // ~40

    this.add.text(textCX, textT, `Fase ${this.phaseIndex + 1} · ${phase.title}`, {
      fontSize: '11px', color: CLR_SUBTEXT, fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5)

    this.add.text(textCX, textT + 18, `Pergunta ${this.question.number} do Catecismo`, {
      fontSize: '11px', color: '#c07010', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5)

    this.add.text(textCX, Math.round(height * 0.34), this.question.simplified, {
      fontSize: '14px', color: CLR_TEXT, fontFamily: 'Arial',
      wordWrap: { width: 430 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(5)

    // Botão ouvir
    const speakBtn = this.add.text(width - 90, textT + 4, '🔊 Ouvir', {
      fontSize: '11px', color: '#c07010', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#fff8e133', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10)
    speakBtn.on('pointerdown', () => AudioManager.speak(this.question.simplified))

    this.time.delayedCall(400, () => AudioManager.play(`q${this.question.number}_text`))

    // ── Respostas sobre os botões A/B/C de question2.png ─────────────
    // question2.png é 1280×720 exibida em 800×450 (fator 0.625)
    // Botões ficam empilhados na esquerda inferior do pergaminho
    const answers = this.shuffle([
      { text: this.question.correct,  isCorrect: true  },
      { text: this.question.wrong[0], isCorrect: false },
      { text: this.question.wrong[1], isCorrect: false }
    ])

    const BX = Math.round(width  * 0.135)   // ~108  (centro x dos botões)
    const BW = Math.round(width  * 0.200)   // ~160  (largura do botão)
    const BH = Math.round(height * 0.087)   // ~39   (altura do botão)

    const positions = [
      { x: BX, y: Math.round(height * 0.617) },  // A ~278
      { x: BX, y: Math.round(height * 0.711) },  // B ~320
      { x: BX, y: Math.round(height * 0.804) },  // C ~362
    ]

    answers.forEach((ans, i) => {
      this.createAnswerBtn(positions[i].x, positions[i].y, BW, BH, ans.text, ans.isCorrect)
    })
  }

  private createAnswerBtn(
    x: number, y: number, bw: number, bh: number,
    text: string, isCorrect: boolean
  ) {
    // Texto da resposta sobre o botão desenhado na imagem question2
    this.add.text(x, y, text, {
      fontSize: '9px', color: '#3a1f00', fontFamily: 'Arial', fontStyle: 'bold',
      wordWrap: { width: bw - 28 }, align: 'center'
    }).setOrigin(0.5).setDepth(5)

    // Zona interativa invisível cobrindo o botão
    const zone = this.add.zone(x, y, bw, bh)
      .setDepth(6).setInteractive({ useHandCursor: true })

    // Overlay de feedback (inicialmente transparente)
    const overlay = this.add.rectangle(x, y, bw, bh, 0x000000, 0)
      .setDepth(5.5)

    zone.on('pointerover', () => overlay.setFillStyle(0xffffff, 0.18))
    zone.on('pointerout',  () => overlay.setFillStyle(0x000000, 0))

    zone.on('pointerdown', () => {
      zone.disableInteractive()
      if (isCorrect) {
        overlay.setFillStyle(BTN_CORRECT, 0.55)
        AudioManager.play('correct')
        StorageManager.markQuestionAnswered(this.question.number)
        StorageManager.save({ currentPhase: this.phaseIndex + 1 })
        this.time.delayedCall(900, () => {
          this.scene.start('GameScene', { phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
        })
      } else {
        this.attempts++
        overlay.setFillStyle(BTN_WRONG, 0.55)
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
