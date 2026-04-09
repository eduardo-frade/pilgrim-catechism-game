import Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyV!: Phaser.Input.Keyboard.Key
  private keySpace!: Phaser.Input.Keyboard.Key
  private projectiles!: Phaser.Physics.Arcade.Group

  // ── Estado de movimento ───────────────────────────────────────────
  private canJump = false
  private jumpCount = 0
  private lastShot = 0
  private isHurt = false
  private isCrouching = false
  private facingRight = true

  // ── Sistema de vida ───────────────────────────────────────────────
  // "hearts" = corações da tentativa atual (0-3, reinicia a cada fase)
  private hearts = 3

  // Callbacks para o GameScene reagir
  private onHeartChangeCallback?: (hearts: number) => void
  private onDeathCallback?: () => void

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 44)
    body.setMaxVelocityX(200)
    this.setDepth(5)

    this.cursors = scene.input.keyboard!.createCursorKeys()
    // SPACE = pular | V = arremessar artefato
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.keyV     = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V)

    this.projectiles = scene.physics.add.group({
      defaultKey: 'projectile',
      maxSize: 10
    })
  }

  // ── Getters ────────────────────────────────────────────────────────
  getProjectiles()  { return this.projectiles }
  getHearts()       { return this.hearts }

  // ── Callbacks ─────────────────────────────────────────────────────
  onHeartChange(cb: (hearts: number) => void) { this.onHeartChangeCallback = cb }
  onDeath(cb: () => void)                     { this.onDeathCallback = cb }

  // ── Receber dano ──────────────────────────────────────────────────
  takeDamage() {
    if (this.isHurt) return
    this.isHurt = true
    this.hearts = Math.max(0, this.hearts - 1)
    this.onHeartChangeCallback?.(this.hearts)

    // Flash vermelho + knockback
    this.setTint(0xff0000)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityY(-200)
    body.setVelocityX(this.facingRight ? -150 : 150)

    if (this.hearts <= 0) {
      // Sem corações → morreu → avisa o GameScene
      this.scene.time.delayedCall(600, () => this.onDeathCallback?.())
    } else {
      this.scene.time.delayedCall(200, () => this.clearTint())
      this.scene.time.delayedCall(1000, () => { this.isHurt = false })
    }
  }

  // ── Ganhar coração ────────────────────────────────────────────────
  addHeart() {
    if (this.hearts < 3) {
      this.hearts = Math.min(3, this.hearts + 1)
      this.onHeartChangeCallback?.(this.hearts)
      return true   // coração restaurado
    }
    return false    // já tem 3 → quem chamou dá +10pts
  }

  // ── Update principal ──────────────────────────────────────────────
  update(_time: number, _delta: number) {
    if (this.isHurt && this.hearts <= 0) return   // morreu, para tudo

    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    if (onGround) { this.jumpCount = 0; this.canJump = true }

    // ── Seta ↓ — agachar ────────────────────────────────────────────
    const downDown = this.cursors.down.isDown
    if (downDown && onGround) {
      if (!this.isCrouching) {
        this.isCrouching = true
        body.setSize(28, 28)
        body.setOffset(0, 16)
        this.setScale(1, 0.65)
      }
      body.setVelocityX(body.velocity.x * 0.6)
    } else {
      if (this.isCrouching) {
        this.isCrouching = false
        body.setSize(28, 44)
        body.setOffset(0, 0)
        this.setScale(1, 1)
      }
    }

    // ── Setas ← → — mover ───────────────────────────────────────────
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
    }

    // ── SPACE — pular ────────────────────────────────────────────────
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace)
    if (jumpPressed && !this.isCrouching && (this.canJump || this.jumpCount < 1)) {
      body.setVelocityY(-480)
      this.jumpCount++
      this.canJump = false
    }

    // ── V — arremessar artefato ──────────────────────────────────────
    const shootPressed = Phaser.Input.Keyboard.JustDown(this.keyV)
    const now = this.scene.time.now
    if (shootPressed && now - this.lastShot > 400) {
      this.shoot()
      this.lastShot = now
    }

    // ── Animação visual ──────────────────────────────────────────────
    if (this.isHurt) {
      this.setTint(0xff0000)
    } else if (this.isCrouching) {
      this.setTint(0xbbaa77)
    } else if (!onGround) {
      this.setTint(0xddddff)
    } else if (leftDown || rightDown) {
      const frame = Math.floor(this.scene.time.now / 120) % 2
      this.setTint(frame === 0 ? 0xffffff : 0xddcc99)
    } else {
      this.clearTint()
    }
  }

  // ── Atirar ────────────────────────────────────────────────────────
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

    this.scene.time.delayedCall(1500, () => {
      if (proj.active) { proj.setActive(false); proj.setVisible(false) }
    })
  }

  // ── Controles de toque (chamados pelo HUDScene) ──────────────────
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
    if (now - this.lastShot > 400) { this.shoot(); this.lastShot = now }
  }
}
