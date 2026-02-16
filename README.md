# SomBuddy - Your Personal Wine Catalog

A mobile-optimized wine collection management app with AI-powered features. Track your cellar, get recommendations from an AI sommelier, and make smarter decisions at restaurants.

## Features

- **Wine Collection Management** - Track your entire wine cellar with detailed metadata: producer, vintage, region, varietals, bottle size, storage location, condition, provenance, and more
- **AI Label Recognition** - Take a photo of a wine label and auto-extract producer, vintage, region, varietals, estimated price, drinking window, food pairings, and a story about the wine
- **AI Data Enrichment** - Enrich existing wine entries with additional details sourced from AI
- **Batch Wine Import** - Add multiple wines at once by uploading several label photos with batch AI processing and review
- **AI Sommelier Chat** - Get personalized recommendations from an AI sommelier that knows your collection, with persistent conversation history
- **Restaurant Advisor** - Upload a photo, paste text, or import a PDF of a restaurant wine list to compare against your cellar. Get bring-vs-buy recommendations with corkage fee analysis and savings calculations
- **Dashboard Analytics** - Collection overview with stats cards (total bottles, collection value, ready to drink, aging), pie chart by wine type, bar chart by top regions, opened bottles tracking, and drinking window alerts
- **Drinking Window Tracking** - Stoplight system showing wine readiness: ready to drink (green), ending soon (yellow), past prime (red), and still aging (blue)
- **Tasting Notes & Ratings** - Add tasting notes with ratings (1-100 scale) to any wine and track tasting history over time
- **Open/Drink Tracking** - Mark bottles as opened, track consumption, and view recently opened bottles on the dashboard
- **Collection Filtering & Sorting** - Search wines, filter by wine color and drinking window status, sort by 8 criteria (date added, price, vintage, drinking window, name), with virtualized scrolling for large collections
- **Data Import/Export** - Export your collection to JSON for backup, import from a previous export
- **Image Storage** - Wine label images stored in Supabase Storage with thumbnail support and a migration tool for legacy base64 images
- **User Accounts** - Secure authentication with signup, login, forgot/reset password, and profile management
- **Account Management** - Update profile, delete account with confirmation
- **Mobile Optimized** - Responsive design with bottom navigation on mobile and sticky header with desktop navigation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (wine label images with thumbnails)
- **AI**: Claude API (Anthropic) via Vercel Serverless Functions
- **State Management**: TanStack React Query + React Context
- **Virtualization**: TanStack Virtual
- **Charts**: Recharts
- **PDF Parsing**: pdf.js
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Deployment**: Vercel

## Setup

### 1. Clone and Install

```bash
cd SomBuddy
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Run the storage migration: `supabase/migrations/002_storage_bucket.sql`
4. Go to **Settings > API** and copy:
   - Project URL
   - Anon public key

### 3. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
CLAUDE_API_KEY=your-claude-api-key
```

### 4. Set up Claude API (Vercel Serverless Function)

The AI features use a Vercel serverless function at `api/claude-proxy.ts` that proxies requests to the Claude API. When deploying to Vercel, add the following environment variables:

- `CLAUDE_API_KEY` - Your Anthropic API key
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS (e.g., `https://your-app.vercel.app`)

### 5. Run Development Server

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `CLAUDE_API_KEY`
   - `ALLOWED_ORIGINS`
4. Deploy!

## Project Structure

```
SomBuddy/
├── api/                      # Vercel serverless functions
│   ├── claude-proxy.ts       # AI proxy (label extraction, enrichment, sommelier, restaurant advisor)
│   └── update-prices.ts      # Price update endpoint
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Layout            # App shell with header and mobile bottom nav
│   │   ├── WineCard          # Wine display card with compact mode
│   │   ├── WineForm          # Full wine edit/add form
│   │   ├── WineListInput     # Restaurant wine list input (photo/text/PDF)
│   │   ├── MultiImageUpload  # Batch image upload for multiple wines
│   │   ├── BatchProcessingQueue # Batch AI processing progress UI
│   │   ├── RecommendationCard # Restaurant advisor recommendation display
│   │   ├── LazyImage         # Optimized lazy-loaded images
│   │   ├── MigrationSettings # Base64 to Supabase Storage migration tool
│   │   ├── ImageUpload       # Single image capture/upload
│   │   ├── Modal             # Reusable modal dialog
│   │   ├── Toast             # Toast notifications
│   │   ├── ErrorBoundary     # React error boundary
│   │   └── ProtectedRoute    # Auth-gated route wrapper
│   ├── contexts/             # React contexts
│   │   ├── AuthContext       # Authentication state and user profile
│   │   ├── WineContext       # Wine collection state
│   │   ├── ChatContext       # Sommelier chat history (persisted to Supabase)
│   │   ├── ToastContext      # Toast notification system
│   │   └── ApiKeyContext     # API key management
│   ├── hooks/                # Custom React hooks
│   │   ├── useWineQueries    # React Query hooks for wine CRUD operations
│   │   └── useBatchProcessor # Batch AI processing logic
│   ├── lib/                  # Client setup
│   │   ├── supabase          # Supabase client initialization
│   │   └── queryClient       # React Query client configuration
│   ├── pages/                # Page components
│   │   ├── Dashboard         # Collection overview with charts and alerts
│   │   ├── Collection        # Wine list with search, filters, and sorting
│   │   ├── AddWine           # Add wine via photo or manual entry
│   │   ├── BatchAddWines     # Batch wine import with multi-photo upload
│   │   ├── WineDetail        # Individual wine view, edit, tasting notes, drink tracking
│   │   ├── Sommelier         # AI sommelier chat interface
│   │   ├── RestaurantAdvisor # Restaurant wine list analysis and recommendations
│   │   ├── Settings          # Account, data management, and image migration
│   │   ├── Search            # Quick search page
│   │   ├── Login             # Login page
│   │   ├── Signup            # Registration page
│   │   ├── ForgotPassword    # Password reset request
│   │   └── ResetPassword     # Password reset completion
│   ├── types/                # TypeScript types
│   │   ├── wine              # Wine, TastingNote, ConsumptionRecord, VarietalBlend
│   │   ├── restaurant        # RestaurantAnalysis, WineComparison
│   │   ├── chat              # ChatMessage
│   │   └── database          # Database schema types
│   └── utils/                # Utility functions
│       ├── claude            # AI API calls (extract, enrich, chat, restaurant)
│       ├── helpers           # Wine data helpers, stats, formatting, drinking window logic
│       ├── imageStorage      # Supabase Storage upload/download/thumbnail utilities
│       ├── imageMigration    # Base64 to Supabase Storage migration
│       └── storage           # Local storage utilities
├── supabase/
│   ├── functions/            # Supabase Edge Functions (legacy)
│   │   └── claude-proxy/     # Legacy Claude proxy
│   ├── migrations/           # Database migrations
│   │   └── 002_storage_bucket.sql  # Wine image storage bucket setup
│   └── schema.sql            # Core database schema (profiles, wines, chat_history)
└── ...config files
```

## License

MIT
