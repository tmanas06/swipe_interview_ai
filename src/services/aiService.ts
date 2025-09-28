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
    // Simple fallback scoring based on answer length and keywords
    const length = answer.length
    const keywords = ['react', 'node', 'javascript', 'api', 'database', 'component', 'state', 'props']
    const keywordCount = keywords.filter(keyword => 
      answer.toLowerCase().includes(keyword)
    ).length

    let score = Math.min(10, Math.max(1, Math.floor(length / 20) + keywordCount))
    
    // Adjust based on difficulty
    if (difficulty === 'easy') score = Math.min(10, score + 1)
    if (difficulty === 'hard') score = Math.max(1, score - 1)

    return {
      score,
      feedback: `Answer scored based on length and technical keywords. Consider providing more detailed technical explanations.`
    }
  }

  private getFallbackSummary(questions: Array<{text: string, answer: string, score: number}>, totalScore: number): string {
    const averageScore = totalScore / questions.length
    const strengths = questions.filter(q => q.score >= 7).length
    const weaknesses = questions.filter(q => q.score < 5).length

    let summary = `Interview completed with a total score of ${totalScore}/60 (average: ${averageScore.toFixed(1)}/10). `
    
    if (strengths > weaknesses) {
      summary += `The candidate demonstrated strong technical knowledge with ${strengths} high-scoring answers. `
    } else if (weaknesses > strengths) {
      summary += `The candidate showed areas for improvement with ${weaknesses} low-scoring answers. `
    } else {
      summary += `The candidate showed mixed performance across different questions. `
    }

    summary += `Overall, this candidate shows potential for a full-stack developer role with room for growth in specific technical areas.`

    return summary
  }
}

export default new AIService()
