import Phaser from 'phaser'
import { StorageManager } from '../data/StorageManager'

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }) }

  // ── Personagem animado ────────────────────────────────────────────
  private char!: Phaser.GameObjects.Image
  private charVx   = 120
  private charVy   = 0
  private charX    = 120
  private charY    = 0
  private floorY   = 0
  private leftWall = 40
  private rightWall = 0
  private nextJumpAt = 0

  create() {
    const { width, height } = this.cameras.main
    this.floorY    = height - 72
    this.rightWall = width - 40
    this.charY     = this.floorY

    // ── Fundo ────────────────────────────────────────────────────────
    if (this.textures.exists('tela_inicial')) {
      this.add.image(width / 2, height / 2, 'tela_inicial')
        .setDisplaySize(width, height).setDepth(0)
    } else {
      // Fallback gradiente dourado
      const sky = this.add.graphics().setDepth(0)
      sky.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d87a, 0xf5d87a, 1)
      sky.fillRect(0, 0, width, height)

      const hills = this.add.graphics().setDepth(0)
      hills.fillStyle(0xe8d090, 0.7);  hills.fillEllipse(160, height - 40, 480, 200)
      hills.fillEllipse(600, height - 55, 500, 210)
      hills.fillStyle(0xd4a860, 0.9);  hills.fillEllipse(380, height - 30, 360, 160)
      hills.fillStyle(0xc8a050, 1);    hills.fillRect(0, height - 55, width, 55)

      this.drawTree(hills, 100, height - 80, 0.85)
      this.drawTree(hills, 680, height - 90, 0.95)
      this.drawTree(hills, 760, height - 75, 0.70)

      // Painel de título (só no fallback — tela_inicial.png já traz o título)
      const titleBg = this.add.graphics().setDepth(1)
      titleBg.fillStyle(0x1a0a2e, 0.78)
      titleBg.fillRoundedRect(width / 2 - 230, 48, 460, 105, 16)

      this.add.text(width / 2, 82, 'O Peregrino do Catecismo', {
        fontSize: '26px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(2)

      this.add.text(width / 2, 126, 'Aprenda o Catecismo Menor de Westminster', {
        fontSize: '13px', color: '#fff8e1', fontFamily: 'Arial'
      }).setOrigin(0.5).setDepth(2)
    }

    // ── Personagem animado (sprites reais) ────────────────────────────
    this.char = this.add.image(this.charX, this.charY, 'stop')
      .setScale(0.58).setDepth(5)
    this.nextJumpAt = this.time.now + Phaser.Math.Between(800, 2500)

    // ── Botão Iniciar Jornada ─────────────────────────────────────────
    const save   = StorageManager.load()
    const hasSave = save.currentPhase > 1 || save.totalScore > 0

    if (this.textures.exists('botao_iniciar')) {
      // Novo layout com asset de botão
      const btnY = height * 0.76
      const btn  = this.add.image(width / 2, btnY, 'botao_iniciar')
        .setDepth(6).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.06, duration: 100 }))
      btn.on('pointerout',  () => this.tweens.add({ targets: btn, scale: 1.0,  duration: 100 }))
      btn.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })

      if (hasSave) {
        const contBtn = this.createButton(width / 2, btnY - 68, '▶  Continuar Jornada', 0x27ae60)
        contBtn.on('pointerdown', () => {
          this.scene.start('QuizScene', {
            phaseIndex: Math.max(0, save.currentPhase - 1),
            score: save.totalScore,
            lives:  save.lives
          })
        })
      }
    } else {
      // Fallback — botões de texto
      if (hasSave) {
        const contBtn = this.createButton(width / 2, height - 215, '▶  Continuar Jornada', 0x27ae60)
        contBtn.on('pointerdown', () => {
          this.scene.start('QuizScene', {
            phaseIndex: Math.max(0, save.currentPhase - 1),
            score: save.totalScore,
            lives:  save.lives
          })
        })
      }
      const yNew   = hasSave ? height - 158 : height - 185
      const newBtn = this.createButton(width / 2, yNew,
        hasSave ? '↺  Nova Jornada' : '▶  Iniciar Jornada', 0xe8a020)
      newBtn.on('pointerdown', () => {
        StorageManager.reset()
        this.scene.start('QuizScene', { phaseIndex: 0, score: 0, lives: 1 })
      })

      if (save.totalScore > 0) {
        this.add.text(width / 2, height - 12, `Melhor pontuação: ${save.totalScore} pts`, {
          fontSize: '12px', color: '#5c3a00', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(6)
      }
    }

    // ── Instruções de controle ────────────────────────────────────────
    this.add.text(width / 2, height - 12,
      '← → Mover  |  SPACE Pular  |  V Artefato  |  ↓ Agachar', {
        fontSize: '11px', color: '#5c3a00', fontFamily: 'Arial',
        stroke: '#ffffffaa', strokeThickness: 2
      }).setOrigin(0.5).setDepth(8)
  }

  update(time: number, delta: number) {
    if (!this.char) return
    const dt = delta / 1000

    // Gravidade quando no ar
    if (this.charY < this.floorY) {
      this.charVy += 900 * dt
    }

    // Atualiza posição
    this.charX += this.charVx * dt
    this.charY += this.charVy * dt

    // Chão
    if (this.charY >= this.floorY) {
      this.charY        = this.floorY
      this.charVy       = 0
    }

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

    // Posição e sprite
    this.char.setPosition(this.charX, this.charY)
    this.char.setFlipX(this.charVx < 0)

    if (!onGround) {
      this.char.setTexture('jump')
    } else if (Math.abs(this.charVx) > 10) {
      const frame = Math.floor(time / 120) % 2
      this.char.setTexture(frame === 0 ? 'walk_1' : 'walk_2')
    } else {
      this.char.setTexture('stop')
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1) {
    g.fillStyle(0x7a5530, 1);  g.fillRect(x - 4 * scale, y, 8 * scale, 32 * scale)
    g.fillStyle(0x5a7a2c, 1);  g.fillCircle(x, y - 18 * scale, 24 * scale)
    g.fillStyle(0x6a9034, 0.7)
    g.fillCircle(x - 14 * scale, y - 8 * scale, 15 * scale)
    g.fillCircle(x + 14 * scale, y - 10 * scale, 15 * scale)
  }

  private createButton(x: number, y: number, label: string, color: number): Phaser.GameObjects.Container {
    const c  = this.add.container(x, y).setDepth(7)
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
