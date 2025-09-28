import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Question {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
  answer?: string
  score?: number
  feedback?: string
  answeredAt?: string
}

export interface Interview {
  id: string
  candidateId: string
  questions: Question[]
  currentQuestionIndex: number
  isActive: boolean
  isPaused: boolean
  startTime?: string
  endTime?: string
  totalScore?: number
  summary?: string
}

interface InterviewState {
  interviews: Interview[]
  currentInterview: Interview | null
}

const initialState: InterviewState = {
  interviews: [],
  currentInterview: null
}

const interviewSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<{ candidateId: string; questions: Question[] }>) => {
      const newInterview: Interview = {
        id: `interview_${Date.now()}`,
        candidateId: action.payload.candidateId,
        questions: action.payload.questions,
        currentQuestionIndex: 0,
        isActive: true,
        isPaused: false,
        startTime: new Date().toISOString()
      }
      state.interviews.push(newInterview)
      state.currentInterview = newInterview
    },
    answerQuestion: (state, action: PayloadAction<{ questionId: string; answer: string; score?: number; feedback?: string }>) => {
      if (state.currentInterview) {
        const question = state.currentInterview.questions.find(q => q.id === action.payload.questionId)
        if (question) {
          question.answer = action.payload.answer
          question.score = action.payload.score
          question.feedback = action.payload.feedback
          question.answeredAt = new Date().toISOString()
        }
      }
    },
    nextQuestion: (state) => {
      if (state.currentInterview) {
        state.currentInterview.currentQuestionIndex += 1
      }
    },
    pauseInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.isPaused = true
      }
    },
    resumeInterview: (state) => {
      if (state.currentInterview) {
        state.currentInterview.isPaused = false
      }
    },
    completeInterview: (state, action: PayloadAction<{ totalScore: number; summary: string }>) => {
      if (state.currentInterview) {
        state.currentInterview.isActive = false
        state.currentInterview.endTime = new Date().toISOString()
        state.currentInterview.totalScore = action.payload.totalScore
        state.currentInterview.summary = action.payload.summary
      }
    },
    setCurrentInterview: (state, action: PayloadAction<Interview | null>) => {
      state.currentInterview = action.payload
    }
  }
})

export const {
  startInterview,
  answerQuestion,
  nextQuestion,
  pauseInterview,
  resumeInterview,
  completeInterview,
  setCurrentInterview
} = interviewSlice.actions
export default interviewSlice.reducer
