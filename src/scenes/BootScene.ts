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

    // ── Sprites do personagem ─────────────────────────────────────────
    this.load.image('stop',           'assets/sprites/stop.png')
    this.load.image('walk_1',         'assets/sprites/walk_1.png')
    this.load.image('walk_2',         'assets/sprites/walk_2.png')
    this.load.image('jump',           'assets/sprites/jump.png')
    this.load.image('down',           'assets/sprites/down.png')
    this.load.image('power',          'assets/sprites/power.png')
    this.load.image('hurt',           'assets/sprites/hurt.png')
    // ── Inimigo ───────────────────────────────────────────────────────
    this.load.image('enemy',          'assets/sprites/enemy.png')
    // ── Coletáveis ────────────────────────────────────────────────────
    this.load.image('heart',          'assets/sprites/heart.png')
    this.load.image('light',          'assets/sprites/light.png')
    this.load.image('throwing_light', 'assets/sprites/throwing_light.png')
    // ── Cenário ───────────────────────────────────────────────────────
    this.load.image('landscape',      'assets/sprites/landscape.png')
    this.load.image('landscape2',     'assets/sprites/landscape2.png')  // fundo maior (opcional)
    this.load.image('platform_tile',  'assets/sprites/platform.png')
    this.load.image('hole',           'assets/sprites/hole.png')         // marcador de buraco (opcional)
    this.load.image('main_title',          'assets/sprites/main_title.png')
    this.load.image('question_bg',         'assets/sprites/question.png')
    this.load.image('tela_inicial',        'assets/sprites/tela_inicial.png')        // tela de menu (opcional)
    this.load.image('botao_iniciar',       'assets/sprites/botao_iniciar_jornada.png') // botão (opcional)
    // ── Áudio ────────────────────────────────────────────────────────
    AudioManager.preloadAudio(this)
  }

  create() {
    AudioManager.init(this)
    this.scene.start('MenuScene')
  }
}
