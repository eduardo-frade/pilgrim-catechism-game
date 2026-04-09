import Phaser from 'phaser'
import { AudioManager } from '../data/AudioManager'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  preload() {
    const { width, height } = this.cameras.main
    this.cameras.main.setBackgroundColor('#1a0a2e')

    this.add.text(width / 2, height / 2 - 80, 'O Peregrino do Catecismo', {
      fontSize: '28px', color: '#f5c842', fontStyle: 'bold', fontFamily: 'Arial'
    }).setOrigin(0.5)

    const barBg   = this.add.rectangle(width / 2, height / 2, 400, 20, 0x333333).setOrigin(0.5)
    const barFill = this.add.rectangle(width / 2 - 200, height / 2, 4, 18, 0xf5c842).setOrigin(0, 0.5)
    const pct     = this.add.text(width / 2, height / 2 + 30, 'Carregando...', {
      fontSize: '14px', color: '#fff8e1', fontFamily: 'Arial'
    }).setOrigin(0.5)
    void barBg
    this.load.on('progress', (v: number) => { barFill.width = 400 * v; pct.setText(Math.floor(v * 100) + '%') })

    // Carrega os arquivos MP3 do ElevenLabs
    AudioManager.preloadAudio(this)
  }

  create() {
    this.makePlayerTexture()
    this.makePlayerWalkTexture()
    this.makeEnemyTexture()
    this.makeFragmentTexture()
    this.makeHeartTexture()
    this.makeProjectileTexture()
    AudioManager.init(this)
    this.scene.start('MenuScene')
  }

  // ─── Peregrino chibi (fiel ao concept art) ─────────────────────────────────
  // 32×48 px — túnica bege, cabelo castanho escuro, cajado, mochila
  private makePlayerTexture() {
    if (this.textures.exists('player')) return
    const g = this.add.graphics()
    const x = 16, y = 46   // ponto de referência (rodapé do sprite)

    // Sombra
    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(x, y - 1, 22, 5)

    // Cajado (atrás do corpo)
    g.fillStyle(0x7a4f2a, 1)
    g.fillRect(x + 10, y - 44, 3, 44)

    // Mochila
    g.fillStyle(0x8b5e3c, 1)
    g.fillRoundedRect(x - 14, y - 32, 8, 15, 2)
    g.fillStyle(0x6b4424, 1)
    g.fillRect(x - 13, y - 28, 6, 2)

    // Túnica (beige dourado)
    g.fillStyle(0xd4a855, 1)
    g.fillRoundedRect(x - 10, y - 34, 20, 34, 4)

    // Cinto
    g.fillStyle(0xb08030, 1)
    g.fillRect(x - 10, y - 18, 20, 2)

    // Pernas / sandálias
    g.fillStyle(0xc09040, 1)
    g.fillRect(x - 7, y - 8, 5, 9)
    g.fillRect(x + 2, y - 8, 5, 9)
    g.fillStyle(0x7a4a24, 1)
    g.fillRect(x - 9, y - 1, 8, 3)
    g.fillRect(x + 1, y - 1, 8, 3)

    // Capuz/gola
    g.fillStyle(0xc49040, 1)
    g.fillRoundedRect(x - 9, y - 38, 18, 8, 3)

    // Cabeça (redonda, grande — chibi)
    g.fillStyle(0xf0c088, 1)
    g.fillCircle(x, y - 44, 12)

    // Cabelo castanho escuro
    g.fillStyle(0x3a1f08, 1)
    g.fillEllipse(x, y - 51, 22, 12)
    g.fillRect(x - 12, y - 54, 8, 12)

    // Olhos grandes chibi
    g.fillStyle(0x111111, 1)
    g.fillCircle(x - 4, y - 44, 2.8)
    g.fillCircle(x + 4, y - 44, 2.8)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(x - 3, y - 45, 1)
    g.fillCircle(x + 5, y - 45, 1)

    // Bochechas
    g.fillStyle(0xffaaaa, 0.5)
    g.fillCircle(x - 8, y - 41, 3)
    g.fillCircle(x + 8, y - 41, 3)

    // Sorriso
    g.lineStyle(1.5, 0x8b4513, 1)
    g.beginPath(); g.arc(x, y - 39, 4, 0.1, Math.PI - 0.1, false); g.strokePath()

    g.generateTexture('player', 32, 48)
    g.destroy()
  }

  // Frame alternado para animação de caminhada
  private makePlayerWalkTexture() {
    if (this.textures.exists('player_walk')) return
    const g = this.add.graphics()
    const x = 16, y = 46

    // Cajado
    g.fillStyle(0x7a4f2a, 1); g.fillRect(x + 10, y - 44, 3, 44)
    // Mochila
    g.fillStyle(0x8b5e3c, 1); g.fillRoundedRect(x - 14, y - 32, 8, 15, 2)
    // Túnica
    g.fillStyle(0xd09545, 1); g.fillRoundedRect(x - 10, y - 34, 20, 34, 4)
    // Cinto
    g.fillStyle(0xb08030, 1); g.fillRect(x - 10, y - 18, 20, 2)
    // Pernas abertas (frame de caminhada)
    g.fillStyle(0xc09040, 1)
    g.fillRect(x - 8, y - 8, 5, 9)
    g.fillRect(x + 3, y - 8, 5, 9)
    g.fillStyle(0x7a4a24, 1)
    g.fillRect(x - 10, y - 1, 8, 3)
    g.fillRect(x + 3, y - 1, 8, 3)
    // Capuz
    g.fillStyle(0xc49040, 1); g.fillRoundedRect(x - 9, y - 38, 18, 8, 3)
    // Cabeça
    g.fillStyle(0xf0c088, 1); g.fillCircle(x, y - 44, 12)
    // Cabelo
    g.fillStyle(0x3a1f08, 1); g.fillEllipse(x, y - 51, 22, 12); g.fillRect(x - 12, y - 54, 8, 12)
    // Olhos
    g.fillStyle(0x111111, 1); g.fillCircle(x - 4, y - 44, 2.8); g.fillCircle(x + 4, y - 44, 2.8)
    g.fillStyle(0xffffff, 1); g.fillCircle(x - 3, y - 45, 1); g.fillCircle(x + 5, y - 45, 1)
    g.fillStyle(0xffaaaa, 0.5); g.fillCircle(x - 8, y - 41, 3); g.fillCircle(x + 8, y - 41, 3)
    g.lineStyle(1.5, 0x8b4513, 1)
    g.beginPath(); g.arc(x, y - 39, 4, 0.1, Math.PI - 0.1, false); g.strokePath()

    g.generateTexture('player_walk', 32, 48)
    g.destroy()
  }

  // ─── Inimigo "Confusão" — nuvem roxa com olhos loucos ─────────────────────
  private makeEnemyTexture() {
    if (this.textures.exists('enemy')) return
    const g = this.add.graphics()

    // Corpo nuvem
    g.fillStyle(0x9b59b6, 1)
    g.fillCircle(18, 20, 14)
    g.fillCircle(10, 24, 10)
    g.fillCircle(26, 24, 10)
    g.fillStyle(0x8e44ad, 1)
    g.fillCircle(18, 28, 12)

    // Olhos loucos
    g.fillStyle(0xffffff, 1)
    g.fillCircle(12, 19, 5); g.fillCircle(24, 19, 5)
    g.fillStyle(0xe74c3c, 1)
    g.fillCircle(13, 20, 3); g.fillCircle(25, 20, 3)
    g.fillStyle(0x111111, 1)
    g.fillCircle(14, 21, 1.5); g.fillCircle(26, 21, 1.5)

    // Linhas de confusão (espirais)
    g.lineStyle(1.5, 0xf39c12, 0.8)
    g.beginPath(); g.moveTo(6, 10); g.lineTo(10, 14); g.strokePath()
    g.beginPath(); g.moveTo(30, 10); g.lineTo(26, 14); g.strokePath()

    // Boca torta
    g.lineStyle(2, 0xffffff, 0.9)
    g.beginPath(); g.moveTo(11, 30); g.lineTo(14, 28); g.lineTo(18, 31); g.lineTo(22, 28); g.lineTo(25, 30); g.strokePath()

    g.generateTexture('enemy', 36, 36)
    g.destroy()
  }

  // ─── Fragmento de Luz — losango dourado brilhante ─────────────────────────
  private makeFragmentTexture() {
    if (this.textures.exists('fragment')) return
    const g = this.add.graphics()
    // Brilho externo
    g.fillStyle(0xffd700, 0.3); g.fillCircle(8, 8, 10)
    // Losango principal
    g.fillStyle(0xffe066, 1)
    g.fillTriangle(8, 0, 16, 8, 8, 16)
    g.fillTriangle(8, 0, 0, 8, 8, 16)
    // Losango interno claro
    g.fillStyle(0xfff8a0, 1)
    g.fillTriangle(8, 3, 13, 8, 8, 13)
    g.fillTriangle(8, 3, 3, 8, 8, 13)
    // Centro brilhante
    g.fillStyle(0xffffff, 0.9); g.fillCircle(8, 8, 2)
    g.generateTexture('fragment', 16, 16)
    g.destroy()
  }

  // ─── Coração no mapa ───────────────────────────────────────────────────────
  private makeHeartTexture() {
    if (this.textures.exists('life_item')) return
    const g = this.add.graphics()
    // Sombra
    g.fillStyle(0x000000, 0.15); g.fillEllipse(10, 22, 16, 5)
    // Coração
    g.fillStyle(0xff4d6d, 1)
    g.fillCircle(6, 7, 6); g.fillCircle(14, 7, 6)
    g.fillTriangle(1, 9, 19, 9, 10, 22)
    // Brilho
    g.fillStyle(0xff8fa3, 0.7); g.fillCircle(5, 5, 2.5)
    g.generateTexture('life_item', 20, 24)
    g.destroy()
  }

  // ─── Projétil — esfera de luz ──────────────────────────────────────────────
  private makeProjectileTexture() {
    if (this.textures.exists('projectile')) return
    const g = this.add.graphics()
    g.fillStyle(0xffd700, 0.3); g.fillCircle(7, 7, 7)
    g.fillStyle(0xfff176, 1);   g.fillCircle(7, 7, 5)
    g.fillStyle(0xffffff, 0.8); g.fillCircle(5, 5, 2)
    g.generateTexture('projectile', 14, 14)
    g.destroy()
  }
}
