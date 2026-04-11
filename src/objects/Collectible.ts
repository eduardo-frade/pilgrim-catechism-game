import Phaser from 'phaser'

export type CollectibleType = 'point' | 'life'

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly collectibleType: CollectibleType

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType) {
    super(scene, x, y, type === 'point' ? 'light' : 'heart')
    this.collectibleType = type

    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
    this.setDepth(3)
    this.setScale(type === 'point' ? 0.65 : 0.70)  // 3-4x maior para melhor visibilidade

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 6,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut'
    })

    // Rotate for point items
    if (type === 'point') {
      scene.tweens.add({
        targets: this,
        angle: 360,
        repeat: -1,
        duration: 2000,
        ease: 'Linear'
      })
    }
  }

  collect() {
    // Desativa imediatamente — impede que o overlap dispare múltiplas vezes por frame
    this.setActive(false)
    ;(this.body as Phaser.Physics.Arcade.Body).enable = false

    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => this.destroy()
    })
  }
}
