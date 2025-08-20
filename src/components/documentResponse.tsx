import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Send, 
  Bot,
  User,
  Loader2,
  FileText,
  Database,
  ExternalLink,
  Quote,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react'
import { dataRoomAPI, APIQuestionResponse } from '../service/api'

// Enhanced response interface for document-aware responses
interface DocumentResponse {
  answer: string
  documentName?: string
  pageNumber?: number
  context: string
  confidence: number
  sourceType: 'document' | 'metadata' | 'general'
  relatedDocuments?: Array<{
    name: string
    id: string
    relevance: number
  }>
  sources?: Array<{
    file_id: string
    file_name: string
    download_url: string
    category: string
  }>
}

interface EnhancedMessage {
  id: number
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  quickReplies?: Array<{
    id: string
    text: string
    action: string
  }>
  documentResponse?: DocumentResponse
  isQuickReply?: boolean
  isFromAPI?: boolean
}

type ConnectionStatus = 'online' | 'offline' | 'local-only';

const DocumentAwareChatBot = () => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant with access to your DataRoom documents. I can answer questions about your uploaded files, analyze financial data, and help you find specific information across all your documents. What would you like to know?',
      timestamp: new Date(),
      quickReplies: [
        { id: 'help', text: 'What can you do?', action: 'help' },
        { id: 'documents', text: 'Show my documents', action: 'list_documents' },
        { id: 'financial', text: 'Financial summary', action: 'financial_summary' }
      ]
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [expandedResponses, setExpandedResponses] = useState<Record<number, boolean>>({})
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    checkConnectionStatus()
    const interval = setInterval(checkConnectionStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkConnectionStatus = async () => {
    const isOnline = navigator.onLine
    
    if (!isOnline) {
      setConnectionStatus('offline')
      return
    }
    
    try {
      const isBackendHealthy = await dataRoomAPI.checkHealth()
      if (isBackendHealthy) {
        setConnectionStatus('online')
      } else {
        setConnectionStatus('local-only')
      }
    } catch {
      setConnectionStatus('local-only')
    }
  }

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  // Enhanced function with real API integration
  const getDocumentAwareResponse = async (query: string): Promise<DocumentResponse> => {
    if (connectionStatus === 'online') {
      try {
        const apiResponse: APIQuestionResponse = await dataRoomAPI.askQuestion(query)
        
        return {
          answer: apiResponse.answer,
          documentName: apiResponse.sources[0]?.file_name,
          pageNumber: apiResponse.context[0]?.row_number,
          context: apiResponse.context.map(c => c.text).join(' '),
          confidence: apiResponse.context[0]?.score || 0,
          sourceType: 'document',
          sources: apiResponse.sources,
          relatedDocuments: apiResponse.sources.slice(1).map(s => ({
            name: s.file_name,
            id: s.file_id,
            relevance: 0.8
          }))
        }
      } catch (apiError) {
        console.error('API request failed, falling back to local search:', apiError)
        return getFallbackResponse(query)
      }
    } else {
      return getFallbackResponse(query)
    }
  }

  const getFallbackResponse = async (query: string): Promise<DocumentResponse> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
      
      // Use IndexedDB search when backend is unavailable
      const searchResults = await dataRoomDB.searchFiles(query)
      
      if (searchResults.length > 0) {
        const firstResult = searchResults[0]
        const contextText = JSON.stringify(firstResult.metadata)
        
        return {
          answer: `Found information in ${firstResult.name}. Note: This is offline mode with limited AI capabilities. For full semantic search and analysis, please ensure backend connection is available.`,
          documentName: firstResult.name,
          context: contextText.substring(0, 300) + (contextText.length > 300 ? '...' : ''),
          confidence: 0.6,
          sourceType: 'metadata'
        }
      }
      
      // Mock responses for common queries when no local data found
      if (query.toLowerCase().includes('profit') || query.toLowerCase().includes('revenue')) {
        return {
          answer: "I don't have access to real-time financial data. Please upload financial documents or connect to the AI backend for detailed analysis.",
          context: "No financial documents found in local storage.",
          confidence: 0.3,
          sourceType: 'general'
        }
      }
      
      if (query.toLowerCase().includes('customer') || query.toLowerCase().includes('client')) {
        return {
          answer: "I don't have access to customer data. Please upload customer-related documents or ensure backend connectivity for comprehensive analysis.",
          context: "No customer documents found in local storage.",
          confidence: 0.3,
          sourceType: 'general'
        }
      }
      
      return {
        answer: "I couldn't find relevant information in your local documents. For the best experience, please ensure you have uploaded relevant documents and that the AI backend is connected.",
        context: "Operating in offline mode with basic search capabilities.",
        confidence: 0.2,
        sourceType: 'general'
      }
    } catch (error) {
      console.error('Fallback search failed:', error)
      return {
        answer: "I'm sorry, I encountered an error while searching your documents. Please try again or check your connection.",
        context: "Search operation failed.",
        confidence: 0.1,
        sourceType: 'general'
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: EnhancedMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentMessage = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      const documentResponse = await getDocumentAwareResponse(currentMessage)
      
      const botMessage: EnhancedMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: documentResponse.answer,
        timestamp: new Date(),
        documentResponse,
        quickReplies: generateQuickReplies(documentResponse),
        isFromAPI: connectionStatus === 'online'
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: EnhancedMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error while searching through your documents. Please try again.',
        timestamp: new Date(),
        quickReplies: [
          { id: 'retry', text: 'Try again', action: 'retry' },
          { id: 'help', text: 'Get help', action: 'help' }
        ]
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setIsTyping(false)
  }

  const generateQuickReplies = (response: DocumentResponse) => {
    const replies = []

    if (response.documentName) {
      replies.push({ id: 'open_doc', text: 'Open document', action: 'open_document' })
    }

    if (response.relatedDocuments && response.relatedDocuments.length > 0) {
      replies.push({ id: 'related', text: 'Show related docs', action: 'show_related' })
    }

    if (response.sourceType === 'document') {
      replies.push({ id: 'more_detail', text: 'More details', action: 'more_details' })
    }

    if (connectionStatus !== 'online') {
      replies.push({ id: 'connect', text: 'Connect to AI', action: 'check_connection' })
    }

    replies.push({ id: 'continue', text: 'Ask another question', action: 'continue' })

    return replies
  }

  const handleQuickReply = async (action: string, text: string) => {
    const userMessage: EnhancedMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      isQuickReply: true
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      let botResponse: string
      let quickReplies = []

      switch (action) {
        case 'help':
          botResponse = `I can help you:\n\n• Answer questions about your uploaded documents\n• Analyze financial data and metrics\n• Find specific information across all files\n• Compare data between different documents\n• Summarize key insights from your data\n\n${
            connectionStatus === 'online' 
              ? 'AI backend is connected - full capabilities available!'
              : 'Currently in offline mode - limited to basic search. Connect to backend for AI analysis.'
          }`
          quickReplies = [
            { id: 'example1', text: 'Revenue analysis', action: 'revenue_example' },
            { id: 'example2', text: 'Customer metrics', action: 'customer_example' },
            { id: 'documents', text: 'List documents', action: 'list_documents' }
          ]
          break

        case 'list_documents':
          try {
            const files = await dataRoomDB.getAllFiles()
            if (files.length > 0) {
              const fileList = files.map(f => `• ${f.name} (${f.category || 'Uncategorized'})`).join('\n')
              botResponse = `Here are your uploaded documents:\n\n${fileList}\n\nYou can ask me questions about any of these files.`
              quickReplies = [
                { id: 'analyze', text: 'Analyze all', action: 'analyze_all' },
                { id: 'financial', text: 'Financial summary', action: 'financial_summary' }
              ]
            } else {
              botResponse = "No documents found in your DataRoom. Please upload some files first to get started."
              quickReplies = [{ id: 'help', text: 'Get help', action: 'help' }]
            }
          } catch (error) {
            botResponse = "I couldn't retrieve your documents. Please make sure some files are uploaded to the DataRoom."
            quickReplies = [{ id: 'help', text: 'Get help', action: 'help' }]
          }
          break

        case 'check_connection':
          await checkConnectionStatus()
          botResponse = connectionStatus === 'online' 
            ? "Connection restored! AI backend is now available with full semantic search capabilities."
            : "Still unable to connect to AI backend. Operating in offline mode with basic search functionality."
          quickReplies = [
            { id: 'help', text: 'What can you do?', action: 'help' },
            { id: 'documents', text: 'Show documents', action: 'list_documents' }
          ]
          break

        case 'financial_summary':
          if (connectionStatus === 'online') {
            botResponse = "Let me analyze your financial documents using AI..."
            // This would trigger a real API call in practice
          } else {
            botResponse = "Basic financial summary from local data:\n\n• Files uploaded to DataRoom\n• Categories identified\n• For detailed AI analysis, please connect to backend\n\nUpload financial documents and connect to AI for comprehensive analysis."
          }
          quickReplies = [
            { id: 'revenue_detail', text: 'Revenue breakdown', action: 'revenue_breakdown' },
            { id: 'customer_detail', text: 'Customer analysis', action: 'customer_analysis' }
          ]
          break

        default:
          botResponse = "Thanks for your interest! Feel free to ask me any questions about your documents."
          quickReplies = [
            { id: 'help', text: 'What can you do?', action: 'help' },
            { id: 'documents', text: 'Show documents', action: 'list_documents' }
          ]
      }

      const botMessage: EnhancedMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        quickReplies
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error handling quick reply:', error)
    }
    
    setIsTyping(false)
  }

  const toggleResponseExpansion = (messageId: number) => {
    setExpandedResponses(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const renderDocumentResponse = (message: EnhancedMessage) => {
    if (!message.documentResponse) return null

    const { documentResponse } = message
    const isExpanded = expandedResponses[message.id]

    return (
      <Card className="mt-3 bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Document Source
              {message.isFromAPI && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  AI Processed
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleResponseExpansion(message.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            {/* Source Information */}
            {documentResponse.documentName && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{documentResponse.documentName}</span>
                {documentResponse.pageNumber && (
                  <Badge variant="secondary" className="text-xs">
                    Row {documentResponse.pageNumber}
                  </Badge>
                )}
                {documentResponse.sources && documentResponse.sources[0] && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                )}
              </div>
            )}

            {/* Confidence Score */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Confidence:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    documentResponse.confidence > 0.7 ? 'bg-green-600' :
                    documentResponse.confidence > 0.4 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${documentResponse.confidence * 100}%` }}
                />
              </div>
              <span className="font-medium">{(documentResponse.confidence * 100).toFixed(0)}%</span>
            </div>

            {/* Context */}
            <div className="bg-white p-3 rounded border">
              <div className="flex items-start gap-2 mb-2">
                <Quote className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">Context</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-6">
                {documentResponse.context}
              </p>
            </div>

            {/* Related Documents */}
            {documentResponse.relatedDocuments && documentResponse.relatedDocuments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Related Documents</h4>
                <div className="space-y-2">
                  {documentResponse.relatedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {(doc.relevance * 100).toFixed(0)}% match
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Type Badge */}
            <div className="flex justify-end">
              <Badge variant={
                documentResponse.sourceType === 'document' ? 'default' :
                documentResponse.sourceType === 'metadata' ? 'secondary' : 'outline'
              } className="text-xs">
                {documentResponse.sourceType === 'document' ? 'Document Content' :
                 documentResponse.sourceType === 'metadata' ? 'Document Metadata' : 'General Knowledge'}
              </Badge>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          icon: <Wifi className="w-2 h-2" />,
          color: 'bg-green-500',
          text: 'AI Connected'
        }
      case 'local-only':
        return {
          icon: <AlertTriangle className="w-2 h-2" />,
          color: 'bg-yellow-500',
          text: 'Local Only'
        }
      default:
        return {
          icon: <WifiOff className="w-2 h-2" />,
          color: 'bg-red-500',
          text: 'Offline'
        }
    }
  }

  const statusDisplay = getConnectionStatusDisplay()

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarFallback className="bg-blue-500 text-white">
                <Bot className="h-4 w-4 md:h-5 md:w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm md:text-lg font-semibold truncate">DataRoom AI Assistant</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Ask questions about your documents
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            <div className={`w-2 h-2 rounded-full mr-1.5 ${statusDisplay.color}`}></div>
            {statusDisplay.text}
          </Badge>
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
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                      {message.isFromAPI && (
                        <Badge variant="outline" className="text-xs">AI</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Document Response Details */}
                  {renderDocumentResponse(message)}
                  
                  {/* Quick Replies */}
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
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gray-500 text-white">
                      <User className="h-3 w-3 md:h-4 md:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-blue-500 text-white">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-3 py-2 md:px-4 md:py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {connectionStatus === 'online' ? 'AI is analyzing documents...' : 'Searching locally...'}
                  </span>
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
          <div className="flex items-end space-x-1 md:space-x-2">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  connectionStatus === 'online' 
                    ? "Ask about your documents... (e.g., 'What was our profit this year?')"
                    : "Ask about your documents... (offline mode - limited capabilities)"
                }
                className="h-9"
                disabled={isTyping}
              />
            </div>
            
            <Button 
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="h-9 w-9 p-0 bg-blue-500 hover:bg-blue-600"
              title="Send message"
            >
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentAwareChatBot