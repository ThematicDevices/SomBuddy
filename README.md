# Sommelier - Your Personal Wine Catalog

A sophisticated sommelier agent application that manages your personal wine collection with intelligent recommendations, image-based bottle entry, and conversational sommelier interactions.

## Features

### 🍷 Smart Wine Catalog
- Complete wine data model with all relevant fields
- Photo-based wine entry using Claude's vision AI
- Manual entry with auto-complete for varietals
- Full edit/delete capabilities

### 🤖 AI Sommelier
- Natural language queries about food pairings
- Personalized recommendations from YOUR collection
- Context-aware conversations
- Considers drinking windows, price points, and varietals

### 📊 Dashboard & Analytics
- Visual breakdown by region, varietal, and wine type
- Ready-to-drink highlights
- Collection value tracking
- Recently added wines

### 🔍 Search & Filter
- Fast full-text search
- Filter by type, status, region, price range
- Drinking window status indicators

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Claude API key (for AI features)

### Installation

```bash
# Navigate to the project directory
cd sommelier-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

1. Open the app in your browser (default: http://localhost:5173)
2. Go to Settings
3. Enter your Claude API key (get one from [console.anthropic.com](https://console.anthropic.com/settings/keys))

## Usage

### Adding Wine via Photo
1. Click "Add Wine" from the dashboard
2. Choose "Photo Capture"
3. Take a photo or upload an image of the wine label
4. Review and correct the AI-extracted data
5. Add quantity, price, and storage location
6. Save to your collection

### Getting Recommendations
1. Click "Sommelier" in the navigation
2. Ask natural language questions like:
   - "What pairs with rack of lamb?"
   - "What's ready to drink now?"
   - "Show me wines under $50"
3. Get personalized recommendations from your actual collection

### Managing Your Collection
- Browse and search your wines
- Edit any wine's details
- Track quantity and open bottles
- Add tasting notes
- Export/import your collection

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **AI**: Claude API (Anthropic)
- **Storage**: localStorage (client-side)

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Layout.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── WineCard.tsx
│   ├── WineForm.tsx
│   └── ImageUpload.tsx
├── contexts/          # React contexts for state management
│   ├── WineContext.tsx
│   ├── ApiKeyContext.tsx
│   └── ToastContext.tsx
├── pages/             # Route pages
│   ├── Dashboard.tsx
│   ├── Collection.tsx
│   ├── AddWine.tsx
│   ├── WineDetail.tsx
│   ├── Sommelier.tsx
│   ├── Settings.tsx
│   └── Search.tsx
├── types/             # TypeScript type definitions
│   ├── wine.ts
│   └── chat.ts
├── utils/             # Utility functions
│   ├── storage.ts     # localStorage helpers
│   ├── claude.ts      # Claude API integration
│   └── helpers.ts     # General helpers
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Data Storage

All data is stored locally in your browser using localStorage:
- Wine collection
- Chat history
- API key (encrypted)

Use the Export feature in Settings to backup your data.

## Privacy

- All data stays in your browser
- API key is stored locally only
- Images are processed via Claude API (sent to Anthropic)
- No analytics or tracking

## License

MIT
