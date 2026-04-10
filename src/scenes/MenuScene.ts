import Phaser from 'phaser'
import { StorageManager } from '../data/StorageManager'

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }) }

  // ── Personagem animado ────────────────────────────────────────────
  private char!: Phaser.GameObjects.Image
  private charVx    = 110          // px/s
  private charVy    = 0
  private charX     = 0
  private charY     = 0
  private floorY    = 0
  private leftWall  = 48
  private rightWall = 0
  private nextJumpAt = 0

  create() {
    const { width, height } = this.cameras.main

    // ── Fundo ─────────────────────────────────────────────────────────
    this.add.image(width / 2, height / 2, 'tela_inicial')
      .setDisplaySize(width, height).setDepth(0)

    // ── Personagem andando aleatoriamente ─────────────────────────────
    this.floorY    = height - 70
    this.rightWall = width - 48
    this.charX     = Phaser.Math.Between(this.leftWall + 20, this.rightWall - 20)
    this.charY     = this.floorY

    this.char = this.add.image(this.charX, this.charY, 'stop')
      .setScale(0.58).setDepth(5)
    this.nextJumpAt = this.time.now + Phaser.Math.Between(800, 2500)

    // ── Botões ─────────────────────────────────────────────────────────
    const save    = StorageManager.load()
    const hasSave = save.currentPhase > 1 || save.totalScore > 0

    if (hasSave) {
      // Dois botões: Continuar + Nova Jornada
      const btnContinuar = this.add.image(width / 2, height * 0.72, 'btn_continuar')
        .setDepth(6).setInteractive({ useHandCursor: true })
      this.addHover(btnContinuar)
      btnContinuar.on('pointerdown', () => {
        this.scene.start('QuizScene', {
          phaseIndex: Math.max(0, save.currentPhase - 1),
          score: save.totalScore,
          lives:  save.lives
        })
      })

      const btnNova = this.add.image(width / 2, height * 0.84, 'btn_nova')
        .setDepth(6).setInteractive({ useHandCursor: true })
      this.addHover(btnNova)
      btnNova.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })
    } else {
      // Só o botão Iniciar
      const btnIniciar = this.add.image(width / 2, height * 0.78, 'btn_iniciar')
        .setDepth(6).setInteractive({ useHandCursor: true })
      this.addHover(btnIniciar)
      btnIniciar.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })
    }

  }

  update(time: number, delta: number) {
    if (!this.char) return
    const dt = delta / 1000

    // Gravidade quando no ar
    if (this.charY < this.floorY) this.charVy += 900 * dt

    this.charX += this.charVx * dt
    this.charY  = Math.min(this.charY + this.charVy * dt, this.floorY)

    // Chão
    if (this.charY >= this.floorY) this.charVy = 0

    // Paredes — rebate
    if (this.charX <= this.leftWall) {
      this.charX  = this.leftWall
      this.charVx = Math.abs(this.charVx)
    } else if (this.charX >= this.rightWall) {
      this.charX  = this.rightWall
      this.charVx = -Math.abs(this.charVx)
    }

    // Pulo aleatório quando no chão
    const onGround = this.charY >= this.floorY
    if (onGround && time >= this.nextJumpAt) {
      this.charVy    = -520
      this.nextJumpAt = time + Phaser.Math.Between(1500, 4000)
    }

    // Sprite
    this.char.setPosition(this.charX, this.charY).setFlipX(this.charVx < 0)

    if (!onGround) {
      this.char.setTexture('jump')
    } else if (Math.abs(this.charVx) > 10) {
      this.char.setTexture(Math.floor(time / 120) % 2 === 0 ? 'walk_1' : 'walk_2')
    } else {
      this.char.setTexture('stop')
    }
  }

  private addHover(img: Phaser.GameObjects.Image) {
    img.on('pointerover', () => this.tweens.add({ targets: img, scale: 1.06, duration: 100 }))
    img.on('pointerout',  () => this.tweens.add({ targets: img, scale: 1.0,  duration: 100 }))
  }
}
