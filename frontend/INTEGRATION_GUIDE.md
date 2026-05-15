# Frontend-Backend Integration Summary

This document summarizes the integration between the VeriDoc frontend and backend.

## What's Been Connected

### 1. **Document Management** (API `/documents` and `/upload`)
- **Feature**: Upload, list, and manage documents
- **Page**: `/documents`
- **API Calls**:
  - `fetchDocuments()` - Get all documents
  - `uploadDocument(file, type, date)` - Upload a new document
- **Improvements**:
  - Real-time document listing with refresh button
  - Search and filter functionality
  - Better error handling with toast notifications
  - File validation (10MB max)

### 2. **AI Assistant** (API `/query`)
- **Feature**: Natural language querying with citations
- **Page**: `/ai-assistant`
- **API Calls**:
  - `queryDocuments(question, docIds, topK)` - Query documents
  - `fetchDocuments()` - Get document count
- **Improvements**:
  - Smooth chat interface with auto-scroll
  - Real-time document count display
  - Contradiction detection warnings
  - Better error handling and retry logic
  - Loading states and typing indicators

### 3. **Contradiction Detection** (API `/query`)
- **Feature**: Automatic detection of conflicting information
- **Page**: `/contradictions`
- **API Calls**:
  - Multiple `queryDocuments()` calls with varied queries
  - `fetchDocuments()` for document count
- **Improvements**:
  - Runs multiple queries to find contradictions
  - Deduplicates results
  - Categorizes by severity
  - Displays clear conflict resolution suggestions

### 4. **Home Page** (All APIs)
- **Feature**: Dashboard and entry point
- **Page**: `/` (home)
- **Improvements**:
  - Functional search bar that redirects to AI Assistant
  - Live document count display
  - Quick navigation buttons
  - Better CTA placement

## API Client Features

### Error Handling
```typescript
try {
  const response = await queryDocuments(question);
  // Handle success
} catch (error) {
  // Automatically formatted error message
  addToast(error.message, "error");
}
```

### Retry Logic
- Automatic retries for network failures (3 attempts)
- Exponential backoff: 200ms, 400ms, 800ms
- No retries for client errors (4xx)

### Type Safety
All API responses are fully typed:
```typescript
interface QueryResponse {
  question: string;
  answer: string;
  confidence_score: number;
  citations: Citation[];
  contradictions: Contradiction[];
  no_answer_found: boolean;
  no_answer_reason?: string;
  model: string;
}
```

## User Experience Improvements

### 1. **Notifications System**
- Toast notifications for all operations
- Success, error, warning, and info types
- Auto-dismiss after 4 seconds
- Global accessibility via `useToast()` hook

### 2. **Loading States**
- Skeleton loaders for tables
- Loading spinners for async operations
- Disabled state for buttons during loading
- Typing indicators in chat

### 3. **Error Messages**
- Clear, user-friendly error messages
- Specific guidance based on error type
- Retry suggestions for network errors

### 4. **Search and Filter**
- Real-time search across documents
- Type filtering (PDF, DOCX, TXT, XLSX)
- Sorting options (newest, oldest, authority)
- Search on home page redirects to AI Assistant

## Environment Configuration

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Backend (.env)
```
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
GEMINI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

## Performance Optimizations

1. **API Client Optimization**
   - Retry logic with exponential backoff
   - Proper error categorization
   - Efficient error handling

2. **Component Optimization**
   - useCallback for memoized functions
   - Proper dependency arrays
   - Auto-scroll to latest messages
   - Conditional rendering for states

3. **Data Flow**
   - Single source of truth for documents
   - Proper state management
   - Cache API responses where applicable

## Testing the Integration

### 1. Upload Documents
```
1. Go to /documents
2. Click "Upload" button
3. Select a file
4. Choose document type and date
5. Verify success toast and document list update
```

### 2. Query Documents
```
1. Go to /ai-assistant
2. Enter a question (e.g., "What are the policies?")
3. View response with citations
4. Check contradictions if detected
```

### 3. View Contradictions
```
1. Go to /contradictions
2. System automatically scans for conflicts
3. Filter by severity
4. View detailed conflict information
```

## Troubleshooting

### Backend Connection Issues
- Check CORS settings in backend
- Ensure `ALLOWED_ORIGINS` includes frontend URL
- Verify backend is running on correct port

### Search Not Working
- Check API response structure matches types
- Verify `fetchDocuments()` returns correct format

### Toast Notifications Not Showing
- Verify `ToastProvider` wraps the app
- Check `ToastContainer` is rendered in layout
- Ensure `useToast()` is called within provider

### Upload Failures
- Check file size (max 10MB)
- Verify file type is supported (PDF, DOCX, TXT, XLSX)
- Check backend has necessary permissions

## Future Enhancements

1. **Pagination** - Add pagination for large document lists
2. **Caching** - Implement response caching for better performance
3. **Offline Mode** - Store documents locally
4. **Analytics** - Track user interactions
5. **Export** - Export results as PDF/CSV
6. **Collaboration** - Multi-user support
7. **Advanced Search** - Filter by date range, keywords, etc.
8. **Real-time Updates** - WebSocket for live notifications

## Code Structure

```
src/
├── app/
│   ├── page.tsx                 # Home page
│   ├── documents/page.tsx       # Document management
│   ├── ai-assistant/page.tsx    # AI chat interface
│   └── contradictions/page.tsx  # Contradiction viewer
├── components/
│   ├── ui/
│   │   ├── SearchBar.tsx        # Functional search
│   │   ├── ToastContainer.tsx   # Notifications
│   │   └── ...other components
│   └── sections/
│       └── HeroSection.tsx      # Enhanced hero
├── lib/
│   ├── api.ts                   # Enhanced API client
│   ├── context/
│   │   └── ToastContext.tsx     # Toast provider
│   └── hooks/
│       └── useToast.ts          # Toast hook
└── styles/
    └── globals.css              # Global styles
```

## Deployment Checklist

- [ ] Backend URL configured in `.env.local`
- [ ] CORS settings updated in backend
- [ ] All environment variables set
- [ ] Tests run successfully
- [ ] Build completes without errors
- [ ] No console errors in production build
- [ ] API responses validated
- [ ] Error handling tested
- [ ] Toast notifications working
- [ ] Mobile responsiveness checked
