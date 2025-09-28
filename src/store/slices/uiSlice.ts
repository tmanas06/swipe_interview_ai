import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  activeTab: 'interviewee' | 'interviewer'
  showWelcomeBackModal: boolean
  showResumeUpload: boolean
  showProfileForm: boolean
  isLoading: boolean
  error: string | null
  darkMode: boolean
}

const initialState: UIState = {
  activeTab: 'interviewee',
  showWelcomeBackModal: false,
  showResumeUpload: true,
  showProfileForm: false,
  isLoading: false,
  error: null,
  darkMode: true
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload
    },
    setShowWelcomeBackModal: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBackModal = action.payload
    },
    setShowResumeUpload: (state, action: PayloadAction<boolean>) => {
      state.showResumeUpload = action.payload
    },
    setShowProfileForm: (state, action: PayloadAction<boolean>) => {
      state.showProfileForm = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    }
  }
})

export const {
  setActiveTab,
  setShowWelcomeBackModal,
  setShowResumeUpload,
  setShowProfileForm,
  setLoading,
  setError,
  toggleDarkMode
} = uiSlice.actions
export default uiSlice.reducer
