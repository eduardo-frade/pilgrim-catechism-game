import Phaser from 'phaser'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private patrolLeft: number
  private patrolRight: number
  private speed: number
  private isDead = false

  constructor(scene: Phaser.Scene, x: number, y: number, patrolLeft: number, patrolRight: number, speed = 90) {
    super(scene, x, y, 'enemy')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.patrolLeft  = patrolLeft
    this.patrolRight = patrolRight
    this.speed       = speed
    this.setScale(0.50)   // 128px → ~64px display
    this.setDepth(4)

    const body = this.body as Phaser.Physics.Arcade.Body
    // body.setSize com center=true (padrão) centraliza automaticamente no sprite
    body.setSize(52, 56)
    body.setVelocityX(this.speed)
  }

  update() {
    if (this.isDead) return
    const body = this.body as Phaser.Physics.Arcade.Body

    // Patrulha entre os limites
    if (this.x <= this.patrolLeft) {
      body.setVelocityX(this.speed)
      this.setFlipX(true)    // sprite padrão olha para esquerda; flip → direita
    } else if (this.x >= this.patrolRight) {
      body.setVelocityX(-this.speed)
      this.setFlipX(false)   // sem flip → olha para esquerda
    }

    // ── Detecção de borda: não cair nos buracos ───────────────────
    if (body.blocked.down) {
      const movingRight = body.velocity.x > 0
      // Ponto de verificação: 6px à frente da borda do pé, 4px abaixo
      const aheadX = movingRight ? body.right + 6 : body.left - 6
      const belowY = body.bottom + 4

      // Verifica se existe algum corpo estático (plataforma) logo abaixo desse ponto
      const groundAhead = (
        this.scene.physics.overlapRect(aheadX, belowY, 4, 8, false, true) as unknown as unknown[]
      ).length > 0

      if (!groundAhead) {
        // Sem chão à frente — ajusta o limite de patrulha e inverte
        if (movingRight) {
          this.patrolRight = this.x - 24   // margem para não re-triggerar imediatamente
          body.setVelocityX(-this.speed)
          this.setFlipX(false)
        } else {
          this.patrolLeft = this.x + 24
          body.setVelocityX(this.speed)
          this.setFlipX(true)
        }
      }

      // Animação de wobble
      const t = this.scene.time.now / 180
      this.setAngle(Math.sin(t) * 7)
    }
  }

  stomp() {
    if (this.isDead) return
    this.isDead = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0, 0)
    body.setEnable(false)

    this.scene.tweens.add({
      targets: this,
      scaleY: 0.15,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => this.destroy()
    })
  }

  hitByProjectile() {
    if (this.isDead) return
    this.isDead = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)

    this.scene.tweens.add({
      targets: this,
      x: this.x + (Math.random() > 0.5 ? 50 : -50),
      y: this.y - 40,
      alpha: 0,
      angle: 360,
      duration: 380,
      ease: 'Power2',
      onComplete: () => this.destroy()
    })
  }

  isAlive() { return !this.isDead }
}
