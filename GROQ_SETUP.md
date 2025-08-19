# 🤖 AI ChatterBot with Latest Groq Models

This AI chatbot uses the newest Groq production models for optimal performance and capabilities.

## 🚀 Production Models Used

### 💬 Text & Chat
- **llama-3.3-70b-versatile**: Primary text model for conversations and structured responses
- **llama-3.1-8b-instant**: Fast model for quick responses and advanced reasoning

### 👁️ Vision & Image Analysis  
- **llama-3.2-11b-vision-preview**: Analyzes images and provides detailed descriptions

### 🎤 Audio Processing
- **whisper-large-v3-turbo**: Fast, accurate speech-to-text transcription

### � Text-to-Speech
- **playai-tts**: High-quality voice generation with multiple voice options

## 🔧 Setup Instructions

### 1. Get Your Groq API Key
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Configure Environment
1. Create a `.env` file in the project root:
```bash
VITE_GROQ_API_KEY=your_groq_api_key_here
```

2. Replace `your_groq_api_key_here` with your actual API key

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

## ✨ Features

### 💬 Text Chat
- Powered by **llama-3.3-70b-versatile**
- Intelligent responses with context awareness
- Quick reply buttons for better UX
- Structured JSON responses for enhanced interactions

### 🖼️ Image Analysis
- Upload any image file
- AI describes what it sees using **llama-3.2-11b-vision-preview**
- Ask follow-up questions about images
- Supports JPG, PNG, WebP, and other common formats

### 🎤 Audio Transcription
- Upload audio files for transcription
- Powered by **whisper-large-v3-turbo** for speed and accuracy
- Supports various audio formats

### 🔊 Text-to-Speech (TTS)
- **playai-tts** model for natural voice generation
- 8 different voice options (Jennifer, Ryan, Alex, Sarah, Michael, Emma, David, Sophie)
- Auto-play bot responses (can be toggled)
- Manual replay button on each bot message
- Adjustable voice selection in header

### 📱 Mobile Responsive
- Optimized for mobile and desktop
- Touch-friendly interface
- Responsive design with shadcn/ui

## 🎛️ Advanced Configuration

### Model Selection
The service automatically selects the best model for each task:
- **General chat**: llama-3.3-70b-versatile
- **Quick responses**: llama-3.1-8b-instant  
- **Image analysis**: llama-3.2-11b-vision-preview
- **Audio transcription**: whisper-large-v3-turbo
- **Text-to-speech**: playai-tts

### Voice Options
Available TTS voices:
- Jennifer (default)
- Ryan, Alex, Sarah, Michael, Emma, David, Sophie

### File Upload Limits
- **Images**: Up to 10MB (JPG, PNG, WebP, etc.)
- **Audio**: Up to 10MB (MP3, WAV, M4A, etc.)
- **Documents**: Up to 10MB (PDF, DOC, TXT, etc.)

## 🛠️ API Rate Limits

Groq offers generous free tier limits:
- **Text models**: 30 requests per minute
- **Vision models**: 30 requests per minute  
- **Audio models**: 30 requests per minute
- **TTS models**: 30 requests per minute

## 🔒 Security Notes

- API key is stored in environment variables
- Never commit your `.env` file to version control
- The app uses `dangerouslyAllowBrowser: true` for client-side usage
- In production, consider using a backend proxy for API calls

## 🐛 Troubleshooting

### API Key Issues
- Ensure `.env` file exists and contains valid key
- Check that key starts with `gsk_`
- Verify key has necessary permissions

### Model Errors
- Check Groq console for API usage and limits
- Ensure your account has access to production models
- Try refreshing the page if models seem unavailable

### TTS Issues
- TTS requires a valid API key
- Check browser audio permissions
- Ensure speakers/headphones are working
- Try different voice options if one doesn't work

### File Upload Issues
- Check file size (must be under 10MB)
- Ensure file format is supported
- Try refreshing if uploads fail

## 📖 Usage Examples

### Text Chat
```
User: "Explain quantum computing"
Bot: [Detailed explanation with quick reply buttons]
```

### Image Analysis
```
User: [Uploads photo of a sunset]
Bot: "I can see a beautiful sunset over the ocean with vibrant orange and pink colors..."
```

### Voice Interaction
1. Toggle TTS on/off with volume button
2. Select preferred voice from dropdown
3. Bot responses automatically play as speech
4. Click speaker icon on any message to replay

## 🔄 Model Updates

This chatbot automatically uses the latest Groq production models. The models are regularly updated by Groq for better performance, and the app will benefit from these improvements without code changes.

---

**Happy chatting! 🤖💬**
