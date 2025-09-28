import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { toggleDarkMode, setShowResumeUpload, setShowProfileForm, setActiveTab } from '../store/slices/uiSlice'
import { resetCurrentCandidate } from '../store/slices/candidateSlice'
import { setCurrentInterview } from '../store/slices/interviewSlice'
import { Moon, Sun, User, BarChart3, Menu, X, Home } from 'lucide-react'
import { useState } from 'react'

const FloatingNavbar: React.FC = () => {
  const dispatch = useDispatch()
  const { darkMode, activeTab } = useSelector((state: RootState) => state.ui)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleTabChange = (tab: 'interviewee' | 'interviewer') => {
    // This will be handled by the parent component
    window.dispatchEvent(new CustomEvent('tabChange', { detail: tab }))
    setIsMenuOpen(false)
  }

  const handleLogoClick = () => {
    // Reset all app state to go back to resume upload
    dispatch(resetCurrentCandidate())
    dispatch(setCurrentInterview(null))
    dispatch(setShowResumeUpload(true))
    dispatch(setShowProfileForm(false))
    dispatch(setActiveTab('interviewee'))
    setIsMenuOpen(false)
  }

  return (
    <div className={`floating-navbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="navbar-content">
        {/* Logo/Brand */}
        <div 
          className="navbar-brand"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
          title="Go to Home (Resume Upload)"
        >
          <div className="brand-icon">
            <div className="icon-circle">
              <span>S</span>
            </div>
          </div>
          <span className="brand-text">Swipe AI</span>
          <Home size={14} style={{ opacity: 0.7, marginLeft: '4px' }} />
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav desktop-only">
          <button
            className={`nav-item ${activeTab === 'interviewee' ? 'active' : ''}`}
            onClick={() => handleTabChange('interviewee')}
          >
            <User size={18} />
            <span>Interviewee</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'interviewer' ? 'active' : ''}`}
            onClick={() => handleTabChange('interviewer')}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={() => dispatch(toggleDarkMode())}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav">
          <button
            className={`mobile-nav-item ${activeTab === 'interviewee' ? 'active' : ''}`}
            onClick={() => handleTabChange('interviewee')}
          >
            <User size={20} />
            <span>Interviewee</span>
          </button>
          <button
            className={`mobile-nav-item ${activeTab === 'interviewer' ? 'active' : ''}`}
            onClick={() => handleTabChange('interviewer')}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FloatingNavbar
