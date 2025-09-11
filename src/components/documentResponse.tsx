import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
  Play,
  Pause,
  RefreshCw,
  Activity,
  Target,
  Brain,
  FileSearch,
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
  const [expandedProcessing, setExpandedProcessing] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const streamingMessage = messages.find(msg => msg.isStreaming)
    if (streamingMessage) {
      setExpandedProcessing(prev => ({
        ...prev,
        [streamingMessage.id]: true // Set to true by default for streaming messages
      }))
    }
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

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'initialization': return <Play className="h-4 w-4" />
      case 'metadata_loading': return <FileText className="h-4 w-4" />
      case 'query_decomposition': return <Brain className="h-4 w-4" />
      case 'relevance_analysis': return <Target className="h-4 w-4" />
      case 'vector_search': return <Search className="h-4 w-4" />
      case 'answer_generation': return <MessageSquare className="h-4 w-4" />
      case 'finalization': return <CheckCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getStepProgress = (steps: ProcessingStep[]) => {
    const totalSteps = ['initialization', 'metadata_loading', 'query_decomposition', 'relevance_analysis', 'vector_search', 'answer_generation', 'finalization']
    const completedSteps = steps.filter(step => step.status === 'completed').length
    return Math.round((completedSteps / totalSteps.length) * 100)
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
                      content: `Processing: ${data.message}`
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

                const documentResponse: DocumentResponse = {
                  answer: data.final_result.final_answer || 'Processing completed',
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

  const toggleProcessingExpansion = (messageId: number) => {
    setExpandedProcessing(prev => ({
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

    const steps = message.processingSteps
    const progress = getStepProgress(steps)
    const isExpanded = expandedProcessing[message.id]

    return (
      <Card className="mt-3 bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
              Live Processing
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                {progress}% Complete
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleProcessingExpansion(message.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0 space-y-3">
            {steps.map((step, index) => (
              <div key={`${step.step}-${step.status}-${index}`} className="flex items-start gap-3">
                <div className={`flex-shrink-0 ${step.status === 'completed' ? 'text-green-600' : step.status === 'failed' ? 'text-red-600' : 'text-blue-600'}`}>
                  {getStepIcon(step.step)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">
                      {step.step.replace('_', ' ')}
                    </span>
                    <Badge 
                      variant={step.status === 'completed' ? 'default' : step.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{step.message}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                  
                  {/* Show additional details for certain steps */}
                  {step.details && Object.keys(step.details).length > 0 && (
                    <div className="mt-2 text-xs bg-white p-2 rounded border">
                      {step.step === 'query_decomposition' && step.details.sub_queries && (
                        <div>
                          <span className="font-medium">Sub-queries ({step.details.sub_queries.length}):</span>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {step.details.sub_queries.slice(0, 3).map((query: string, i: number) => (
                              <li key={i} className="text-gray-600">{query}</li>
                            ))}
                            {step.details.sub_queries.length > 3 && (
                              <li className="text-gray-500">... and {step.details.sub_queries.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {step.step === 'metadata_loading' && step.details.files_count && (
                        <span>Analyzed {step.details.files_count} files</span>
                      )}
                      
                      {step.details.sub_query_index && (
                        <span>Processing sub-query {step.details.sub_query_index}</span>
                      )}
                      
                      {step.details.chunks_found !== undefined && (
                        <span>Found {step.details.chunks_found} relevant chunks</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
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

            {/* Files Searched */}
            {documentResponse.files_searched && documentResponse.files_searched.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Files Analyzed</span>
                <div className="bg-white p-3 rounded border">
                  <div className="flex flex-wrap gap-2">
                    {documentResponse.files_searched.map((fileName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {fileName}
                      </Badge>
                    ))}
                  </div>
                </div>
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
                {isStreaming ? 'Processing via dual API approach...' : 'Ask questions about your documents'}
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
      <ScrollArea className="flex-1 p-2 md:p-4">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex gap-2 md:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className={`text-white ${message.isError ? 'bg-red-500' : message.isStreaming ? 'bg-blue-600' : 'bg-pink-600'}`}>
                      {message.isError ? <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" /> : 
                       message.isStreaming ? <Activity className="h-3 w-3 md:h-4 md:w-4 animate-pulse" /> :
                       <Bot className="h-3 w-3 md:h-4 md:w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] md:max-w-[75%] space-y-2 ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                    message.type === 'user' 
                      ? 'bg-gray-500 text-white ml-auto' 
                      : message.isError
                      ? 'bg-red-50 border border-red-200'
                      : message.isStreaming
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-muted'
                  }`}>
                    <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
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
                placeholder={isStreaming ? "Processing your previous question..." : "Ask about your documents... (e.g., 'What was our profit this year?')"}
                className="h-9"
                disabled={isStreaming}
              />
            </div>
            
            <Button 
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="h-9 w-9 p-0 bg-pink-600 hover:bg-pink-700"
              title="Send message"
            >
              {isStreaming ? <Activity className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentChatBot