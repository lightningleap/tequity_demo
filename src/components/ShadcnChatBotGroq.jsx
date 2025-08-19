import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Paperclip, 
  Image, 
  Mic, 
  MicOff,
  Bot,
  User,
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react'
import { 
  getChatResponseWithQuickReplies, 
  getVisionChatResponse, 
  generateSpeechFromResponse,
  transcribeAudio,
  AVAILABLE_VOICES 
} from '../services/groqService'

const ShadcnChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant powered by Groq\'s latest models. I can help with questions, analyze images, transcribe audio, and even speak my responses aloud using text-to-speech. How can I assist you today?',
      timestamp: new Date(),
      quickReplies: [
        { id: 'help', text: '❓ Get Help', action: 'help' },
        { id: 'features', text: '✨ Show Features', action: 'features' },
        { id: 'models', text: '🤖 About Models', action: 'models' }
      ]
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState('jennifer')
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [isTranscribing, setIsTranscribing] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check microphone permissions on component mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' })
        console.log('Microphone permission:', permissionStatus.state)
      } catch (error) {
        console.log('Microphone permission check not supported')
      }
    }
    
    checkMicrophonePermission()
  }, [])

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  const convertToGroqMessages = (chatMessages) => {
    return chatMessages
      .filter(msg => msg.type === 'user' || msg.type === 'bot')
      .map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
  }

  const handleTextToSpeech = async (text) => {
    if (!ttsEnabled) return

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }

      setIsSpeaking(true)
      
      const audioBlob = await generateSpeechFromResponse(text, selectedVoice)
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      setCurrentAudio(audio)
      
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.onerror = () => {
        setIsSpeaking(false)
        console.error('Error playing TTS audio')
      }
      
      await audio.play()
    } catch (error) {
      console.error('TTS Error:', error)
      setIsSpeaking(false)
    }
  }

  const toggleTTS = () => {
    if (isSpeaking && currentAudio) {
      currentAudio.pause()
      setIsSpeaking(false)
    }
    setTtsEnabled(!ttsEnabled)
  }

  const stopSpeech = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsSpeaking(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim() || (attachedFile ? `Shared: ${attachedFile.name}` : ''),
      timestamp: new Date(),
      file: attachedFile
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputValue
    const currentFile = attachedFile
    setInputValue('')
    setAttachedFile(null)
    setIsTyping(true)

    try {
      let botResponse

      if (currentFile && currentFile.type.startsWith('image/')) {
        // Handle image analysis
        const imageMessages = [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: currentMessage || 'Please analyze this image and tell me what you see.'
            },
            {
              type: 'image_url',
              image_url: {
                url: currentFile.url
              }
            }
          ]
        }]

        const visionResponse = await getVisionChatResponse(imageMessages)
        botResponse = {
          content: visionResponse,
          quickReplies: [
            { id: 'more_details', text: '🔍 More details', action: 'more_details' },
            { id: 'questions', text: '❓ Ask questions', action: 'questions' },
            { id: 'continue', text: '▶️ Continue chat', action: 'continue' }
          ]
        }
      } else if (currentFile && currentFile.type.startsWith('audio/')) {
        // Handle audio transcription (should already be handled in handleFileUpload, but just in case)
        try {
          const transcription = await transcribeAudio(currentFile)
          const transcribedText = transcription || 'Could not transcribe audio'
          
          const chatHistory = convertToGroqMessages(messages)
          chatHistory.push({ role: 'user', content: `Audio transcription: "${transcribedText}". ${currentMessage || 'Please respond to this audio message.'}` })
          
          botResponse = await getChatResponseWithQuickReplies(chatHistory)
        } catch (error) {
          botResponse = {
            content: 'Sorry, I had trouble processing the audio file.',
            quickReplies: [
              { id: 'retry', text: '🔄 Try again', action: 'retry' },
              { id: 'help', text: '❓ Get help', action: 'help' }
            ]
          }
        }
      } else {
        // Handle regular text chat
        const chatHistory = convertToGroqMessages(messages)
        chatHistory.push({ role: 'user', content: currentMessage })
        
        botResponse = await getChatResponseWithQuickReplies(chatHistory)
        
        // Fallback: if response still contains raw JSON, clean it up
        if (botResponse.content.includes('QUICK_REPLIES:')) {
          const cleanContent = botResponse.content.split('QUICK_REPLIES:')[0]?.trim()
          if (cleanContent) {
            botResponse.content = cleanContent
          }
          
          // Provide default quick replies if parsing failed
          if (!botResponse.quickReplies || botResponse.quickReplies.length === 0) {
            botResponse.quickReplies = [
              { id: 'more', text: '📖 Tell me more', action: 'more_info' },
              { id: 'continue', text: '▶️ Continue', action: 'continue' },
              { id: 'help', text: '❓ Need help?', action: 'help' }
            ]
          }
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        quickReplies: botResponse.quickReplies
      }
      
      setMessages(prev => [...prev, botMessage])
      handleTextToSpeech(botResponse.content) // Play TTS for bot response
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        quickReplies: [
          { id: 'retry', text: '🔄 Retry', action: 'retry' },
          { id: 'help', text: '❓ Get Help', action: 'help' }
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsTyping(false)
  }

  const handleQuickReply = async (action, text) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      isQuickReply: true
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const chatHistory = convertToGroqMessages(messages)
      chatHistory.push({ role: 'user', content: text })
      
      const botResponse = await getChatResponseWithQuickReplies(chatHistory)
      
      // Fallback: clean up any remaining raw JSON
      if (botResponse.content.includes('QUICK_REPLIES:')) {
        const cleanContent = botResponse.content.split('QUICK_REPLIES:')[0]?.trim()
        if (cleanContent) {
          botResponse.content = cleanContent
        }
        
        if (!botResponse.quickReplies || botResponse.quickReplies.length === 0) {
          botResponse.quickReplies = [
            { id: 'more', text: '📖 Tell me more', action: 'more_info' },
            { id: 'continue', text: '▶️ Continue', action: 'continue' }
          ]
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        quickReplies: botResponse.quickReplies
      }
      
      setMessages(prev => [...prev, botMessage])
      handleTextToSpeech(botResponse.content) // Play TTS for bot response
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        quickReplies: [
          { id: 'retry', text: '🔄 Retry', action: 'retry' },
          { id: 'continue', text: '▶️ Continue', action: 'continue' }
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsTyping(false)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      
      // Handle audio files for transcription
      if (file.type.startsWith('audio/')) {
        setIsTranscribing(true)
        try {
          const transcription = await transcribeAudio(file)
          if (transcription && transcription.trim()) {
            setInputValue(prev => prev + (prev ? ' ' : '') + transcription)
          }
        } catch (error) {
          console.error('Error transcribing uploaded audio:', error)
          alert('Error transcribing audio file. Please try again.')
        } finally {
          setIsTranscribing(false)
        }
        return
      }
      
      // Handle other files (images, documents)
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      })
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000, // Optimal for Whisper
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          } 
        })
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus' // Best format for web
        })
        
        const chunks = []
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' })
          
          // Convert to WAV for better Whisper compatibility
          const audioFile = new File([audioBlob], 'voice_recording.webm', { 
            type: 'audio/webm' 
          })
          
          await handleVoiceTranscription(audioFile)
          
          // Cleanup
          stream.getTracks().forEach(track => track.stop())
        }
        
        setMediaRecorder(recorder)
        setAudioChunks(chunks)
        recorder.start(250) // Collect data every 250ms for real-time feel
        setIsRecording(true)
        
      } catch (error) {
        console.error('Error accessing microphone:', error)
        alert('Could not access microphone. Please check permissions.')
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        setIsRecording(false)
      }
    }
  }

  const handleVoiceTranscription = async (audioFile) => {
    setIsTranscribing(true)
    try {
      const transcription = await transcribeAudio(audioFile)
      
      if (transcription && transcription.trim()) {
        setInputValue(prev => prev + (prev ? ' ' : '') + transcription)
      } else {
        console.warn('No transcription received')
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert('Error transcribing audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarImage src="/api/placeholder/40/40" />
              <AvatarFallback className="bg-blue-500 text-white">
                <Bot className="h-4 w-4 md:h-5 md:w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold truncate">AI ChatBot</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Powered by Groq • Always online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="text-xs border rounded px-2 py-1 bg-background"
              title="Select voice for text-to-speech"
            >
              {AVAILABLE_VOICES.map(voice => (
                <option key={voice} value={voice}>
                  {voice.charAt(0).toUpperCase() + voice.slice(1)}
                </option>
              ))}
            </select>
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-2 md:p-4">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex gap-2 md:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                    <AvatarImage src="/api/placeholder/32/32" />
                    <AvatarFallback className="bg-blue-500 text-white">
                      <Bot className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] md:max-w-[75%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-muted'
                  } ${message.isQuickReply ? 'ring-2 ring-blue-200' : ''}`}>
                    {message.file && (
                      <div className="mb-2 p-2 bg-white/10 rounded-lg">
                        {message.file.type.startsWith('image/') ? (
                          <img 
                            src={message.file.url} 
                            alt={message.file.name}
                            className="max-w-full h-auto rounded max-h-32 md:max-h-48 object-cover"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm truncate">{message.file.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {message.type === 'bot' && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTextToSpeech(message.content)}
                          className="h-6 w-6 p-0 ml-2"
                          title="Listen to this message"
                          disabled={isSpeaking}
                        >
                          {isSpeaking ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {message.quickReplies && (
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
                      {message.quickReplies.map((reply) => (
                        <Button
                          key={reply.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReply(reply.action, reply.text)}
                          className="text-xs h-6 md:h-7 px-2 md:px-3 rounded-full bg-background/50 hover:bg-background border-muted-foreground/20 hover:border-muted-foreground/40 transition-all"
                        >
                          {reply.text}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                    <AvatarImage src="/api/placeholder/32/32" />
                    <AvatarFallback className="bg-gray-500 text-white">
                      <User className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-3 py-2 md:px-4 md:py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="text-xs md:text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t bg-card">
        <div className="p-2 md:p-4 max-w-4xl mx-auto">
          {attachedFile && (
            <div className="mb-3 p-2 md:p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {attachedFile.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFile(null)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                >
                  Remove
                </Button>
              </div>
              
              {attachedFile.type.startsWith('image/') && (
                <img 
                  src={attachedFile.url} 
                  alt={attachedFile.name}
                  className="mt-2 max-w-full h-auto rounded max-h-24 md:max-h-32 object-cover"
                />
              )}
            </div>
          )}
          
          {/* Real-time transcription indicator */}
          {isTranscribing && (
            <div className="mb-3 p-2 md:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-700">Processing audio...</span>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="mb-3 p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-700">Recording... speak now</span>
                <div className="flex space-x-1 ml-auto">
                  <div className="h-3 w-1 bg-red-400 rounded animate-pulse" style={{animationDelay: '0ms'}}></div>
                  <div className="h-4 w-1 bg-red-500 rounded animate-pulse" style={{animationDelay: '100ms'}}></div>
                  <div className="h-3 w-1 bg-red-400 rounded animate-pulse" style={{animationDelay: '200ms'}}></div>
                  <div className="h-5 w-1 bg-red-600 rounded animate-pulse" style={{animationDelay: '300ms'}}></div>
                  <div className="h-2 w-1 bg-red-300 rounded animate-pulse" style={{animationDelay: '400ms'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-1 md:space-x-2">
            <div className="flex space-x-0.5 md:space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 p-0"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 p-0"
                title="Upload image"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
                className="h-9 w-9 p-0"
                title={isRecording ? "Stop recording" : "Voice message"}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant={ttsEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleTTS}
                className="h-9 w-9 p-0"
                title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
              >
                {isSpeaking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : ttsEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex-1 min-w-0">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isTranscribing 
                    ? "Transcribing audio..." 
                    : isRecording 
                    ? "Recording... (speak now)" 
                    : "Type your message..."
                }
                className={`${isRecording ? 'ring-2 ring-red-500' : ''} h-9`}
                disabled={isRecording || isTyping || isTranscribing}
              />
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={(!inputValue.trim() && !attachedFile) || isTyping}
              className="h-9 w-9 p-0 bg-blue-500 hover:bg-blue-600"
              title="Send message"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </div>
  )
}

export default ShadcnChatBot
