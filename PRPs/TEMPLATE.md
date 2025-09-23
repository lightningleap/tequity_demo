# Product Requirements Prompt (PRP) Template for Tequity Demo

## FEATURE
[Describe the feature you want to implement]

## EXAMPLES
[Provide specific code examples and patterns to follow]

### Component Pattern Example
```jsx
// Reference existing component structure
// File: src/components/ExistingComponent.jsx
- Follow the same prop structure
- Use similar state management patterns
- Apply consistent styling approach
```

### API Integration Example
```javascript
// Reference existing API calls
// File: src/service/api.ts or src/services/groqService.js
- Use the same error handling patterns
- Follow the same response structure
- Apply consistent loading states
```

### Redux Pattern Example
```javascript
// Reference existing Redux slice
// File: src/store/authSlice.ts
- Follow the same slice structure
- Use similar async thunk patterns
- Apply consistent state management
```

## DOCUMENTATION
[Link to relevant documentation and guidelines]

- Project documentation: README.md
- API documentation: [Link to API docs]
- UI component library: [shadcn/ui docs]
- State management: [Redux Toolkit docs]

## TECHNICAL REQUIREMENTS

### Dependencies
- Must use existing dependencies when possible
- New dependencies require justification
- Consider bundle size impact

### Performance
- Components must be optimized for React 19
- Use proper memoization strategies
- Minimize re-renders and API calls

### Accessibility
- Follow WCAG 2.1 AA standards
- Include proper ARIA attributes
- Support keyboard navigation
- Test with screen readers

### Testing
- Unit tests for component logic
- Integration tests for user workflows
- Mock external dependencies
- Test error scenarios

## VALIDATION GATES
- [ ] All existing tests pass
- [ ] New functionality is tested
- [ ] No TypeScript/ESLint errors
- [ ] Responsive design works on mobile
- [ ] Accessibility requirements met
- [ ] Performance benchmarks maintained
- [ ] Code follows project conventions

## OTHER CONSIDERATIONS
- Maintain existing authentication flow
- Preserve current UI/UX patterns
- Consider impact on existing features
- Plan for future extensibility
- Document any breaking changes

## ACCEPTANCE CRITERIA
[Define specific, measurable criteria for completion]

1. Feature works as described
2. Tests pass and provide adequate coverage
3. Code follows project standards
4. Documentation is updated
5. No regression in existing functionality