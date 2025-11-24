# LocalNotebook — Open Source NotebookLM Clone

## What We're Building

An open-source web application that recreates the core functionality of Google's NotebookLM with local data storage and educational focus:

- **NotebookLM Clone** — Upload documents, create projects, chat with your knowledge base, and generate content
- **Educational Focus** — Learn LLM concepts through practical implementation
- **Local-First** — All data stored locally, users control their own API keys
- **Cross-Platform** — Web app that works on all platforms (Mac, Windows, Linux, mobile)

---

## Why This Exists

- **For learning**: Covers core LLM teaching concepts through practical implementation
- **Open source**: Fully transparent codebase for learning and modification
- **Privacy-first**: Local data storage with user-controlled API keys
- **No subscriptions**: Pay only for the API calls you make

---

## Target Platform

- **Web Application** — Works in any modern browser
- **No app bundling complexity** — Same app works on all platforms
- **Local data storage** — JSON files stored in browser's local storage or downloadable
- **Self-hosted option** — Run locally or deploy to any web server

---

## Core Features (NotebookLM Clone)

### Document Management
- Create and manage multiple projects/notebooks
- Upload documents (PDF, text, markdown, URLs, YouTube videos)
- Support for multiple sources per project (up to 50)
- Document indexing and organization
- Source categorization and quick switching

### AI-Powered Research
- Natural language Q&A about documents
- Context-aware responses with inline citations
- Direct linking to source sections
- Multi-document cross-referencing
- Follow-up question suggestions

### Content Generation
- **Study Guides** — Automatic study guide creation from sources
- **Briefing Documents** — Executive summaries and briefings
- **Audio Overviews** — Convert documents to podcast-style discussions
- **Mind Maps** — Visual representation of document relationships
- **Presentations** — Auto-generate slides from content
- **Video Overviews** — Create video summaries with AI narration
- **Outlines** — Structured outlines from notes
- **Key Points** — Extract and organize main ideas

### Chat Interface
- Normal chat mode (general AI assistant)
- Project chat mode (chat within document context)
- Multiple chats per project
- Chat history and management
- Voice input for chat (using browser's speech API)

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Shadcn/ui** component library (Radix UI)
- **Tailwind CSS** for styling
- **Vite** for fast development

### Backend
- **Python Flask** for API server
- **Flask-CORS** for cross-origin support
- **Flask-SocketIO** for real-time features (optional)

### Storage
- **Browser LocalStorage** for client-side persistence
- **IndexedDB** for larger document storage
- **JSON files** for export/import functionality
- No database required — keeps it simple and teachable

### AI & Processing
- **LangChain** for document processing and RAG
- **ChromaDB** or **FAISS** for local vector storage (no Pinecone needed)
- **PDFPlumber** for PDF text extraction
- **BeautifulSoup** for web scraping

### External APIs (User Provides Keys)

| Service | Provider | Purpose | Required |
|---------|----------|---------|----------|
| LLM / Chat | Claude API (Anthropic) | Main AI brain | Yes |
| Embeddings | OpenAI API | Document embeddings | Yes |
| Voice Transcription | Browser Speech API | Voice input | No (built-in) |
| YouTube Data | YouTube API | Video transcripts | Optional |
| Image Generation | Google Gemini | Visual content | Optional |

---

## Learning Concepts Covered

### Core LLM Concepts
1. **Normal Chat** — Basic LLM interaction
2. **Project-Based Chat** — Context management and memory
3. **RAG (Retrieval Augmented Generation)** — Document Q&A with citations
4. **Embeddings & Vector Search** — Semantic document search
5. **Prompt Engineering** — Customizable system prompts

### Agent Architecture
1. **Main Agent** — Orchestrates different capabilities
2. **Sub-Agents** — Specialized agents for specific tasks:
   - Document processing agent
   - Content generation agent
   - Audio overview agent (podcast generation)
   - Presentation builder agent
   - Mind map creator agent

### Advanced Features
1. **Multi-modal Processing** — Text, images, PDFs, videos
2. **Streaming Responses** — Real-time AI output
3. **Token Management** — Handling context limits
4. **Citation Generation** — Linking responses to sources

---

## Implementation Phases

### Phase 1: Core Foundation ✅
- Project management UI
- Document upload interface
- Basic chat functionality
- Local storage setup

### Phase 2: Document Processing
- PDF text extraction
- Web scraping for URLs
- YouTube transcript fetching
- Document chunking and indexing

### Phase 3: RAG Implementation
- Vector embeddings generation
- Semantic search setup
- Context retrieval
- Citation system

### Phase 4: Content Generation
- Study guide generator
- Summary creation
- Audio overview (text-to-speech or AI dialogue)
- Presentation builder

### Phase 5: Advanced Features
- Mind map visualization
- Video overview generation
- Multi-agent orchestration
- Export/import functionality

---

## Distribution

### For Developers
```bash
# Clone the repository
git clone https://github.com/yourusername/localnotebook
cd localnotebook

# Install dependencies
npm install
pip install -r requirements.txt

# Add your API keys to .env
cp .env.example .env
# Edit .env with your keys

# Run development servers
npm run dev  # Frontend
python app.py  # Backend
```

### For End Users
1. Download the release package
2. Extract and open `index.html`
3. Enter API keys in settings
4. Start using immediately

### Deployment Options
- **Local only** — Run on localhost
- **Self-hosted** — Deploy to your own server
- **Static hosting** — Deploy frontend to Netlify/Vercel
- **Container** — Docker compose for easy setup

---

## Privacy & Data Control

- **No telemetry** — Zero tracking or analytics
- **Local storage** — All data stays on user's device
- **Export anytime** — Download all data as JSON
- **API key security** — Keys stored locally, never sent to our servers
- **Open source** — Full transparency, audit the code yourself

---

## Educational Value

This project teaches:
- How NotebookLM-style apps work internally
- RAG implementation from scratch
- Multi-agent architectures
- Document processing pipelines
- Vector databases and embeddings
- Modern React development
- API integration patterns
- Local-first application design

Perfect for:
- Developers learning AI/LLM concepts
- Students building portfolio projects
- Teams needing a private knowledge base
- Anyone wanting to understand modern AI tools

---

## Summary

LocalNotebook is an open-source NotebookLM clone designed for learning and practical use. It demonstrates core LLM concepts through a real-world application while giving users complete control over their data and costs. The web-based architecture ensures it works everywhere without platform-specific complexity.