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
    this.setScale(0.35)   // 128px → ~45px display
    this.setDepth(4)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(38, 42)
    body.setOffset(45, 42)
    body.setVelocityX(this.speed)
  }

  update() {
    if (this.isDead) return
    const body = this.body as Phaser.Physics.Arcade.Body

    // Patrulha
    if (this.x <= this.patrolLeft) {
      body.setVelocityX(this.speed)
      this.setFlipX(false)
    } else if (this.x >= this.patrolRight) {
      body.setVelocityX(-this.speed)
      this.setFlipX(true)
    }

    // Não andar para fora das plataformas (verifica borda)
    if (body.blocked.down) {
      // animação de wobble
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
