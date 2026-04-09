export interface GameSave {
  currentPhase: number
  totalScore: number
  answeredQuestions: number[]
  worldId: number
}

const SAVE_KEY = 'pilgrim_catechism_save'

const defaultSave: GameSave = {
  currentPhase: 1,
  totalScore: 0,
  answeredQuestions: [],
  worldId: 1
}

export class StorageManager {
  static load(): GameSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return { ...defaultSave }
      return { ...defaultSave, ...JSON.parse(raw) }
    } catch {
      return { ...defaultSave }
    }
  }

  static save(data: Partial<GameSave>) {
    try {
      const current = this.load()
      const updated = { ...current, ...data }
      localStorage.setItem(SAVE_KEY, JSON.stringify(updated))
    } catch {
      console.warn('Could not save game state')
    }
  }

  static reset() {
    localStorage.removeItem(SAVE_KEY)
  }

  static markQuestionAnswered(questionNumber: number) {
    const save = this.load()
    if (!save.answeredQuestions.includes(questionNumber)) {
      save.answeredQuestions.push(questionNumber)
      this.save(save)
    }
  }
}
