# PressHub

A community discussion platform bridging physical community newspapers to digital engagement through QR codes and TikTok-style conversational comments.

## Architecture

- **Framework:** Next.js 16 (App Router, Server Components)
- **Styling:** Tailwind CSS v4 with custom theme tokens
- **Database:** Supabase (PostgreSQL) with Realtime subscriptions
- **Auth:** Clerk (drop-in, social logins)
- **AI:** Groq API (Llama 3.3 70B) for article exploration and discussion summaries
- **QR Codes:** `qrcode` npm package, generated per article
- **Deployment:** Vercel

## Project Structure

```
src/
  app/
    page.tsx              # Community hub feed (trending/recent)
    layout.tsx            # Root layout with Clerk + Header
    article/[id]/page.tsx # Article detail + comments
    explore/page.tsx      # AI-powered article exploration
    sign-in/              # Clerk sign-in
    sign-up/              # Clerk sign-up
    api/
      articles/           # GET all articles
      comments/           # GET/POST comments
      likes/              # POST/DELETE comment likes
      views/              # POST article view tracking
      qrcode/[id]/        # GET QR code PNG for article
      ai/explore/         # POST AI-powered article search
      ai/summarize/       # POST AI discussion summary
  components/
    Header.tsx            # Nav with Clerk auth
    ArticleCard.tsx       # Article preview card
    CommentSection.tsx    # Real-time comment list with Supabase Realtime
    Comment.tsx           # Single comment with reply/like
    CommentInput.tsx      # Comment form (auth-gated)
    QRCode.tsx            # QR code modal + download
    EngagementMetrics.tsx # View/comment/like counts
    AIExplorer.tsx        # AI search interface
  lib/
    supabase.ts           # Supabase client
    types.ts              # TypeScript interfaces
supabase/
  migrations/
    001_initial.sql       # Tables, indexes, RLS, seed data
    002_functions.sql     # RPC functions for atomic counters
    003_actions_events.sql # Actions + community events tables + seed data
```

## Key Patterns

- `params` is a Promise in Next.js 16 — always `await params` or `use(params)`
- Comments use Supabase Realtime for live updates (postgres_changes)
- Comment tree is built client-side from flat list using `buildCommentTree()`
- Like/view counts use Supabase RPC functions for atomic increments
- AI features hit Groq API (Llama 3.3 70B) server-side, passing article corpus as context

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
- Supabase URL + anon key
- Clerk publishable + secret keys
- Groq API key

## Database Setup

Run the SQL files in `supabase/migrations/` against your Supabase project in order.
The seed data includes 5 sample articles from community newspapers.

## Development

```bash
npm run dev
```

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint check
