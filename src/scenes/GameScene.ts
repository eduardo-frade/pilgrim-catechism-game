import Phaser from 'phaser'
import { Player } from '../objects/Player'
import { Enemy } from '../objects/Enemy'
import { Collectible } from '../objects/Collectible'
import worlds from '../data/worlds.json'
import { StorageManager } from '../data/StorageManager'

interface GameData {
  phaseIndex: number
  score: number
  lives?: number
}

// ─── Layouts das 8 fases ──────────────────────────────────────────────────────
// Plataformas: [x, y, largura, altura]  (y=418 = chão; menor y = mais alto)
// Inimigos: y indica y da plataforma onde ficam (418 = chão)
// Buracos são as lacunas entre segmentos de chão
const PHASE_LAYOUTS = [
  { // Fase 1 — intro (~2320px) — 2 buracos (140, 160px), 6 inimigos
    platforms: [
      // Chão (3 segmentos)
      [0,418,580,30],[720,418,720,30],[1600,418,720,30],
      // Plataformas flutuantes (variadas)
      [180,350,130,16],[450,285,80,16],
      [760,315,170,16],[1020,255,90,16],[1250,300,120,16],
      [1640,290,140,16],[1900,250,85,16]
    ],
    enemies: [
      {x:310,y:418,patrol:[10,570]},
      {x:470,y:418,patrol:[10,570]},
      {x:850,y:418,patrol:[725,1430]},
      {x:1150,y:418,patrol:[725,1430]},
      {x:1730,y:418,patrol:[1605,2310]},
      {x:2050,y:418,patrol:[1605,2310]}
    ],
    collectibles: [
      {x:245,y:315,type:'point'},{x:450,y:250,type:'point'},
      {x:1065,y:220,type:'point'},{x:1310,y:265,type:'life'}
    ],
    goal:        {x:2220, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 2 — 3 buracos (150, 170, 170px) (~2540px) — 7 inimigos
    platforms: [
      [0,418,500,30],[650,418,570,30],[1390,418,580,30],[2140,418,420,30],
      [220,340,100,16],[410,280,70,16],
      [700,310,150,16],[960,250,85,16],[1170,285,115,16],
      [1450,275,130,16],[1780,235,75,16],[2020,275,110,16]
    ],
    enemies: [
      {x:300,y:418,patrol:[10,490]},
      {x:420,y:418,patrol:[10,490]},
      {x:740,y:418,patrol:[655,1380]},
      {x:1080,y:418,patrol:[655,1380]},
      {x:1520,y:418,patrol:[1395,2130]},
      {x:1900,y:418,patrol:[1395,2130]},
      {x:2300,y:418,patrol:[2145,2555]}
    ],
    collectibles: [
      {x:280,y:305,type:'point'},{x:410,y:245,type:'point'},
      {x:1010,y:215,type:'point'},{x:1840,y:200,type:'life'}
    ],
    goal:        {x:2440, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 3 — 3 buracos (170, 180, 185px) (~2700px) — 7 inimigos
    platforms: [
      [0,418,460,30],[630,418,540,30],[1350,418,555,30],[2090,418,660,30],
      [160,335,100,16],[340,270,70,16],[490,210,80,16],
      [670,300,150,16],[880,240,90,16],[1140,275,110,16],
      [1400,260,120,16],[1670,220,75,16],[1910,270,130,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,450]},
      {x:410,y:418,patrol:[10,450]},
      {x:700,y:418,patrol:[635,1340]},
      {x:1030,y:418,patrol:[635,1340]},
      {x:1440,y:418,patrol:[1355,2080]},
      {x:1780,y:418,patrol:[1355,2080]},
      {x:2200,y:418,patrol:[2095,2745]}
    ],
    collectibles: [
      {x:215,y:300,type:'point'},{x:490,y:175,type:'point'},
      {x:880,y:205,type:'point'},{x:1725,y:185,type:'life'}
    ],
    goal:        {x:2600, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 4 — 3 buracos (190, 200, 210px) (~2860px) — 8 inimigos
    platforms: [
      [0,418,420,30],[610,418,510,30],[1320,418,540,30],[2070,418,840,30],
      [145,325,95,16],[320,260,65,16],[460,205,75,16],
      [650,290,155,16],[870,230,85,16],[1110,270,120,16],
      [1370,255,125,16],[1660,215,70,16],[1910,260,130,16],[2200,220,80,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,410]},
      {x:390,y:418,patrol:[10,410]},
      {x:680,y:418,patrol:[615,1310]},
      {x:1010,y:418,patrol:[615,1310]},
      {x:1400,y:418,patrol:[1325,2060]},
      {x:1770,y:418,patrol:[1325,2060]},
      {x:2180,y:418,patrol:[2075,2905]},
      {x:2580,y:418,patrol:[2075,2905]}
    ],
    collectibles: [
      {x:195,y:290,type:'point'},{x:460,y:170,type:'point'},
      {x:1150,y:235,type:'point'},{x:1720,y:180,type:'life'}
    ],
    goal:        {x:2760, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 5 — 4 buracos (200, 200, 210, 210px) (~3070px) — 9 inimigos
    platforms: [
      [0,418,380,30],[580,418,480,30],[1260,418,490,30],[1960,418,500,30],[2670,418,430,30],
      [130,320,90,16],[300,255,65,16],[450,200,75,16],
      [620,285,145,16],[860,225,80,16],[1090,265,110,16],
      [1310,250,115,16],[1620,210,65,16],[1850,255,120,16],
      [2150,215,75,16],[2530,240,95,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,370]},
      {x:380,y:418,patrol:[10,370]},
      {x:660,y:418,patrol:[585,1250]},
      {x:980,y:418,patrol:[585,1250]},
      {x:1340,y:418,patrol:[1265,1950]},
      {x:1700,y:418,patrol:[1265,1950]},
      {x:2040,y:418,patrol:[1965,2660]},
      {x:2380,y:418,patrol:[1965,2660]},
      {x:2820,y:418,patrol:[2675,3095]}
    ],
    collectibles: [
      {x:185,y:285,type:'point'},{x:450,y:165,type:'point'},
      {x:1130,y:230,type:'point'},{x:1680,y:175,type:'life'}
    ],
    goal:        {x:2940, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 6 — 4 buracos (200, 200, 200, 210px) (~3150px) — 9 inimigos
    platforms: [
      [0,418,360,30],[560,418,460,30],[1220,418,470,30],[1890,418,480,30],[2580,418,570,30],
      [120,325,90,16],[280,260,60,16],[430,205,70,16],
      [600,290,140,16],[840,230,80,16],[1060,260,105,16],
      [1270,245,110,16],[1570,205,65,16],[1800,250,115,16],
      [2100,210,70,16],[2450,235,90,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,350]},
      {x:380,y:418,patrol:[10,350]},
      {x:630,y:418,patrol:[565,1210]},
      {x:940,y:418,patrol:[565,1210]},
      {x:1300,y:418,patrol:[1225,1880]},
      {x:1650,y:418,patrol:[1225,1880]},
      {x:1970,y:418,patrol:[1895,2570]},
      {x:2320,y:418,patrol:[1895,2570]},
      {x:2750,y:418,patrol:[2585,3145]}
    ],
    collectibles: [
      {x:170,y:290,type:'point'},{x:430,y:170,type:'point'},
      {x:1100,y:225,type:'point'},{x:1630,y:170,type:'life'}
    ],
    goal:        {x:3000, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 7 — 4 buracos (210, 220, 220, 220px) (~3250px) — 10 inimigos
    platforms: [
      [0,418,340,30],[550,418,440,30],[1200,418,450,30],[1870,418,460,30],[2550,418,700,30],
      [110,325,85,16],[260,260,60,16],[400,205,65,16],
      [590,285,135,16],[820,225,75,16],[1040,255,100,16],
      [1250,240,105,16],[1550,200,60,16],[1780,245,110,16],
      [2080,205,65,16],[2420,230,85,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,330]},
      {x:390,y:418,patrol:[10,330]},
      {x:610,y:418,patrol:[555,1190]},
      {x:920,y:418,patrol:[555,1190]},
      {x:1270,y:418,patrol:[1205,1860]},
      {x:1630,y:418,patrol:[1205,1860]},
      {x:1950,y:418,patrol:[1875,2540]},
      {x:2290,y:418,patrol:[1875,2540]},
      {x:2680,y:418,patrol:[2555,3245]},
      {x:3000,y:418,patrol:[2555,3245]}
    ],
    collectibles: [
      {x:155,y:290,type:'point'},{x:400,y:170,type:'point'},
      {x:1080,y:220,type:'point'},{x:1610,y:165,type:'life'}
    ],
    goal:        {x:3100, y:378},
    playerStart: {x:60,   y:375}
  },
  { // Fase 8 — desafio final (~3300px) — 4 buracos (200, 210, 210, 210px), 12 inimigos
    platforms: [
      [0,418,310,30],[510,418,410,30],[1130,418,430,30],[1770,418,450,30],[2430,418,870,30],
      [100,320,85,16],[240,255,60,16],[370,200,65,16],
      [550,280,130,16],[790,220,75,16],[1020,250,100,16],
      [1180,235,105,16],[1490,195,60,16],[1720,240,110,16],
      [2020,200,65,16],[2330,225,80,16],
      [2650,270,120,16],[2900,215,70,16]
    ],
    enemies: [
      {x:295,y:418,patrol:[10,300]},
      {x:380,y:418,patrol:[10,300]},
      {x:580,y:418,patrol:[515,1120]},
      {x:870,y:418,patrol:[515,1120]},
      {x:1200,y:418,patrol:[1135,1760]},
      {x:1550,y:418,patrol:[1135,1760]},
      {x:1840,y:418,patrol:[1775,2420]},
      {x:2170,y:418,patrol:[1775,2420]},
      {x:2520,y:418,patrol:[2435,3295]},
      {x:2780,y:418,patrol:[2435,3295]},
      {x:3040,y:418,patrol:[2435,3295]},
      {x:3200,y:418,patrol:[2435,3295]}
    ],
    collectibles: [
      {x:145,y:285,type:'point'},{x:370,y:165,type:'point'},
      {x:1060,y:215,type:'point'},{x:1550,y:160,type:'life'},
      {x:2700,y:235,type:'point'},{x:2950,y:180,type:'point'}
    ],
    goal:        {x:3180, y:378},
    playerStart: {x:60,   y:375}
  }
]

// Shift all game elements up so character walks on landscape's visible sandy surface
const Y_SHIFT = 133

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

    // Parede esquerda da câmera — player não pode voltar atrás
    const camLeft  = this.cameras.main.scrollX
    const pBody    = this.player.body as Phaser.Physics.Arcade.Body
    const minX     = camLeft + pBody.halfWidth + 4
    if (this.player.x < minX) {
      this.player.setX(minX)
      if (pBody.velocity.x < 0) pBody.setVelocityX(0)
    }

    // Caiu fora da tela
    if (this.player.y > this.game.canvas.height + 80) {
      const layout = PHASE_LAYOUTS[this.phaseIndex % PHASE_LAYOUTS.length]
      this.player.takeDamage()
      if (this.player.getHearts() > 0) {
        this.player.setPosition(layout.playerStart.x, layout.playerStart.y - Y_SHIFT - 60)
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
    // Vai direto para o quiz da próxima fase (sem tela de leitura da resposta)
    const nextPhase = this.phaseIndex + 1
    if (nextPhase >= PHASE_LAYOUTS.length) {
      StorageManager.reset()
      this.scene.start('MenuScene')
    } else {
      this.scene.start('QuizScene', { phaseIndex: nextPhase, score: this.score, lives: this.lives })
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONSTRUÇÃO DA FASE
  // ════════════════════════════════════════════════════════════════════════════

  private drawBackground() {
    const { width: vw, height: vh } = this.cameras.main
    const W = this.levelWidth

    // landscape2: 6223×720 — preserva proporção, escala para a altura da tela e tila se o nível for mais largo
    const src   = this.textures.get('landscape2').getSourceImage() as HTMLImageElement
    const dispW = Math.round((src.width / src.height) * vh)
    const copies = Math.ceil(W / dispW) + 1
    for (let i = 0; i < copies; i++) {
      this.add.image(i * dispW + dispW / 2, vh / 2, 'landscape2')
        .setDisplaySize(dispW, vh).setScrollFactor(1).setDepth(-10)
    }

  }

  private buildPlatforms(layout: typeof PHASE_LAYOUTS[0]) {
    this.platforms = this.physics.add.staticGroup()
    const vh = this.game.canvas.height

    // Shifted platforms
    const shifted = layout.platforms.map(([x, y, w, h]) => [x, y - Y_SHIFT, w, h] as [number,number,number,number])

    shifted.forEach(([x, y, w, h]) => {
      const isGround = y + Y_SHIFT + h >= vh - 10  // checa y original (antes do shift)

      if (isGround) {
        // Chão — hitbox simples, visual pelo landscape
        const block = this.platforms.create(x + w / 2, y + h / 2, 'platform_tile') as Phaser.Physics.Arcade.Sprite
        block.setDisplaySize(w, h).setAlpha(0).refreshBody()
      } else {
        // Plataforma flutuante — superfície visível da oval fica ~25% abaixo do topo da imagem
        const visualH = Math.min(Math.round(w * 0.55), 60)
        const surfaceOffset = Math.round(visualH * 0.25)  // desloca hitbox para alinhar com a borda da oval
        const block = this.platforms.create(x + w / 2, y + surfaceOffset + h / 2, 'platform_tile') as Phaser.Physics.Arcade.Sprite
        block.setDisplaySize(w, h).setAlpha(0).refreshBody()
        this.add.image(x + w / 2, y + visualH / 2, 'platform_tile')
          .setDisplaySize(w, visualH).setDepth(2)
      }
    })

    // ── Marcadores de buracos no chão ─────────────────────────────────
    const gndY = 418 - Y_SHIFT   // = 285
    const groundIntervals = shifted
      .filter(([, y, , h]) => y + Y_SHIFT + h >= vh - 10)
      .map(([x, , w]) => [x, x + w] as [number, number])
      .sort((a, b) => a[0] - b[0])

    // Buracos — hole.png alinhado com a superfície visual do landscape2
    // (desloca 20px para baixo para casar com a borda visível do terreno)
    const holeTopY = gndY + 20
    const holeH    = vh - holeTopY
    for (let i = 0; i < groundIntervals.length - 1; i++) {
      const gapStart = groundIntervals[i][1]
      const gapEnd   = groundIntervals[i + 1][0]
      const gapW     = gapEnd - gapStart
      if (gapW < 20) continue
      this.add.image(gapStart + gapW / 2, holeTopY + holeH / 2, 'hole')
        .setDisplaySize(gapW, holeH).setDepth(-5)
    }
  }

  private spawnGoal(layout: typeof PHASE_LAYOUTS[0]) {
    const { x } = layout.goal
    const y      = layout.goal.y - Y_SHIFT
    const height = this.game.canvas.height

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
    this.player = new Player(this, layout.playerStart.x, layout.playerStart.y - Y_SHIFT)
  }

  private spawnEnemies(layout: typeof PHASE_LAYOUTS[0]) {
    const safeZoneEnd = layout.playerStart.x + 220  // inimigos não nascem perto do jogador
    layout.enemies.forEach(e => {
      if (e.x < safeZoneEnd) return

      // Usa o y explícito da plataforma (y original, antes do shift)
      const spawnY = (e.y - Y_SHIFT) - 32

      const enemy = new Enemy(this, e.x, spawnY, e.patrol[0], e.patrol[1], this.world.enemy.speed)
      this.enemies.push(enemy)
    })
  }

  private spawnCollectibles(layout: typeof PHASE_LAYOUTS[0]) {
    layout.collectibles.forEach(c => {
      this.collectibles.push(new Collectible(this, c.x, c.y - Y_SHIFT, c.type as 'point' | 'life'))
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
