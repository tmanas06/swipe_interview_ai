import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { setShowResumeUpload, setShowProfileForm, setLoading, setError } from '../store/slices/uiSlice'
import { addCandidate, completeProfile } from '../store/slices/candidateSlice'
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
    if (currentCandidate?.profileComplete && !interviewStarted) {
      startInterviewProcess()
    }
  }, [currentCandidate?.profileComplete])

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

    dispatch(setLoading(true))
    try {
      // Score the answer
      const scoreResult = await aiService.scoreAnswer(
        currentQuestion.text,
        answer,
        currentQuestion.difficulty
      )

      dispatch(answerQuestion({
        questionId: currentQuestion.id,
        answer,
        score: scoreResult.score,
        feedback: scoreResult.feedback
      }))

      // Move to next question or complete interview
      if (currentInterview.currentQuestionIndex < currentInterview.questions.length - 1) {
        dispatch(nextQuestion())
      } else {
        // Complete interview
        const totalScore = currentInterview.questions.reduce((sum, q) => sum + (q.score || 0), 0)
        const summary = await aiService.generateSummary(
          currentInterview.questions.map(q => ({
            text: q.text,
            answer: q.answer || '',
            score: q.score || 0
          })),
          totalScore
        )

        dispatch(completeInterview({ totalScore, summary }))
        setInterviewStarted(false)
      }
    } catch (error) {
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
    return <ChatInterface interview={currentInterview} onAnswerSubmit={handleAnswerSubmit} />
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Welcome to the AI Interview Assistant</h2>
      <p>Please upload your resume to get started.</p>
      <button onClick={() => dispatch(setShowResumeUpload(true))}>
        Upload Resume
      </button>
    </div>
  )
}

export default IntervieweeTab
