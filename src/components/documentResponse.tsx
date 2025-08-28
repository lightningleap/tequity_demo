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
  AlertTriangle,
  Clock
} from 'lucide-react'
import { dataRoomAPI, APIQuestionResponse } from '../service/api'

interface DocumentResponse {
  answer: string
  sources?: Array<{
    file_id: string
    file_name: string
    download_url: string
    category: string
    chunk_point_id: string
  }>
  context?: Array<{
    id: string
    text: string
    category: string
    source_file: string
    row_number: number
    sheet_name?: string
    score: number
  }>
  category?: string
  timestamp?: string
}

interface ChatMessage {
  id: number
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  documentResponse?: DocumentResponse
  isError?: boolean
  quickReplies?: Array<{
    id: string
    text: string
    action: string
  }>
}

const DocumentChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI assistant with access to your DataRoom documents. I can answer questions about your uploaded files, analyze financial data, and help you find specific information across all your documents. What would you like to know?',
      timestamp: new Date(),
      quickReplies: [
        { id: 'example1', text: 'What\'s in my documents?', action: 'list_files' },
        { id: 'example2', text: 'Financial summary', action: 'financial_summary' },
        { id: 'example3', text: 'Show me revenue data', action: 'revenue_query' }
      ]
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [expandedResponses, setExpandedResponses] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp)
  }

  const askQuestion = async (query: string): Promise<DocumentResponse | null> => {
    try {
      const apiResponse: APIQuestionResponse = await dataRoomAPI.askQuestion(query)
      
      return {
        answer: apiResponse.answer,
        sources: apiResponse.sources,
        context: apiResponse.context,
        category: apiResponse.category,
        timestamp: apiResponse.timestamp
      }
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
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
      const documentResponse = await askQuestion(currentMessage)
      
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: documentResponse?.answer || 'I received an empty response.',
        timestamp: new Date(),
        documentResponse: documentResponse || undefined,
        quickReplies: generateQuickReplies(documentResponse)
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      let errorMessage = 'I encountered an error while processing your question.'
      
      if (error instanceof Error) {
        if (error.message.includes('Backend service is unavailable')) {
          errorMessage = 'The AI service is currently unavailable. Please check your connection and try again.'
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the AI service. Please check your internet connection.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      const errorBotMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
        quickReplies: [
          { id: 'retry', text: 'Try again', action: 'retry' },
          { id: 'help', text: 'Get help', action: 'help' }
        ]
      }
      setMessages(prev => [...prev, errorBotMessage])
    }
    
    setIsTyping(false)
  }

  const generateQuickReplies = (response: DocumentResponse | null) => {
    if (!response) return []

    const replies = []

    if (response.sources && response.sources.length > 0) {
      replies.push({ id: 'sources', text: 'Show sources', action: 'show_sources' })
    }

    if (response.context && response.context.length > 0) {
      replies.push({ id: 'context', text: 'More details', action: 'show_context' })
    }

    if (response.category) {
      replies.push({ id: 'category', text: `More about ${response.category}`, action: 'category_query' })
    }

    replies.push({ id: 'continue', text: 'Ask another question', action: 'continue' })

    return replies
  }

  const handleQuickReply = async (action: string, text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      let botResponse: string
      let quickReplies = []

      switch (action) {
        case 'help':
          botResponse = `I can help you with:\n\n• Answering questions about your uploaded documents\n• Analyzing financial data and trends\n• Finding specific information across all files\n• Comparing data between different documents\n• Summarizing key insights from your data\n\nTry asking specific questions like:\n• "What was our revenue last quarter?"\n• "Show me customer data"\n• "Summarize financial performance"`
          quickReplies = [
            { id: 'example1', text: 'Revenue analysis', action: 'revenue_query' },
            { id: 'example2', text: 'Customer data', action: 'customer_query' },
            { id: 'example3', text: 'Document summary', action: 'summary_query' }
          ]
          break

        case 'list_files':
          botResponse = "Let me check what documents you have uploaded..."
          // This would trigger a real API call to list files
          break

        case 'financial_summary':
          botResponse = "Analyzing your financial documents..."
          // This would trigger a specific financial query
          break

        case 'revenue_query':
          botResponse = "What specific revenue information would you like to know? For example:\n• Total revenue for a specific period\n• Revenue by product or category\n• Revenue trends over time"
          quickReplies = [
            { id: 'total_revenue', text: 'Total revenue', action: 'total_revenue' },
            { id: 'revenue_trends', text: 'Revenue trends', action: 'revenue_trends' }
          ]
          break

        case 'retry':
          botResponse = "Please try asking your question again. I'm ready to help!"
          quickReplies = [
            { id: 'help', text: 'What can you do?', action: 'help' }
          ]
          break

        default:
          botResponse = "I'm ready to answer questions about your documents. What would you like to know?"
          quickReplies = [
            { id: 'help', text: 'What can you do?', action: 'help' }
          ]
      }

      const botMessage: ChatMessage = {
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

  const renderDocumentResponse = (message: ChatMessage) => {
    if (!message.documentResponse) return null

    const { documentResponse } = message
    const isExpanded = expandedResponses[message.id]

    return (
      <Card className="mt-3 bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              Document Sources
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                AI Processed
              </Badge>
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
            {/* Category Information */}
            {documentResponse.category && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Category:</span>
                <Badge variant="secondary" className="text-xs">
                  {documentResponse.category}
                </Badge>
              </div>
            )}

            {/* Timestamp */}
            {documentResponse.timestamp && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Query Time:</span>
                <span className="font-medium text-xs">
                  {new Date(documentResponse.timestamp).toLocaleString()}
                </span>
              </div>
            )}

            {/* Sources */}
            {documentResponse.sources && documentResponse.sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Source Documents</span>
                {documentResponse.sources.map((source, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{source.file_name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                    {source.category && (
                      <Badge variant="outline" className="text-xs">
                        {source.category}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Context Details */}
            {documentResponse.context && documentResponse.context.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Context Matches</span>
                {documentResponse.context.slice(0, 3).map((contextItem, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Quote className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {contextItem.row_number && (
                            <Badge variant="outline" className="text-xs">
                              Row {contextItem.row_number}
                            </Badge>
                          )}
                          {contextItem.sheet_name && (
                            <Badge variant="outline" className="text-xs">
                              {contextItem.sheet_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {contextItem.score && (
                        <Badge variant="secondary" className="text-xs">
                          {(contextItem.score * 100).toFixed(0)}% match
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {contextItem.text.length > 200 
                        ? `${contextItem.text.substring(0, 200)}...`
                        : contextItem.text}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      From: {contextItem.source_file}
                    </div>
                  </div>
                ))}
                {documentResponse.context.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    ... and {documentResponse.context.length - 3} more context matches
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarFallback className="bg-pink-600 text-white">
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
                    <AvatarFallback className={`text-white ${message.isError ? 'bg-red-500' : 'bg-pink-600'}`}>
                      {message.isError ? <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" /> : <Bot className="h-3 w-3 md:h-4 md:w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] md:max-w-[75%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                    message.type === 'user' 
                      ? 'bg-gray-500 text-white ml-auto' 
                      : message.isError
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-muted'
                  }`}>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.documentResponse && (
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
                    <AvatarFallback className="bg-pink-500 text-white">
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
                <AvatarFallback className="bg-pink-600 text-white">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-3 py-2 md:px-4 md:py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                  <span className="text-xs md:text-sm text-muted-foreground">
                    AI is analyzing your documents...
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
                placeholder="Ask about your documents... (e.g., 'What was our profit this year?')"
                className="h-9"
                disabled={isTyping}
              />
            </div>
            
            <Button 
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="h-9 w-9 p-0 bg-pink-600 hover:bg-pink-700"
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

export default DocumentChatBot