import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setActiveTab, setShowWelcomeBackModal } from '../store/slices/uiSlice'
import IntervieweeTab from './IntervieweeTab'
import InterviewerTab from './InterviewerTab'

const AppContent: React.FC = () => {
  const dispatch = useDispatch()
  const { activeTab } = useSelector((state: RootState) => state.ui)
  const { currentInterview } = useSelector((state: RootState) => state.interviews)

  useEffect(() => {
    // Check for unfinished interview on app load
    if (currentInterview && currentInterview.isActive && currentInterview.isPaused) {
      dispatch(setShowWelcomeBackModal(true))
    }

    // Listen for tab changes from floating navbar
    const handleTabChange = (event: CustomEvent) => {
      dispatch(setActiveTab(event.detail))
    }

    window.addEventListener('tabChange', handleTabChange as EventListener)
    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener)
    }
  }, [currentInterview, dispatch])


  return (
    <div className="app-container">
      <div className="tab-container">
        <div className="tab-content">
          {activeTab === 'interviewee' ? <IntervieweeTab /> : <InterviewerTab />}
        </div>
      </div>
    </div>
  )
}

export default AppContent
