# Tequity Demo - React Chat Application

## PROJECT CONTEXT
This is a modern React application built with Vite, featuring:
- **Core**: React 19.1.0 + Vite + TypeScript/JavaScript hybrid
- **State Management**: Redux Toolkit with authentication slice
- **UI**: Tailwind CSS + Radix UI components + shadcn/ui
- **Routing**: React Router DOM v7
- **Chat**: Groq SDK integration for AI chat functionality
- **Features**: User authentication, data room, file management, chatbot

## ARCHITECTURE OVERVIEW
```
Frontend: React + Vite (SPA)
├── Authentication: Redux + JWT
├── Chat System: Groq SDK + Custom Components
├── Data Room: File categorization & viewing
├── UI Components: shadcn/ui + Radix UI
└── Styling: Tailwind CSS
```

## CODE STANDARDS

### File Organization
- **Components**: Functional components in `src/components/`
- **Pages**: Route components in `src/pages/`
- **Services**: API calls in `src/service/` and `src/services/`
- **Store**: Redux store and slices in `src/store/`
- **Utils**: Helper functions in `src/utils/`
- **UI Components**: Reusable UI in `src/components/ui/`

### React Patterns
- Use functional components with hooks
- Prefer `useSelector` and `useDispatch` for Redux state
- Use React Router's `useNavigate` for navigation
- Implement protected routes with `ProtectedRoute` component
- Follow component composition patterns

### Code Style
- Use ES6+ features (destructuring, arrow functions, template literals)
- Prefer `const` over `let`, avoid `var`
- Use JSX for React components
- Keep components small and focused (< 200 lines)
- Extract custom hooks for reusable logic

### Import Conventions
```javascript
// External libraries first
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports
import { Button } from './ui/button';
import { api } from '../service/api';
```

## TESTING REQUIREMENTS
- All new features must include basic functionality tests
- Components should be testable in isolation
- API calls should be mocked in tests
- Test user interactions and state changes
- Validate authentication flows

## TASK COMPLETION WORKFLOW
1. **Analyze**: Understand the requirement and existing codebase
2. **Plan**: Break down into components/services/state changes
3. **Implement**: Follow established patterns and conventions
4. **Test**: Create test cases and validate functionality
5. **Document**: Update relevant documentation
6. **Validate**: Ensure no breaking changes

## KEY DEPENDENCIES
- **React**: ^19.1.0 - UI framework
- **Redux Toolkit**: ^2.8.2 - State management
- **React Router**: ^7.8.1 - Client-side routing
- **Tailwind CSS**: ^4.1.11 - Styling
- **Groq SDK**: ^0.26.0 - AI chat integration
- **Axios**: ^1.10.0 - HTTP client
- **Radix UI**: Various components - Accessible UI primitives

## COMMON PATTERNS

### Authentication Flow
```javascript
// Use authSlice for state management
const { user, isAuthenticated } = useSelector(state => state.auth);
const dispatch = useDispatch();

// Protect routes with ProtectedRoute component
<ProtectedRoute>
  <ComponentRequiringAuth />
</ProtectedRoute>
```

### API Calls
```javascript
// Use service layer pattern
import { api } from '../service/api';

// Handle errors consistently
try {
  const response = await api.post('/endpoint', data);
  // Handle success
} catch (error) {
  // Handle error
}
```

### Component Structure
```javascript
// Standard component pattern
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleAction = () => {
    // Event handlers
  };
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

## BUILD AND DEPLOYMENT
- Development: `npm run dev` (Vite dev server)
- Production Build: `npm run build`
- Preview: `npm run preview`
- Linting: `npm run lint`

## IMPORTANT GUIDELINES
- **ALWAYS** maintain existing authentication patterns
- **NEVER** break existing Redux store structure
- **PROACTIVELY** suggest UI/UX improvements
- **VALIDATE** all API integrations thoroughly
- **PRESERVE** existing component prop interfaces
- **TEST** authentication flows after any auth-related changes

## ERROR HANDLING
- Use try-catch blocks for async operations
- Display user-friendly error messages
- Log errors for debugging
- Implement loading states for async operations
- Handle network failures gracefully

## SECURITY CONSIDERATIONS
- Validate all user inputs
- Sanitize data before rendering
- Implement proper authentication checks
- Secure API endpoints
- Handle sensitive data appropriately