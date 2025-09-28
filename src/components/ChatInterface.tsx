import React, { useState, useEffect, useRef } from 'react'
import { Send, Clock, CheckCircle } from 'lucide-react'
import { Interview } from '../store/slices/interviewSlice'

interface ChatInterfaceProps {
  interview: Interview
  onAnswerSubmit: (answer: string) => void
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ interview, onAnswerSubmit }) => {
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentQuestion = interview.questions[interview.currentQuestionIndex]
  const isInterviewComplete = interview.currentQuestionIndex >= interview.questions.length

  useEffect(() => {
    if (currentQuestion && !isInterviewComplete) {
      setTimeLeft(currentQuestion.timeLimit)
      setCurrentAnswer('')
      
      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up, auto-submit
            handleSubmitAnswer()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestion, interview.currentQuestionIndex])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [interview.questions])

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || isSubmitting) return

    setIsSubmitting(true)
    await onAnswerSubmit(currentAnswer.trim())
    setIsSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a'
      case 'medium': return '#faad14'
      case 'hard': return '#ff4d4f'
      default: return '#1890ff'
    }
  }

  const getProgressPercentage = () => {
    return ((interview.currentQuestionIndex + 1) / interview.questions.length) * 100
  }

  if (isInterviewComplete) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <CheckCircle size={64} style={{ color: '#52c41a', marginBottom: '24px' }} />
        <h2>Interview Complete!</h2>
        <p>Your responses have been submitted and scored.</p>
        <p>Total Score: {interview.totalScore}/60</p>
        {interview.summary && (
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f', 
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <h4>AI Summary:</h4>
            <p>{interview.summary}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Timer */}
      {timeLeft > 0 && (
        <div className="timer-display">
          <Clock size={16} style={{ marginRight: '8px' }} />
          Time Remaining: {formatTime(timeLeft)}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {interview.questions.map((question, index) => (
          <div key={question.id}>
            {/* Question */}
            <div className="message bot">
              <div className="message-content">
                <div className="question-card">
                  <div 
                    className="question-difficulty"
                    style={{ 
                      background: getDifficultyColor(question.difficulty) + '20',
                      color: getDifficultyColor(question.difficulty)
                    }}
                  >
                    {question.difficulty.toUpperCase()}
                  </div>
                  <h4>Question {index + 1}</h4>
                  <p>{question.text}</p>
                </div>
              </div>
            </div>

            {/* Answer */}
            {question.answer && (
              <div className="message user">
                <div className="message-content">
                  <p>{question.answer}</p>
                  {question.score && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '14px', 
                      opacity: 0.8 
                    }}>
                      Score: {question.score}/10
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feedback */}
            {question.feedback && (
              <div className="message bot">
                <div className="message-content">
                  <div style={{ 
                    background: '#f0f8ff', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: '1px solid #d6e4ff'
                  }}>
                    <strong>AI Feedback:</strong> {question.feedback}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Current Question Input */}
        {currentQuestion && !currentQuestion.answer && (
          <div className="message bot">
            <div className="message-content">
              <div className="question-card">
                <div 
                  className="question-difficulty"
                  style={{ 
                    background: getDifficultyColor(currentQuestion.difficulty) + '20',
                    color: getDifficultyColor(currentQuestion.difficulty)
                  }}
                >
                  {currentQuestion.difficulty.toUpperCase()}
                </div>
                <h4>Question {interview.currentQuestionIndex + 1}</h4>
                <p>{currentQuestion.text}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

        {/* Answer Input */}
        {currentQuestion && !currentQuestion.answer && !isInterviewComplete && (
          <div style={{ 
            padding: '24px', 
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'white',
            borderRadius: '0 0 16px 16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  border: '2px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '12px',
                  resize: 'vertical',
                  minHeight: '100px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  background: '#f8fafc',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.background = 'white'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim() || isSubmitting}
                style={{
                  padding: '16px 24px',
                  background: currentAnswer.trim() 
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                    : '#e2e8f0',
                  color: currentAnswer.trim() ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all 0.3s ease',
                  boxShadow: currentAnswer.trim() 
                    ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                    : 'none'
                }}
                onMouseOver={(e) => {
                  if (currentAnswer.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (currentAnswer.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        )}
    </div>
  )
}

export default ChatInterface
