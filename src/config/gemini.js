import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'

if (!API_KEY) {
  console.error('Gemini API key is missing. Please check your .env file.')
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null

const model = genAI?.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
})

export const sendMessage = async (message) => {
  try {
    if (!API_KEY || !model) {
      throw new Error('API key is not configured')
    }

    const result = await model.generateContent(message)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error sending message to Gemini:', error)

    if (error.message.includes('API key')) {
      throw new Error('Invalid or missing API key. Please check your configuration.')
    }

    if (error.message.toLowerCase().includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.')
    }

    if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
      throw new Error(`The Gemini model "${MODEL_NAME}" is unavailable for this API version.`)
    }

    throw new Error('Failed to communicate with Gemini. Please try again.')
  }
}
