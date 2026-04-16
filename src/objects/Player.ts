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

  private canJump        = false
  private jumpCount      = 0
  private lastShot       = 0
  private throwFlashUntil = 0   // timestamp até quando mostrar sprite de arremesso (~2 frames)
  private isHurt         = false
  private isCrouching    = false
  private facingRight    = true
  private onDropThrough?: () => void

  // ── Estado dos botões de toque (mobile) ──────────────────────────
  private touchLeft        = false
  private touchRight       = false
  private touchJumpHeld    = false   // segurado → pulo alto (Mario-like)
  private touchJumpPressed = false   // one-shot para iniciar o pulo
  private touchShootHeld   = false   // segurado → repete o disparo

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
  setDropThrough(fn: () => void)         { this.onDropThrough = fn }

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

    // ── Agachar ↓ — apenas visual, zero física ─────────────────────
    // isCrouching só controla o sprite (down2); o corpo físico nunca muda
    const downDown = this.cursors.down.isDown
    this.isCrouching = downDown && onGround

    // ── Mover ← → (teclado ou toque) ──────────────────────────────
    const leftDown  = this.cursors.left.isDown  || this.touchLeft
    const rightDown = this.cursors.right.isDown || this.touchRight

    if (leftDown) {
      body.setVelocityX(-MOVE_SPEED)
      this.setFlipX(true); this.facingRight = false
    } else if (rightDown) {
      body.setVelocityX(MOVE_SPEED)
      this.setFlipX(false); this.facingRight = true
    } else {
      body.setVelocityX(body.velocity.x * 0.65)
    }

    // ── Pular / descer plataforma ─────────────────────────────────
    const jumpTriggered = Phaser.Input.Keyboard.JustDown(this.keySpace) || this.touchJumpPressed
    this.touchJumpPressed = false

    // Descer pela plataforma flutuante: ↓ + Pular
    // GameScene desativa o collider das flutuantes por 200ms (nunca afeta o chão)
    if (this.isCrouching && jumpTriggered && onGround) {
      this.onDropThrough?.()
      this.canJump = false   // força queda real, sem pulo imediato
    } else if (jumpTriggered && !this.isCrouching) {
      // Pulo normal (chão) ou pulo duplo (somente perto do apex)
      // gravity=1400, JUMP_FORCE=-600 → apex em ~0.43s
      // 2 frames de queda ≈ velocity.y ≤ 47 px/s
      // Permite duplo pulo apenas quando velocity.y ∈ [-60, 50] (stall ± 2 frames)
      const atApex = body.velocity.y > -60 && body.velocity.y < 50
      if (this.canJump || (this.jumpCount < 2 && atApex)) {
        body.setVelocityY(JUMP_FORCE)
        this.jumpCount++
        this.canJump = false
      }
    }

    // Pulo variável: soltar cedo = pulo menor (teclado e toque)
    const jumpHeld = this.keySpace.isDown || this.touchJumpHeld
    if (!jumpHeld && body.velocity.y < -100) {
      body.setVelocityY(body.velocity.y + 55)
    }

    // ── Arremessar V ou toque (repete enquanto segurar) ────────────
    if (this.keyV.isDown || this.touchShootHeld) {
      const now = this.scene.time.now
      if (now - this.lastShot > SHOOT_COOLDOWN) {
        this.shoot(onGround); this.lastShot = now
      }
    }

    // ── Troca de sprite por estado ─────────────────────────────────
    this.updateSprite(onGround, leftDown, rightDown)
  }

  private updateSprite(onGround: boolean, leftDown: boolean, rightDown: boolean) {
    // Pose de arremesso dura ~2 frames (33ms) por disparo, mesmo segurando V
    const throwing = this.scene.time.now < this.throwFlashUntil

    if (this.isHurt) {
      this.setTexture('hurt')
    } else if (throwing) {
      // Usa variante específica se o asset existir; senão usa throwing_light
      if (!onGround && this.scene.textures.exists('jump_throwing_light'))
        this.setTexture('jump_throwing_light')
      else if (this.isCrouching && this.scene.textures.exists('down_throwing_light'))
        this.setTexture('down_throwing_light')
      else
        this.setTexture('throwing_light')
    } else if (this.isCrouching) {
      this.setTexture('down2')
    } else if (!onGround) {
      this.setTexture('jump')
    } else if (leftDown || rightDown) {
      const frame = Math.floor(this.scene.time.now / 120) % 2
      this.setTexture(frame === 0 ? 'walk_1' : 'walk_2')
    } else {
      this.setTexture('stop')
    }
  }

  private shoot(onGround: boolean) {
    const proj = this.projectiles.get() as Phaser.Physics.Arcade.Sprite
    if (!proj) return

    // Cancela timer antigo deste objeto do pool (evita que ele mate o novo disparo)
    const old = (proj as any).__killTimer as Phaser.Time.TimerEvent | undefined
    if (old) old.remove(false)

    proj.setActive(true).setVisible(true)
    proj.setTexture('power')
    proj.setFlipX(!this.facingRight)
    proj.setScale(0.60).setDepth(4).setAngle(0)

    const spawnX = this.x + (this.facingRight ? 28 : -28)
    const spawnY = this.y - 18
    const b = proj.body as Phaser.Physics.Arcade.Body
    b.enable = true
    b.reset(spawnX, spawnY)   // reposiciona + zera velocidade/aceleração
    b.setSize(28, 28)          // hitbox preciso (sprite pode ter padding transparente)
    b.setAllowGravity(true)
    b.setVelocityX(this.facingRight ? 360 : -360)
    b.setVelocityY(-260)       // arco de pedra

    // Ativa sprite de arremesso por ~2 frames (33ms)
    this.throwFlashUntil = this.scene.time.now + 34

    // Timer de segurança — mata o projétil se ainda ativo após 6s
    ;(proj as any).__killTimer = this.scene.time.delayedCall(6000, () => {
      if (proj.active) {
        proj.setActive(false).setVisible(false)
        ;(proj.body as Phaser.Physics.Arcade.Body).enable = false
      }
      ;(proj as any).__killTimer = null
    })
  }

  // ── API de toque para o HUDScene ────────────────────────────────
  // Estado é guardado e consumido no update() — igual ao teclado físico
  moveLeft(active: boolean)   { this.touchLeft  = active }
  moveRight(active: boolean)  { this.touchRight = active }
  jump()                      { this.touchJumpPressed = true; this.touchJumpHeld = true }
  jumpRelease()               { this.touchJumpHeld = false }
  shootNow()                  { this.touchShootHeld = true }
  shootRelease()              { this.touchShootHeld = false }
}
