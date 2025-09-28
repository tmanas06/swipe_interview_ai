import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setShowWelcomeBackModal, setActiveTab } from '../store/slices/uiSlice'
import { resumeInterview } from '../store/slices/interviewSlice'
import { Clock, Play, User } from 'lucide-react'

const WelcomeBackModal: React.FC = () => {
  const dispatch = useDispatch()
  const { showWelcomeBackModal } = useSelector((state: RootState) => state.ui)
  const { currentInterview } = useSelector((state: RootState) => state.interviews)
  const { currentCandidate } = useSelector((state: RootState) => state.candidates)

  const handleResume = () => {
    if (currentInterview) {
      dispatch(resumeInterview())
      dispatch(setActiveTab('interviewee'))
    }
    dispatch(setShowWelcomeBackModal(false))
  }

  const handleStartFresh = () => {
    dispatch(setShowWelcomeBackModal(false))
    // Reset interview state if needed
  }

  if (!showWelcomeBackModal || !currentInterview || !currentCandidate) {
    return null
  }

  const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex]
  const progressPercentage = ((currentInterview.currentQuestionIndex + 1) / currentInterview.questions.length) * 100

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            background: '#f0f8ff',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#1890ff'
          }}>
            <User size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>Welcome Back!</h2>
          <p style={{ margin: 0, color: '#666' }}>
            You have an unfinished interview session.
          </p>
        </div>

        {/* Candidate Info */}
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Candidate: {currentCandidate.name}</h3>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#666' }}>
            Email: {currentCandidate.email}
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Phone: {currentCandidate.phone}
          </p>
        </div>

        {/* Interview Progress */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Interview Progress</span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {currentInterview.currentQuestionIndex + 1} of {currentInterview.questions.length} questions
            </span>
          </div>
          
          <div style={{
            background: '#e9ecef',
            borderRadius: '4px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#1890ff',
              height: '100%',
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Current Question Preview */}
        {currentQuestion && (
          <div style={{
            background: '#f0f8ff',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #d6e4ff'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1890ff' }}>
              Current Question ({currentQuestion.difficulty.toUpperCase()})
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: '14px',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {currentQuestion.text}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleResume}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#40a9ff'}
            onMouseOut={(e) => e.currentTarget.style.background = '#1890ff'}
          >
            <Play size={16} />
            Resume Interview
          </button>
          
          <button
            onClick={handleStartFresh}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: 'transparent',
              color: '#666',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
              e.currentTarget.style.borderColor = '#bfbfbf'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = '#d9d9d9'
            }}
          >
            Start Fresh
          </button>
        </div>

        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center',
          fontSize: '12px',
          color: '#8c8c8c'
        }}>
          <Clock size={12} style={{ marginRight: '4px' }} />
          Your progress is automatically saved
        </div>
      </div>
    </div>
  )
}

export default WelcomeBackModal
