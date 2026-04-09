import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'
import { Collectible } from '../objects/Collectible'
import catechism from '../data/catechism.json'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'

interface GameData {
  phaseIndex: number
  score: number
}

// Level layouts for each of the 8 phases
// Each platform: [x, y, width, height]
const PHASE_LAYOUTS = [
  // Phase 1 — simple
  {
    platforms: [[0, 420, 900, 32], [200, 330, 120, 20], [400, 270, 120, 20], [600, 200, 140, 20]],
    enemies: [{ x: 310, patrol: [220, 420] }, { x: 520, patrol: [420, 600] }],
    collectibles: [{ x: 260, y: 295, type: 'point' }, { x: 460, y: 235, type: 'point' }, { x: 650, y: 155, type: 'life' }],
    goal: { x: 720, y: 150 },
    playerStart: { x: 60, y: 370 }
  },
  // Phase 2
  {
    platforms: [[0, 420, 200, 32], [250, 360, 100, 20], [420, 300, 130, 20], [620, 240, 100, 20], [750, 420, 200, 32]],
    enemies: [{ x: 300, patrol: [260, 430] }, { x: 680, patrol: [630, 740] }],
    collectibles: [{ x: 300, y: 315, type: 'point' }, { x: 480, y: 255, type: 'point' }, { x: 670, y: 195, type: 'point' }],
    goal: { x: 820, y: 370 },
    playerStart: { x: 60, y: 370 }
  },
  // Phase 3
  {
    platforms: [[0, 420, 180, 32], [200, 350, 100, 20], [370, 280, 120, 20], [540, 340, 100, 20], [700, 260, 130, 20], [850, 420, 200, 32]],
    enemies: [{ x: 250, patrol: [210, 380] }, { x: 600, patrol: [550, 720] }],
    collectibles: [{ x: 250, y: 300, type: 'point' }, { x: 430, y: 235, type: 'point' }, { x: 760, y: 210, type: 'life' }],
    goal: { x: 950, y: 370 },
    playerStart: { x: 60, y: 370 }
  },
  // Phase 4
  {
    platforms: [[0, 420, 160, 32], [220, 380, 80, 20], [370, 320, 80, 20], [500, 260, 90, 20], [640, 320, 80, 20], [780, 380, 80, 20], [900, 420, 200, 32]],
    enemies: [{ x: 270, patrol: [230, 430] }, { x: 540, patrol: [510, 640] }],
    collectibles: [{ x: 260, y: 330, type: 'point' }, { x: 550, y: 210, type: 'point' }, { x: 820, y: 335, type: 'life' }],
    goal: { x: 1000, y: 370 },
    playerStart: { x: 60, y: 370 }
  },
  // Phase 5
  {
    platforms: [[0, 420, 140, 32], [200, 350, 120, 20], [400, 280, 120, 20], [560, 350, 100, 20], [720, 280, 120, 20], [880, 350, 100, 20], [1000, 420, 200, 32]],
    enemies: [{ x: 260, patrol: [210, 390] }, { x: 780, patrol: [730, 890] }],
    collectibles: [{ x: 260, y: 300, type: 'point' }, { x: 460, y: 230, type: 'point' }, { x: 780, y: 225, type: 'life' }],
    goal: { x: 1100, y: 370 },
    playerStart: { x: 60, y: 370 }
  },
  // Phase 6
  {
    platforms: [[0, 420, 120, 32], [180, 360, 100, 20], [350, 290, 110, 20], [510, 220, 110, 20], [670, 290, 100, 20], [840, 360, 100, 20], [980, 420, 200, 32]],
    enemies: [{ x: 230, patrol: [190, 340] }, { x: 560, patrol: [520, 660] }, { x: 890, patrol: [850, 970] }],
    collectibles: [{ x: 230, y: 305, type: 'point' }, { x: 560, y: 165, type: 'point' }, { x: 890, y: 305, type: 'life' }],
    goal: { x: 1080, y: 370 },
    playerStart: { x: 50, y: 370 }
  },
  // Phase 7
  {
    platforms: [[0, 420, 100, 32], [160, 380, 80, 20], [310, 330, 80, 20], [460, 270, 90, 20], [600, 330, 80, 20], [750, 270, 90, 20], [900, 330, 80, 20], [1000, 420, 200, 32]],
    enemies: [{ x: 200, patrol: [170, 290] }, { x: 500, patrol: [470, 590] }, { x: 800, patrol: [760, 890] }],
    collectibles: [{ x: 200, y: 330, type: 'point' }, { x: 505, y: 215, type: 'point' }, { x: 800, y: 215, type: 'life' }],
    goal: { x: 1090, y: 370 },
    playerStart: { x: 40, y: 370 }
  },
  // Phase 8 — hardest
  {
    platforms: [[0, 420, 100, 32], [150, 370, 70, 20], [290, 310, 70, 20], [430, 250, 70, 20], [570, 310, 70, 20], [710, 250, 70, 20], [850, 310, 70, 20], [990, 250, 70, 20], [1100, 420, 200, 32]],
    enemies: [{ x: 185, patrol: [160, 270] }, { x: 465, patrol: [440, 560] }, { x: 745, patrol: [720, 840] }],
    collectibles: [{ x: 185, y: 320, type: 'point' }, { x: 465, y: 200, type: 'point' }, { x: 1025, y: 195, type: 'life' }],
    goal: { x: 1190, y: 370 },
    playerStart: { x: 40, y: 370 }
  }
]

export class GameScene extends Phaser.Scene {
  private player!: Player
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private enemies: Enemy[] = []
  private collectibles: Collectible[] = []
  private goalZone!: Phaser.GameObjects.Zone
  private phaseIndex = 0
  private score = 0
  private world = worlds.worlds[0]
  private levelWidth = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: GameData) {
    this.phaseIndex = data.phaseIndex ?? 0
    this.score = data.score ?? StorageManager.load().totalScore
    this.enemies = []
    this.collectibles = []
  }

  create() {
    const layout = PHASE_LAYOUTS[this.phaseIndex % PHASE_LAYOUTS.length]
    const allX = layout.platforms.map(p => p[0] + p[2])
    this.levelWidth = Math.max(...allX, this.game.canvas.width) + 100

    this.drawBackground()
    this.buildPlatforms(layout)
    this.spawnPlayer(layout)
    this.spawnEnemies(layout)
    this.spawnCollectibles(layout)
    this.spawnGoal(layout)
    this.setupCamera()
    this.setupCollisions()

    // Launch HUD
    this.scene.launch('HUDScene', {
      lives: this.player.getLives(),
      score: this.score,
      phaseIndex: this.phaseIndex
    })

    // Player damage callback
    this.player.onDamage((lives) => {
      this.scene.get('HUDScene').events.emit('updateLives', lives)
      if (lives <= 0) {
        this.time.delayedCall(600, () => this.restartPhase())
      }
    })
  }

  update(time: number, delta: number) {
    this.player.update(time, delta)
    this.enemies.forEach(e => e.update())

    // Check goal overlap manually (zone overlap)
    const px = this.player.x
    const py = this.player.y
    const gz = this.goalZone
    if (
      px > gz.x - gz.width / 2 && px < gz.x + gz.width / 2 &&
      py > gz.y - gz.height / 2 && py < gz.y + gz.height / 2
    ) {
      this.completePhase()
    }
  }

  private drawBackground() {
    const { height } = this.cameras.main
    const bg = this.add.graphics()
    bg.setScrollFactor(0)
    bg.setDepth(-10)

    // Sky
    bg.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d87a, 0xf5d87a, 1)
    bg.fillRect(0, 0, this.game.canvas.width, height)

    // Distant hills (parallax feel — fixed to camera)
    const hills = this.add.graphics()
    hills.setScrollFactor(0.3)
    hills.setDepth(-9)
    hills.fillStyle(0xe8d090, 0.5)
    hills.fillEllipse(200, height - 80, 600, 240)
    hills.fillEllipse(600, height - 60, 500, 200)
    hills.fillEllipse(900, height - 100, 400, 180)

    // Trees (decorative, slight parallax)
    this.drawTree(hills, 120, height - 110, 0.8)
    this.drawTree(hills, 450, height - 100, 0.7)
    this.drawTree(hills, 720, height - 120, 0.9)
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, scale = 1) {
    g.fillStyle(0x8b5e3c, 1)
    g.fillRect(x - 4 * scale, y, 8 * scale, 30 * scale)
    g.fillStyle(0x6b8c3c, 1)
    g.fillCircle(x, y - 15 * scale, 22 * scale)
    g.fillStyle(0x7a9c40, 0.7)
    g.fillCircle(x - 12 * scale, y - 8 * scale, 14 * scale)
    g.fillCircle(x + 12 * scale, y - 10 * scale, 14 * scale)
  }

  private buildPlatforms(layout: typeof PHASE_LAYOUTS[0]) {
    this.platforms = this.physics.add.staticGroup()

    layout.platforms.forEach(([x, y, w, h]) => {
      // Ground tile look
      const g = this.add.graphics()
      g.setDepth(1)

      // Main platform body
      g.fillStyle(0xc8a050, 1)
      g.fillRect(0, 0, w, h)

      // Top soil layer
      g.fillStyle(0x8b7355, 1)
      g.fillRect(0, 0, w, 8)

      // Grass top
      g.fillStyle(0x7a9c40, 1)
      g.fillRect(0, 0, w, 4)

      // Grass tufts
      for (let tx = 0; tx < w; tx += 16) {
        g.fillStyle(0x6b8c30, 1)
        g.fillTriangle(tx + 3, 0, tx + 7, -6, tx + 11, 0)
      }

      // Stone texture dots
      g.fillStyle(0xb09040, 0.4)
      for (let tx = 10; tx < w; tx += 24) {
        g.fillCircle(tx, h / 2 + 4, 3)
      }

      const texture = g.generateTexture(`plat_${x}_${y}`, w, h + 8)
      g.destroy()

      const block = this.platforms.create(x + w / 2, y + h / 2, `plat_${x}_${y}`) as Phaser.Physics.Arcade.Sprite
      block.setDepth(2)
      block.refreshBody()
      void texture
    })
  }

  private spawnPlayer(layout: typeof PHASE_LAYOUTS[0]) {
    this.player = new Player(this, layout.playerStart.x, layout.playerStart.y)
  }

  private spawnEnemies(layout: typeof PHASE_LAYOUTS[0]) {
    layout.enemies.forEach(e => {
      const enemy = new Enemy(
        this, e.x, 380,
        e.patrol[0], e.patrol[1],
        this.world.enemy.speed
      )
      this.enemies.push(enemy)
    })
  }

  private spawnCollectibles(layout: typeof PHASE_LAYOUTS[0]) {
    layout.collectibles.forEach(c => {
      const col = new Collectible(this, c.x, c.y, c.type as 'point' | 'life')
      this.collectibles.push(col)
    })
  }

  private spawnGoal(layout: typeof PHASE_LAYOUTS[0]) {
    // Visual goal flag
    const g = this.add.graphics()
    g.setDepth(3)
    g.fillStyle(0xf5c842, 1)
    g.fillRect(layout.goal.x, layout.goal.y - 60, 4, 60)
    g.fillStyle(0xe8a020, 1)
    g.fillTriangle(
      layout.goal.x + 4, layout.goal.y - 60,
      layout.goal.x + 4, layout.goal.y - 40,
      layout.goal.x + 28, layout.goal.y - 50
    )

    // Glowing aura
    const aura = this.add.graphics()
    aura.fillStyle(0xf5c842, 0.2)
    aura.fillCircle(layout.goal.x + 4, layout.goal.y - 30, 25)
    aura.setDepth(2)

    this.tweens.add({
      targets: aura,
      alpha: 0.5,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      repeat: -1,
      duration: 800
    })

    this.goalZone = this.add.zone(layout.goal.x + 4, layout.goal.y - 30, 40, 60)
    this.physics.add.existing(this.goalZone)
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.game.canvas.height)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.physics.world.setBounds(0, 0, this.levelWidth, this.game.canvas.height + 200)
  }

  private setupCollisions() {
    // Player + platforms
    this.physics.add.collider(this.player, this.platforms)

    // Enemies + platforms
    this.enemies.forEach(enemy => {
      this.physics.add.collider(enemy, this.platforms)

      // Player stomps enemy
      this.physics.add.overlap(this.player, enemy, () => {
        if (!enemy.isAlive()) return
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body
        if (playerBody.velocity.y > 0 && this.player.y < enemy.y - 10) {
          enemy.stomp()
          this.addScore(50)
          playerBody.setVelocityY(-300) // bounce
        } else {
          this.player.takeDamage()
        }
      })

      // Projectile hits enemy
      this.physics.add.overlap(this.player.getProjectiles(), enemy, (proj) => {
        if (!enemy.isAlive()) return
        const p = proj as Phaser.Physics.Arcade.Sprite
        p.setActive(false)
        p.setVisible(false)
        enemy.hitByProjectile()
        this.addScore(30)
      })
    })

    // Player collects items
    this.collectibles.forEach(col => {
      this.physics.add.overlap(this.player, col, () => {
        if (!col.active) return
        col.collect()
        if (col.collectibleType === 'point') {
          this.addScore(10)
        } else {
          // Life item
          const currentLives = this.player.getLives()
          if (currentLives < 3) {
            // TODO: add life — for now just bonus points
            this.addScore(100)
          } else {
            this.addScore(100)
          }
          this.scene.get('HUDScene').events.emit('updateLives', this.player.getLives())
        }
      })
    })

    // Player falls off
    this.player.on('update', () => {
      if (this.player.y > this.game.canvas.height + 100) {
        this.player.takeDamage()
        this.player.setPosition(80, 300)
      }
    })
  }

  private addScore(pts: number) {
    this.score += pts
    StorageManager.save({ totalScore: this.score })
    this.scene.get('HUDScene').events.emit('updateScore', this.score)

    // Floating text
    const text = this.add.text(this.player.x, this.player.y - 30, `+${pts}`, {
      fontSize: '16px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
    }).setDepth(10)
    this.tweens.add({
      targets: text, y: text.y - 40, alpha: 0, duration: 700,
      onComplete: () => text.destroy()
    })
  }

  private completePhase() {
    this.scene.stop('HUDScene')
    StorageManager.save({ currentPhase: this.phaseIndex + 2, totalScore: this.score })
    this.scene.start('ResultScene', {
      phaseIndex: this.phaseIndex,
      score: this.score,
      question: catechism[this.phaseIndex % catechism.length]
    })
  }

  private restartPhase() {
    this.scene.stop('HUDScene')
    this.scene.start('QuizScene', { phaseIndex: this.phaseIndex, score: this.score })
  }
}
