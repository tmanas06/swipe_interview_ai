import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  resumeFile?: File
  resumeText?: string
  profileComplete: boolean
  interviewComplete: boolean
  finalScore?: number
  summary?: string
  createdAt: string
}

interface CandidateState {
  candidates: Candidate[]
  currentCandidate: Candidate | null
}

const initialState: CandidateState = {
  candidates: [],
  currentCandidate: null
}

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload)
      state.currentCandidate = action.payload
    },
    updateCandidate: (state, action: PayloadAction<Partial<Candidate> & { id: string }>) => {
      const index = state.candidates.findIndex(c => c.id === action.payload.id)
      if (index !== -1) {
        state.candidates[index] = { ...state.candidates[index], ...action.payload }
      }
      if (state.currentCandidate?.id === action.payload.id) {
        state.currentCandidate = { ...state.currentCandidate, ...action.payload }
      }
    },
    setCurrentCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.currentCandidate = action.payload
    },
    completeProfile: (state, action: PayloadAction<{ id: string; name: string; email: string; phone: string }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id)
      if (candidate) {
        candidate.name = action.payload.name
        candidate.email = action.payload.email
        candidate.phone = action.payload.phone
        candidate.profileComplete = true
      }
      if (state.currentCandidate?.id === action.payload.id) {
        state.currentCandidate.name = action.payload.name
        state.currentCandidate.email = action.payload.email
        state.currentCandidate.phone = action.payload.phone
        state.currentCandidate.profileComplete = true
      }
    },
    resetCurrentCandidate: (state) => {
      state.currentCandidate = null
    }
  }
})

export const { addCandidate, updateCandidate, setCurrentCandidate, completeProfile, resetCurrentCandidate } = candidateSlice.actions
export default candidateSlice.reducer
