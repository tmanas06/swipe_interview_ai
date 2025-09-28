import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setShowResumeUpload, setShowProfileForm, setLoading, setError } from '../store/slices/uiSlice'
import { addCandidate, completeProfile, resetCurrentCandidate } from '../store/slices/candidateSlice'
import { startInterview, answerQuestion, nextQuestion, completeInterview } from '../store/slices/interviewSlice'
import ResumeUpload from './ResumeUpload'
import ProfileForm from './ProfileForm'
import ChatInterface from './ChatInterface'
import aiService from '../services/aiService'

const IntervieweeTab: React.FC = () => {
  const dispatch = useDispatch()
  const { showResumeUpload, showProfileForm, isLoading, error } = useSelector((state: RootState) => state.ui)
  const { currentCandidate } = useSelector((state: RootState) => state.candidates)
  const { currentInterview } = useSelector((state: RootState) => state.interviews)

  const [interviewStarted, setInterviewStarted] = useState(false)

  useEffect(() => {
    // Only start interview if:
    // 1. There's a current candidate
    // 2. Profile is complete (name, email, phone)
    // 3. Resume has been uploaded (has resumeText)
    // 4. Interview hasn't started yet
    if (currentCandidate?.profileComplete && 
        currentCandidate?.resumeText && 
        !interviewStarted) {
      startInterviewProcess()
    }
  }, [currentCandidate?.profileComplete, currentCandidate?.resumeText])

  const handleResumeUploaded = async (resumeData: any) => {
    dispatch(setLoading(true))
    try {
      const candidate = {
        id: `candidate_${Date.now()}`,
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        resumeText: resumeData.text,
        profileComplete: resumeData.name && resumeData.email && resumeData.phone,
        interviewComplete: false,
        createdAt: new Date().toISOString()
      }

      dispatch(addCandidate(candidate))
      dispatch(setShowResumeUpload(false))

      if (!candidate.profileComplete) {
        dispatch(setShowProfileForm(true))
      }
    } catch (error) {
      dispatch(setError('Failed to process resume. Please try again.'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleProfileComplete = (profileData: { name: string; email: string; phone: string }) => {
    if (currentCandidate) {
      dispatch(completeProfile({ id: currentCandidate.id, ...profileData }))
      dispatch(setShowProfileForm(false))
    }
  }

  const startInterviewProcess = async () => {
    if (!currentCandidate) return

    dispatch(setLoading(true))
    try {
      const questions = await aiService.generateQuestions()
      const interviewQuestions = questions.map((q, index) => ({
        id: `q_${index + 1}`,
        text: q.text,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }))

      dispatch(startInterview({
        candidateId: currentCandidate.id,
        questions: interviewQuestions
      }))
      setInterviewStarted(true)
    } catch (error) {
      dispatch(setError('Failed to start interview. Please try again.'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleAnswerSubmit = async (answer: string) => {
    if (!currentInterview) return

    const currentQuestion = currentInterview.questions[currentInterview.currentQuestionIndex]
    if (!currentQuestion) return

    console.log('Submitting answer:', answer)
    console.log('Current question:', currentQuestion.text)
    
    dispatch(setLoading(true))
    try {
      // Score the answer
      console.log('Calling AI service to score answer...')
      const scoreResult = await aiService.scoreAnswer(
        currentQuestion.text,
        answer,
        currentQuestion.difficulty
      )

      console.log('Score result:', scoreResult)

      dispatch(answerQuestion({
        questionId: currentQuestion.id,
        answer,
        score: scoreResult.score,
        feedback: scoreResult.feedback
      }))

      // Move to next question or complete interview
      if (currentInterview.currentQuestionIndex < currentInterview.questions.length - 1) {
        console.log('Moving to next question')
        dispatch(nextQuestion())
      } else {
        // Complete interview
        console.log('Completing interview...')
        const totalScore = currentInterview.questions.reduce((sum, q) => sum + (q.score || 0), 0)
        console.log('Total score calculated:', totalScore)
        
        const summary = await aiService.generateSummary(
          currentInterview.questions.map(q => ({
            text: q.text,
            answer: q.answer || '',
            score: q.score || 0
          })),
          totalScore
        )

        console.log('Summary generated:', summary)

        dispatch(completeInterview({ totalScore, summary }))
        setInterviewStarted(false)
      }
    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error)
      dispatch(setError('Failed to process answer. Please try again.'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ color: '#ff4d4f' }}>Error</h3>
        <p>{error}</p>
        <button onClick={() => dispatch(setError(null))}>Try Again</button>
      </div>
    )
  }

  // Show API key notice if using fallback
  const showApiNotice = !import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'AIzaSyB5GW2ko7PVYaFIBzDYwHUB5mWHBfHB-NI'

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (showResumeUpload) {
    return <ResumeUpload onUploaded={handleResumeUploaded} />
  }

  if (showProfileForm) {
    return <ProfileForm onSubmit={handleProfileComplete} />
  }

  if (interviewStarted && currentInterview) {
    return (
      <div>
        {showApiNotice && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#856404',
            fontSize: '14px'
          }}>
            <strong>Note:</strong> Using fallback AI scoring system. For enhanced AI feedback, please configure a valid Gemini API key in your .env file.
          </div>
        )}
        <ChatInterface interview={currentInterview} onAnswerSubmit={handleAnswerSubmit} />
      </div>
    )
  }

  // If no current candidate or no resume, show upload screen
  if (!currentCandidate || !currentCandidate.resumeText) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Welcome to the AI Interview Assistant</h2>
        <p>Please upload your resume to get started.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => dispatch(setShowResumeUpload(true))}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Upload Resume
          </button>
          {currentCandidate && (
            <button 
              onClick={() => {
                dispatch(resetCurrentCandidate())
                dispatch(setShowResumeUpload(true))
              }}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Start Fresh
            </button>
          )}
        </div>
      </div>
    )
  }

  // If candidate exists but profile is not complete, show profile form
  if (!currentCandidate.profileComplete) {
    return <ProfileForm onSubmit={handleProfileComplete} />
  }

  // If everything is ready but interview hasn't started, show ready message
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Ready to Start Your Interview!</h2>
      <p>Your profile is complete. The interview will begin shortly...</p>
      <div style={{ marginTop: '20px' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
      </div>
    </div>
  )
}

export default IntervieweeTab
