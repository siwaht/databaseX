# VectorHub

A modern, production-ready vector database management interface built with Next.js 14. Manage, search, and analyze your vector databases with an elegant UI and powerful features.

![VectorHub Dashboard](https://via.placeholder.com/1200x630?text=VectorHub+Dashboard)

## Features

- 🗄️ **Multi-Database Support** - Connect to ChromaDB, Pinecone, Qdrant, Weaviate, MongoDB Atlas, Supabase, Redis, and Upstash
- 🔍 **Semantic Search** - Powerful vector similarity search with configurable parameters
- 📊 **Real-time Analytics** - Monitor collections, documents, and system health
- 🎨 **Modern UI** - Beautiful dark/light themes with smooth animations
- 🔒 **Production Ready** - Security headers, API validation, error handling, and health checks
- ⚡ **Performance Optimized** - Fast builds with optimized bundle sizes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **Animations**: Framer Motion
- **State Management**: Zustand with persistence
- **Validation**: Zod
- **Fonts**: Outfit (sans) + JetBrains Mono (mono)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/vectorhub.git
cd vectorhub
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard routes with layout
│   │   ├── collections/    # Collection management
│   │   ├── connections/    # Database connections
│   │   ├── documents/      # Document viewer
│   │   ├── search/         # Semantic search
│   │   ├── settings/       # App settings
│   │   └── upload/         # Data upload
│   └── api/                # API routes
│       ├── collections/    # Collection CRUD
│       ├── documents/      # Document operations
│       ├── search/         # Search endpoint
│       └── health/         # Health check
├── components/             # React components
│   ├── collections/        # Collection components
│   ├── connections/        # Connection components
│   ├── documents/          # Document components
│   ├── layout/             # Layout components
│   ├── providers/          # Context providers
│   ├── search/             # Search components
│   └── ui/                 # Base UI components
├── lib/                    # Utilities and services
│   ├── api/                # API client functions
│   ├── db/                 # Database adapters
│   └── validations/        # Zod schemas
├── store/                  # Zustand store
│   └── slices/             # Store slices
└── types/                  # TypeScript types
```

## Available Scripts

```bash
# Development
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript checks
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with system status |
| `/api/collections` | GET | List all collections |
| `/api/collections` | POST | Create a new collection |
| `/api/collections/[name]` | DELETE | Delete a collection |
| `/api/collections/[name]/stats` | GET | Get collection statistics |
| `/api/documents` | POST | Add documents to a collection |
| `/api/documents` | DELETE | Delete documents from a collection |
| `/api/search` | POST | Perform semantic search |

## Environment Variables

```env
# Application
NEXT_PUBLIC_APP_NAME=VectorHub
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Configuration
API_TIMEOUT=30000
API_MAX_RETRIES=3

# Database Connections (configure based on your setup)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
PINECONE_API_KEY=your-api-key
# ... see .env.example for full list
```

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/vectorhub)

### Security Headers

The application includes comprehensive security headers:

- Strict-Transport-Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
