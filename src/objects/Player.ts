import Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyV!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private projectiles!: Phaser.Physics.Arcade.Group
  private canJump = false
  private jumpCount = 0
  private lastShot = 0
  private isHurt = false
  private isCrouching = false
  private lives = 3
  private onDamageCallback?: (lives: number) => void
  private facingRight = true

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 44)
    body.setMaxVelocityX(200)
    this.setDepth(5)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    // SPACE = pular, V = arremessar artefato
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyV     = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V)

    this.projectiles = scene.physics.add.group({
      defaultKey: 'projectile',
      maxSize: 10
    })
  }

  getProjectiles() {
    return this.projectiles
  }

  getLives() {
    return this.lives
  }

  onDamage(callback: (lives: number) => void) {
    this.onDamageCallback = callback
  }

  takeDamage() {
    if (this.isHurt) return
    this.lives = Math.max(0, this.lives - 1)
    this.isHurt = true
    this.onDamageCallback?.(this.lives)

    // Flash red
    this.setTint(0xff0000)
    this.scene.time.delayedCall(200, () => this.clearTint())
    this.scene.time.delayedCall(1000, () => { this.isHurt = false })

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-200)
    body.setVelocityX(this.facingRight ? -150 : 150)
  }

  update(_time: number, _delta: number) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    if (onGround) {
      this.jumpCount = 0
      this.canJump = true
    }

    // ── Agachar (seta ↓) ─────────────────────────────────────────
    const downDown = this.cursors.down.isDown
    if (downDown && onGround) {
      if (!this.isCrouching) {
        this.isCrouching = true
        body.setSize(28, 28)       // hitbox menor
        body.setOffset(0, 16)
        this.setScale(1, 0.65)
      }
    } else {
      if (this.isCrouching) {
        this.isCrouching = false
        body.setSize(28, 44)
        body.setOffset(0, 0)
        this.setScale(1, 1)
      }
    }

    // ── Movimento horizontal (setas ← →) ─────────────────────────
    const leftDown  = this.cursors.left.isDown
    const rightDown = this.cursors.right.isDown

    if (!this.isCrouching) {
      if (leftDown) {
        body.setVelocityX(-160)
        this.setFlipX(true)
        this.facingRight = false
      } else if (rightDown) {
        body.setVelocityX(160)
        this.setFlipX(false)
        this.facingRight = true
      } else {
        body.setVelocityX(body.velocity.x * 0.75)
      }
    } else {
      // Agachado: movimento lento
      body.setVelocityX(body.velocity.x * 0.5)
    }

    // ── Pular (SPACE) ─────────────────────────────────────────────
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace)
    if (jumpPressed && !this.isCrouching && (this.canJump || this.jumpCount < 1)) {
      body.setVelocityY(-480)
      this.jumpCount++
      this.canJump = false
    }

    // ── Arremessar artefato (V) ───────────────────────────────────
    const shootPressed = Phaser.Input.Keyboard.JustDown(this.keyV)
    const now = this.scene.time.now
    if (shootPressed && now - this.lastShot > 400) {
      this.shoot()
      this.lastShot = now
    }

    // ── Animação simples por cor ──────────────────────────────────
    if (this.isHurt) {
      this.setTint(0xff0000)
    } else if (this.isCrouching) {
      this.setTint(0xbbaa77)           // tom mais escuro agachado
    } else if (!onGround) {
      this.setTint(0xddddff)           // leve azul no ar
    } else if (leftDown || rightDown) {
      const frame = Math.floor(this.scene.time.now / 120) % 2
      this.setTint(frame === 0 ? 0xffffff : 0xddcc99)  // pisca ao andar
    } else {
      this.clearTint()
    }
  }

  private shoot() {
    const proj = this.projectiles.get() as Phaser.Physics.Arcade.Sprite
    if (!proj) return

    proj.setActive(true)
    proj.setVisible(true)
    proj.setPosition(this.x + (this.facingRight ? 20 : -20), this.y - 5)
    proj.setTint(0xfff176)
    proj.setDepth(4)

    const body = proj.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocityX(this.facingRight ? 450 : -450)
    body.setVelocityY(0)

    // Auto-destroy after 1.5s
    this.scene.time.delayedCall(1500, () => {
      if (proj.active) {
        proj.setActive(false)
        proj.setVisible(false)
      }
    })
  }

  // Called from touch buttons in HUDScene
  moveLeft(active: boolean) {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(active ? -160 : 0)
    if (active) { this.setFlipX(true); this.facingRight = false }
  }

  moveRight(active: boolean) {
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(active ? 160 : 0)
    if (active) { this.setFlipX(false); this.facingRight = true }
  }

  jump() {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.down || this.jumpCount < 1) {
      body.setVelocityY(-480)
      this.jumpCount++
    }
  }

  shootNow() {
    const now = this.scene.time.now
    if (now - this.lastShot > 400) {
      this.shoot()
      this.lastShot = now
    }
  }
}
