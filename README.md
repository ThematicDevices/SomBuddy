# Sommelier - Wine Catalog App

A mobile-optimized wine collection management app with AI-powered features.

## Features

- 🍷 **Wine Collection Management** - Track your entire wine cellar
- 📸 **AI Label Recognition** - Take a photo and auto-extract wine details
- 🤖 **AI Sommelier** - Get personalized recommendations from your collection
- 📊 **Dashboard Analytics** - Visualize your collection by region, varietal, and more
- 🔍 **Search & Filter** - Find wines quickly
- 📱 **Mobile Optimized** - Works great on any device
- 🔐 **User Accounts** - Secure authentication with Supabase

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Claude API (via Supabase Edge Functions)
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup

### 1. Clone and Install

```bash
cd sommelier-app
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings > API** and copy:
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
```

### 4. Deploy Claude API Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Set the Claude API key secret:
   ```bash
   supabase secrets set CLAUDE_API_KEY=your-claude-api-key
   ```

4. Deploy the edge function:
   ```bash
   supabase functions deploy claude-proxy
   ```

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
4. Deploy!

## Project Structure

```
sommelier-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (Auth, Wine, Toast)
│   ├── lib/            # Supabase client
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── supabase/
│   ├── functions/      # Edge functions (Claude proxy)
│   └── schema.sql      # Database schema
└── ...config files
```

## License

MIT
