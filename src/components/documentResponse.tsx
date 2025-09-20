import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import * as XLSX from 'xlsx'
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
  MessageSquare,
  Upload,
  FileSpreadsheet,
  Download,
  Play,
  Pause,
  X,
  FileX,
  Trash2
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

interface BatchQuestion {
  id: number
  question: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  answer?: string
  documentResponse?: DocumentResponse
  processingSteps?: ProcessingStep[]
  sessionId?: string
  startTime?: Date
  endTime?: Date
}

interface ChatMessage {
  id: number
  type: 'user' | 'bot' | 'batch'
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
  batchData?: {
    questions: BatchQuestion[]
    currentIndex: number
    totalQuestions: number
    isProcessing: boolean
    fileName: string
  }
}

const DocumentChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load messages from local storage on mount
    const savedMessages = localStorage.getItem('chatMessages')
    if (savedMessages) {
      try {
        // Parse dates back to Date objects
        const parsedMessages = JSON.parse(savedMessages, (key, value) => {
          if (key === 'timestamp' || key === 'startTime' || key === 'endTime') {
            return value ? new Date(value) : null
          }
          return value
        })
        return parsedMessages
      } catch (error) {
        console.error('Error loading messages from local storage:', error)
        return [
          {
            id: 1,
            type: 'bot',
            content: 'Hello! I\'m your AI assistant with access to your DataRoom documents. I can answer questions about your uploaded files.',
            timestamp: new Date(),
            quickReplies: [
              { id: 'example1', text: 'What\'s in my documents?', action: 'list_files' },
              { id: 'example2', text: 'Financial summary', action: 'financial_summary' },
              { id: 'example3', text: 'Upload Excel questions', action: 'upload_excel' }
            ]
          }
        ]
      }
    }
    // Default welcome message if no saved messages
    return [
      {
        id: 1,
        type: 'bot',
        content: 'Hello! I\'m your AI assistant with access to your DataRoom documents. I can answer questions about your uploaded files.',
        timestamp: new Date(),
        quickReplies: [
          { id: 'example1', text: 'What\'s in my documents?', action: 'list_files' },
          { id: 'example2', text: 'Financial summary', action: 'financial_summary' },
          { id: 'example3', text: 'Upload Excel questions', action: 'upload_excel' }
        ]
      }
    ]
  })
  
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [expandedResponses, setExpandedResponses] = useState<Record<number, boolean>>({})
  const [expandedSubQueries, setExpandedSubQueries] = useState<Record<string, boolean>>({})
  const [expandedBatchQuestions, setExpandedBatchQuestions] = useState<Record<string, boolean>>({})
  const [batchProcessing, setBatchProcessing] = useState<{
    messageId: number | null
    isPaused: boolean
    currentIndex: number
  }>({ messageId: null, isPaused: false, currentIndex: 0 })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialMount = useRef(true)

  const scrollToBottom = () => {
    // Use scrollTop instead of scrollIntoView to avoid affecting page scroll
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // Skip scrolling on initial mount to prevent unwanted page scroll
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    // Only scroll to bottom when messages are actually added/updated
    if (messages.length > 1) { // Changed from > 0 to > 1 to account for the welcome message
      scrollToBottom()
    }
  }, [messages])

  useEffect(() => {
    // Save messages to local storage whenever they change
    localStorage.setItem('chatMessages', JSON.stringify(messages))
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

  // Excel file processing function
  const parseExcelFile = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          
          // Parse the Excel file using XLSX library
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0]
          if (!firstSheetName) {
            reject(new Error('No worksheets found in the Excel file'))
            return
          }
          
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convert worksheet to JSON format
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Use array format instead of object format
            defval: '', // Default value for empty cells
            raw: false // Convert all values to strings
          }) as string[][]
          
          if (jsonData.length === 0) {
            reject(new Error('The Excel file appears to be empty'))
            return
          }
          
          // Extract questions from the data
          const questions: string[] = []
          
          // Check if first row contains headers
          const firstRow = jsonData[0]
          let startRow = 0
          
          // Look for a "Question" or "Questions" header in the first row
          const questionColumnIndex = firstRow.findIndex(cell => 
            cell && typeof cell === 'string' && 
            cell.toLowerCase().includes('question')
          )
          
          if (questionColumnIndex !== -1) {
            // Found a question header, start from row 1
            startRow = 1
            
            // Extract questions from the identified column
            for (let i = startRow; i < jsonData.length; i++) {
              const row = jsonData[i]
              if (row && row[questionColumnIndex] && typeof row[questionColumnIndex] === 'string') {
                const question = row[questionColumnIndex].trim()
                if (question.length > 0) {
                  questions.push(question)
                }
              }
            }
          } else {
            // No header found, assume first column contains questions
            for (let i = 0; i < jsonData.length; i++) {
              const row = jsonData[i]
              if (row && row[0] && typeof row[0] === 'string') {
                const question = row[0].trim()
                // Skip if it looks like a header
                if (question.length > 0 && 
                    !question.toLowerCase().includes('question') &&
                    !question.toLowerCase().includes('query')) {
                  questions.push(question)
                }
              }
            }
          }
          
          if (questions.length === 0) {
            reject(new Error('No questions found in the Excel file. Please ensure questions are in the first column or under a "Questions" header.'))
            return
          }
          
          // Limit to reasonable number of questions
          const maxQuestions = 50
          if (questions.length > maxQuestions) {
            console.warn(`Excel file contains ${questions.length} questions. Limiting to first ${maxQuestions} questions.`)
            resolve(questions.slice(0, maxQuestions))
          } else {
            resolve(questions)
          }
          
        } catch (error) {
          console.error('Error parsing Excel file:', error)
          reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx or .xls file.'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv (also supported by XLSX library)
    ]
    
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file (.csv)')
      return
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size is too large. Please upload a file smaller than 10MB.')
      return
    }

    try {
      // Show loading feedback
      const loadingMessage: ChatMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Processing ${file.name}... Please wait.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, loadingMessage])

      const questions = await parseExcelFile(file)
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id))
      
      if (questions.length === 0) {
        alert('No questions found in the Excel file. Please ensure questions are in the first column or under a "Questions" header.')
        return
      }

      // Create batch questions
      const batchQuestions: BatchQuestion[] = questions.map((question, index) => ({
        id: index + 1,
        question: question.trim(),
        status: 'pending'
      }))

      // Create batch message
      const batchMessage: ChatMessage = {
        id: Date.now(),
        type: 'batch',
        content: `Excel file "${file.name}" uploaded successfully! Found ${questions.length} questions to process.`,
        timestamp: new Date(),
        batchData: {
          questions: batchQuestions,
          currentIndex: 0,
          totalQuestions: questions.length,
          isProcessing: false,
          fileName: file.name
        }
      }

      setMessages(prev => [...prev, batchMessage])
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      console.error('Error processing Excel file:', error)
      
      // Remove any loading message
      setMessages(prev => prev.filter(msg => !msg.content.includes('Processing')))
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error processing Excel file: ${errorMessage}`)
    }
  }

  const startBatchProcessing = async (messageId: number) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.batchData) return

    setBatchProcessing({ messageId, isPaused: false, currentIndex: 0 })
    
    // Update message to show processing started
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.batchData) {
        return {
          ...msg,
          batchData: {
            ...msg.batchData,
            isProcessing: true
          }
        }
      }
      return msg
    }))

    await processBatchQuestions(messageId, 0)
  }

  const processBatchQuestions = async (messageId: number, startIndex: number) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.batchData) return

    const { questions } = message.batchData

    for (let i = startIndex; i < questions.length; i++) {
      // Check if processing was paused
      if (batchProcessing.isPaused) {
        setBatchProcessing(prev => ({ ...prev, currentIndex: i }))
        return
      }

      const question = questions[i]
      
      // Update question status to processing
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.batchData) {
          const updatedQuestions = [...msg.batchData.questions]
          updatedQuestions[i] = { ...question, status: 'processing', startTime: new Date() }
          
          return {
            ...msg,
            batchData: {
              ...msg.batchData,
              questions: updatedQuestions,
              currentIndex: i
            }
          }
        }
        return msg
      }))

      try {
        // Process the question using the same API as individual questions
        const documentResponse = await processIndividualQuestion(question.question, messageId, i)
        
        // Update question with completed status and answer
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.batchData) {
            const updatedQuestions = [...msg.batchData.questions]
            updatedQuestions[i] = { 
              ...updatedQuestions[i], 
              status: 'completed', 
              answer: documentResponse.answer,
              documentResponse: documentResponse,
              endTime: new Date()
            }
            
            return {
              ...msg,
              batchData: {
                ...msg.batchData,
                questions: updatedQuestions
              }
            }
          }
          return msg
        }))
      } catch (error) {
        console.error(`Error processing question ${i + 1}:`, error)
        
        // Update question with failed status
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId && msg.batchData) {
            const updatedQuestions = [...msg.batchData.questions]
            updatedQuestions[i] = { 
              ...updatedQuestions[i], 
              status: 'failed', 
              answer: 'Failed to process this question',
              endTime: new Date()
            }
            
            return {
              ...msg,
              batchData: {
                ...msg.batchData,
                questions: updatedQuestions
              }
            }
          }
          return msg
        }))
      }

      // Small delay between questions to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Mark batch processing as complete
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.batchData) {
        return {
          ...msg,
          content: `Batch processing completed! Processed ${questions.length} questions from ${msg.batchData.fileName}`,
          batchData: {
            ...msg.batchData,
            isProcessing: false
          }
        }
      }
      return msg
    }))

    setBatchProcessing({ messageId: null, isPaused: false, currentIndex: 0 })
  }

  const processIndividualQuestion = async (question: string, batchMessageId: number, questionIndex: number): Promise<DocumentResponse> => {
    return new Promise((resolve, reject) => {
      const sessionId = generateSessionId()
      
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const streamUrl = `${baseUrl}/question-live-stream/${sessionId}?question=${encodeURIComponent(question)}`
        const eventSource = new EventSource(streamUrl)

        let documentResponse: DocumentResponse | null = null

        eventSource.onmessage = (event) => {
          try {
            const data: LiveStreamData = JSON.parse(event.data)
            console.log('Received SSE data:', data)

            if (data.type === 'complete' && data.final_result) {
              const constructFinalAnswer = () => {
                if (data.final_result.final_answer && data.final_result.final_answer.trim() && 
                    data.final_result.final_answer !== 'Processing completed') {
                  return data.final_result.final_answer;
                }

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
                  }
                  return "I searched through your documents but couldn't find specific information matching your query.";
                }
                return "Analysis completed. Please expand the results section below for detailed findings.";
              };

              documentResponse = {
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
              
              eventSource.close()
              resolve(documentResponse)
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error)
          eventSource.close()
          reject(new Error('Failed to process question'))
        }

        // Timeout after 60 seconds
        setTimeout(() => {
          eventSource.close()
          if (!documentResponse) {
            reject(new Error('Question processing timed out'))
          }
        }, 60000)

      } catch (error) {
        reject(error)
      }
    })
  }

  const pauseBatchProcessing = () => {
    setBatchProcessing(prev => ({ ...prev, isPaused: true }))
  }

  const resumeBatchProcessing = async () => {
    if (batchProcessing.messageId !== null) {
      setBatchProcessing(prev => ({ ...prev, isPaused: false }))
      await processBatchQuestions(batchProcessing.messageId, batchProcessing.currentIndex)
    }
  }

  const stopBatchProcessing = () => {
    if (batchProcessing.messageId !== null) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === batchProcessing.messageId && msg.batchData) {
          return {
            ...msg,
            content: `Batch processing stopped. Processed ${batchProcessing.currentIndex} out of ${msg.batchData.totalQuestions} questions.`,
            batchData: {
              ...msg.batchData,
              isProcessing: false
            }
          }
        }
        return msg
      }))
    }
    
    setBatchProcessing({ messageId: null, isPaused: false, currentIndex: 0 })
    cleanupEventSource()
  }

  const downloadResults = (messageId: number) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.batchData) return

    const { questions, fileName } = message.batchData
    
    // Create CSV content
    const csvContent = [
      ['Question', 'Answer', 'Status', 'Processing Time'],
      ...questions.map(q => [
        q.question,
        q.answer || '',
        q.status,
        q.startTime && q.endTime 
          ? `${Math.round((q.endTime.getTime() - q.startTime.getTime()) / 1000)}s`
          : ''
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `results_${fileName.replace('.xlsx', '')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const updateMessageProcessingSteps = (messageId: number, newStep: ProcessingStep) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingSteps = msg.processingSteps || []
        const stepIndex = existingSteps.findIndex(s => s.step === newStep.step && s.status === newStep.status)
        
        let updatedSteps
        if (stepIndex >= 0) {
          updatedSteps = [...existingSteps]
          updatedSteps[stepIndex] = newStep
        } else {
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
                const constructFinalAnswer = () => {
                  if (data.final_result.final_answer && data.final_result.final_answer.trim() && 
                      data.final_result.final_answer !== 'Processing completed') {
                    return data.final_result.final_answer;
                  }

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
    if (action === 'upload_excel') {
      fileInputRef.current?.click()
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    let botResponse: string
    let quickReplies = []

    switch (action) {
      case 'help':
        botResponse = `I can help you with:\n\n• Answering questions about your uploaded documents\n• Analyzing financial data and trends\n• Finding specific information across all files\n• Comparing data between different documents\n• Summarizing key insights from your data\n• Processing multiple questions from Excel files\n\nTry asking specific questions like:\n• "What was our revenue last quarter?"\n• "Show me customer data"\n• "Summarize financial performance"`
        quickReplies = [
          { id: 'example1', text: 'Revenue analysis', action: 'revenue_query' },
          { id: 'example2', text: 'Customer data', action: 'customer_query' },
          { id: 'upload_excel', text: 'Upload Excel questions', action: 'upload_excel' }
        ]
        break

      case 'retry':
        botResponse = "Please try asking your question again. I'm ready to help!"
        quickReplies = [
          { id: 'help', text: 'What can you do?', action: 'help' },
          { id: 'upload_excel', text: 'Upload Excel questions', action: 'upload_excel' }
        ]
        break

      default:
        botResponse = "I'm ready to answer questions about your documents. What would you like to know?"
        quickReplies = [
          { id: 'help', text: 'What can you do?', action: 'help' },
          { id: 'upload_excel', text: 'Upload Excel questions', action: 'upload_excel' }
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

  const toggleBatchQuestionExpansion = (key: string) => {
    setExpandedBatchQuestions(prev => ({
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

  const clearConversation = () => {
    // Reset to initial welcome message
    const welcomeMessage: ChatMessage = {
      id: Date.now(),
      type: 'bot',
      content: 'Hello! I\'m your AI assistant with access to your DataRoom documents. I can answer questions about your uploaded files.',
      timestamp: new Date(),
      quickReplies: [
        { id: 'example1', text: 'What\'s in my documents?', action: 'list_files' },
        { id: 'example2', text: 'Financial summary', action: 'financial_summary' },
        { id: 'example3', text: 'Upload Excel questions', action: 'upload_excel' }
      ]
    }
    setMessages([welcomeMessage])
    
    // Clear any ongoing processes
    cleanupEventSource()
    setBatchProcessing({ messageId: null, isPaused: false, currentIndex: 0 })
  }

  const renderProcessingSteps = (message: ChatMessage) => {
    if (!message.processingSteps || message.processingSteps.length === 0) return null

    const latestStep = message.processingSteps[message.processingSteps.length - 1]
    if (!latestStep) return null

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

  const renderBatchProcessing = (message: ChatMessage) => {
    if (!message.batchData) return null

    const { questions, currentIndex, totalQuestions, isProcessing, fileName } = message.batchData
    const completedQuestions = questions.filter(q => q.status === 'completed').length
    const failedQuestions = questions.filter(q => q.status === 'failed').length
    const progressPercentage = (completedQuestions + failedQuestions) / totalQuestions * 100

    return (
      <Card className="mt-3 bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Batch Processing: {fileName}
            </CardTitle>
            <div className="flex gap-2">
              {isProcessing ? (
                <>
                  {batchProcessing.isPaused ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resumeBatchProcessing}
                      className="h-7 px-2"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pauseBatchProcessing}
                      className="h-7 px-2"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopBatchProcessing}
                    className="h-7 px-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  {completedQuestions > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadResults(message.id)}
                      className="h-7 px-2"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  {completedQuestions + failedQuestions < totalQuestions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startBatchProcessing(message.id)}
                      className="h-7 px-2"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress: {completedQuestions + failedQuestions} / {totalQuestions}</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            {/* Status Summary */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{completedQuestions} completed</span>
              </div>
              {failedQuestions > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  <span>{failedQuestions} failed</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                  <span>Processing question {currentIndex + 1}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {questions.map((question, index) => {
              const questionKey = `${message.id}-batch-${index}`
              const isExpanded = expandedBatchQuestions[questionKey]
              
              return (
                <div key={index} className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleBatchQuestionExpansion(questionKey)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Badge 
                          variant={
                            question.status === 'completed' ? 'default' :
                            question.status === 'failed' ? 'destructive' :
                            question.status === 'processing' ? 'secondary' : 'outline'
                          } 
                          className="text-xs flex-shrink-0 mt-1"
                        >
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">{question.question}</p>
                          {question.status === 'processing' && (
                            <p className="text-xs text-blue-600 mt-1">Processing...</p>
                          )}
                          {question.status === 'completed' && question.answer && (
                            <p className="text-xs text-green-600 mt-1">Answer available - click to expand</p>
                          )}
                          {question.status === 'failed' && (
                            <p className="text-xs text-red-600 mt-1">Processing failed</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {question.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                        {question.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {question.status === 'failed' && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        {question.answer && (
                          <ChevronDown className={`h-4 w-4 transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && question.answer && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="text-sm space-y-4">
                        {/* Main Answer */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">Answer:</span>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">{question.answer}</div>
                          </div>
                        </div>

                        {/* Document Response Details */}
                        {question.documentResponse && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-gray-900">Analysis Details</span>
                              {question.documentResponse.optimization_used && (
                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  Optimized
                                </Badge>
                              )}
                            </div>
                            
                            <Card className="bg-white border border-green-200">
                              <CardContent className="p-4 space-y-4">
                              {/* Sub-Queries Analysis */}
                              {question.documentResponse.sub_queries && question.documentResponse.sub_queries.length > 0 && (
                                <div className="space-y-3">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4" />
                                    Query Breakdown ({question.documentResponse.sub_queries.length} parts)
                                  </span>
                                  <div className="space-y-2">
                                  {question.documentResponse.sub_queries.map((subQuery, subIndex) => {
                                    const subQueryKey = `${message.id}-question-${index}-subquery-${subIndex}`
                                    const isSubExpanded = expandedSubQueries[subQueryKey]
                                    const subAnswer = question.documentResponse?.sub_answers?.find(sa => sa.sub_query === subQuery)
                                    
                                    const relevantChunks = subAnswer?.context_chunks_data?.filter(chunk => 
                                      chunk.relevance_type === 'category_match'
                                    ) || []
                                    
                                    const hasRelevantData = relevantChunks.length > 0
                                    
                                    return (
                                      <div key={subIndex} className="bg-white rounded border">
                                        <div 
                                          className="p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                          onClick={() => toggleSubQueryExpansion(subQueryKey)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary" className="text-xs">
                                                Q{subIndex + 1}
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
                                          <div className="border-t p-2">
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
                                </div>
                              )}

                              {/* Sources */}
                              {question.documentResponse.sources && question.documentResponse.sources.length > 0 && (
                                <div className="space-y-3">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Source Documents ({question.documentResponse.sources.length})
                                  </span>
                                  <div className="grid gap-2">
                                  {question.documentResponse.sources.map((source, sourceIndex) => (
                                    <div key={sourceIndex} className="bg-gray-50 p-3 rounded-lg border">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          <span className="font-medium text-gray-900">{source.file_name}</span>
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
                                </div>
                              )}

                              {/* Processing Statistics */}
                              <div className="bg-gray-50 rounded-lg p-3 border">
                                <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  Processing Statistics
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {question.documentResponse.sub_queries && (
                                    <div className="flex items-center gap-1">
                                      <HelpCircle className="h-3 w-3" />
                                      Queries: {question.documentResponse.sub_queries.length}
                                    </div>
                                  )}
                                  {question.documentResponse.files_searched && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      Files searched: {question.documentResponse.files_searched.length}
                                    </div>
                                  )}
                                  {question.documentResponse.timestamp && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Processed: {new Date(question.documentResponse.timestamp).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            </Card>
                          </div>
                        )}

                        {/* Processing Time */}
                        {question.startTime && question.endTime && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-sm text-blue-800 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Processing time: </span>
                              <span>{Math.round((question.endTime.getTime() - question.startTime.getTime()) / 1000)}s</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderDocumentResponse = (message: ChatMessage) => {
    if (!message.documentResponse) return null

    const { documentResponse } = message
    const isExpanded = expandedResponses[message.id]

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
    <div className="flex flex-col w-full h-[calc(100vh-4rem)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleExcelUpload}
        className="hidden"
      />

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 pb-24">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {(message.type === 'bot' || message.type === 'batch') && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className={`text-white ${
                      message.isError ? 'bg-red-500' : 
                      message.isStreaming ? 'bg-blue-600' : 
                      message.type === 'batch' ? 'bg-green-600' :
                      'bg-pink-600'
                    }`}>
                      {message.isError ? <AlertTriangle className="h-4 w-4" /> : 
                       message.isStreaming ? <Activity className="h-4 w-4 animate-pulse" /> :
                       message.type === 'batch' ? <FileSpreadsheet className="h-4 w-4" /> :
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
                      : message.type === 'batch'
                      ? 'bg-green-50 border border-green-200'
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
                        {message.type === 'batch' && (
                          <Badge variant="outline" className="text-xs">
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            Batch
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
                  
                  {/* Batch Processing Interface */}
                  {message.type === 'batch' && renderBatchProcessing(message)}
                  
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
                          {reply.action === 'upload_excel' && <Upload className="h-3 w-3 mr-1" />}
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white shadow-lg">
        <div className="p-4 mx-auto max-w-screen-xl">
          <div className="flex items-end space-x-2">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isStreaming ? "Processing your previous question..." : 
                  batchProcessing.messageId ? "Batch processing in progress..." :
                  "Ask about your documents... (e.g., 'What was our profit this year?')"
                }
                className="h-10"
                disabled={isStreaming || !!batchProcessing.messageId}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={clearConversation}
                disabled={isStreaming || !!batchProcessing.messageId}
                className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || !!batchProcessing.messageId}
                className="h-10 w-10 p-0 hover:bg-gray-100"
                title="Upload Excel/CSV file with questions"
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="default"
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming || !!batchProcessing.messageId}
                className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700"
                title="Send message"
              >
                {isStreaming ? <Activity className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentChatBot