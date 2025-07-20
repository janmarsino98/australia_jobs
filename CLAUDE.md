# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AusJobs is a full-stack Australian job search platform with a Flask backend and React frontend. The application connects job seekers with employers, featuring AI-powered resume analysis, OAuth authentication (Google/LinkedIn), job filtering, and payment processing via Stripe.

## Architecture

### Backend (Flask)
- **Main server**: `backend/server.py` - Flask app with blueprint registration
- **Database**: MongoDB with PyMongo, GridFS for file storage, Redis for sessions
- **Authentication**: Flask-Session with OAuth (Google/LinkedIn), email verification
- **Modular structure**: Blueprint-based organization by feature (auth, jobs, resume, etc.)

### Frontend (React + TypeScript)
- **Build tool**: Vite with TypeScript support
- **State management**: Zustand stores in `src/stores/`
- **Component architecture**: Atomic design pattern (atoms/molecules/organisms)
- **UI framework**: shadcn/ui with Radix UI primitives, Tailwind CSS
- **Routing**: React Router v6

### Key Integrations
- **MongoDB**: Primary database with GridFS for resume storage
- **Redis**: Session management and caching
- **Stripe**: Payment processing for premium services
- **OAuth providers**: Google and LinkedIn authentication

## Development Commands

### Frontend (from `frontend/` directory)
```bash
npm run dev              # Start development server (port 5173)
npm run build            # TypeScript compile + Vite build
npm run typecheck        # Run TypeScript type checking
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
npm test                 # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Cypress end-to-end tests
npm run test:e2e:dev     # Cypress interactive mode
```

### Backend (from `backend/` directory)
```bash
python server.py         # Start Flask development server (port 5000)
pip install -r requirements.txt  # Install dependencies
```

### Required Services
```bash
mongod                   # MongoDB server
redis-server            # Redis server
```

## Code Patterns and Conventions

### Frontend State Management
- Zustand stores for global state (`useAuthStore`, `useJobFilterStore`, `useResumeStore`, etc.)
- Store files in `src/stores/` with TypeScript interfaces
- Prefer store composition over large monolithic stores

### Component Structure
- **Atoms**: Basic UI elements (`NavProfileIcon`, `Category_Pill`)
- **Molecules**: Composed components (`Navbar`, `JobCard`, `ResumePreview`)
- **Organisms**: Complex components (`JobApplicationTracker`)
- **UI components**: shadcn/ui components in `src/components/ui/`

### Backend Blueprints
- Feature-based blueprints: `auth/`, `jobs/`, `resume/`, `users/`
- Each blueprint has its own `__init__.py` and main module
- Database models centralized in `models.py`
- Utility functions in `utils.py`

### API Communication
- HTTP client configured in `frontend/src/httpClient.js`
- Base URL: `http://localhost:5000`
- Session-based authentication with CORS support

### TypeScript Types
- Main types defined in `frontend/src/types/index.ts`
- Key interfaces: `User`, `Job`, `ResumeMetadata`, `ResumeAnalysis`
- Store types in `frontend/src/types/store.ts`

## Testing Strategy

### Frontend Testing
- **Unit tests**: Jest with React Testing Library
- **E2E tests**: Cypress for user flow testing
- **Type checking**: TypeScript compiler with strict mode
- **Linting**: ESLint with React hooks and TypeScript rules

### Backend Testing
- Manual testing scripts in `backend/test_*.py` files
- Focus on OAuth integration and API endpoint testing

## Important Configuration Files

- `frontend/vite.config.js` - Vite build configuration
- `frontend/tailwind.config.js` - Tailwind CSS customization
- `frontend/tsconfig.json` - TypeScript compiler options
- `backend/extensions.py` - Flask extension initialization
- `backend/constants.py` - Application constants

## File Storage and Resume Handling
- GridFS integration for PDF resume storage
- Resume metadata tracking with custom naming
- PDF.js integration for frontend preview functionality
- Resume analysis and ATS scoring features

## OAuth Implementation Notes
- Google and LinkedIn OAuth with comprehensive error handling
- Fallback strategies for limited API permissions
- Profile data synchronization between OAuth providers and local user records
- Email verification workflow integration