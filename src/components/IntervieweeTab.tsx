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
  const interviews = useSelector((state: RootState) => state.interviews.interviews)
  
  console.log('Redux state:', {
    currentInterview,
    interviewsCount: interviews.length,
    allInterviews: interviews
  })

  const [interviewStarted, setInterviewStarted] = useState(false)
  const [forceRender, setForceRender] = useState(0)

  useEffect(() => {
    console.log('useEffect triggered:', {
      hasCandidate: !!currentCandidate,
      profileComplete: currentCandidate?.profileComplete,
      hasResumeText: !!currentCandidate?.resumeText,
      interviewStarted,
      hasCurrentInterview: !!currentInterview,
      isInterviewActive: currentInterview?.isActive
    })
    
    // Only start interview if:
    // 1. There's a current candidate
    // 2. Profile is complete (name, email, phone)
    // 3. Resume has been uploaded (has resumeText)
    // 4. Interview hasn't started yet
    // 5. No current interview exists yet
    if (currentCandidate?.profileComplete && 
        currentCandidate?.resumeText && 
        !interviewStarted &&
        !currentInterview) {
      console.log('Starting interview process...')
      startInterviewProcess()
    }
  }, [currentCandidate?.profileComplete, currentCandidate?.resumeText, interviewStarted, currentInterview])

  // Separate useEffect to handle when interview is created in Redux
  useEffect(() => {
    if (currentInterview && currentInterview.isActive && !interviewStarted) {
      console.log('Interview created in Redux, updating local state')
      setInterviewStarted(true)
      setForceRender(prev => prev + 1) // Force re-render
    }
  }, [currentInterview, interviewStarted])

  const handleResumeUploaded = async (resumeData: any) => {
    console.log('Resume data received:', resumeData)
    console.log('Profile complete check:', {
      name: resumeData.name,
      email: resumeData.email,
      phone: resumeData.phone,
      allPresent: Boolean(resumeData.name && resumeData.email && resumeData.phone)
    })
    
    // Clear any existing candidate data to prevent cached issues
    dispatch(resetCurrentCandidate())
    
    dispatch(setLoading(true))
    try {
      const candidate = {
        id: `candidate_${Date.now()}`,
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        resumeText: resumeData.text,
        profileComplete: Boolean(resumeData.name && resumeData.email && resumeData.phone),
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
    console.log('startInterviewProcess called with candidate:', currentCandidate)
    if (!currentCandidate) {
      console.log('No current candidate, returning')
      return
    }

    dispatch(setLoading(true))
    try {
      console.log('Generating questions...')
      const questions = await aiService.generateQuestions()
      console.log('Generated questions:', questions)
      
      const interviewQuestions = questions.map((q, index) => ({
        id: `q_${index + 1}`,
        text: q.text,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }))

      console.log('Starting interview with questions:', interviewQuestions)
      dispatch(startInterview({
        candidateId: currentCandidate.id,
        questions: interviewQuestions
      }))
      
      // Debug: Check Redux state after dispatch
      setTimeout(() => {
        console.log('After dispatch - currentInterview:', currentInterview)
        console.log('After dispatch - isActive:', currentInterview?.isActive)
      }, 100)
      
      setInterviewStarted(true)
    } catch (error) {
      console.error('Error in startInterviewProcess:', error)
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
        // Calculate total score including the current question's score
        const currentQuestionScore = scoreResult.score || 0
        const totalScore = currentInterview.questions.reduce((sum, q) => {
          if (q.id === currentQuestion.id) {
            return sum + currentQuestionScore
          }
          return sum + (q.score || 0)
        }, 0)
        console.log('Total score calculated:', totalScore, 'Current question score:', currentQuestionScore)
        
        const summary = await aiService.generateSummary(
          currentInterview.questions.map(q => ({
            text: q.text,
            answer: q.id === currentQuestion.id ? answer : (q.answer || ''),
            score: q.id === currentQuestion.id ? currentQuestionScore : (q.score || 0)
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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
  const showApiNotice = !apiKey || 
    apiKey === 'AIzaSyB5GW2ko7PVYaFIBzDYwHUB5mWHBfHB-NI' || 
    apiKey.length <= 20

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Priority 1: Show resume upload modal if requested
  if (showResumeUpload) {
    return <ResumeUpload onUploaded={handleResumeUploaded} />
  }

  // Priority 2: Always show resume upload first if no candidate or no resume text
  if (!currentCandidate || !currentCandidate.resumeText) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Welcome to the AI Interview Assistant</h2>
        <p>Please upload your resume to get started.</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
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
        </div>
      </div>
    )
  }

  // Priority 3: Show profile form if requested
  if (showProfileForm) {
    return <ProfileForm onSubmit={handleProfileComplete} />
  }

  console.log('Render check:', {
    interviewStarted,
    hasCurrentInterview: !!currentInterview,
    currentInterview,
    isInterviewActive: currentInterview?.isActive,
    currentInterviewId: currentInterview?.id,
    questionsCount: currentInterview?.questions?.length,
    forceRender
  })

  // Force re-render when interview state changes
  const interviewKey = currentInterview?.id || 'no-interview'
  
  // Priority 4: Show interview questions if interview is active
  if ((currentInterview && currentInterview.isActive) || (interviewStarted && currentInterview)) {
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
        <ChatInterface key={interviewKey} interview={currentInterview} onAnswerSubmit={handleAnswerSubmit} />
      </div>
    )
  }

  // Priority 5: If candidate exists but profile is not complete, show profile form
  if (!currentCandidate.profileComplete) {
    return <ProfileForm onSubmit={handleProfileComplete} />
  }

  // Priority 6: Show main dashboard with options
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Ready to Start Your Interview?</h2>
      <p>You have uploaded your resume. Click below to begin your AI-powered interview.</p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={startInterviewProcess}
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
          Start Interview
        </button>
        <button 
          onClick={() => dispatch(setShowResumeUpload(true))}
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
          Update Resume
        </button>
        <button 
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          style={{
            padding: '12px 24px',
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          Clear Cache & Reload
        </button>
      </div>
    </div>
  )
}

export default IntervieweeTab
