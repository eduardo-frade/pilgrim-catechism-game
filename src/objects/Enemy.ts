import Phaser from 'phaser'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private patrolLeft: number
  private patrolRight: number
  private speed: number
  private isDead = false

  constructor(scene: Phaser.Scene, x: number, y: number, patrolLeft: number, patrolRight: number, speed = 80) {
    super(scene, x, y, 'enemy')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.patrolLeft = patrolLeft
    this.patrolRight = patrolRight
    this.speed = speed
    this.setDepth(4)
    this.setTint(0x9b59b6)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(32, 32)

    // Start moving right
    body.setVelocityX(this.speed)
  }

  update() {
    if (this.isDead) return

    const body = this.body as Phaser.Physics.Arcade.Body

    // Patrol logic
    if (this.x <= this.patrolLeft) {
      body.setVelocityX(this.speed)
      this.setFlipX(false)
    } else if (this.x >= this.patrolRight) {
      body.setVelocityX(-this.speed)
      this.setFlipX(true)
    }

    // Wobble animation
    const t = this.scene.time.now / 200
    this.setAngle(Math.sin(t) * 8)
  }

  stomp() {
    if (this.isDead) return
    this.isDead = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(0)
    body.setVelocityY(0)
    body.setEnable(false)

    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      alpha: 0,
      duration: 300,
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
      x: this.x + (Math.random() > 0.5 ? 40 : -40),
      y: this.y - 30,
      alpha: 0,
      angle: 360,
      duration: 400,
      ease: 'Power2',
      onComplete: () => this.destroy()
    })
  }

  isAlive() {
    return !this.isDead
  }
}
