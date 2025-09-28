import React from 'react'
import { ArrowLeft, User, Mail, Phone, Calendar, Star, Clock } from 'lucide-react'

interface CandidateDetailProps {
  candidate: {
    id: string
    name: string
    email: string
    phone: string
    createdAt: string
    interview?: {
      id: string
      questions: Array<{
        id: string
        text: string
        difficulty: 'easy' | 'medium' | 'hard'
        answer?: string
        score?: number
        feedback?: string
        answeredAt?: string
      }>
      totalScore?: number
      summary?: string
      startTime?: string
      endTime?: string
    }
    totalScore: number
    interviewStatus: string
  }
  onBack: () => void
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidate, onBack }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a'
      case 'medium': return '#faad14'
      case 'hard': return '#ff4d4f'
      default: return '#1890ff'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#52c41a'
    if (score >= 6) return '#faad14'
    return '#ff4d4f'
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 'N/A'
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)
    return `${diffMins}m ${diffSecs}s`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '24px',
        gap: '16px'
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        
        <div>
          <h2 style={{ margin: 0 }}>{candidate.name}</h2>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            color: '#666',
            fontSize: '14px',
            marginTop: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={14} />
              {candidate.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Phone size={14} />
              {candidate.phone}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              {new Date(candidate.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Interview Summary */}
      {candidate.interview && (
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} />
            Interview Summary
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total Score</div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold',
                color: getScoreColor(candidate.totalScore / 6) // Average score
              }}>
                {candidate.totalScore}/60
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Status</div>
              <div style={{ 
                fontSize: '18px',
                color: candidate.interviewStatus === 'Completed' ? '#52c41a' : '#1890ff'
              }}>
                {candidate.interviewStatus}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Duration</div>
              <div style={{ fontSize: '18px' }}>
                {formatDuration(candidate.interview.startTime, candidate.interview.endTime)}
              </div>
            </div>
          </div>

          {candidate.interview.summary && (
            <div style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>AI Assessment</h4>
              <p style={{ margin: 0, lineHeight: '1.6' }}>{candidate.interview.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Questions and Answers */}
      {candidate.interview && (
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Interview Questions & Answers</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {candidate.interview.questions.map((question, index) => (
              <div key={question.id} style={{
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                background: '#fafafa'
              }}>
                {/* Question Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#1890ff',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    <div 
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        background: getDifficultyColor(question.difficulty) + '20',
                        color: getDifficultyColor(question.difficulty)
                      }}
                    >
                      {question.difficulty}
                    </div>
                  </div>
                  
                  {question.score && (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: getScoreColor(question.score)
                    }}>
                      {question.score}/10
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Question:</h4>
                  <p style={{ margin: 0, lineHeight: '1.6' }}>{question.text}</p>
                </div>

                {/* Answer */}
                {question.answer ? (
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Answer:</h4>
                    <div style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9',
                      lineHeight: '1.6'
                    }}>
                      {question.answer}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    color: '#8c8c8c', 
                    fontStyle: 'italic',
                    marginBottom: '12px'
                  }}>
                    No answer provided
                  </div>
                )}

                {/* Feedback */}
                {question.feedback && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>AI Feedback:</h4>
                    <div style={{
                      background: '#f0f8ff',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #d6e4ff',
                      lineHeight: '1.6'
                    }}>
                      {question.feedback}
                    </div>
                  </div>
                )}

                {/* Answer Time */}
                {question.answeredAt && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8c8c8c',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={12} />
                    Answered: {new Date(question.answeredAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Interview Data */}
      {!candidate.interview && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <User size={48} style={{ marginBottom: '16px', color: '#8c8c8c' }} />
          <h3>No Interview Data</h3>
          <p>This candidate hasn't started their interview yet.</p>
        </div>
      )}
    </div>
  )
}

export default CandidateDetail
