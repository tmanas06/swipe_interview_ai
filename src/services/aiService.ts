import { demoQuestions } from '../data/demoQuestions'

export interface AIQuestion {
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  timeLimit: number
}

export interface AIScore {
  score: number
  feedback: string
}

class AIService {
  private apiKey: string
  private baseUrl: string
  private isValidApiKey: boolean

  constructor() {
    this.apiKey = ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.isValidApiKey = false
  }

  private isValidApiKeyCheck(): boolean {
    // Get fresh API key from environment
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
    
    // Debug logging
    console.log('API Key from env:', apiKey)
    console.log('API Key length:', apiKey.length)
    
    // Check if API key is valid (not placeholder)
    const isPlaceholder = apiKey === 'AIzaSyB5GW2ko7PVYaFIBzDYwHUB5mWHBfHB-NI' || 
                         apiKey === 'IzaSyB5GW2ko7PVYaFIBzDYwHUB5mWHBfHB-NI' ||
                         apiKey === '"IzaSyB5GW2ko7PVYaFIBzDYwHUB5mWHBfHB-NI"'
    const isTooShort = apiKey.length <= 20
    const isEmpty = !apiKey
    const isMalformed = apiKey.includes('"') || !apiKey.startsWith('AI')
    
    const isValid = Boolean(apiKey && !isPlaceholder && !isTooShort && !isEmpty && !isMalformed)
    
    console.log('API Key validation:', {
      isEmpty,
      isPlaceholder,
      isTooShort,
      isMalformed,
      isValid
    })
    
    return isValid
  }

  private async makeRequest(endpoint: string, data: any) {
    // Get fresh API key and validate
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
    
    // Safety check - don't make API calls with invalid keys
    if (!this.isValidApiKeyCheck()) {
      throw new Error('Invalid API key - should use fallback system instead')
    }

    console.log('Making API request with key:', apiKey.substring(0, 10) + '...')
    
    const response = await fetch(`${this.baseUrl}${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async generateQuestions(): Promise<AIQuestion[]> {
    // Use demo questions if no valid API key is provided
    if (!this.isValidApiKeyCheck()) {
      console.log('No valid API key provided, using demo questions')
      return demoQuestions
    }

    const prompt = `Generate 6 interview questions for a full-stack developer position (React/Node.js). 
    Format: 2 easy questions (20s each), 2 medium questions (60s each), 2 hard questions (120s each).
    Return as JSON array with text, difficulty, and timeLimit fields.`

    try {
      const data = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }

      const result = await this.makeRequest('/models/gemini-pro:generateContent', data)
      const responseText = result.candidates[0].content.parts[0].text
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback questions if AI fails
      return this.getFallbackQuestions()
    } catch (error) {
      console.error('Error generating questions:', error)
      return this.getFallbackQuestions()
    }
  }

  async scoreAnswer(question: string, answer: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<AIScore> {
    console.log('AI Service: Starting answer scoring')
    console.log('Question:', question)
    console.log('Answer:', answer)
    console.log('Difficulty:', difficulty)
    console.log('API Key available:', !!this.apiKey)
    console.log('Valid API Key:', this.isValidApiKey)
    
    // Use fallback scoring if no valid API key is provided
    if (!this.isValidApiKeyCheck()) {
      console.log('No valid API key provided, using fallback scoring')
      return this.getFallbackScore(answer, difficulty, question)
    }

    const prompt = `Score this interview answer on a scale of 1-10 for a full-stack developer position:
    
    Question: ${question}
    Difficulty: ${difficulty}
    Answer: ${answer}
    
    Evaluation Criteria:
    1. Technical Accuracy (25%): Correctness of technical concepts and terminology
    2. Completeness (25%): How well the answer addresses all aspects of the question
    3. Clarity & Communication (20%): How clearly and logically the answer is presented
    4. Depth & Detail (20%): Level of technical detail and real-world examples
    5. Relevance (10%): How directly the answer relates to the question asked
    
    Scoring Guidelines:
    - 9-10: Exceptional technical expertise, comprehensive coverage, excellent examples
    - 7-8: Strong technical knowledge, good coverage, clear explanations
    - 5-6: Solid technical understanding, adequate coverage, some examples
    - 3-4: Basic technical knowledge, incomplete coverage, needs more detail
    - 1-2: Limited technical understanding, poor coverage, minimal detail
    
    Return JSON with score (number) and feedback (string). The feedback should be specific, constructive, and actionable.`

    try {
      const data = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      }

      const result = await this.makeRequest('/models/gemini-pro:generateContent', data)
      const responseText = result.candidates[0].content.parts[0].text
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback scoring
      return this.getFallbackScore(answer, difficulty, question)
    } catch (error) {
      console.error('Error scoring answer:', error)
      return this.getFallbackScore(answer, difficulty, question)
    }
  }

  async generateSummary(questions: Array<{text: string, answer: string, score: number}>, totalScore: number): Promise<string> {
    console.log('AI Service: Starting summary generation')
    console.log('Questions count:', questions.length)
    console.log('Total score:', totalScore)
    console.log('API Key available:', !!this.apiKey)
    console.log('Valid API Key:', this.isValidApiKey)
    
    // Use fallback summary if no valid API key is provided
    if (!this.isValidApiKeyCheck()) {
      console.log('No valid API key provided, using fallback summary')
      return this.getFallbackSummary(questions, totalScore)
    }

    const prompt = `Generate a comprehensive interview summary for a full-stack developer candidate:
    
    Total Score: ${totalScore}/60 (Average: ${(totalScore/questions.length).toFixed(1)}/10)
    Questions and Answers:
    ${questions.map((q, i) => `${i + 1}. Q: ${q.text}\n   A: ${q.answer}\n   Score: ${q.score}/10`).join('\n\n')}
    
    Please provide a detailed assessment including:
    1. Overall Performance Rating (Excellent/Good/Average/Needs Improvement)
    2. Technical Strengths demonstrated in the interview
    3. Areas for improvement and development
    4. Specific recommendations for the candidate's growth
    5. Suitability assessment for full-stack developer role
    6. Next steps or follow-up recommendations
    
    Format the summary professionally with clear sections and actionable insights.`

    try {
      const data = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      }

      const result = await this.makeRequest('/models/gemini-pro:generateContent', data)
      return result.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Error generating summary:', error)
      return this.getFallbackSummary(questions, totalScore)
    }
  }

  private getFallbackQuestions(): AIQuestion[] {
    return [
      {
        text: "What is React and what are its main features?",
        difficulty: "easy",
        timeLimit: 20
      },
      {
        text: "Explain the difference between props and state in React.",
        difficulty: "easy",
        timeLimit: 20
      },
      {
        text: "How would you optimize a React application for better performance?",
        difficulty: "medium",
        timeLimit: 60
      },
      {
        text: "Describe the Node.js event loop and how it handles asynchronous operations.",
        difficulty: "medium",
        timeLimit: 60
      },
      {
        text: "Design a scalable microservices architecture for an e-commerce platform. What challenges would you face?",
        difficulty: "hard",
        timeLimit: 120
      },
      {
        text: "Implement a real-time chat application using WebSockets. How would you handle connection failures and message ordering?",
        difficulty: "hard",
        timeLimit: 120
      }
    ]
  }

  private getFallbackScore(answer: string, difficulty: 'easy' | 'medium' | 'hard', question?: string): AIScore {
    console.log('Using enhanced fallback scoring system')
    
    // Enhanced fallback scoring based on multiple factors
    const length = answer.length
    const wordCount = answer.split(/\s+/).filter(word => word.length > 0).length
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    
    // Comprehensive technical keywords with weighted scoring
    const keywordCategories = {
      frontend: {
        keywords: [
          'react', 'component', 'state', 'props', 'jsx', 'hooks', 'useeffect', 'usestate', 
          'rendering', 'virtual dom', 'browser', 'dom', 'css', 'html', 'javascript', 'typescript',
          'angular', 'vue', 'svelte', 'nextjs', 'gatsby', 'webpack', 'babel', 'eslint',
          'tailwind', 'bootstrap', 'material-ui', 'styled-components', 'sass', 'less'
        ],
        weight: 1.2
      },
      backend: {
        keywords: [
          'node', 'api', 'database', 'server', 'express', 'mongodb', 'sql', 'rest', 'graphql',
          'middleware', 'authentication', 'authorization', 'jwt', 'oauth', 'redis', 'postgresql',
          'mysql', 'nosql', 'microservices', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
          'nginx', 'apache', 'load balancing', 'caching', 'session', 'cookie'
        ],
        weight: 1.3
      },
      general: {
        keywords: [
          'async', 'promise', 'callback', 'function', 'variable', 'array', 'object', 'json',
          'http', 'https', 'tcp', 'udp', 'websocket', 'algorithm', 'data structure', 'recursion',
          'iteration', 'loop', 'conditional', 'exception', 'error handling', 'logging', 'testing',
          'unit test', 'integration test', 'debugging', 'performance', 'optimization', 'security'
        ],
        weight: 1.0
      },
      architecture: {
        keywords: [
          'design pattern', 'mvc', 'mvp', 'mvvm', 'singleton', 'factory', 'observer', 'mvc',
          'microservices', 'monolith', 'soa', 'event-driven', 'pub-sub', 'caching', 'scalability',
          'availability', 'reliability', 'maintainability', 'testability', 'deployment', 'ci/cd'
        ],
        weight: 1.5
      }
    }
    
    // Calculate weighted keyword score
    let keywordScore = 0
    let matchedCategories = new Set<string>()
    const answerLower = answer.toLowerCase()
    
    Object.entries(keywordCategories).forEach(([category, data]) => {
      const matches = data.keywords.filter(keyword => answerLower.includes(keyword))
      if (matches.length > 0) {
        matchedCategories.add(category)
        keywordScore += matches.length * data.weight
      }
    })
    
    // Answer quality metrics
    const qualityMetrics = {
      completeness: this.calculateCompleteness(answer),
      clarity: this.calculateClarity(answer, sentences, wordCount),
      technicalDepth: this.calculateTechnicalDepth(answer, matchedCategories),
      relevance: this.calculateRelevance(answer, question)
    }
    
    // Calculate base score with improved algorithm
    let score = 1
    
    // Length and structure scoring (0-3 points)
    if (length > 200) score += 3
    else if (length > 100) score += 2
    else if (length > 50) score += 1
    else if (length < 20) score -= 1
    
    // Word density scoring (0-2 points)
    if (wordCount > 30) score += 2
    else if (wordCount > 15) score += 1
    else if (wordCount < 5) score -= 1
    
    // Sentence structure scoring (0-1 point)
    if (sentences > 2) score += 1
    
    // Enhanced keyword scoring (0-4 points)
    if (keywordScore > 8) score += 4
    else if (keywordScore > 5) score += 3
    else if (keywordScore > 2) score += 2
    else if (keywordScore > 0) score += 1
    
    // Quality metrics scoring (0-3 points)
    const avgQuality = Object.values(qualityMetrics).reduce((sum, val) => sum + val, 0) / 4
    score += Math.round(avgQuality * 3)
    
    // Difficulty adjustment with better scaling
    if (difficulty === 'easy') {
      score = Math.min(10, score + 0.5)
    } else if (difficulty === 'medium') {
      score = Math.max(1, score - 0.2)
    } else if (difficulty === 'hard') {
      score = Math.max(1, score - 0.8)
      // Bonus for hard questions with good technical depth
      if (qualityMetrics.technicalDepth > 0.7) score += 1
    }
    
    // Ensure score is between 1-10
    score = Math.min(10, Math.max(1, Math.round(score)))
    
    // Generate enhanced contextual feedback
    const feedback = this.generateEnhancedFeedback(score, qualityMetrics, matchedCategories, difficulty, length, keywordScore)
    
    console.log(`Enhanced fallback scoring: length=${length}, words=${wordCount}, sentences=${sentences}, keywordScore=${keywordScore.toFixed(2)}, quality=${avgQuality.toFixed(2)}, difficulty=${difficulty}, score=${score}`)
    
    return {
      score,
      feedback
    }
  }

  private calculateCompleteness(answer: string): number {
    // Check if answer addresses common question components
    const hasExplanation = answer.length > 50
    const hasExample = /example|for instance|such as|like/i.test(answer)
    const hasDetail = answer.split(/\s+/).length > 15
    const hasTechnicalTerms = /[A-Z]{2,}|[a-z]+(?:ing|tion|sion|ment)$/i.test(answer)
    
    let completeness = 0
    if (hasExplanation) completeness += 0.3
    if (hasExample) completeness += 0.3
    if (hasDetail) completeness += 0.2
    if (hasTechnicalTerms) completeness += 0.2
    
    return Math.min(1, completeness)
  }

  private calculateClarity(answer: string, sentences: number, wordCount: number): number {
    // Assess clarity based on structure and readability
    const avgWordsPerSentence = wordCount / Math.max(sentences, 1)
    const hasStructure = /first|second|third|next|then|finally|also|additionally/i.test(answer)
    const hasConnectors = /however|therefore|because|since|although|moreover/i.test(answer)
    
    let clarity = 0.5 // base score
    
    // Optimal sentence length (not too short, not too long)
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) clarity += 0.3
    else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 30) clarity += 0.1
    
    if (hasStructure) clarity += 0.2
    if (hasConnectors) clarity += 0.2
    
    return Math.min(1, clarity)
  }

  private calculateTechnicalDepth(answer: string, matchedCategories: Set<string>): number {
    // Assess technical depth based on categories and complexity
    let depth = 0
    
    if (matchedCategories.has('architecture')) depth += 0.4
    if (matchedCategories.has('backend')) depth += 0.3
    if (matchedCategories.has('frontend')) depth += 0.2
    if (matchedCategories.has('general')) depth += 0.1
    
    // Check for advanced concepts
    const advancedConcepts = /algorithm|complexity|optimization|scalability|security|performance|architecture/i
    if (advancedConcepts.test(answer)) depth += 0.2
    
    return Math.min(1, depth)
  }

  private calculateRelevance(answer: string, question?: string): number {
    if (!question) return 0.5
    
    // Simple relevance check based on keyword overlap
    const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const answerWords = answer.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    
    const overlap = questionWords.filter(word => answerWords.includes(word)).length
    const relevance = Math.min(1, overlap / Math.max(questionWords.length, 1))
    
    return relevance
  }

  private generateEnhancedFeedback(score: number, qualityMetrics: any, matchedCategories: Set<string>, difficulty: string, length: number, keywordScore: number): string {
    let feedback = ''
    
    // Base feedback based on score
    if (score >= 9) {
      feedback = 'Outstanding answer! Demonstrates exceptional technical expertise with comprehensive coverage and clear explanations.'
    } else if (score >= 7) {
      feedback = 'Excellent answer! Shows strong technical understanding with good depth and clarity.'
    } else if (score >= 5) {
      feedback = 'Good answer with solid technical knowledge. Consider adding more specific examples or expanding on key concepts.'
    } else if (score >= 3) {
      feedback = 'Decent answer but needs improvement. Try to include more technical details, examples, and explanations.'
    } else {
      feedback = 'Answer needs significant improvement. Consider providing more detailed technical explanations with specific examples.'
    }
    
    // Specific improvement suggestions
    const suggestions = []
    
    if (qualityMetrics.completeness < 0.5) {
      suggestions.push('Provide more comprehensive explanations with examples')
    }
    
    if (qualityMetrics.clarity < 0.5) {
      suggestions.push('Improve answer structure and clarity with better organization')
    }
    
    if (qualityMetrics.technicalDepth < 0.4) {
      suggestions.push('Include more technical details and advanced concepts')
    }
    
    if (keywordScore < 2) {
      suggestions.push('Use more relevant technical terminology')
    }
    
    if (length < 50) {
      suggestions.push('Expand your answer with more detailed explanations')
    }
    
    if (difficulty === 'hard' && score < 7) {
      suggestions.push('For advanced questions, provide deeper technical analysis with real-world examples')
    }
    
    if (suggestions.length > 0) {
      feedback += ' ' + suggestions.join('. ') + '.'
    }
    
    // Positive reinforcement
    if (matchedCategories.size > 2) {
      feedback += ' Great job covering multiple technical areas!'
    }
    
    return feedback
  }

  private getFallbackSummary(questions: Array<{text: string, answer: string, score: number}>, totalScore: number): string {
    console.log('Using fallback summary generation')
    
    const averageScore = totalScore / questions.length
    const strengths = questions.filter(q => q.score >= 7).length
    const weaknesses = questions.filter(q => q.score < 5).length
    const mediumScores = questions.filter(q => q.score >= 5 && q.score < 7).length

    let summary = `Interview Assessment Summary:\n\n`
    summary += `Total Score: ${totalScore}/60 (Average: ${averageScore.toFixed(1)}/10)\n\n`
    
    // Performance analysis
    if (averageScore >= 8) {
      summary += `🌟 Excellent Performance: The candidate demonstrated exceptional technical knowledge and problem-solving skills. `
    } else if (averageScore >= 6) {
      summary += `✅ Good Performance: The candidate showed solid technical understanding with room for growth. `
    } else if (averageScore >= 4) {
      summary += `⚠️  Average Performance: The candidate has basic knowledge but needs significant improvement. `
    } else {
      summary += `❌ Below Expectations: The candidate requires substantial development in technical skills. `
    }

    // Detailed breakdown
    summary += `\n\nDetailed Analysis:\n`
    summary += `• High-scoring answers (7+): ${strengths}/${questions.length}\n`
    summary += `• Medium-scoring answers (5-6): ${mediumScores}/${questions.length}\n`
    summary += `• Low-scoring answers (<5): ${weaknesses}/${questions.length}\n\n`

    // Specific feedback
    if (strengths > weaknesses) {
      summary += `Strengths: The candidate excels in technical problem-solving and demonstrates strong understanding of key concepts. `
    } else if (weaknesses > strengths) {
      summary += `Areas for Improvement: The candidate needs to strengthen their technical knowledge and provide more detailed answers. `
    } else {
      summary += `Mixed Performance: The candidate shows potential but has inconsistent technical knowledge across different areas. `
    }

    // Recommendations
    summary += `\n\nRecommendations:\n`
    if (averageScore >= 7) {
      summary += `• Strong candidate for full-stack developer role\n`
      summary += `• Consider for senior positions with mentoring opportunities\n`
      summary += `• Continue professional development in advanced topics\n`
    } else if (averageScore >= 5) {
      summary += `• Suitable for junior to mid-level developer positions\n`
      summary += `• Focus on strengthening core technical concepts\n`
      summary += `• Consider additional training in specific weak areas\n`
    } else {
      summary += `• Requires significant technical training before consideration\n`
      summary += `• Focus on fundamental programming concepts\n`
      summary += `• Consider internship or junior training programs\n`
    }

    summary += `\nOverall Assessment: This candidate ${averageScore >= 6 ? 'shows promise' : 'needs development'} for a full-stack developer role with ${averageScore >= 6 ? 'appropriate' : 'extensive'} training and support.`

    console.log(`Fallback summary generated: avg=${averageScore.toFixed(1)}, strengths=${strengths}, weaknesses=${weaknesses}`)
    
    return summary
  }
}

export default new AIService()
