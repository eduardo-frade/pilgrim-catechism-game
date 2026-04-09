import Phaser from 'phaser'

// ─── Constantes de física (Mario-like) ────────────────────────────────────────
const MOVE_SPEED   = 220    // velocidade horizontal
const JUMP_FORCE   = -800   // força do pulo (negativa = para cima)
const SHOOT_COOLDOWN = 350  // ms entre arremessos

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyV!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private projectiles!: Phaser.Physics.Arcade.Group

  private canJump    = false
  private jumpCount  = 0
  private lastShot   = 0
  private isHurt     = false
  private isCrouching = false
  private facingRight = true

  // Sistema de corações
  private hearts = 3
  private onHeartChangeCallback?: (h: number) => void
  private onDeathCallback?: () => void

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(24, 44)
    body.setMaxVelocityX(300)
    this.setDepth(5)

    this.cursors  = scene.input.keyboard!.createCursorKeys()
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyV     = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V)

    this.projectiles = scene.physics.add.group({ defaultKey: 'projectile', maxSize: 10 })
  }

  getProjectiles()  { return this.projectiles }
  getHearts()       { return this.hearts }
  onHeartChange(cb: (h: number) => void) { this.onHeartChangeCallback = cb }
  onDeath(cb: () => void)                { this.onDeathCallback = cb }

  takeDamage() {
    if (this.isHurt) return
    this.isHurt = true
    this.hearts = Math.max(0, this.hearts - 1)
    this.onHeartChangeCallback?.(this.hearts)

    this.setTint(0xff0000)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-300)
    body.setVelocityX(this.facingRight ? -200 : 200)

    if (this.hearts <= 0) {
      this.scene.time.delayedCall(600, () => this.onDeathCallback?.())
    } else {
      this.scene.time.delayedCall(150, () => this.clearTint())
      this.scene.time.delayedCall(900, () => { this.isHurt = false })
    }
  }

  addHeart(): boolean {
    if (this.hearts < 3) {
      this.hearts = Math.min(3, this.hearts + 1)
      this.onHeartChangeCallback?.(this.hearts)
      return true
    }
    return false
  }

  update(_t: number, _d: number) {
    if (this.isHurt && this.hearts <= 0) return

    const body     = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    if (onGround) { this.jumpCount = 0; this.canJump = true }

    // ── Agachar ↓ ──────────────────────────────────────────────────
    const downDown = this.cursors.down.isDown
    if (downDown && onGround) {
      if (!this.isCrouching) {
        this.isCrouching = true
        body.setSize(24, 28); body.setOffset(0, 16)
        this.setScale(1, 0.65)
      }
      body.setVelocityX(body.velocity.x * 0.6)
    } else if (this.isCrouching) {
      this.isCrouching = false
      body.setSize(24, 44); body.setOffset(0, 0)
      this.setScale(1, 1)
    }

    // ── Mover ← → ──────────────────────────────────────────────────
    const leftDown  = this.cursors.left.isDown
    const rightDown = this.cursors.right.isDown

    if (!this.isCrouching) {
      if (leftDown) {
        body.setVelocityX(-MOVE_SPEED)
        this.setFlipX(true); this.facingRight = false
      } else if (rightDown) {
        body.setVelocityX(MOVE_SPEED)
        this.setFlipX(false); this.facingRight = true
      } else {
        // Fricção rápida estilo Mario
        body.setVelocityX(body.velocity.x * 0.65)
      }
    }

    // ── Pular SPACE ─────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) &&
        !this.isCrouching && (this.canJump || this.jumpCount < 1)) {
      body.setVelocityY(JUMP_FORCE)
      this.jumpCount++
      this.canJump = false
    }

    // ── Pulo variável: soltar cedo = pulo baixo (como Mario) ────────
    if (!this.keySpace.isDown && body.velocity.y < -200) {
      body.setVelocityY(body.velocity.y + 60)
    }

    // ── Arremessar V ────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      const now = this.scene.time.now
      if (now - this.lastShot > SHOOT_COOLDOWN) {
        this.shoot(); this.lastShot = now
      }
    }

    // ── Animação visual ─────────────────────────────────────────────
    if (this.isHurt) {
      this.setTint(0xff4444)
    } else if (this.isCrouching) {
      this.setTint(0xbbaa77)
    } else if (!onGround) {
      this.clearTint()
    } else if (leftDown || rightDown) {
      // pisca ao andar
      const f = Math.floor(this.scene.time.now / 100) % 2
      this.setTint(f === 0 ? 0xffffff : 0xeedd99)
    } else {
      this.clearTint()
    }
  }

  private shoot() {
    const proj = this.projectiles.get() as Phaser.Physics.Arcade.Sprite
    if (!proj) return
    proj.setActive(true).setVisible(true)
    proj.setPosition(this.x + (this.facingRight ? 22 : -22), this.y - 8)
    proj.setTint(0xfff176).setDepth(4)
    const b = proj.body as Phaser.Physics.Arcade.Body
    b.setAllowGravity(false)
    b.setVelocityX(this.facingRight ? 500 : -500)
    b.setVelocityY(0)
    this.scene.time.delayedCall(1200, () => {
      if (proj.active) { proj.setActive(false).setVisible(false) }
    })
  }

  // Controles de toque (HUD)
  moveLeft(active: boolean) {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(active ? -MOVE_SPEED : 0)
    if (active) { this.setFlipX(true); this.facingRight = false }
  }
  moveRight(active: boolean) {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(active ? MOVE_SPEED : 0)
    if (active) { this.setFlipX(false); this.facingRight = true }
  }
  jump() {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.down || this.jumpCount < 1) {
      body.setVelocityY(JUMP_FORCE); this.jumpCount++
    }
  }
  shootNow() {
    const now = this.scene.time.now
    if (now - this.lastShot > SHOOT_COOLDOWN) { this.shoot(); this.lastShot = now }
  }
}
