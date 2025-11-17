# Finest Notes

A full-stack web application for saving, annotating, and organizing web pages and notes with a browser extension, built with modern web technologies.

## 🌟 Overview

Finest Notes is a comprehensive note-taking and web annotation platform that allows users to:

- 📝 Create and manage personal notes
- 🔖 Save web pages with descriptions
- ✨ Highlight and annotate web content
- 📁 Organize content into projects
- 🔒 Control privacy with public/private settings
- 💬 Comment and engage with public content
- 👥 Subscribe to other users' public projects
- 🔍 Search across your saved content

## 🏗️ Architecture

This is a monorepo project using **pnpm workspaces** with the following structure:

```
finest/
├── apps/
│   ├── web/          # Astro-based web application
│   ├── server/       # Hono API server (Cloudflare Workers)
│   └── extension/    # Browser extension (Chrome/Firefox)
└── packages/
    ├── typescript-config/  # Shared TypeScript configurations
    └── utils/             # Shared utilities and types
```

## 🚀 Tech Stack

### Web Application ([apps/web](apps/web))
- **Framework**: [Astro](https://astro.build) with React islands
- **Styling**: Tailwind CSS with DaisyUI
- **Fonts**: Libre Baskerville (serif), Libre Franklin (sans-serif)
- **State Management**: TanStack Query (React Query)
- **Authentication**: Better Auth integration
- **Deployment**: Cloudflare Pages

### API Server ([apps/server](apps/server))
- **Framework**: [Hono](https://hono.dev)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with email/password
- **Email**: Resend for email verification
- **Deployment**: Cloudflare Workers

### Browser Extension ([apps/extension](apps/extension))
- **Framework**: SolidJS
- **Build Tool**: Vite with web extension plugin
- **API Client**: Hono RPC client
- **Styling**: Tailwind CSS
- **Features**: 
  - Save current page
  - Highlight text selections
  - Quick access popup
  - Authentication integration

## 📦 Key Features

### Notes & Pages
- **Notes**: Rich text notes with Lexical editor
- **Pages**: Saved web pages with URL and description
- **Annotations**: Highlights and image annotations on saved pages
- **Privacy Controls**: Public or private visibility

### Projects
- Organize notes and pages into collections
- Public or private projects
- Subscribe to public projects from other users
- Multi-user collaboration through subscriptions

### Social Features
- Upvote/like system for notes
- Nested comment threads
- User profiles with public content
- Search across public content

### Browser Extension
- One-click page saving
- Text highlighting with XPath-based restoration
- Synced with web application
- Keyboard shortcuts (Ctrl+Shift+D)

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ and **pnpm** 8+
- **Cloudflare account** (for deployment)
- **Resend account** (for email)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
cp apps/extension/.env.example apps/extension/.env
```

### Environment Variables

#### Server ([apps/server/.env](apps/server/.env))
```env
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:8787
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_TOKEN=your_d1_token
RESEND_API_KEY=your_resend_key
```

#### Web ([apps/web/.env](apps/web/.env))
```env
VITE_API_URL=http://localhost:8787
CF_WEB_URL=http://localhost:4321
```

#### Extension ([apps/extension/.env](apps/extension/.env))
```env
VITE_API_URL=http://localhost:8787
VITE_WEB_URL=http://localhost:4321
```

### Running Locally

```bash
# Run all apps in development mode
pnpm dev

# Or run individually:
cd apps/server && pnpm dev    # API on localhost:8787
cd apps/web && pnpm dev       # Web on localhost:4321
cd apps/extension && pnpm dev # Extension dev mode
```

### Database Setup

```bash
# Navigate to server directory
cd apps/server

# Generate migration files
pnpm db:generate

# Apply migrations to local D1
wrangler d1 migrations apply finestdb --local

# View database in Drizzle Studio
pnpm db:studio
```

## 📊 Database Schema

The application uses the following main tables:

- **user**: User accounts and profiles
- **session**: Better Auth sessions
- **notes**: Both notes and saved pages
- **projects**: User-created collections
- **highlights**: Text annotations on pages
- **images**: Image annotations on pages
- **comments**: Nested comment threads
- **likes**: User upvotes on notes
- **projectsToNotes**: Many-to-many relationship
- **projectsToSubscribers**: Project subscriptions

See [apps/server/src/db/schema.ts](apps/server/src/db/schema.ts) for full schema.

## 🚢 Deployment

### Server Deployment

```bash
cd apps/server
pnpm deploy-r
```

### Web Deployment

```bash
cd apps/web
pnpm build
pnpm preview  # Test production build locally
pnpm deploy-r # Deploy to Cloudflare Pages
```

### Extension Publishing

1. Build the extension:
   ```bash
   cd apps/extension
   pnpm build
   ```

2. The built extension will be in `dist/` directory
3. Submit to [Chrome Web Store](https://chrome.google.com/webstore/devconsole) or [Firefox Add-ons](https://addons.mozilla.org)

## 🔑 API Routes

The server exposes the following main routes:

- `/api/note` - Note CRUD operations
- `/api/page` - Saved page operations
- `/api/highlight` - Highlight annotations
- `/api/image` - Image annotations
- `/api/projects` - Project management
- `/api/user` - User profiles and data
- `/api/comments` - Comment threads
- `/api/search` - Content search
- `/api/settings` - User settings
- `/api/auth/*` - Better Auth endpoints

See [apps/server/src/index.ts](apps/server/src/index.ts) and route files in [apps/server/src/routes](apps/server/src/routes).

## 🧪 Type Safety

The project uses **Hono RPC** for end-to-end type safety between the server and clients:

```typescript
// Server defines the API
export type RouteType = typeof routes;

// Clients get full type inference
import type { RouteType } from '@finest/server/types';
const client = hc<RouteType>(API_URL);
```

## 📝 Scripts

```bash
# Development
pnpm dev                 # Run all apps in dev mode

# Deployment
pnpm deploy-r           # Deploy all apps

# Type Checking
pnpm check-types        # Check types across all packages
```

---

Built with ❤️ using Astro, Hono, SolidJS, and Cloudflare