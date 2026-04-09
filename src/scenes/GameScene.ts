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
  { // Fase 1 — introdução (~2000px) — 6 inimigos
    platforms: [
      [0,418,280,30],[200,340,100,16],[360,275,100,16],[520,215,120,16],
      [700,275,100,16],[860,340,100,16],[1000,418,240,30],
      [1060,340,100,16],[1210,275,100,16],[1370,215,120,16],
      [1530,300,100,16],[1690,370,100,16],[1830,418,270,30]
    ],
    enemies: [
      {x:100, patrol:[10,270]},
      {x:400, patrol:[365,450]},
      {x:750, patrol:[705,790]},
      {x:1100, patrol:[1005,1230]},
      {x:1430, patrol:[1375,1480]},
      {x:1900, patrol:[1835,2090]}
    ],
    collectibles: [
      {x:240,y:305,type:'point'},{x:570,y:180,type:'point'},
      {x:1110,y:305,type:'point'},{x:1420,y:180,type:'life'}
    ],
    goal:        {x:1960, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 2 — lacunas no chão (~2200px) — 7 inimigos
    platforms: [
      [0,418,200,30],[290,418,220,30],[540,360,100,16],[700,418,200,30],
      [990,360,100,16],[1150,418,220,30],[1430,320,100,16],[1610,260,100,16],
      [1800,418,270,30],[1850,340,100,16]
    ],
    enemies: [
      {x:80,  patrol:[10,190]},
      {x:380, patrol:[295,500]},
      {x:590, patrol:[545,635]},
      {x:780, patrol:[705,890]},
      {x:1250, patrol:[1155,1360]},
      {x:1480, patrol:[1435,1525]},
      {x:1900, patrol:[1805,2060]}
    ],
    collectibles: [
      {x:350,y:380,type:'point'},{x:590,y:325,type:'point'},
      {x:1040,y:325,type:'point'},{x:1660,y:225,type:'life'}
    ],
    goal:        {x:1960, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 3 — escadaria dupla (~2400px) — 7 inimigos
    platforms: [
      [0,418,180,30],[200,370,100,16],[360,320,100,16],[520,270,100,16],[680,220,110,16],
      [870,418,200,30],
      [920,370,100,16],[1080,320,100,16],[1240,270,100,16],[1400,220,110,16],
      [1580,270,100,16],[1740,320,100,16],[1900,418,250,30]
    ],
    enemies: [
      {x:80,  patrol:[10,170]},
      {x:250, patrol:[205,295]},
      {x:570, patrol:[525,615]},
      {x:730, patrol:[685,785]},
      {x:970, patrol:[875,1060]},
      {x:1290, patrol:[1245,1335]},
      {x:1980, patrol:[1905,2140]}
    ],
    collectibles: [
      {x:250,y:335,type:'point'},{x:730,y:185,type:'point'},
      {x:1290,y:235,type:'point'},{x:1450,y:185,type:'life'}
    ],
    goal:        {x:2020, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 4 — zigue-zague duplo (~2400px) — 8 inimigos
    platforms: [
      [0,418,160,30],
      [200,355,80,16],[340,295,80,16],[480,355,80,16],[620,295,80,16],[760,355,80,16],
      [900,418,200,30],
      [960,355,80,16],[1100,295,80,16],[1240,355,80,16],[1380,295,80,16],[1520,355,80,16],
      [1660,418,200,30],[1720,295,80,16],[1860,355,80,16],[2000,418,220,30]
    ],
    enemies: [
      {x:80,  patrol:[10,150]},
      {x:230, patrol:[205,275]},
      {x:510, patrol:[485,555]},
      {x:790, patrol:[765,835]},
      {x:980, patrol:[905,1090]},
      {x:1130, patrol:[1105,1175]},
      {x:1410, patrol:[1385,1455]},
      {x:1750, patrol:[1725,1795]}
    ],
    collectibles: [
      {x:245,y:320,type:'point'},{x:665,y:260,type:'point'},
      {x:1145,y:260,type:'point'},{x:1425,y:260,type:'point'},{x:1770,y:260,type:'life'}
    ],
    goal:        {x:2090, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 5 — saltos longos duplos (~2500px) — 8 inimigos
    platforms: [
      [0,418,140,30],
      [220,340,90,16],[400,270,90,16],[580,340,90,16],[760,270,90,16],
      [960,418,200,30],
      [1010,340,90,16],[1190,270,90,16],[1370,340,90,16],[1550,270,90,16],
      [1730,340,90,16],[1920,418,250,30],[1980,270,90,16]
    ],
    enemies: [
      {x:60,  patrol:[10,130]},
      {x:260, patrol:[225,305]},
      {x:620, patrol:[585,665]},
      {x:800, patrol:[765,845]},
      {x:1050, patrol:[965,1150]},
      {x:1230, patrol:[1195,1275]},
      {x:1590, patrol:[1555,1635]},
      {x:2020, patrol:[1925,2160]}
    ],
    collectibles: [
      {x:270,y:305,type:'point'},{x:820,y:235,type:'point'},
      {x:1240,y:235,type:'point'},{x:1600,y:235,type:'life'}
    ],
    goal:        {x:2090, y:378},
    playerStart: {x:60,  y:375}
  },
  { // Fase 6 — três andares duplos (~2700px) — 9 inimigos
    platforms: [
      [0,418,120,30],
      [160,355,90,16],[320,290,90,16],[480,225,100,16],[640,290,90,16],[800,355,90,16],
      [980,418,200,30],
      [1040,355,90,16],[1200,290,90,16],[1360,225,100,16],[1520,290,90,16],[1680,355,90,16],
      [1860,418,200,30],[1920,290,90,16],[2080,225,100,16],[2240,418,230,30]
    ],
    enemies: [
      {x:50,  patrol:[10,110]},
      {x:200, patrol:[165,245]},
      {x:530, patrol:[485,575]},
      {x:840, patrol:[805,885]},
      {x:1080, patrol:[985,1170]},
      {x:1250, patrol:[1205,1285]},
      {x:1560, patrol:[1525,1605]},
      {x:1970, patrol:[1925,2005]},
      {x:2340, patrol:[2245,2460]}
    ],
    collectibles: [
      {x:210,y:320,type:'point'},{x:530,y:190,type:'point'},
      {x:1250,y:255,type:'point'},{x:1570,y:255,type:'point'},{x:2130,y:190,type:'life'}
    ],
    goal:        {x:2360, y:378},
    playerStart: {x:50,  y:375}
  },
  { // Fase 7 — degraus finos duplos (~2800px) — 10 inimigos
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
      {x:55,  patrol:[10,90]},
      {x:170, patrol:[155,210]},
      {x:425, patrol:[415,470]},
      {x:685, patrol:[675,730]},
      {x:960, patrol:[935,990]},
      {x:1125, patrol:[1085,1140]},
      {x:1355, patrol:[1345,1400]},
      {x:1615, patrol:[1605,1660]},
      {x:2060, patrol:[1965,2155]},
      {x:2460, patrol:[2405,2610]}
    ],
    collectibles: [
      {x:195,y:345,type:'point'},{x:540,y:225,type:'point'},
      {x:1210,y:305,type:'point'},{x:1470,y:225,type:'point'},{x:2140,y:225,type:'life'}
    ],
    goal:        {x:2500, y:378},
    playerStart: {x:40,  y:375}
  },
  { // Fase 8 — desafio final (~3000px) — 12 inimigos
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
      {x:55,  patrol:[10,90]},
      {x:160, patrol:[145,195]},
      {x:415, patrol:[405,455]},
      {x:545, patrol:[535,585]},
      {x:800, patrol:[795,845]},
      {x:935, patrol:[925,975]},
      {x:1140, patrol:[1115,1165]},
      {x:1385, patrol:[1375,1425]},
      {x:1515, patrol:[1505,1555]},
      {x:1645, patrol:[1635,1685]},
      {x:2100, patrol:[2035,2225]},
      {x:2790, patrol:[2735,2940]}
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

  private phaseIndex      = 0
  private score           = 0
  private lives           = 1
  private scoreAtLastLife  = 0
  private scoreAtPhaseStart = 0   // score ao entrar na fase — restaurado ao morrer
  private world           = worlds.worlds[0]
  private levelWidth      = 0
  private phaseEnded      = false

  constructor() { super({ key: 'GameScene' }) }

  init(data: GameData) {
    this.phaseIndex       = data.phaseIndex ?? 0
    this.score            = data.score  ?? 0
    this.scoreAtPhaseStart = this.score
    this.lives            = data.lives  ?? StorageManager.load().lives
    this.scoreAtLastLife  = this.score
    this.enemies          = []
    this.collectibles     = []
    this.phaseEnded       = false
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
      // Perde vida → reinicia a fase do zero (inimigos, coletáveis e score resetados)
      this.add.text(width / 2, height / 2 - 20, 'Não desista!', {
        fontSize: '24px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.add.text(width / 2, height / 2 + 16, `${'❤️'.repeat(this.lives)} vida${this.lives > 1 ? 's' : ''} restante${this.lives > 1 ? 's' : ''}`, {
        fontSize: '18px', color: '#fff8e1', fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(26)
      this.time.delayedCall(2000, () => {
        this.scene.stop('HUDScene')
        // Reinicia a fase — pontos da tentativa perdida são descartados
        this.scene.restart({ phaseIndex: this.phaseIndex, score: this.scoreAtPhaseStart, lives: this.lives })
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
    const { width: vw, height: vh } = this.cameras.main
    const W = this.levelWidth

    // Paisagem como fundo fixo (imagem real)
    const bg = this.add.image(vw / 2, vh / 2, 'landscape')
    bg.setDisplaySize(vw, vh).setScrollFactor(0).setDepth(-10)

    // Chão base
    const ground = this.add.graphics().setDepth(-7)
    ground.fillStyle(0xc8a050, 1)
    ground.fillRect(0, vh - 32, W, 32)
    ground.fillStyle(0x7a9c40, 1)
    ground.fillRect(0, vh - 32, W, 5)
  }

  private buildPlatforms(layout: typeof PHASE_LAYOUTS[0]) {
    this.platforms = this.physics.add.staticGroup()
    layout.platforms.forEach(([x, y, w, h]) => {
      const block = this.platforms.create(x + w / 2, y + h / 2, 'platform_tile') as Phaser.Physics.Arcade.Sprite
      block.setDisplaySize(w, h).setDepth(2).refreshBody()
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
    const safeZoneEnd = layout.playerStart.x + 220  // inimigos não nascem perto do jogador
    layout.enemies.forEach(e => {
      if (e.x < safeZoneEnd) return

      // Detect the bottommost platform that contains this enemy's x position
      // so enemies on floating platforms spawn on the correct platform (not groundY)
      let spawnY = this.game.canvas.height - 48  // fallback
      let bestPlatformTop = -1
      for (const [px, py, pw] of layout.platforms) {
        if (e.x >= px && e.x <= px + pw && py > bestPlatformTop) {
          bestPlatformTop = py
          spawnY = py - 22   // center just above platform top (enemy half-height ≈ 22px)
        }
      }

      const enemy = new Enemy(this, e.x, spawnY, e.patrol[0], e.patrol[1], this.world.enemy.speed)
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

    // ── Projétil para na plataforma (não atravessa) ───────────────────
    this.physics.add.collider(
      this.player.getProjectiles(), this.platforms,
      (proj) => {
        const p = proj as Phaser.Physics.Arcade.Sprite
        if (p.active) p.setActive(false).setVisible(false)
      }
    )

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
