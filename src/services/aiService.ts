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

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  }

  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}?key=${this.apiKey}`, {
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
    // Use demo questions if no API key is provided
    if (!this.apiKey) {
      console.log('No API key provided, using demo questions')
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
    
    // Use fallback scoring if no API key is provided
    if (!this.apiKey) {
      console.log('No API key provided, using fallback scoring')
      return this.getFallbackScore(answer, difficulty)
    }

    const prompt = `Score this interview answer on a scale of 1-10:
    
    Question: ${question}
    Difficulty: ${difficulty}
    Answer: ${answer}
    
    Consider: technical accuracy, completeness, clarity, and relevance.
    Return JSON with score (number) and feedback (string).`

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
      return this.getFallbackScore(answer, difficulty)
    } catch (error) {
      console.error('Error scoring answer:', error)
      return this.getFallbackScore(answer, difficulty)
    }
  }

  async generateSummary(questions: Array<{text: string, answer: string, score: number}>, totalScore: number): Promise<string> {
    console.log('AI Service: Starting summary generation')
    console.log('Questions count:', questions.length)
    console.log('Total score:', totalScore)
    console.log('API Key available:', !!this.apiKey)
    
    // Use fallback summary if no API key is provided
    if (!this.apiKey) {
      console.log('No API key provided, using fallback summary')
      return this.getFallbackSummary(questions, totalScore)
    }

    const prompt = `Generate a brief interview summary for a full-stack developer candidate:
    
    Total Score: ${totalScore}/60
    Questions and Answers:
    ${questions.map((q, i) => `${i + 1}. ${q.text}\nAnswer: ${q.answer}\nScore: ${q.score}/10`).join('\n\n')}
    
    Provide a concise summary highlighting strengths, areas for improvement, and overall assessment.`

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

  private getFallbackScore(answer: string, difficulty: 'easy' | 'medium' | 'hard'): AIScore {
    console.log('Using fallback scoring system')
    
    // Enhanced fallback scoring based on multiple factors
    const length = answer.length
    const wordCount = answer.split(/\s+/).filter(word => word.length > 0).length
    
    // Technical keywords for different categories
    const frontendKeywords = ['react', 'component', 'state', 'props', 'jsx', 'hooks', 'useeffect', 'usestate', 'rendering', 'virtual dom', 'browser', 'dom', 'css', 'html']
    const backendKeywords = ['node', 'api', 'database', 'server', 'express', 'mongodb', 'sql', 'rest', 'graphql', 'middleware', 'authentication', 'authorization']
    const generalKeywords = ['javascript', 'typescript', 'async', 'promise', 'callback', 'function', 'variable', 'array', 'object', 'json', 'http', 'https']
    
    const allKeywords = [...frontendKeywords, ...backendKeywords, ...generalKeywords]
    const keywordCount = allKeywords.filter(keyword => 
      answer.toLowerCase().includes(keyword)
    ).length
    
    // Calculate base score
    let score = 1
    
    // Length scoring (0-4 points)
    if (length > 100) score += 2
    else if (length > 50) score += 1
    else if (length < 10) score -= 1
    
    // Word count scoring (0-2 points)
    if (wordCount > 20) score += 2
    else if (wordCount > 10) score += 1
    else if (wordCount < 5) score -= 1
    
    // Keyword scoring (0-3 points)
    if (keywordCount > 5) score += 3
    else if (keywordCount > 2) score += 2
    else if (keywordCount > 0) score += 1
    
    // Difficulty adjustment
    if (difficulty === 'easy') {
      score = Math.min(10, score + 1)
    } else if (difficulty === 'hard') {
      score = Math.max(1, score - 1)
    }
    
    // Ensure score is between 1-10
    score = Math.min(10, Math.max(1, score))
    
    // Generate contextual feedback
    let feedback = ''
    if (score >= 8) {
      feedback = 'Excellent answer! Shows strong technical understanding and comprehensive coverage of the topic.'
    } else if (score >= 6) {
      feedback = 'Good answer with solid technical knowledge. Consider adding more specific examples or details.'
    } else if (score >= 4) {
      feedback = 'Decent answer but could be improved. Try to include more technical details and specific examples.'
    } else {
      feedback = 'Answer needs improvement. Consider providing more detailed technical explanations and specific examples.'
    }
    
    // Add specific suggestions based on content
    if (keywordCount === 0) {
      feedback += ' Try to include more technical terminology relevant to the question.'
    }
    if (length < 20) {
      feedback += ' Consider expanding your answer with more details and examples.'
    }
    if (difficulty === 'hard' && score < 6) {
      feedback += ' For advanced questions, provide more in-depth technical analysis and real-world examples.'
    }

    console.log(`Fallback scoring: length=${length}, words=${wordCount}, keywords=${keywordCount}, difficulty=${difficulty}, score=${score}`)
    
    return {
      score,
      feedback
    }
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
