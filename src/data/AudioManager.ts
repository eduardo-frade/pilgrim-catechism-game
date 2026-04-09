/**
 * AudioManager — gerencia narração do jogo.
 *
 * Funciona em dois modos:
 *  1. Com arquivos MP3 (ElevenLabs): carregados via Phaser, alta qualidade
 *  2. Fallback: Web Speech API do browser (robótico, mas funciona sem arquivos)
 *
 * Para ativar o modo MP3, coloque os arquivos em assets/audio/ com os nomes
 * definidos em AUDIO_KEYS e chame AudioManager.init(scene) no BootScene.
 */

export const AUDIO_KEYS: Record<string, string> = {
  quiz_intro:     'narr_01',
  correct:        'narr_02',
  wrong_1:        'narr_03',
  wrong_2:        'narr_04',
  wrong_3:        'narr_05',
  phase_complete: 'narr_06',
  game_over:      'narr_07',
  extra_life:     'narr_08',
  q1_text:        'narr_09',
  q1_answer:      'narr_10',
  q2_text:        'narr_11',
  q2_answer:      'narr_12',
  q3_text:        'narr_13',
  q3_answer:      'narr_14',
  q4_text:        'narr_15',
  q4_answer:      'narr_16',
  q5_text:        'narr_17',
  q5_answer:      'narr_18',
  q6_text:        'narr_19',
  q6_answer:      'narr_20',
  q7_text:        'narr_21',
  q7_answer:      'narr_22',
  q8_text:        'narr_23',
  q8_answer:      'narr_24',
}

// Textos de fallback (Web Speech API)
const FALLBACK_TEXTS: Record<string, string> = {
  quiz_intro:     'Atenção, peregrino! Responda a pergunta para continuar sua jornada.',
  correct:        'Muito bem! Você acertou! Continue sua jornada!',
  wrong_1:        'Hmm, não foi dessa vez. Pense bem e tente de novo!',
  wrong_2:        'Quase! Leia a pergunta com atenção e tente de novo!',
  wrong_3:        'Não desanime! Tente mais uma vez!',
  phase_complete: 'Parabéns! Você completou a fase!',
  game_over:      'Não desista, peregrino! Tente de novo!',
  extra_life:     'Incrível! Você ganhou uma vida extra!',
}

let _scene: Phaser.Scene | null = null
let _useMP3 = true

export class AudioManager {
  /** Chamar no BootScene após carregar os assets */
  static init(scene: Phaser.Scene, hasMP3Files = true) {
    _scene   = scene
    _useMP3  = hasMP3Files
  }

  static play(key: string) {
    if (_useMP3 && _scene) {
      try {
        _scene.sound.stopAll()
        _scene.sound.play(AUDIO_KEYS[key] ?? key)
        return
      } catch { /* cai no fallback */ }
    }
    // Fallback: Web Speech API
    AudioManager.speak(FALLBACK_TEXTS[key] ?? '')
  }

  /** Narração de texto livre via Web Speech API */
  static speak(text: string) {
    if (!text || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang  = 'pt-BR'
    utt.rate  = 0.92
    utt.pitch = 1.05
    // Tenta usar uma voz feminina (mais natural que a padrão)
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v =>
      v.lang.startsWith('pt') && (v.name.includes('female') || v.name.toLowerCase().includes('francisca') || v.name.toLowerCase().includes('luciana'))
    )
    if (ptVoice) utt.voice = ptVoice
    window.speechSynthesis.speak(utt)
  }

  static stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    _scene?.sound.stopAll()
  }

  /** Registra os arquivos MP3 no Phaser loader (chamar no preload do BootScene) */
  static preloadAudio(scene: Phaser.Scene) {
    Object.entries(AUDIO_KEYS).forEach(([, key]) => {
      scene.load.audio(key, `assets/audio/narr_audios/${key}.mp3`)
    })
  }
}
