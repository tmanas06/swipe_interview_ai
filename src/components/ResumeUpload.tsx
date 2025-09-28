import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import resumeService from '../services/resumeService'

interface ResumeUploadProps {
  onUploaded: (data: { name: string; email: string; phone: string; text: string }) => void
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploaded }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const resumeData = await resumeService.parseResume(file)
      onUploaded(resumeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Upload Your Resume
        </h2>
        <p style={{ 
          fontSize: '18px', 
          color: '#64748b',
          margin: 0
        }}>
          Get started with your AI-powered interview
        </p>
      </div>
      
      <div
        className={`upload-area ${isDragging ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Upload size={64} style={{ 
          marginBottom: '20px', 
          color: '#3b82f6',
          filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))'
        }} />
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          marginBottom: '12px',
          color: '#1e293b'
        }}>
          Drop your resume here or click to browse
        </h3>
        <p style={{ 
          fontSize: '16px', 
          color: '#64748b',
          margin: 0
        }}>
          Supports PDF and DOCX files (max 10MB)
        </p>
        
        {isProcessing && (
          <div style={{ 
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#3b82f6',
            fontWeight: '600'
          }}>
            <div className="loading-spinner"></div>
            Processing resume...
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#fff2f0', 
          border: '1px solid #ffccc7', 
          borderRadius: '6px',
          color: '#ff4d4f',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <h4>What we'll extract from your resume:</h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Name</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Email</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Phone</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeUpload
