import React, { useState } from 'react'
import { User, Mail, Phone } from 'lucide-react'

interface ProfileFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-\(\)\+]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="profile-form">
      <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>
        Complete Your Profile
      </h2>
      
      <p style={{ textAlign: 'center', marginBottom: '32px', color: '#666' }}>
        We couldn't extract all the required information from your resume. 
        Please fill in the missing details to start your interview.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <div className="error-message">
              <span>{errors.name}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">
            <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <div className="error-message">
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label className="form-label">
            <Phone size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="Enter your phone number"
          />
          {errors.phone && (
            <div className="error-message">
              <span>{errors.phone}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="form-button"
        >
          Start Interview
        </button>
      </form>
    </div>
  )
}

export default ProfileForm
