# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Start Vite development server with hot reload
- **Build**: `npm run build` - Build for production using Vite
- **Lint**: `npm run lint` - Run ESLint on the codebase
- **Preview**: `npm run preview` - Preview production build locally

## Tech Stack & Architecture

This is a React + Vite application with the following key technologies:

### Frontend Framework
- **React 19** with JSX (not TypeScript for components, but TypeScript for store/auth)
- **Vite** for build tooling and development server
- **TailwindCSS v4** for styling with `@tailwindcss/vite` plugin

### UI Libraries
- **shadcn/ui** components built on **Radix UI** primitives
- **Lucide React** for icons
- **Framer Motion** for animations
- Component aliases configured: `@/components`, `@/lib/utils`, etc.

### State Management & Routing
- **Redux Toolkit** with TypeScript for global state (auth)
- **React Router v7** for client-side routing
- **react-toastify** for notifications

### AI Integration
- **Groq SDK** for AI chat functionality using Llama models
- Multiple AI capabilities: text chat, vision analysis, audio transcription, TTS
- Environment variable: `VITE_GROQ_API_KEY`

## Project Structure

```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   │   ├── avatar.jsx
│   │   ├── badge.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── input.jsx
│   │   ├── separator.jsx
│   │   ├── textarea.jsx
│   │   ├── checkbox.jsx
│   │   ├── label.jsx
│   │   ├── scroll-area.jsx
│   │   └── progress.jsx
│   ├── auth/
│   │   └── ProtectedRoute.jsx       # Route protection component
│   ├── ChatBot.jsx                  # Simple chat implementation
│   ├── ShadcnChatBot.jsx           # Basic shadcn/ui chat interface
│   ├── ShadcnChatBotGroq.jsx       # Full-featured AI chat with Groq
│   ├── SimpleChatBot.jsx           # Minimal chat version
│   └── Navbar.jsx                   # Main navigation component
├── pages/
│   ├── signin.tsx                   # Sign-in page
│   ├── signup.tsx                   # Sign-up page
│   ├── dataRoom.tsx                 # Main authenticated page
│   └── preview.jsx                  # Theme hook demo page
├── services/
│   └── groqService.js              # AI service layer (Groq integration)
├── store/                          # Redux store (TypeScript)
│   ├── store.ts                    # Main store configuration
│   ├── authSlice.ts               # Authentication state slice
│   └── authThunk.ts               # Auth async actions
├── utils/
│   └── chatUtils.js               # Chat utility functions
├── lib/
│   └── utils.js                   # General utility functions
├── hooks/                          # Custom React hooks
│   └── useTheme.js                # Dark/light mode theme hook
├── assets/
│   └── react.svg                  # Static assets
├── App.jsx                        # Main app component with routing
├── main.jsx                       # App entry point
├── index.css                      # Global styles with Tailwind
├── App.css                        # Component-specific styles
└── simple.css                     # Additional styles
```

### Core Architecture

#### Authentication System
- **Redux-based auth** with TypeScript (`src/store/`)
- **Protected routes** using `ProtectedRoute` component
- **Auth pages**: `/signin`, `/signup` with redirect logic
- **Main authenticated route**: `/` (DataRoom page)
- **Route protection**: Unauthenticated users redirected to sign-in

#### Chat Components (Multiple Implementations)
- **`ShadcnChatBotGroq.jsx`** - Full-featured chat with Groq integration, vision, audio
- **`ShadcnChatBot.jsx`** - Basic shadcn/ui chat interface
- **`ChatBot.jsx`** - Simple chat implementation
- **`SimpleChatBot.jsx`** - Minimal chat version

#### AI Service Layer
**`src/services/groqService.js`** provides:
- Text chat responses with different model configs
- Vision analysis for image inputs
- Audio transcription (Whisper)
- Text-to-speech (PlayAI Dialog)
- Contextual responses with different AI personalities
- Mock responses when API key not available

#### UI Component System
- **shadcn/ui components** in `src/components/ui/`
- **Custom components** follow shadcn patterns
- **Uses class-variance-authority** for component variants
- **Consistent styling** with TailwindCSS utilities

## Key Configuration Files

- **components.json**: shadcn/ui configuration with aliases
- **vite.config.js**: Path aliases (`@` -> `./src`) and TailwindCSS plugin
- **eslint.config.js**: Modern ESLint flat config with React hooks rules
- **.env**: Contains `VITE_GROQ_API_KEY` for AI functionality

## Development Notes

### File Extensions
- UI components: `.jsx` files
- Store/auth logic: `.ts/.tsx` files for TypeScript
- Main app structure uses JSX with occasional TypeScript

### Styling Approach
- TailwindCSS v4 with CSS variables for theming
- shadcn/ui component system with customizable variants
- Responsive design patterns throughout

### AI Features
- Supports multiple Llama models via Groq
- Fallback mock responses when API unavailable
- Quick reply buttons for enhanced UX
- Multi-modal: text, images, audio input/output