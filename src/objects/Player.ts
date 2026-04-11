import Phaser from 'phaser'

const MOVE_SPEED     = 220
const JUMP_FORCE     = -600   // mais Mario: pulo menor e preciso (era -800)
const SHOOT_COOLDOWN = 400
const PLAYER_SCALE   = 0.58   // 128px → ~74px display

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyV!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private projectiles!: Phaser.Physics.Arcade.Group

  private canJump     = false
  private jumpCount   = 0
  private lastShot    = 0
  private isHurt      = false
  private isCrouching = false
  private isShooting  = false
  private facingRight = true

  private hearts = 3
  private onHeartChangeCallback?: (h: number) => void
  private onDeathCallback?: () => void

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'stop')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setScale(PLAYER_SCALE)
    this.setDepth(5)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(42, 70)
    body.setMaxVelocityX(300)

    this.cursors  = scene.input.keyboard!.createCursorKeys()
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyV     = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V)

    // 'power' é o projétil (bola de fogo); 'throwing_light' é a pose do personagem
    this.projectiles = scene.physics.add.group({ defaultKey: 'power', maxSize: 10 })
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

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-300)
    body.setVelocityX(this.facingRight ? -200 : 200)

    if (this.hearts <= 0) {
      this.scene.time.delayedCall(600, () => this.onDeathCallback?.())
    } else {
      this.scene.time.delayedCall(900, () => { this.isHurt = false })
    }
  }

  addHeart(): boolean {
    if (this.hearts < 3) {
      this.hearts = Math.min(3, this.hearts + 1)  // +1 coração
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
        body.setSize(36, 42)   // hitbox menor — 'down' cuida do visual
      }
      body.setVelocityX(body.velocity.x * 0.6)
    } else if (this.isCrouching) {
      this.isCrouching = false
      body.setSize(42, 70)
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
        body.setVelocityX(body.velocity.x * 0.65)
      }
    }

    // ── Pular SPACE — estilo Mario ──────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keySpace) &&
        !this.isCrouching && (this.canJump || this.jumpCount < 1)) {
      body.setVelocityY(JUMP_FORCE)
      this.jumpCount++
      this.canJump = false
    }

    // Pulo variável: soltar cedo = pulo menor (Mario-like)
    if (!this.keySpace.isDown && body.velocity.y < -100) {
      body.setVelocityY(body.velocity.y + 55)
    }

    // ── Arremessar V ────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      const now = this.scene.time.now
      if (now - this.lastShot > SHOOT_COOLDOWN) {
        this.shoot(); this.lastShot = now
      }
    }

    // ── Troca de sprite por estado ─────────────────────────────────
    this.updateSprite(onGround, leftDown, rightDown)
  }

  private updateSprite(onGround: boolean, leftDown: boolean, rightDown: boolean) {
    if (this.isHurt) {
      this.setTexture('hurt')
    } else if (this.isShooting) {
      this.setTexture('throwing_light')   // personagem em pose de arremesso
    } else if (this.isCrouching) {
      this.setTexture('down')
    } else if (!onGround) {
      this.setTexture('jump')
    } else if (leftDown || rightDown) {
      const frame = Math.floor(this.scene.time.now / 120) % 2
      this.setTexture(frame === 0 ? 'walk_1' : 'walk_2')
    } else {
      this.setTexture('stop')
    }
  }

  private shoot() {
    this.isShooting = true
    this.scene.time.delayedCall(1440, () => { this.isShooting = false })

    const proj = this.projectiles.get() as Phaser.Physics.Arcade.Sprite
    if (!proj) return

    // Cancela timer antigo deste objeto do pool (evita que ele mate o novo disparo)
    const old = (proj as any).__killTimer as Phaser.Time.TimerEvent | undefined
    if (old) old.remove(false)

    proj.setActive(true).setVisible(true)
    proj.setTexture('power')
    proj.setFlipX(!this.facingRight)
    proj.setPosition(this.x + (this.facingRight ? 28 : -28), this.y - 18)
    proj.setScale(0.60).setDepth(4).setAngle(0)
    const b = proj.body as Phaser.Physics.Arcade.Body
    b.setAllowGravity(true)
    b.setVelocityX(this.facingRight ? 360 : -360)
    b.setVelocityY(-260)   // arco de pedra

    // Timer de segurança — só dispara se o projétil não acertou nada ainda
    ;(proj as any).__killTimer = this.scene.time.delayedCall(6000, () => {
      if (proj.active) proj.setActive(false).setVisible(false)
      ;(proj as any).__killTimer = null
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
