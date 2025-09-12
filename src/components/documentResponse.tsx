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
  Clock,
  Search,
  Zap,
  HelpCircle,
  CheckCircle,
  Activity,
  MessageSquare
} from 'lucide-react'

// Types for the streaming data
interface ProcessingStep {
  step: string
  status: 'started' | 'completed' | 'failed'
  message: string
  details: any
  timestamp: string
}

interface SubQueryResult {
  sub_query: string
  relevant_files: Array<[{
    file_id: string
    file_name: string
    category: string
    description: string
  }, number]>
  file_ids: string[]
  context_chunks: Array<{
    text: string
    category: string
    source_file: string
    row_number: number
    original_id: string
    file_id: string
    sheet_name?: string
    relevance_type?: string
    diversity_bonus?: number
  }>
}

interface ProcessingSummary {
  sub_queries: number
  files_analyzed: number
  chunks_processed: number
  answer_generated: boolean
}

interface StreamDetails {
  sources_count: number
  processing_summary: ProcessingSummary
}

interface LiveStreamData {
  type: 'connected' | 'step' | 'complete' | 'error'
  session_id: string
  step?: string
  status?: 'started' | 'completed' | 'failed'
  message?: string
  details?: StreamDetails
  timestamp?: string
  final_result?: {
    original_query: string
    sub_queries: string[]
    sub_query_results: SubQueryResult[]
    final_answer: string
    sources: Array<{
      file_id: string
      file_name: string
      category: string
      description: string
    }>
    processing_timestamp: string
    session_id: string
  }
}

interface DocumentResponse {
  answer: string
  sources?: Array<{
    file_id: string
    file_name: string
    category: string
    description: string
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
  sub_queries?: string[]
  sub_answers?: Array<{
    sub_query: string
    answer: string
    context_chunks?: number
    relevant_files?: Array<[{
      file_id: string
      file_name: string
      category: string
      description: string
    }, number]>
    file_ids?: string[]
    context_chunks_data?: Array<{
      text: string
      category: string
      source_file: string
      row_number: number
      original_id: string
      file_id: string
      sheet_name?: string
      relevance_type?: string
      diversity_bonus?: number
    }>
  }>
  files_searched?: string[]
  optimization_used?: boolean
}

interface ChatMessage {
  id: number
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  documentResponse?: DocumentResponse
  isError?: boolean
  isStreaming?: boolean
  sessionId?: string
  processingSteps?: ProcessingStep[]
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [expandedResponses, setExpandedResponses] = useState<Record<number, boolean>>({})
  const [expandedSubQueries, setExpandedSubQueries] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef(null)
  const eventSourceRef = useRef<EventSource | null>(null)

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

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const cleanupEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const updateMessageProcessingSteps = (messageId: number, newStep: ProcessingStep) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingSteps = msg.processingSteps || []
        const stepIndex = existingSteps.findIndex(s => s.step === newStep.step && s.status === newStep.status)
        
        let updatedSteps
        if (stepIndex >= 0) {
          // Update existing step
          updatedSteps = [...existingSteps]
          updatedSteps[stepIndex] = newStep
        } else {
          // Add new step
          updatedSteps = [...existingSteps, newStep]
        }
        
        return {
          ...msg,
          processingSteps: updatedSteps
        }
      }
      return msg
    }))
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return

    const sessionId = generateSessionId()
    setCurrentSessionId(sessionId)
    
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    const streamingMessage: ChatMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: 'Starting AI analysis...',
      timestamp: new Date(),
      isStreaming: true,
      sessionId: sessionId,
      processingSteps: []
    }

    setMessages(prev => [...prev, userMessage, streamingMessage])
    const currentMessage = inputValue
    setInputValue('')
    setIsStreaming(true)

    try {
      // Start the streaming connection
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const streamUrl = `${baseUrl}/question-live-stream/${sessionId}?question=${encodeURIComponent(currentMessage)}`
      const eventSource = new EventSource(streamUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE Connection opened')
      }

      eventSource.onmessage = (event) => {
        try {
          const data: LiveStreamData = JSON.parse(event.data)
          console.log('Received SSE data:', data)

          switch (data.type) {
            case 'connected':
              updateMessageProcessingSteps(streamingMessage.id, {
                step: 'connected',
                status: 'completed',
                message: data.message || 'Connected to processing stream',
                details: {},
                timestamp: new Date().toISOString()
              })
              break

            case 'step':
              if (data.step && data.status && data.message && data.timestamp) {
                updateMessageProcessingSteps(streamingMessage.id, {
                  step: data.step,
                  status: data.status as 'started' | 'completed' | 'failed',
                  message: data.message,
                  details: data.details || {},
                  timestamp: data.timestamp
                })

                // Update the main message content based on current step
                setMessages(prev => prev.map(msg => {
                  if (msg.id === streamingMessage.id) {
                    return {
                      ...msg,
                      content: `Processing: ${data.message}...`
                    }
                  }
                  return msg
                }))
              }
              break

            case 'complete':
              if (data.final_result) {
                console.log("Processing complete. Final result:", {
                  answer: data.final_result.final_answer,
                  sources_count: data.final_result.sources?.length,
                  sub_queries: data.final_result.sub_queries,
                  sub_query_results: data.final_result.sub_query_results?.map(result => ({
                    query: result.sub_query,
                    context_chunks: result.context_chunks?.length,
                    relevant_files: result.relevant_files?.length
                  }))
                });

                // Create a comprehensive final answer
                const constructFinalAnswer = () => {
                  // If we have a final_answer, use it
                  if (data.final_result.final_answer && data.final_result.final_answer.trim() && 
                      data.final_result.final_answer !== 'Processing completed') {
                    return data.final_result.final_answer;
                  }

                  // Otherwise, construct from sub-query results
                  if (data.final_result.sub_query_results && data.final_result.sub_query_results.length > 0) {
                    const hasRelevantData = data.final_result.sub_query_results.some(result => 
                      result.context_chunks && result.context_chunks.length > 0
                    );

                    if (hasRelevantData) {
                      let constructedAnswer = "Based on the analysis of your documents:\n\n";
                      
                      data.final_result.sub_query_results.forEach((result, index) => {
                        if (result.context_chunks && result.context_chunks.length > 0) {
                          const relevantChunks = result.context_chunks.filter(chunk => 
                            chunk.relevance_type === 'category_match' || chunk.text.length > 20
                          );
                          
                          if (relevantChunks.length > 0) {
                            constructedAnswer += `**${result.sub_query}**\n`;
                            
                            // Add key insights from the chunks
                            const uniqueFiles = new Set(relevantChunks.map(chunk => chunk.source_file));
                            constructedAnswer += `Found relevant information in ${uniqueFiles.size} document(s):\n`;
                            
                            relevantChunks.slice(0, 3).forEach(chunk => {
                              const preview = chunk.text.length > 150 ? 
                                chunk.text.substring(0, 150) + "..." : chunk.text;
                              constructedAnswer += `• ${preview}\n`;
                            });
                            constructedAnswer += "\n";
                          }
                        }
                      });

                      return constructedAnswer.trim();
                    } else {
                      return "I searched through your documents but couldn't find specific information matching your query. You may want to try rephrasing your question or check if the relevant documents are uploaded.";
                    }
                  }

                  return "Analysis completed. Please expand the results section below for detailed findings.";
                };

                const documentResponse: DocumentResponse = {
                  answer: constructFinalAnswer(),
                  sources: data.final_result.sources?.map(source => ({
                    file_id: source.file_id,
                    file_name: source.file_name,
                    category: source.category,
                    description: source.description
                  })) || [],
                  sub_queries: data.final_result.sub_queries || [],
                  sub_answers: data.final_result.sub_query_results?.map((result: SubQueryResult) => ({
                    sub_query: result.sub_query,
                    answer: result.context_chunks?.length > 0 
                      ? `Found ${result.context_chunks.length} relevant chunks from ${result.relevant_files?.length || 0} files` 
                      : 'No relevant information found',
                    context_chunks: result.context_chunks?.length || 0,
                    relevant_files: result.relevant_files,
                    file_ids: result.file_ids,
                    context_chunks_data: result.context_chunks
                  })) || [],
                  files_searched: Array.from(new Set(
                    data.final_result.sub_query_results?.flatMap(result => result.file_ids) || []
                  )),
                  optimization_used: true,
                  timestamp: data.final_result.processing_timestamp
                }

                setMessages(prev => prev.map(msg => {
                  if (msg.id === streamingMessage.id) {
                    return {
                      ...msg,
                      content: documentResponse.answer,
                      isStreaming: false,
                      documentResponse: documentResponse,
                      quickReplies: generateQuickReplies(documentResponse)
                    }
                  }
                  return msg
                }))
                
                cleanupEventSource()
                setIsStreaming(false)
                setCurrentSessionId(null)
              }
              break

            case 'error':
              throw new Error(data.message || 'Stream processing error')
          }
        } catch (parseError) {
          console.error('Error parsing SSE data:', parseError)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error)
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === streamingMessage.id) {
            return {
              ...msg,
              content: 'An error occurred while processing your request. Please try again.',
              isStreaming: false,
              isError: true,
              quickReplies: [
                { id: 'retry', text: 'Try again', action: 'retry' },
                { id: 'help', text: 'Get help', action: 'help' }
              ]
            }
          }
          return msg
        }))
        
        cleanupEventSource()
        setIsStreaming(false)
        setCurrentSessionId(null)
      }

    } catch (error) {
      console.error('Error starting stream:', error)
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === streamingMessage.id) {
          return {
            ...msg,
            content: 'Failed to start processing. Please check your connection and try again.',
            isStreaming: false,
            isError: true,
            quickReplies: [
              { id: 'retry', text: 'Try again', action: 'retry' },
              { id: 'help', text: 'Get help', action: 'help' }
            ]
          }
        }
        return msg
      }))
      
      setIsStreaming(false)
      setCurrentSessionId(null)
    }
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

    if (response.sub_queries && response.sub_queries.length > 0) {
      replies.push({ id: 'sub_queries', text: 'Show breakdown', action: 'show_sub_queries' })
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

    // Handle quick reply actions (same as before)
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
  }

  const toggleResponseExpansion = (messageId: number) => {
    setExpandedResponses(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  const toggleSubQueryExpansion = (key: string) => {
    setExpandedSubQueries(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupEventSource()
    }
  }, [])

  const renderProcessingSteps = (message: ChatMessage) => {
    if (!message.processingSteps || message.processingSteps.length === 0) return null

    // Get the latest step that's currently running or most recent
    const latestStep = message.processingSteps[message.processingSteps.length - 1]
    if (!latestStep) return null

    // Format the step name for display
    const formatStepName = (step: string) => {
      switch (step) {
        case 'initialization': return 'Initializing AI analysis'
        case 'metadata_loading': return 'Loading document metadata'
        case 'query_decomposition': return 'Breaking down your question'
        case 'relevance_analysis': return 'Analyzing document relevance'
        case 'vector_search': return 'Searching through documents'
        case 'answer_generation': return 'Generating comprehensive answer'
        case 'finalization': return 'Finalizing results'
        default: return step.replace('_', ' ')
      }
    }

    return (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-blue-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-sm text-blue-800 font-medium">
            {formatStepName(latestStep.step)}...
          </span>
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            Live Stream
          </Badge>
        </div>
        {latestStep.message && latestStep.message !== formatStepName(latestStep.step) && (
          <p className="text-xs text-blue-700 mt-1 ml-6">{latestStep.message}</p>
        )}
      </div>
    )
  }

  const renderDocumentResponse = (message: ChatMessage) => {
    console.log(`🎯 Rendering document response for message ${message.id}`)
    console.log(`📄 Document Response:`, message.documentResponse)
    
    if (!message.documentResponse) {
      console.log(`⚠️ No document response found for message ${message.id}`)
      return null
    }

    const { documentResponse } = message
    const isExpanded = expandedResponses[message.id]

    console.log(`📊 Document response details:`)
    console.log(`  - Answer: ${documentResponse.answer}`)
    console.log(`  - Sources: ${documentResponse.sources?.length || 0}`)
    console.log(`  - Sub-queries: ${documentResponse.sub_queries?.length || 0}`)
    console.log(`  - Files searched: ${documentResponse.files_searched?.length || 0}`)
    console.log(`  - Optimization used: ${documentResponse.optimization_used}`)

    return (
      <Card className="mt-3 bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              Final Results
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Completed
                </Badge>
                {documentResponse.optimization_used && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Optimized
                  </Badge>
                )}
              </div>
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
          <CardContent className="pt-0 space-y-4">
            {/* Sub-Queries Analysis */}
            {documentResponse.sub_queries && documentResponse.sub_queries.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Query Breakdown ({documentResponse.sub_queries.length} parts)
                </span>
                {documentResponse.sub_queries.map((subQuery, index) => {
                  const subQueryKey = `${message.id}-subquery-${index}`
                  const isSubExpanded = expandedSubQueries[subQueryKey]
                  const subAnswer = documentResponse.sub_answers?.find(sa => sa.sub_query === subQuery)
                  
                  const relevantChunks = subAnswer?.context_chunks_data?.filter(chunk => 
                    chunk.relevance_type === 'category_match'
                  ) || []
                  
                  const hasRelevantData = relevantChunks.length > 0
                  
                  return (
                    <div key={index} className="bg-white rounded border">
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSubQueryExpansion(subQueryKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Q{index + 1}
                            </Badge>
                            <span className="text-sm font-medium">{subQuery}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {subAnswer && (
                              <>
                                <Badge variant={hasRelevantData ? "default" : "secondary"} className="text-xs">
                                  {subAnswer.context_chunks} chunks
                                </Badge>
                                {hasRelevantData && (
                                  <ChevronDown className={`h-4 w-4 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isSubExpanded && subAnswer && hasRelevantData && (
                        <div className="border-t p-3">
                          <div className="space-y-3">
                            {relevantChunks.map((chunk, chunkIndex) => (
                              <div key={chunkIndex} className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{chunk.source_file}</span>
                                  {chunk.sheet_name && (
                                    <Badge variant="outline" className="text-xs">
                                      Sheet: {chunk.sheet_name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="pl-6">
                                  <div className="text-muted-foreground whitespace-pre-wrap">
                                    {chunk.text}
                                  </div>
                                  {chunk.row_number && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Row: {chunk.row_number}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
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
                        <span className="font-medium">{source.file_name}</span>
                      </div>
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

            {documentResponse.timestamp && (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Completed: {new Date(documentResponse.timestamp).toLocaleString()}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-pink-600 text-white">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-600">
                {isStreaming ? 'Processing your question...' : 'Ask questions about your documents'}
              </p>
            </div>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm text-blue-600">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="p-4 bg-gray-50 min-h-[400px]">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className={`text-white ${message.isError ? 'bg-red-500' : message.isStreaming ? 'bg-blue-600' : 'bg-pink-600'}`}>
                      {message.isError ? <AlertTriangle className="h-4 w-4" /> : 
                       message.isStreaming ? <Activity className="h-4 w-4 animate-pulse" /> :
                       <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[75%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-lg px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : message.isError
                      ? 'bg-red-50 border border-red-200'
                      : message.isStreaming
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                      <div className="flex gap-1">
                        {message.isStreaming && (
                          <Badge variant="outline" className="text-xs">
                            <Activity className="h-3 w-3 mr-1 animate-pulse" />
                            Live
                          </Badge>
                        )}
                        {message.documentResponse && (
                          <Badge variant="outline" className="text-xs">AI</Badge>
                        )}
                        {message.documentResponse?.optimization_used && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Live Processing Steps */}
                  {message.isStreaming && renderProcessingSteps(message)}
                  
                  {/* Final Document Response */}
                  {!message.isStreaming && renderDocumentResponse(message)}
                  
                  {/* Quick Replies */}
                  {message.quickReplies && !message.isStreaming && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.quickReplies.map((reply) => (
                        <Button
                          key={reply.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReply(reply.action, reply.text)}
                          className="text-xs h-7 px-3 rounded-full bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400 transition-all"
                        >
                          {reply.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-blue-600 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isStreaming ? "Processing your previous question..." : "Ask about your documents... (e.g., 'What was our profit this year?')"}
              className="h-10"
              disabled={isStreaming}
            />
          </div>
          
          <Button 
            variant="default"
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
            title="Send message"
          >
            {isStreaming ? <Activity className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DocumentChatBot