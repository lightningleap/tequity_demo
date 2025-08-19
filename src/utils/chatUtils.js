// Voice recognition utilities
export class VoiceRecognition {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.onResult = null
    this.onError = null
    
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
      
      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        
        if (this.onResult) {
          this.onResult(transcript, event.results[0].isFinal)
        }
      }
      
      this.recognition.onerror = (event) => {
        if (this.onError) {
          this.onError(event.error)
        }
      }
      
      this.recognition.onend = () => {
        this.isListening = false
      }
    }
  }
  
  start(onResult, onError) {
    if (!this.recognition) {
      if (onError) {
        onError('Speech recognition not supported')
      }
      return false
    }
    
    this.onResult = onResult
    this.onError = onError
    this.isListening = true
    this.recognition.start()
    return true
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }
  
  isSupported() {
    return !!this.recognition
  }
}

// File type detection utilities
export const getFileType = (file) => {
  const fileType = file.type.toLowerCase()
  
  if (fileType.startsWith('image/')) {
    return 'image'
  } else if (fileType.startsWith('audio/')) {
    return 'audio'
  } else if (fileType.startsWith('video/')) {
    return 'video'
  } else if (fileType.includes('pdf')) {
    return 'pdf'
  } else if (fileType.includes('document') || fileType.includes('text')) {
    return 'document'
  } else {
    return 'file'
  }
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Simulate OpenAI API call (replace with actual API integration)
export const simulateOpenAICall = async (messages, file = null) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const responses = [
    "I understand your question. Let me provide you with a comprehensive answer.",
    "That's a great point! Here's what I think about that topic.",
    "Based on your input, I can suggest several approaches to consider.",
    "Interesting! Let me break this down for you step by step.",
    "I see what you're looking for. Here are some recommendations.",
    "That's a common question, and I'm happy to help clarify."
  ]
  
  let response = responses[Math.floor(Math.random() * responses.length)]
  
  if (file) {
    const fileType = getFileType(file)
    switch (fileType) {
      case 'image':
        response = "I can see the image you've shared. It looks like an interesting visual. What would you like to know about it?"
        break
      case 'audio':
        response = "I've received your audio file. While I can't process audio directly, I can help you with audio-related questions or transcription needs."
        break
      case 'document':
        response = "I've received your document. I can help you analyze, summarize, or answer questions about text-based content."
        break
      default:
        response = `I've received your ${fileType} file. How can I help you with it?`
    }
  }
  
  return {
    content: response,
    buttons: generateContextualButtons(file)
  }
}

const generateContextualButtons = (file) => {
  if (!file) {
    return [
      { id: 'help', text: '❓ Need Help?', action: 'help' },
      { id: 'examples', text: '📝 Show Examples', action: 'examples' },
      { id: 'features', text: '⚡ Features', action: 'features' }
    ]
  }
  
  const fileType = getFileType(file)
  
  switch (fileType) {
    case 'image':
      return [
        { id: 'analyze', text: '🔍 Analyze Image', action: 'analyze_image' },
        { id: 'describe', text: '📝 Describe', action: 'describe_image' },
        { id: 'extract', text: '📄 Extract Text', action: 'extract_text' }
      ]
    case 'document':
      return [
        { id: 'summarize', text: '📋 Summarize', action: 'summarize' },
        { id: 'questions', text: '❓ Ask Questions', action: 'questions' },
        { id: 'translate', text: '🌐 Translate', action: 'translate' }
      ]
    case 'audio':
      return [
        { id: 'transcribe', text: '✍️ Transcribe', action: 'transcribe' },
        { id: 'analyze_audio', text: '🎵 Analyze Audio', action: 'analyze_audio' }
      ]
    default:
      return [
        { id: 'info', text: 'ℹ️ File Info', action: 'file_info' },
        { id: 'help_file', text: '❓ How to use?', action: 'help_file' }
      ]
  }
}
