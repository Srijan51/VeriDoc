# VeriDoc Quick Start Guide

Get VeriDoc running locally in 5 minutes!

## Prerequisites

- Node.js 18+
- Python 3.9+
- npm or yarn
- Git

## Step 1: Clone the Repository

```bash
cd VeriDoc
```

## Step 2: Start the Backend

### Terminal 1: Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Gemini and Supabase credentials

# Start the server
python run.py
```

The backend will start at `http://127.0.0.1:8000`

Check API docs at: `http://127.0.0.1:8000/docs`

## Step 3: Start the Frontend

### Terminal 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# The default backend URL is already set to http://127.0.0.1:8000

# Start development server
npm run dev
```

The frontend will start at `http://localhost:3000`

## Step 4: Test the Integration

1. **Upload a Document**
   - Go to http://localhost:3000/documents
   - Click "Upload Documents"
   - Select a PDF or DOCX file
   - Choose document type and date
   - Verify it appears in the document list

2. **Query Documents**
   - Go to http://localhost:3000/ai-assistant
   - Ask a question (e.g., "What are the main policies?")
   - View the AI response with citations

3. **Check for Contradictions**
   - Go to http://localhost:3000/contradictions
   - System will scan for conflicts
   - View any detected contradictions

4. **Use the Home Search**
   - Go to http://localhost:3000
   - Use the search bar to ask a question
   - You'll be redirected to the AI assistant

## Troubleshooting

### Backend won't start
```bash
# Check Python installation
python --version

# Clear cache and reinstall
rm -rf venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Can't connect to backend
- Verify backend is running: `http://127.0.0.1:8000/docs`
- Check `.env.local` in frontend has correct `NEXT_PUBLIC_API_URL`
- Ensure CORS is enabled in backend

### API calls failing
- Check backend logs for errors
- Verify `.env` in backend is configured
- Make sure Gemini and Supabase credentials are valid

## Project Structure

```
VeriDoc/
├── backend/
│   ├── app/              # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   ├── run.py           # Start server here
│   └── .env             # Configuration (create from .env.example)
│
├── frontend/
│   ├── src/             # React components and pages
│   ├── package.json     # npm dependencies
│   ├── .env.local       # Configuration (create from .env.example)
│   └── SETUP.md         # Detailed setup guide
```

## Common Commands

### Backend
```bash
cd backend
python run.py              # Start server
python check_models.py     # Verify setup
```

### Frontend
```bash
cd frontend
npm run dev               # Development mode
npm run build            # Build for production
npm run lint             # Check code quality
npm start                # Production mode (after build)
```

## Environment Variables Reference

### Backend (.env)
```
GEMINI_API_KEY=           # Your Gemini API key
SUPABASE_URL=             # Your Supabase project URL
SUPABASE_KEY=             # Your Supabase API key
ALLOWED_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Getting API Keys

### Gemini API
1. Go to https://ai.google.dev
2. Click "Get API key"
3. Create new API key for your project
4. Copy to backend `.env`

### Supabase
1. Go to https://supabase.com
2. Create new project
3. Copy project URL and anon key
4. Copy to backend `.env`

## Next Steps

- Read [INTEGRATION_GUIDE.md](./frontend/INTEGRATION_GUIDE.md) for technical details
- Check [SETUP.md](./frontend/SETUP.md) for frontend configuration
- Explore [backend README](./backend/README.md) for backend details

## Getting Help

- Check logs in both terminals for errors
- Review environment variable configuration
- Verify API credentials are valid
- Check network requests in browser DevTools

## Production Deployment

When ready to deploy:

### Backend
- Set `ENVIRONMENT=production` in `.env`
- Use a production WSGI server (gunicorn, uvicorn)
- Set up proper logging and monitoring

### Frontend
- Build optimized bundle: `npm run build`
- Deploy to Vercel, Netlify, or your server
- Set `NEXT_PUBLIC_API_URL` to production backend URL

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review environment variable setup
3. Check application logs
4. Verify API credentials
