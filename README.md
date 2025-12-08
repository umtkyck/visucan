# VisuCAN - AI-Powered PCB Design Platform

VisuCAN is an AI-powered browser-based SaaS platform that combines conversational AI (Claude) with professional PCB design tools (Altium Designer integration) to streamline the entire PCB development workflow.

## Features

- **Claude AI Assistant** - Conversational AI that guides users through PCB design
- **Block Diagram to PCB** - Complete design flow from concept to manufacturing
- **DigiKey Integration** - Real-time component sourcing and pricing
- **PCBWAY Quoting** - Instant PCB manufacturing quotes with visual confirmation
- **Logo Placement** - Add your brand logo to PCB silkscreen (Pro/Enterprise)
- **Order Tracking** - Track PCB orders from fab to delivery (Pro/Enterprise)
- **Marketplace** - Buy and sell PCB designs and assembled boards
- **Draftsman Reports** - Professional PCB documentation

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18 with TypeScript
- TailwindCSS + Framer Motion
- Zustand (State Management)
- TanStack Query (Data Fetching)

### Backend
- Fastify (API Gateway)
- PostgreSQL + Prisma
- Redis (Caching & Sessions)
- JWT Authentication

### Infrastructure
- Turborepo (Monorepo)
- Docker
- GitHub Actions (CI/CD)

## Project Structure

```
visucan/
├── apps/
│   └── web/                  # Next.js frontend application
├── packages/
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utilities
│   ├── database/             # Prisma schema and client
│   └── ui/                   # Shared UI components
├── services/
│   └── api-gateway/          # Fastify API server
└── .github/
    └── workflows/            # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/umtkyck/visucan.git
cd visucan
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Set up the database:
```bash
npm run db:generate -w @visucan/database
npm run db:push -w @visucan/database
```

5. Start the development servers:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Development

### Commands

```bash
# Start all services in development mode
npm run dev

# Build all packages
npm run build

# Run linter
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test

# Format code
npm run format
```

### Database

```bash
# Generate Prisma client
npm run db:generate -w @visucan/database

# Push schema changes to database
npm run db:push -w @visucan/database

# Run migrations
npm run db:migrate -w @visucan/database

# Open Prisma Studio
npm run db:studio -w @visucan/database
```

## Subscription Tiers

| Feature | Lite (Free) | Pro ($49/mo) | Enterprise |
|---------|-------------|--------------|------------|
| Projects | 2 | Unlimited | Unlimited |
| Board Size | 10x10cm | 30x30cm | Unlimited |
| Layers | 2 | 4 | 4 |
| AI Messages | 50/mo | 500/mo | Unlimited |
| Logo Placement | No | Yes | Yes |
| Order Tracking | No | Yes | Yes |
| Marketplace | No | Yes (5% fee) | Yes (3% fee) |

## API Documentation

When running in development mode, API documentation is available at `http://localhost:3001/docs`.

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

### Commit Convention

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
```

## License

Proprietary - All rights reserved.

## Support

For support, please contact support@visucan.io or open an issue on GitHub.
