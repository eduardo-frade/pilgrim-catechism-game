import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const width  = this.cameras.main.width
    const height = this.cameras.main.height
    this.cameras.main.setBackgroundColor('#1a0a2e')

    this.add.text(width / 2, height / 2 - 80, 'O Peregrino do Catecismo', {
      fontSize: '28px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 40, 'Carregando...', {
      fontSize: '16px', color: '#fff8e1', fontFamily: 'Arial'
    }).setOrigin(0.5)

    const barBg   = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333).setOrigin(0.5)
    const barFill = this.add.rectangle(width / 2 - 200, height / 2, 4, 18, 0xf5c842).setOrigin(0, 0.5)
    const pctText = this.add.text(width / 2, height / 2 + 30, '0%', {
      fontSize: '14px', color: '#f5c842', fontFamily: 'Arial'
    }).setOrigin(0.5)

    void barBg  // usado só para layout visual

    this.load.on('progress', (v: number) => {
      barFill.width = 400 * v
      pctText.setText(Math.floor(v * 100) + '%')
    })
  }

  create() {
    // Gera todas as texturas placeholder no create (canvas já pronto)
    this.generateTextures()
    this.scene.start('MenuScene')
  }

  private generateTextures() {
    // ── Personagem chibi peregrino ────────────────────────────────────
    this.makeTexture('player',      32, 48, 0xd4a055)
    this.makeTexture('player_walk1',32, 48, 0xc8943f)
    this.makeTexture('player_walk2',32, 48, 0xdaaa60)

    // ── Inimigo "Confusão" ────────────────────────────────────────────
    this.makeEnemyTexture()

    // ── Coletáveis ────────────────────────────────────────────────────
    this.makeFragmentTexture()   // Fragmento de Luz (dourado)
    this.makeHeartTexture()      // Coração (vida)
    this.makeTexture('projectile', 10, 10, 0xfff176)
  }

  // ── Textura retangular simples ─────────────────────────────────────
  private makeTexture(key: string, w: number, h: number, color: number) {
    if (this.textures.exists(key)) return
    const g = this.add.graphics()
    g.fillStyle(color, 1)
    g.fillRoundedRect(0, 0, w, h, 4)
    g.lineStyle(2, 0x00000044, 1)
    g.strokeRoundedRect(0, 0, w, h, 4)
    g.generateTexture(key, w, h)
    g.destroy()
  }

  // ── Inimigo roxo com cara de "confusão" ───────────────────────────
  private makeEnemyTexture() {
    if (this.textures.exists('enemy')) return
    const g = this.add.graphics()
    g.fillStyle(0x9b59b6, 1)
    g.fillRoundedRect(2, 2, 32, 32, 6)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(10, 13, 4)
    g.fillCircle(24, 13, 4)
    g.fillStyle(0x333333, 1)
    g.fillCircle(10, 14, 2)
    g.fillCircle(24, 14, 2)
    // boca zigue-zague de confusão
    g.lineStyle(2, 0xffffff, 1)
    g.beginPath()
    g.moveTo(8, 24); g.lineTo(14, 20); g.lineTo(20, 24); g.lineTo(26, 20)
    g.strokePath()
    g.generateTexture('enemy', 36, 36)
    g.destroy()
  }

  // ── Fragmento de Luz (losango dourado brilhante) ───────────────────
  private makeFragmentTexture() {
    if (this.textures.exists('fragment')) return
    const g = this.add.graphics()
    g.fillStyle(0xffe066, 1)
    g.fillTriangle(8, 0, 16, 8, 8, 16)
    g.fillTriangle(8, 0, 0, 8, 8, 16)
    g.lineStyle(1, 0xffa500, 1)
    g.strokeTriangle(8, 0, 16, 8, 8, 16)
    g.strokeTriangle(8, 0, 0, 8, 8, 16)
    // brilho central
    g.fillStyle(0xffffff, 0.7)
    g.fillCircle(8, 8, 2)
    g.generateTexture('fragment', 16, 16)
    g.destroy()
  }

  // ── Coração (vida no mapa) ─────────────────────────────────────────
  private makeHeartTexture() {
    if (this.textures.exists('life_item')) return
    const g = this.add.graphics()
    // Coração feito de dois círculos + triângulo
    g.fillStyle(0xff4d6d, 1)
    g.fillCircle(6, 6, 6)
    g.fillCircle(14, 6, 6)
    g.fillTriangle(0, 8, 20, 8, 10, 20)
    g.fillStyle(0xff8fa3, 0.6)
    g.fillCircle(5, 5, 2)
    g.generateTexture('life_item', 20, 20)
    g.destroy()
  }
}
