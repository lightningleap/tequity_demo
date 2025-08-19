import { Groq } from 'groq-sdk'

const apiKey = import.meta.env.VITE_GROQ_API_KEY

if (!apiKey) {
  console.warn('VITE_GROQ_API_KEY environment variable is not set. Using mock responses.')
}

const groq = apiKey ? new Groq({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
}) : null

const TEXT_RESPONSE_CONFIG = {
  model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Latest Llama 4 Maverick for text
  temperature: 0.7,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  response_format: {
    type: "text"
  }
}

const JSON_RESPONSE_CONFIG = {
  model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Latest Llama 4 Maverick for structured responses
  temperature: 0.5,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  response_format: {
    type: "json_object"
  }
}

const VISION_MODEL_CONFIG = {
  model: "meta-llama/llama-4-maverick-17b-128e-instruct", // Latest Llama 4 Maverick with vision support
  temperature: 0.7,
  max_tokens: 1024,
  top_p: 1,
  stream: false,
  stop: null
}

const AUDIO_TRANSCRIPTION_CONFIG = {
  model: "whisper-large-v3-turbo", // For audio transcription
  temperature: 0.2,
  max_tokens: 1024,
  top_p: 1,
  stream: false
}

const TTS_CONFIG = {
  model: "playai-tts", // PlayAI Dialog for text-to-speech
  voice: "jennifer", // Default voice
  speed: 1.0,
  response_format: "mp3"
}

const ADVANCED_TEXT_CONFIG = {
  model: 'llama-3.1-8b-instant', // For fast advanced reasoning - production model
  temperature: 0.6,
  max_tokens: 2048,
  top_p: 0.9,
  stream: false
}

export async function getChatResponse(
  messages,
  systemPrompt = "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
  responseType = 'text'
) {
  // If no API key, return mock response
  if (!groq) {
    return getMockResponse(messages[messages.length - 1]?.content || '')
  }

  try {
    const config = responseType === 'json' ? JSON_RESPONSE_CONFIG : TEXT_RESPONSE_CONFIG

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      ...config
    })

    console.log('Groq API Response:', {
      model: completion.model,
      responseContent: completion.choices[0]?.message?.content,
      usage: completion.usage
    })

    const content = completion.choices[0]?.message?.content || ''
    return content || "I apologize, but I couldn't generate a response. Please try again."
  } catch (error) {
    console.error('Error calling Groq:', error)
    return "I apologize, but I'm having trouble processing your request. Please try again later."
  }
}

export async function getVisionChatResponse(
  messages,
  systemPrompt = "You are a helpful AI assistant that can analyze images. Describe what you see and answer questions about the image."
) {
  // If no API key, return mock response
  if (!groq) {
    return "I can see your image, but I need a Groq API key to analyze it properly. This is a mock response."
  }

  try {
    const finalMessages = systemPrompt 
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages

    const completion = await groq.chat.completions.create({
      messages: finalMessages,
      ...VISION_MODEL_CONFIG
    })

    const content = completion.choices[0]?.message?.content || ''
    return content || "I apologize, but I couldn't analyze the image. Please try again."
  } catch (error) {
    console.error('Error calling Groq Vision:', error)
    return "I apologize, but I'm having trouble processing the image. Please try again later."
  }
}

export async function getChatResponseWithQuickReplies(
  messages,
  systemPrompt = "You are a helpful AI assistant. Provide clear responses and suggest 2-3 relevant quick reply buttons for the user."
) {
  // If no API key, return mock response with quick replies
  if (!groq) {
    return getMockResponseWithQuickReplies(messages[messages.length - 1]?.content || '')
  }

  try {
    const enhancedSystemPrompt = `${systemPrompt}

You must format your response EXACTLY as follows:

RESPONSE: [Your main response here - be helpful and informative]

QUICK_REPLIES: [
  {"id": "btn1", "text": "📊 Button Text 1", "action": "action1"},
  {"id": "btn2", "text": "🎯 Button Text 2", "action": "action2"},
  {"id": "btn3", "text": "💡 Button Text 3", "action": "action3"}
]

Important rules:
- Always include both RESPONSE: and QUICK_REPLIES: sections
- Quick replies must be valid JSON array
- Use emojis in button text to make them more engaging
- Limit to 3 buttons maximum
- Make button actions relevant to the conversation context`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        ...messages
      ],
      ...TEXT_RESPONSE_CONFIG
    })

    const fullResponse = completion.choices[0]?.message?.content || ''
    return parseResponseWithQuickReplies(fullResponse)
  } catch (error) {
    console.error('Error calling Groq:', error)
    return {
      content: "I apologize, but I'm having trouble processing your request. Please try again later.",
      quickReplies: [
        { id: 'retry', text: '🔄 Try Again', action: 'retry' },
        { id: 'help', text: '❓ Get Help', action: 'help' }
      ]
    }
  }
}

function parseResponseWithQuickReplies(fullResponse) {
  try {
    // Look for RESPONSE: and QUICK_REPLIES: sections
    const responsePart = fullResponse.split('RESPONSE:')[1]
    const quickRepliesPart = fullResponse.split('QUICK_REPLIES:')[1]
    
    let content = ''
    let quickReplies = []

    if (responsePart) {
      // Extract content between RESPONSE: and QUICK_REPLIES:
      content = responsePart.split('QUICK_REPLIES:')[0]?.trim() || responsePart.trim()
    } else {
      // If no RESPONSE: marker, use everything before QUICK_REPLIES:
      content = fullResponse.split('QUICK_REPLIES:')[0]?.trim() || fullResponse
    }

    if (quickRepliesPart) {
      try {
        // Clean up the JSON string
        let jsonString = quickRepliesPart.trim()
        
        // Remove any trailing text after the JSON array
        const jsonEnd = jsonString.lastIndexOf(']')
        if (jsonEnd !== -1) {
          jsonString = jsonString.substring(0, jsonEnd + 1)
        }
        
        quickReplies = JSON.parse(jsonString)
        
        // Validate the structure
        if (!Array.isArray(quickReplies)) {
          throw new Error('Quick replies is not an array')
        }
        
        // Ensure each quick reply has required fields
        quickReplies = quickReplies.filter(reply => 
          reply && reply.id && reply.text && reply.action
        ).slice(0, 3) // Limit to 3 buttons
        
      } catch (e) {
        console.log('Could not parse quick replies JSON:', e.message)
        quickReplies = getDefaultQuickReplies()
      }
    } else {
      quickReplies = getDefaultQuickReplies()
    }

    // If we still got the raw JSON in content, clean it up
    if (content.includes('QUICK_REPLIES:')) {
      content = content.split('QUICK_REPLIES:')[0]?.trim() || content
    }

    return { content: content.trim(), quickReplies }
  } catch (error) {
    console.error('Error parsing response:', error)
    return {
      content: fullResponse.split('QUICK_REPLIES:')[0]?.trim() || fullResponse,
      quickReplies: getDefaultQuickReplies()
    }
  }
}

function getDefaultQuickReplies() {
  return [
    { id: 'more', text: '📖 Tell me more', action: 'more_info' },
    { id: 'help', text: '❓ Need help?', action: 'help' },
    { id: 'continue', text: '▶️ Continue', action: 'continue' }
  ]
}

function getMockResponse(userMessage) {
  const responses = [
    "That's a great question! I'd be happy to help you with that.",
    "I understand what you're looking for. Let me provide some guidance.",
    "Interesting point! Here's what I think about that.",
    "Based on your question, here are some suggestions.",
    "Great question! Let me break this down for you."
  ]
  
  if (userMessage.toLowerCase().includes('help')) {
    return "I'm here to help! I can assist with various tasks including answering questions, providing information, and offering suggestions. What specific area would you like help with?"
  }
  
  return responses[Math.floor(Math.random() * responses.length)]
}

function getMockResponseWithQuickReplies(userMessage) {
  const mockContent = getMockResponse(userMessage)
  const quickReplies = [
    { id: 'more', text: '📖 Tell me more', action: 'more_info' },
    { id: 'examples', text: '📝 Show examples', action: 'examples' },
    { id: 'help', text: '❓ Get help', action: 'help' }
  ]
  
  if (userMessage.toLowerCase().includes('help')) {
    return {
      content: mockContent,
      quickReplies: [
        { id: 'coding', text: '💻 Coding help', action: 'coding' },
        { id: 'writing', text: '✍️ Writing help', action: 'writing' },
        { id: 'general', text: '🎯 General questions', action: 'general' }
      ]
    }
  }
  
  return { content: mockContent, quickReplies }
}

export async function getAdvancedChatResponse(
  messages,
  systemPrompt = "You are an advanced AI assistant with deep reasoning capabilities. Provide thoughtful, detailed, and nuanced responses."
) {
  if (!groq) {
    return getMockResponse(messages[messages.length - 1]?.content || '')
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      ...ADVANCED_TEXT_CONFIG
    })

    const content = completion.choices[0]?.message?.content || ''
    return content || "I apologize, but I couldn't generate a response. Please try again."
  } catch (error) {
    console.error('Error calling Groq Advanced:', error)
    return "I apologize, but I'm having trouble with advanced processing. Please try again later."
  }
}

export async function transcribeAudio(audioFile) {
  if (!groq) {
    return "Audio transcription requires a Groq API key. This is a mock transcription."
  }

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      temperature: 0.2,
      response_format: "json"
    })

    return transcription.text || "Could not transcribe audio."
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return "Sorry, I couldn't transcribe the audio. Please try again."
  }
}

export async function textToSpeech(text, voice = "jennifer", speed = 1.0) {
  if (!groq) {
    return "Text-to-speech requires a Groq API key. This is a mock audio response."
  }

  try {
    const audioResponse = await groq.tts.synthesize({
      text: text,
      model: "playai-tts",
      voice: voice,
      speed: speed,
      response_format: "mp3"
    })

    return audioResponse.audio_url || "Could not generate audio."
  } catch (error) {
    console.error('Error with text-to-speech:', error)
    return "Sorry, I couldn't convert the text to speech. Please try again."
  }
}

export async function generateSpeech(text, voice = "jennifer", speed = 1.0) {
  if (!groq) {
    throw new Error("Text-to-speech requires a Groq API key.")
  }

  try {
    const speech = await groq.audio.speech.create({
      model: "playai-tts",
      input: text,
      voice: voice,
      speed: speed,
      response_format: "mp3"
    })

    // Return the audio as a blob or buffer
    return speech
  } catch (error) {
    console.error('Error generating speech:', error)
    throw new Error("Sorry, I couldn't generate speech. Please try again.")
  }
}

export async function generateSpeechFromResponse(responseText, voice = "jennifer") {
  // Clean the response text for TTS
  let cleanText = responseText
    .replace(/RESPONSE:\s*/g, '')
    .replace(/QUICK_REPLIES:.*$/s, '')
    .replace(/[#*_`]/g, '')
    .replace(/\[.*?\]/g, '')
    .trim()

  // Limit text length for TTS (most TTS services have limits)
  if (cleanText.length > 500) {
    cleanText = cleanText.substring(0, 500) + "..."
  }

  return generateSpeech(cleanText, voice)
}

// Available voices for PlayAI Dialog
export const AVAILABLE_VOICES = [
  "jennifer", "ryan", "alex", "sarah", "michael", "emma", "david", "sophie"
]

export { TTS_CONFIG }

export async function analyzeFileContent(fileType, fileName) {
  const prompts = {
    'pdf': `Analyze this PDF document. Provide a summary of its content and suggest relevant questions I could ask about it.`,
    'document': `Analyze this document. What type of document is this and what are the key topics covered?`,
    'audio': `I've shared an audio file. Once transcribed, please analyze its content and provide insights.`,
    'video': `I've shared a video file. Please help me understand what kind of analysis or processing you can provide.`,
    'default': `I've shared a file named "${fileName}". How can you help me work with this type of file?`
  }

  return prompts[fileType] || prompts['default']
}

export async function getContextualResponse(messages, context = 'general') {
  const contextPrompts = {
    'technical': 'You are a technical expert. Provide detailed, accurate technical information with examples and best practices.',
    'creative': 'You are a creative assistant. Help with brainstorming, creative writing, and innovative solutions.',
    'educational': 'You are an educational tutor. Explain concepts clearly with examples and encourage learning.',
    'business': 'You are a business consultant. Provide strategic insights and practical business advice.',
    'general': 'You are a helpful AI assistant. Provide clear, comprehensive, and useful responses.'
  }

  const systemPrompt = contextPrompts[context] || contextPrompts['general']
  
  if (context === 'technical' || context === 'business') {
    return getAdvancedChatResponse(messages, systemPrompt)
  } else {
    return getChatResponse(messages, systemPrompt)
  }
}
