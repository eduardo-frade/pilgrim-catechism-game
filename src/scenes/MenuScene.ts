import Phaser from 'phaser'
import { StorageManager } from '../data/StorageManager'

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }) }

  // ── Personagem animado ────────────────────────────────────────────
  private char!: Phaser.GameObjects.Image
  private charVx    = 110
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

    // ── Personagem (mesma altura visual do jogo, metade esquerda) ────────
    // floorY = centro do sprite quando parado no chão (pés em height*0.72)
    this.floorY    = Math.round(height * 0.72) - 37
    this.rightWall = Math.round(width * 0.38)
    this.charX     = Phaser.Math.Between(this.leftWall + 20, this.rightWall - 20)
    this.charY     = this.floorY

    this.char = this.add.image(this.charX, this.charY, 'stop')
      .setScale(0.58).setDepth(5)
    this.nextJumpAt = this.time.now + Phaser.Math.Between(800, 2500)

    // ── Botões ─────────────────────────────────────────────────────────
    // Largura alvo dos botões em pixels (mantém proporção natural da imagem)
    const save    = StorageManager.load()
    const hasSave = save.currentPhase > 1 || save.totalScore > 0

    const BTN_W = 200           // largura — menores e centralizados
    const btnX  = width / 2    // centralizado

    if (hasSave) {
      // "Iniciar Jornada" no topo, "Continuar Jornada" abaixo
      const btnIniciar = this.makeBtn('btn_iniciar',   btnX, Math.round(height * 0.50), BTN_W)
      btnIniciar.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })

      const btnContinuar = this.makeBtn('btn_continuar', btnX, Math.round(height * 0.65), BTN_W)
      btnContinuar.on('pointerdown', () => {
        this.scene.start('QuizScene', {
          phaseIndex: Math.max(0, save.currentPhase - 1),
          score: save.totalScore,
          lives:  save.lives
        })
      })
    } else {
      // Só "Iniciar Jornada"
      const btnIniciar = this.makeBtn('btn_iniciar', btnX, Math.round(height * 0.57), BTN_W)
      btnIniciar.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })
    }
  }

  update(time: number, delta: number) {
    if (!this.char) return
    const dt = delta / 1000

    if (this.charY < this.floorY) this.charVy += 900 * dt

    this.charX += this.charVx * dt
    this.charY  = Math.min(this.charY + this.charVy * dt, this.floorY)

    if (this.charY >= this.floorY) this.charVy = 0

    if (this.charX <= this.leftWall) {
      this.charX  = this.leftWall
      this.charVx = Math.abs(this.charVx)
    } else if (this.charX >= this.rightWall) {
      this.charX  = this.rightWall
      this.charVx = -Math.abs(this.charVx)
    }

    const onGround = this.charY >= this.floorY
    if (onGround && time >= this.nextJumpAt) {
      this.charVy    = -520
      this.nextJumpAt = time + Phaser.Math.Between(1500, 4000)
    }

    this.char.setPosition(this.charX, this.charY).setFlipX(this.charVx < 0)

    if (!onGround) {
      this.char.setTexture('jump')
    } else if (Math.abs(this.charVx) > 10) {
      this.char.setTexture(Math.floor(time / 120) % 2 === 0 ? 'walk_1' : 'walk_2')
    } else {
      this.char.setTexture('stop')
    }
  }

  // Cria botão com escala proporcional (mantém aspecto natural da imagem)
  private makeBtn(key: string, x: number, y: number, targetW: number): Phaser.GameObjects.Image {
    const src   = this.textures.get(key).getSourceImage() as HTMLImageElement
    const scale = targetW / src.width
    const img   = this.add.image(x, y, key)
      .setScale(scale).setDepth(6).setInteractive({ useHandCursor: true })

    // Efeito de pressionar (sem crescer — funciona bem no touch)
    img.on('pointerdown', () => this.tweens.add({ targets: img, scale: scale * 0.93, duration: 80 }))
    img.on('pointerup',   () => this.tweens.add({ targets: img, scale: scale,         duration: 80 }))
    img.on('pointerout',  () => this.tweens.add({ targets: img, scale: scale,         duration: 80 }))

    return img
  }
}
