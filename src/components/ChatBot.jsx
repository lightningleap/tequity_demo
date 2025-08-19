import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  PaperPlaneIcon, 
  PaperClipIcon, 
  ImageIcon, 
  SpeakerLoudIcon,
  PersonIcon,
  ChatBubbleIcon,
  MicrophoneIcon,
  StopIcon
} from "@radix-ui/react-icons"
import { format } from "date-fns"
import { VoiceRecognition, getFileType, formatFileSize, simulateOpenAICall } from "../utils/chatUtils"

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant. I can help you with text, images, voice, and files. How can I assist you today?',
      timestamp: new Date(),
      buttons: [
        { id: 'help', text: '❓ Get Help', action: 'help' },
        { id: 'features', text: '⚡ Show Features', action: 'features' },
        { id: 'demo', text: '🚀 Try Demo', action: 'demo' }
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const fileInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const voiceRecognition = useRef(new VoiceRecognition())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateTyping = () => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
  }

  const generateBotResponse = (userMessage) => {
    const responses = [
      {
        content: "That's an interesting question! Let me help you with that.",
        buttons: [
          { id: 'more', text: 'Tell me more', action: 'more_info' },
          { id: 'different', text: 'Try different approach', action: 'different' }
        ]
      },
      {
        content: "I understand what you're looking for. Here are some options:",
        buttons: [
          { id: 'option1', text: 'Option 1', action: 'option1' },
          { id: 'option2', text: 'Option 2', action: 'option2' },
          { id: 'option3', text: 'Option 3', action: 'option3' }
        ]
      },
      {
        content: "Great question! I can help you with several things.",
        buttons: [
          { id: 'technical', text: '🔧 Technical Help', action: 'technical' },
          { id: 'creative', text: '🎨 Creative Ideas', action: 'creative' },
          { id: 'analysis', text: '📊 Data Analysis', action: 'analysis' }
        ]
      }
    ]

    if (userMessage.toLowerCase().includes('help')) {
      return {
        content: "I'm here to help! I can assist with various tasks, answer questions, and provide recommendations. What would you like to know?",
        buttons: [
          { id: 'faq', text: '❓ FAQ', action: 'faq' },
          { id: 'contact', text: '📞 Contact Support', action: 'contact' },
          { id: 'guide', text: '📖 User Guide', action: 'guide' }
        ]
      }
    }

    if (userMessage.toLowerCase().includes('feature')) {
      return {
        content: "Here are my key features: 💬 Text chat, 🖼️ Image sharing, 🎵 Voice input, 📎 File attachments, and interactive buttons!",
        buttons: [
          { id: 'demo', text: '🚀 Try Demo', action: 'demo' },
          { id: 'learn_more', text: '📚 Learn More', action: 'learn_more' }
        ]
      }
    }

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage || (selectedFile ? `Shared: ${selectedFile.name}` : ''),
      timestamp: new Date(),
      file: selectedFile
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputMessage
    const currentFile = selectedFile
    setInputMessage('')
    setSelectedFile(null)
    
    simulateTyping()

    try {
      // Use the utility function to simulate OpenAI API call
      const botResponse = await simulateOpenAICall([userMessage], currentFile)
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date(),
        buttons: botResponse.buttons
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        buttons: [
          { id: 'retry', text: '🔄 Retry', action: 'retry' },
          { id: 'help', text: '❓ Get Help', action: 'help' }
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsTyping(false)
  }

  const handleButtonClick = (action, buttonText) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `Clicked: ${buttonText}`,
      timestamp: new Date(),
      isButtonClick: true
    }

    setMessages(prev => [...prev, userMessage])
    simulateTyping()

    setTimeout(() => {
      let botResponse = `You selected "${buttonText}". `
      
      switch (action) {
        case 'help':
          botResponse += "Here's how I can help you: I can answer questions, provide information, help with tasks, and much more!"
          break
        case 'features':
          botResponse += "My features include: intelligent conversations, file sharing, voice input, interactive buttons, and multimedia support!"
          break
        case 'technical':
          botResponse += "I can help with programming, troubleshooting, system configuration, and technical documentation."
          break
        case 'creative':
          botResponse += "I can assist with brainstorming, content creation, design ideas, and creative problem-solving."
          break
        default:
          botResponse += "Great choice! How else can I assist you today?"
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        buttons: [
          { id: 'continue', text: 'Continue Chat', action: 'continue' },
          { id: 'new_topic', text: 'New Topic', action: 'new_topic' }
        ]
      }
      
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        fileType: getFileType(file),
        url: URL.createObjectURL(file),
        formattedSize: formatFileSize(file.size)
      })
    }
  }

  const startVoiceRecording = () => {
    if (!voiceRecognition.current.isSupported()) {
      alert('Voice recognition is not supported in your browser')
      return
    }

    setIsRecording(true)
    setVoiceTranscript('')
    
    voiceRecognition.current.start(
      (transcript, isFinal) => {
        setVoiceTranscript(transcript)
        if (isFinal) {
          setInputMessage(prev => prev + ' ' + transcript)
          setIsRecording(false)
          setVoiceTranscript('')
        }
      },
      (error) => {
        console.error('Voice recognition error:', error)
        setIsRecording(false)
        setVoiceTranscript('')
        alert('Voice recognition error: ' + error)
      }
    )
  }

  const stopVoiceRecording = () => {
    voiceRecognition.current.stop()
    setIsRecording(false)
    if (voiceTranscript) {
      setInputMessage(prev => prev + ' ' + voiceTranscript)
    }
    setVoiceTranscript('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderMessage = (message) => {
    const isUser = message.type === 'user'
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <ChatBubbleIcon className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
          } ${message.isButtonClick ? 'border-2 border-blue-300' : ''}`}>
            
            {message.file && (
              <div className="mb-2 p-2 bg-white/20 rounded-lg">
                {message.file.fileType === 'image' ? (
                  <img 
                    src={message.file.url} 
                    alt={message.file.name}
                    className="max-w-full h-auto rounded max-h-64 object-cover"
                  />
                ) : message.file.fileType === 'audio' ? (
                  <div className="flex items-center gap-2">
                    <SpeakerLoudIcon className="w-4 h-4" />
                    <audio controls className="max-w-full">
                      <source src={message.file.url} type={message.file.type} />
                    </audio>
                  </div>
                ) : message.file.fileType === 'video' ? (
                  <video controls className="max-w-full h-auto rounded max-h-64">
                    <source src={message.file.url} type={message.file.type} />
                  </video>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <PaperClipIcon className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{message.file.name}</p>
                      <p className="text-xs text-gray-500">{message.file.formattedSize}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          
          {message.buttons && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.buttons.map((button) => (
                <Button
                  key={button.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleButtonClick(button.action, button.text)}
                  className="text-xs"
                >
                  {button.text}
                </Button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {format(message.timestamp, 'HH:mm')}
          </p>
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
            <PersonIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <ChatBubbleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-gray-100">AI ChatterBot</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Always here to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(renderMessage)}
          
          {isTyping && (
            <div className="flex gap-3 justify-start mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <ChatBubbleIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedFile.fileType === 'image' && <ImageIcon className="w-4 h-4 text-blue-500" />}
                {selectedFile.fileType === 'audio' && <SpeakerLoudIcon className="w-4 h-4 text-green-500" />}
                {(selectedFile.fileType === 'document' || selectedFile.fileType === 'file') && <PaperClipIcon className="w-4 h-4 text-gray-500" />}
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                  <p className="text-xs text-gray-500">{selectedFile.formattedSize}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
            
            {selectedFile.fileType === 'image' && (
              <img 
                src={selectedFile.url} 
                alt={selectedFile.name}
                className="mt-2 max-w-full h-auto rounded max-h-32 object-cover"
              />
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="p-2"
            >
              <PaperClipIcon className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="p-2"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => audioInputRef.current?.click()}
              className="p-2"
              title="Upload Audio File"
            >
              <SpeakerLoudIcon className="w-4 h-4" />
            </Button>
            
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className="p-2"
              title={isRecording ? "Stop Recording" : "Start Voice Recording"}
            >
              {isRecording ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
            </Button>
          </div>
          
          <Textarea
            value={inputMessage + (voiceTranscript ? ` ${voiceTranscript}` : '')}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Listening..." : "Type your message... (Press Enter to send)"}
            className={`flex-1 min-h-[44px] max-h-32 resize-none ${isRecording ? 'ring-2 ring-red-500' : ''}`}
            disabled={isRecording}
          />
          
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && !selectedFile}
            className="self-end"
          >
            <PaperPlaneIcon className="w-4 h-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />
        
        <input
          ref={audioInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="audio/*"
        />
      </div>
    </div>
  )
}

export default ChatBot
