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
  lives?: number
}

// ─── Layouts das 8 fases ──────────────────────────────────────────────────────
// Plataformas: [x, y, largura, altura]
// Goal: posição da bandeira
// playerStart: onde o player começa
const PHASE_LAYOUTS = [
  { // Fase 1 — introdução (~2000px)
    platforms: [
      [0,418,280,30],[200,340,100,16],[360,275,100,16],[520,215,120,16],
      [700,275,100,16],[860,340,100,16],[1000,418,240,30],
      [1060,340,100,16],[1210,275,100,16],[1370,215,120,16],
      [1530,300,100,16],[1690,370,100,16],[1830,418,270,30]
    ],
    enemies: [
      {x:260, patrol:[210,350]},{x:760, patrol:[710,850]},
      {x:1260, patrol:[1220,1360]}
    ],
    collectibles: [
      {x:240,y:305,type:'point'},{x:570,y:180,type:'point'},
      {x:1110,y:305,type:'point'},{x:1420,y:180,type:'life'}
    ],
    goal:        {x:1960, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 2 — lacunas no chão (~2200px)
    platforms: [
      [0,418,200,30],[290,418,220,30],[540,360,100,16],[700,418,200,30],
      [990,360,100,16],[1150,418,220,30],[1430,320,100,16],[1610,260,100,16],
      [1800,418,270,30],[1850,340,100,16]
    ],
    enemies: [
      {x:350, patrol:[300,490]},{x:760, patrol:[710,880]},
      {x:1210, patrol:[1160,1410]},{x:1870, patrol:[1860,1940]}
    ],
    collectibles: [
      {x:350,y:380,type:'point'},{x:590,y:325,type:'point'},
      {x:1040,y:325,type:'point'},{x:1660,y:225,type:'life'}
    ],
    goal:        {x:1960, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 3 — escadaria dupla (~2400px)
    platforms: [
      [0,418,180,30],[200,370,100,16],[360,320,100,16],[520,270,100,16],[680,220,110,16],
      [870,418,200,30],
      [920,370,100,16],[1080,320,100,16],[1240,270,100,16],[1400,220,110,16],
      [1580,270,100,16],[1740,320,100,16],[1900,418,250,30]
    ],
    enemies: [
      {x:250, patrol:[210,350]},{x:730, patrol:[690,860]},
      {x:1130, patrol:[1090,1230]},{x:1630, patrol:[1590,1730]}
    ],
    collectibles: [
      {x:250,y:335,type:'point'},{x:730,y:185,type:'point'},
      {x:1290,y:235,type:'point'},{x:1450,y:185,type:'life'}
    ],
    goal:        {x:2020, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 4 — zigue-zague duplo (~2400px)
    platforms: [
      [0,418,160,30],
      [200,355,80,16],[340,295,80,16],[480,355,80,16],[620,295,80,16],[760,355,80,16],
      [900,418,200,30],
      [960,355,80,16],[1100,295,80,16],[1240,355,80,16],[1380,295,80,16],[1520,355,80,16],
      [1660,418,200,30],[1720,295,80,16],[1860,355,80,16],[2000,418,220,30]
    ],
    enemies: [
      {x:250, patrol:[210,370]},{x:670, patrol:[630,750]},
      {x:1010, patrol:[970,1090]},{x:1430, patrol:[1390,1510]},
      {x:1760, patrol:[1730,1850]}
    ],
    collectibles: [
      {x:245,y:320,type:'point'},{x:665,y:260,type:'point'},
      {x:1145,y:260,type:'point'},{x:1425,y:260,type:'point'},{x:1770,y:260,type:'life'}
    ],
    goal:        {x:2090, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 5 — saltos longos duplos (~2500px)
    platforms: [
      [0,418,140,30],
      [220,340,90,16],[400,270,90,16],[580,340,90,16],[760,270,90,16],
      [960,418,200,30],
      [1010,340,90,16],[1190,270,90,16],[1370,340,90,16],[1550,270,90,16],
      [1730,340,90,16],[1920,418,250,30],[1980,270,90,16]
    ],
    enemies: [
      {x:270, patrol:[230,390]},{x:820, patrol:[770,940]},
      {x:1060, patrol:[1020,1180]},{x:1420, patrol:[1380,1540]},
      {x:2010, patrol:[1990,2060]}
    ],
    collectibles: [
      {x:270,y:305,type:'point'},{x:820,y:235,type:'point'},
      {x:1240,y:235,type:'point'},{x:1600,y:235,type:'life'}
    ],
    goal:        {x:2090, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 6 — três andares duplos (~2700px)
    platforms: [
      [0,418,120,30],
      [160,355,90,16],[320,290,90,16],[480,225,100,16],[640,290,90,16],[800,355,90,16],
      [980,418,200,30],
      [1040,355,90,16],[1200,290,90,16],[1360,225,100,16],[1520,290,90,16],[1680,355,90,16],
      [1860,418,200,30],[1920,290,90,16],[2080,225,100,16],[2240,418,230,30]
    ],
    enemies: [
      {x:210, patrol:[170,310]},{x:530, patrol:[490,630]},{x:850, patrol:[810,970]},
      {x:1250, patrol:[1210,1350]},{x:1570, patrol:[1530,1670]},
      {x:1970, patrol:[1930,2070]}
    ],
    collectibles: [
      {x:210,y:320,type:'point'},{x:530,y:190,type:'point'},
      {x:1250,y:255,type:'point'},{x:1570,y:255,type:'point'},{x:2130,y:190,type:'life'}
    ],
    goal:        {x:2360, y:378},
    playerStart: {x:50,  y:375}
  },
  { // Fase 7 — degraus finos duplos (~2800px)
    platforms: [
      [0,418,100,30],
      [150,380,65,16],[280,340,65,16],[410,300,65,16],[540,260,65,16],
      [670,300,65,16],[800,340,65,16],[930,380,65,16],
      [1030,418,200,30],
      [1080,380,65,16],[1210,340,65,16],[1340,300,65,16],[1470,260,65,16],
      [1600,300,65,16],[1730,340,65,16],[1860,380,65,16],
      [1960,418,200,30],[2010,300,65,16],[2140,260,65,16],[2270,300,65,16],
      [2400,418,220,30]
    ],
    enemies: [
      {x:195, patrol:[160,265]},{x:455, patrol:[420,530]},{x:865, patrol:[810,920]},
      {x:1125, patrol:[1090,1200]},{x:1385, patrol:[1350,1460]},{x:1645, patrol:[1610,1720]}
    ],
    collectibles: [
      {x:195,y:345,type:'point'},{x:540,y:225,type:'point'},
      {x:1210,y:305,type:'point'},{x:1470,y:225,type:'point'},{x:2140,y:225,type:'life'}
    ],
    goal:        {x:2500, y:378},
    playerStart: {x:40,  y:375}
  },
  { // Fase 8 — desafio final (~3000px)
    platforms: [
      [0,418,100,30],
      [140,370,60,16],[270,315,60,16],[400,260,60,16],[530,205,60,16],
      [660,260,60,16],[790,315,60,16],[920,260,60,16],
      [1060,418,200,30],
      [1110,370,60,16],[1240,315,60,16],[1370,260,60,16],[1500,205,60,16],
      [1630,260,60,16],[1760,315,60,16],[1890,260,60,16],
      [2030,418,200,30],
      [2080,370,60,16],[2210,315,60,16],[2340,260,60,16],[2470,205,60,16],
      [2600,260,60,16],[2730,418,220,30]
    ],
    enemies: [
      {x:180, patrol:[150,260]},{x:440, patrol:[410,520]},{x:710, patrol:[670,780]},
      {x:1160, patrol:[1120,1230]},{x:1420, patrol:[1380,1490]},{x:1690, patrol:[1640,1750]},
      {x:2130, patrol:[2090,2200]},{x:2390, patrol:[2350,2460]}
    ],
    collectibles: [
      {x:180,y:335,type:'point'},{x:530,y:170,type:'point'},
      {x:1240,y:280,type:'point'},{x:1500,y:170,type:'point'},
      {x:2340,y:225,type:'point'},{x:2470,y:170,type:'life'}
    ],
    goal:        {x:2840, y:378},
    playerStart: {x:40,  y:375}
  }
]

export class GameScene extends Phaser.Scene {
  private player!: Player
  // Exposto para o HUDScene controlar via toque
  get playerRef() { return this.player }
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private goalSprite!: Phaser.Physics.Arcade.Sprite
  private enemies:      Enemy[]       = []
  private collectibles: Collectible[] = []

  private phaseIndex     = 0
  private score          = 0
  private lives          = 1
  private scoreAtLastLife = 0
  private world          = worlds.worlds[0]
  private levelWidth     = 0
  private phaseEnded     = false

  constructor() { super({ key: 'GameScene' }) }

  init(data: GameData) {
    this.phaseIndex      = data.phaseIndex ?? 0
    this.score           = data.score  ?? 0
    this.lives           = data.lives  ?? StorageManager.load().lives
    this.scoreAtLastLife = this.score
    this.enemies         = []
    this.collectibles    = []
    this.phaseEnded      = false
  }

  create() {
    const layout    = PHASE_LAYOUTS[this.phaseIndex % PHASE_LAYOUTS.length]
    const allX      = layout.platforms.map(p => p[0] + p[2])
    this.levelWidth = Math.max(...allX, this.game.canvas.width) + 150

    this.drawBackground()
    this.buildPlatforms(layout)
    this.spawnGoal(layout)           // goal antes do player p/ overlap funcionar
    this.spawnPlayer(layout)
    this.spawnEnemies(layout)
    this.spawnCollectibles(layout)
    this.setupCamera()
    this.setupCollisions()

    this.scene.launch('HUDScene', {
      hearts: this.player.getHearts(),
      lives:  this.lives,
      score:  this.score,
      phaseIndex: this.phaseIndex
    })

    this.player.onHeartChange((h) => {
      this.scene.get('HUDScene').events.emit('updateHearts', h)
    })
    this.player.onDeath(() => this.handlePlayerDeath())
  }

  update(time: number, delta: number) {
    if (this.phaseEnded) return
    this.player.update(time, delta)
    this.enemies.forEach(e => e.update())

    // Caiu fora da tela
    if (this.player.y > this.game.canvas.height + 80) {
      const layout = PHASE_LAYOUTS[this.phaseIndex % PHASE_LAYOUTS.length]
      this.player.takeDamage()
      if (this.player.getHearts() > 0) {
        this.player.setPosition(layout.playerStart.x, layout.playerStart.y - 60)
        ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0)
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PONTUAÇÃO E VIDAS
  // ════════════════════════════════════════════════════════════════════════════

  private addScore(pts: number, label: string) {
    this.score += pts
    StorageManager.save({ totalScore: this.score })
    this.scene.get('HUDScene').events.emit('updateScore', this.score)

    const txt = this.add.text(this.player.x, this.player.y - 38, label, {
      fontSize: '16px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial',
      stroke: '#1a0a2e', strokeThickness: 3
    }).setDepth(15).setOrigin(0.5)
    this.tweens.add({ targets: txt, y: txt.y - 48, alpha: 0, duration: 750, onComplete: () => txt.destroy() })

    this.checkScoreMilestone()
  }

  private checkScoreMilestone() {
    if (this.score - this.scoreAtLastLife >= 100 && this.lives < 3) {
      this.lives = Math.min(3, this.lives + 1)
      this.scoreAtLastLife = this.score
      StorageManager.save({ lives: this.lives })
      this.scene.get('HUDScene').events.emit('updateLives', this.lives)
      this.showBanner('✨ +1 Vida! ✨', '#f5c842')
    }
  }

  private showBanner(text: string, color: string) {
    const { width, height } = this.cameras.main
    const panel = this.add.graphics().setScrollFactor(0).setDepth(25)
    panel.fillStyle(0x1a0a2e, 0.88)
    panel.fillRoundedRect(width / 2 - 140, height / 2 - 32, 280, 64, 14)
    const txt = this.add.text(width / 2, height / 2, text, {
      fontSize: '24px', color, fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
    this.time.delayedCall(1800, () => { panel.destroy(); txt.destroy() })
  }

  private handlePlayerDeath() {
    if (this.phaseEnded) return
    this.phaseEnded = true
    this.lives -= 1
    StorageManager.save({ lives: this.lives })

    const { width, height } = this.cameras.main
    const panel = this.add.graphics().setScrollFactor(0).setDepth(25)
    panel.fillStyle(0x1a0a2e, 0.92)
    panel.fillRoundedRect(width / 2 - 160, height / 2 - 55, 320, 110, 14)

    if (this.lives <= 0) {
      StorageManager.reset()
      this.add.text(width / 2, height / 2 - 20, '💀 GAME OVER', {
        fontSize: '28px', color: '#e74c3c', fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.add.text(width / 2, height / 2 + 18, 'Voltando ao menu...', {
        fontSize: '15px', color: '#fff8e1', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.time.delayedCall(2500, () => { this.scene.stop('HUDScene'); this.scene.start('MenuScene') })
    } else {
      this.add.text(width / 2, height / 2 - 20, 'Não desista!', {
        fontSize: '24px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.add.text(width / 2, height / 2 + 16, `${'❤️'.repeat(this.lives)} vida${this.lives > 1 ? 's' : ''} restante${this.lives > 1 ? 's' : ''}`, {
        fontSize: '18px', color: '#fff8e1', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.time.delayedCall(2000, () => {
        this.scene.stop('HUDScene')
        this.scene.start('QuizScene', { phaseIndex: this.phaseIndex, score: this.score, lives: this.lives })
      })
    }
  }

  private completePhase() {
    if (this.phaseEnded) return
    this.phaseEnded = true
    StorageManager.save({ currentPhase: this.phaseIndex + 2, totalScore: this.score, lives: this.lives })
    this.scene.stop('HUDScene')
    this.scene.start('ResultScene', {
      phaseIndex: this.phaseIndex,
      score:      this.score,
      lives:      this.lives,
      question:   catechism[this.phaseIndex % catechism.length]
    })
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONSTRUÇÃO DA FASE
  // ════════════════════════════════════════════════════════════════════════════

  private drawBackground() {
    const { height } = this.cameras.main
    const W = this.levelWidth

    // Céu quente/dourado (paralaxe)
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10)
    sky.fillGradientStyle(0xfff8e1, 0xfff8e1, 0xf5d060, 0xf5d060, 1)
    sky.fillRect(0, 0, this.game.canvas.width, height)

    // Colinas distantes (paralaxe lenta)
    const hills = this.add.graphics().setScrollFactor(0.2).setDepth(-9)
    hills.fillStyle(0xe8d090, 0.55)
    hills.fillEllipse(300,  height - 60, 700, 260)
    hills.fillEllipse(900,  height - 40, 600, 220)
    hills.fillEllipse(1500, height - 70, 700, 240)
    hills.fillStyle(0xd4b870, 0.45)
    hills.fillEllipse(600,  height - 30, 500, 200)
    hills.fillEllipse(1200, height - 50, 500, 210)

    // Árvores no fundo (paralaxe média)
    const treesG = this.add.graphics().setScrollFactor(0.4).setDepth(-8)
    for (let tx = 80; tx < W; tx += 260) {
      this.drawBgTree(treesG, tx, height - 70, 0.7 + Math.random() * 0.5)
    }

    // Chão base (solo dourado)
    const ground = this.add.graphics().setDepth(-7)
    ground.fillStyle(0xc8a050, 1)
    ground.fillRect(0, height - 32, W, 32)
    ground.fillStyle(0x7a9c40, 1)
    ground.fillRect(0, height - 32, W, 5)
  }

  private drawBgTree(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
    g.fillStyle(0x7a5530, 1); g.fillRect(x - 4 * s, y, 8 * s, 30 * s)
    g.fillStyle(0x5a7a2c, 0.8); g.fillCircle(x, y - 18 * s, 22 * s)
    g.fillStyle(0x6a9034, 0.6); g.fillCircle(x - 12 * s, y - 8 * s, 15 * s)
    g.fillCircle(x + 12 * s, y - 10 * s, 15 * s)
  }

  private buildPlatforms(layout: typeof PHASE_LAYOUTS[0]) {
    this.platforms = this.physics.add.staticGroup()

    layout.platforms.forEach(([x, y, w, h]) => {
      const key = `plt_${w}_${h}`

      if (!this.textures.exists(key)) {
        const g = this.add.graphics()

        // Terra (base marrom)
        g.fillStyle(0xb08040, 1); g.fillRect(0, 4, w, h)

        // Grama no topo
        g.fillStyle(0x7ab030, 1); g.fillRect(0, 0, w, 6)
        g.fillStyle(0x5a8a20, 1); g.fillRect(0, 0, w, 2)

        // Tufos de grama
        for (let tx = 6; tx < w - 6; tx += 14) {
          g.fillStyle(0x6aaa28, 1)
          g.fillTriangle(tx, 0, tx + 4, -5, tx + 8, 0)
        }

        // Textura da terra
        g.fillStyle(0xa07030, 0.5)
        for (let tx = 12; tx < w - 6; tx += 22) {
          g.fillCircle(tx, h / 2 + 4, 3)
        }

        g.generateTexture(key, w, h)
        g.destroy()
      }

      const block = this.platforms.create(x + w / 2, y + h / 2, key) as Phaser.Physics.Arcade.Sprite
      block.setDepth(2).refreshBody()
    })
  }

  private spawnGoal(layout: typeof PHASE_LAYOUTS[0]) {
    const { x, y } = layout.goal
    const height   = this.game.canvas.height

    // Poste da bandeira (estilo Mario)
    const pole = this.add.graphics().setDepth(3)
    pole.fillStyle(0xaaaaaa, 1); pole.fillRect(x - 2, y - 80, 4, 80)
    pole.fillStyle(0xdddddd, 1); pole.fillRect(x - 2, y - 80, 2, 80)

    // Bandeira amarela
    const flag = this.add.graphics().setDepth(3)
    flag.fillStyle(0xf5c842, 1)
    flag.fillTriangle(x + 2, y - 80, x + 2, y - 56, x + 30, y - 68)
    flag.fillStyle(0xe8a020, 0.5)
    flag.fillTriangle(x + 2, y - 80, x + 2, y - 68, x + 18, y - 74)

    // Ondular a bandeira
    this.tweens.add({
      targets: flag, x: '+=3', yoyo: true, repeat: -1, duration: 300, ease: 'Sine.easeInOut'
    })

    // Aura brilhante no chão
    const aura = this.add.graphics().setDepth(2)
    aura.fillStyle(0xf5c842, 0.25); aura.fillEllipse(x, height - 42, 80, 20)
    this.tweens.add({ targets: aura, alpha: 0.5, scaleX: 1.3, yoyo: true, repeat: -1, duration: 700 })

    // Linha vertical de luz
    const beam = this.add.graphics().setDepth(1)
    beam.fillStyle(0xf5c842, 0.08)
    beam.fillRect(x - 20, 0, 40, height)
    this.tweens.add({ targets: beam, alpha: 0.15, yoyo: true, repeat: -1, duration: 900 })

    // ── Hitbox invisível via sprite estático (overlap confiável) ──────
    const goalKey = 'goal_hit'
    if (!this.textures.exists(goalKey)) {
      const gh = this.add.graphics()
      gh.fillStyle(0xffffff, 0); gh.fillRect(0, 0, 36, 90)
      gh.generateTexture(goalKey, 36, 90)
      gh.destroy()
    }
    this.goalSprite = this.physics.add.sprite(x, y - 45, goalKey)
    this.goalSprite.setAlpha(0).setDepth(1)
    ;(this.goalSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setImmovable(true)
  }

  private spawnPlayer(layout: typeof PHASE_LAYOUTS[0]) {
    this.player = new Player(this, layout.playerStart.x, layout.playerStart.y)
  }

  private spawnEnemies(layout: typeof PHASE_LAYOUTS[0]) {
    const groundY = this.game.canvas.height - 48
    layout.enemies.forEach(e => {
      const enemy = new Enemy(this, e.x, groundY, e.patrol[0], e.patrol[1], this.world.enemy.speed)
      this.enemies.push(enemy)
    })
  }

  private spawnCollectibles(layout: typeof PHASE_LAYOUTS[0]) {
    layout.collectibles.forEach(c => {
      this.collectibles.push(new Collectible(this, c.x, c.y, c.type as 'point' | 'life'))
    })
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelWidth, this.game.canvas.height)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.physics.world.setBounds(0, -200, this.levelWidth, this.game.canvas.height + 300)
  }

  private setupCollisions() {
    this.physics.add.collider(this.player, this.platforms)

    // ── Goal — overlap com sprite estático ────────────────────────────
    this.physics.add.overlap(this.player, this.goalSprite, () => {
      this.completePhase()
    })

    this.enemies.forEach(enemy => {
      this.physics.add.collider(enemy, this.platforms)

      // Pisou no inimigo
      this.physics.add.overlap(this.player, enemy, () => {
        if (!enemy.isAlive()) return
        const pb = this.player.body as Phaser.Physics.Arcade.Body
        if (pb.velocity.y > 50 && this.player.y < enemy.y - 8) {
          enemy.stomp()
          this.addScore(50, '+50 ⭐')
          pb.setVelocityY(-600)  // quica igual Mario
        } else {
          this.player.takeDamage()
        }
      })

      // Projétil acertou inimigo
      this.physics.add.overlap(this.player.getProjectiles(), enemy, (proj) => {
        if (!enemy.isAlive()) return
        ;(proj as Phaser.Physics.Arcade.Sprite).setActive(false).setVisible(false)
        enemy.hitByProjectile()
        this.addScore(30, '+30 ⭐')
      })
    })

    // Coletáveis
    this.collectibles.forEach(col => {
      this.physics.add.overlap(this.player, col, () => {
        if (!col.active) return
        col.collect()
        if (col.collectibleType === 'point') {
          this.addScore(1, '+1 ✦')
        } else {
          if (this.player.addHeart()) {
            this.scene.get('HUDScene').events.emit('updateHearts', this.player.getHearts())
            this.showFloating('❤️ +1 Coração!', '#ff6b6b')
          } else {
            this.addScore(10, '+10 ⭐')
          }
        }
      })
    })
  }

  private showFloating(text: string, color: string) {
    const txt = this.add.text(this.player.x, this.player.y - 38, text, {
      fontSize: '16px', color, fontStyle: 'bold', fontFamily: 'Arial',
      stroke: '#1a0a2e', strokeThickness: 3
    }).setDepth(15).setOrigin(0.5)
    this.tweens.add({ targets: txt, y: txt.y - 48, alpha: 0, duration: 900, onComplete: () => txt.destroy() })
  }
}
