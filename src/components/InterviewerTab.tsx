import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Search, User, Mail, Phone, Calendar, Star } from 'lucide-react'
import CandidateDetail from './CandidateDetail'

const InterviewerTab: React.FC = () => {
  const { candidates, interviews } = useSelector((state: RootState) => state)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score')
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  // Get candidates with their interview data
  const candidatesWithInterviews = candidates.candidates.map(candidate => {
    const candidateInterviews = interviews.interviews.filter(
      interview => interview.candidateId === candidate.id
    )
    const latestInterview = candidateInterviews[candidateInterviews.length - 1]
    
    return {
      ...candidate,
      interview: latestInterview,
      totalScore: latestInterview?.totalScore || 0,
      interviewStatus: latestInterview?.isActive ? 'In Progress' : 
                     latestInterview?.totalScore ? 'Completed' : 'Not Started'
    }
  })

  // Filter and sort candidates
  const filteredCandidates = candidatesWithInterviews
    .filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.totalScore - a.totalScore
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const getScoreColor = (score: number) => {
    if (score >= 45) return '#52c41a' // Green
    if (score >= 30) return '#faad14' // Yellow
    return '#ff4d4f' // Red
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#52c41a'
      case 'In Progress': return '#1890ff'
      default: return '#8c8c8c'
    }
  }

  if (selectedCandidate) {
    const candidate = candidatesWithInterviews.find(c => c.id === selectedCandidate)
    if (candidate) {
      return (
        <CandidateDetail 
          candidate={candidate} 
          onBack={() => setSelectedCandidate(null)} 
        />
      )
    }
  }

  return (
    <div className="dashboard-container">
      <h2 style={{ marginBottom: '24px' }}>Interview Dashboard</h2>
      
      {/* Search and Sort Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#8c8c8c'
            }} 
          />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'date')}
          style={{
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        >
          <option value="score">Sort by Score</option>
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      {/* Candidates List */}
      {filteredCandidates.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#8c8c8c'
        }}>
          <User size={48} style={{ marginBottom: '16px' }} />
          <h3>No candidates found</h3>
          <p>No candidates match your search criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredCandidates.map(candidate => (
            <div 
              key={candidate.id}
              className="candidate-card"
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                    {candidate.name}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} />
                      {candidate.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} />
                      {candidate.phone}
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div 
                    className="candidate-score"
                    style={{ color: getScoreColor(candidate.totalScore) }}
                  >
                    {candidate.totalScore}/60
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: getStatusColor(candidate.interviewStatus),
                    fontWeight: '500'
                  }}>
                    {candidate.interviewStatus}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#8c8c8c'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  {new Date(candidate.createdAt).toLocaleDateString()}
                </div>
                
                {candidate.interview?.summary && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: '#1890ff'
                  }}>
                    <Star size={12} />
                    AI Summary Available
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredCandidates.length > 0 && (
        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {filteredCandidates.length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Candidates</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {filteredCandidates.filter(c => c.interviewStatus === 'Completed').length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Completed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
              {filteredCandidates.filter(c => c.interviewStatus === 'In Progress').length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>In Progress</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8c8c8c' }}>
              {Math.round(filteredCandidates.reduce((sum, c) => sum + c.totalScore, 0) / filteredCandidates.length) || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Avg Score</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewerTab
