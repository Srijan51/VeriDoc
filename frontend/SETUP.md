# VeriDoc - Frontend Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- VeriDoc backend running (see backend README)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
cp .env.example .env.local
```

Update the `.env.local` file with your backend URL:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

**For production:** Replace with your actual backend URL.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm run start
```

## Architecture

### Key Features

- **AI Assistant**: Natural language querying with citations and contradiction detection
- **Document Management**: Upload, organize, and search documents
- **Contradiction Detection**: Automatically identifies conflicting information across documents
- **Real-time Notifications**: Toast system for user feedback

### File Structure

```
src/
├── app/                 # Next.js pages
│   ├── page.tsx        # Home page
│   ├── documents/      # Document management
│   ├── ai-assistant/   # AI query interface
│   └── contradictions/ # Contradiction viewer
├── components/
│   ├── layout/         # Layout components
│   ├── sections/       # Page sections
│   └── ui/            # Reusable UI components
├── lib/
│   ├── api.ts         # Backend API client
│   ├── context/       # React context providers
│   └── hooks/         # Custom React hooks
└── styles/
    └── globals.css    # Global styles
```

### Key Components

- **ToastContext**: Global notification system
- **API Client**: Type-safe fetch wrapper with retry logic
- **useToast Hook**: Easy access to toast notifications

## API Integration

The frontend communicates with the backend through:

### Endpoints Used

- `POST /upload` - Upload documents
- `GET /documents` - List all documents
- `POST /query` - Query documents with natural language

### Error Handling

The API client includes:
- Automatic retry logic for failed requests
- Detailed error messages
- User-friendly error notifications

## Customization

### Styling

The app uses Tailwind CSS with custom variables:
- `--accent-mint`: Primary accent color
- `--accent-teal`: Secondary accent color
- `--text-primary`: Main text color
- `--text-secondary`: Secondary text color
- `--severity-critical`: Error/critical color

### Fonts

The app uses Google Fonts:
- Playfair Display - Display font
- Source Sans 3 - Body font
- Montserrat - Heading font

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Make sure to set the environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Connection Issues

If you see "Failed to connect to backend":
1. Ensure backend is running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Verify CORS settings in backend

### Build Errors

Clear cache and reinstall:
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Performance Issues

- Clear browser cache
- Check network tab in DevTools
- Ensure backend is responding quickly

## Development Tips

- Use `npm run lint` to check code quality
- Hot reload is enabled - just save files to see changes
- Check console for detailed error messages
