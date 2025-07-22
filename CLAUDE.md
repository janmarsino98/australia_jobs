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

### Frontend Development (from `frontend/` directory)
```bash
npm run dev              # Start development server (port 5173)
npm run build            # TypeScript compile + Vite build  
npm run typecheck        # Run TypeScript type checking
npm run lint             # ESLint with auto-fix (--max-warnings 0)
npm run lint -- --fix    # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm test                 # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Cypress end-to-end tests
npm run test:e2e:dev     # Cypress interactive mode
```

### Backend Development (from `backend/` directory)
```bash
python server.py         # Start Flask development server (port 5000)
pip install -r requirements.txt  # Install dependencies
python run_all_tests.py  # Run all backend tests
python test_oauth.py     # Test OAuth integration specifically
```

### Required Services (Development Environment)
```bash
mongod                   # MongoDB server (required)
redis-server             # Redis server (required for sessions)
```

### Full Development Setup
```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Redis  
redis-server

# Terminal 3: Backend
cd backend && python server.py

# Terminal 4: Frontend
cd frontend && npm run dev
```

### Common Development Workflows
- **New Component**: Create in appropriate atomic layer → Add to UI_DESIGN_SYSTEM.md if needed
- **New API Endpoint**: Add to appropriate blueprint → Test with backend test script
- **State Management**: Create Zustand store in `src/stores/` → Export in `index.ts`
- **Bug Fixes**: Always run `npm run lint` and `npm run typecheck` before committing
- **TypeScript Errors**: Project configured with strict mode - fix type errors, don't ignore them

## Code Patterns and Conventions

### Frontend Architecture Overview
- **React 18** with **TypeScript** and **Vite** for build tooling
- **Zustand** for state management with API integration
- **shadcn/ui + Radix UI** components with **Tailwind CSS**
- **Atomic Design Pattern**: atoms → molecules → organisms → pages
- **React Router v6** for client-side routing

### State Management (Zustand Stores)
All stores located in `frontend/src/stores/` with centralized export in `index.ts`:
- **Core Stores**: `useAuthStore`, `useJobFilterStore`, `useResumeStore`
- **User Data**: `useUserPreferencesStore`, `useUserExperienceStore`, `useUserEducationStore`
- **Application Features**: `useJobApplicationStore`, `useSavedJobsStore`, `useAnalyticsStore`
- **Admin Features**: `useAdminStore` (comprehensive admin functionality)
- Store pattern: TypeScript interfaces + Zustand + API integration + persistence where appropriate

### Component Architecture (Atomic Design)
- **Atoms** (`src/components/atoms/`): `NavProfileIcon`, `Category_Pill`, `LocationIcon`
- **Molecules** (`src/components/molecules/`): `Navbar`, `JobCard`, `SearchBox`, `JobApplicationModal`
- **Organisms** (`src/components/organisms/`): `JobRow`, `PaymentForm`
- **UI Components** (`src/components/ui/`): shadcn/ui primitives (Button, Card, Input, etc.)
- **Pages** (`src/pages/`): Route-level components with full page layouts

### Backend Blueprint Architecture
Flask app with modular blueprint structure in `backend/`:
- **Core Blueprints**: `auth/`, `jobs/`, `resume/`, `users/`, `applications/`
- **Location Services**: `cities/`, `states/`
- **Utility Blueprints**: `jobtypes/`
- Each blueprint: `__init__.py` + main module (e.g., `auth.py`, `jobs.py`)
- **Centralized Models**: `models.py` (MongoDB document schemas)
- **Utilities**: `utils.py`, `constants.py`, `extensions.py`

### API Communication Pattern
- **HTTP Client**: `frontend/src/httpClient.ts` (Axios with interceptors)
- **Base URL**: `http://localhost:5000` (configurable via environment)
- **Authentication**: Session-based with CSRF protection
- **Error Handling**: Comprehensive interceptors with detailed logging
- **Security**: XSS protection, CORS configured, request sanitization

### TypeScript Integration
- **Main Types**: `frontend/src/types/index.ts` (User, Job, ResumeMetadata, etc.)
- **Store Types**: `frontend/src/types/store.ts`
- **Component Props**: Defined inline with interfaces
- **API Responses**: Typed throughout with proper error handling

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest with React Testing Library (`npm test`)
- **E2E Tests**: Cypress for user flow testing (`npm run test:e2e`)
- **Type Checking**: TypeScript compiler with strict mode (`npm run typecheck`)
- **Linting**: ESLint with TypeScript + React rules (`npm run lint`)
- **Code Coverage**: Jest coverage reports (`npm run test:coverage`)
- **Current Status**: Limited test coverage, focus on critical components

### Backend Testing
- **Manual Testing Scripts**: `backend/test_*.py` files for each blueprint
- **OAuth Testing**: Comprehensive LinkedIn/Google OAuth integration tests
- **API Endpoint Testing**: Individual blueprint testing (jobs, auth, resume, users)
- **Email Service Testing**: Email verification and notification testing
- **Run All Tests**: `python run_all_tests.py` for comprehensive backend testing

## Important Configuration Files

### Frontend Configuration
- **`vite.config.js`** - Vite build configuration and dev server settings
- **`tailwind.config.js`** - Tailwind CSS customization and design system
- **`tsconfig.json`** - TypeScript compiler options (strict mode enabled)
- **`.eslintrc.cjs`** - ESLint configuration with TypeScript + React rules
- **`package.json`** - Scripts, dependencies, and lint-staged configuration

### Backend Configuration  
- **`server.py`** - Flask app factory and configuration setup
- **`extensions.py`** - Flask extension initialization (MongoDB, Redis, etc.)
- **`constants.py`** - Application constants and configuration values
- **`requirements.txt`** - Python dependencies

### Environment Configuration
- **`.env`** (backend) - Environment variables for MongoDB, Redis, OAuth keys
- **Redis Configuration**: Session storage and caching
- **MongoDB Configuration**: Document database with GridFS for file storage

## File Storage and Resume Handling
- GridFS integration for PDF resume storage
- Resume metadata tracking with custom naming
- PDF.js integration for frontend preview functionality
- Resume analysis and ATS scoring features

## OAuth Implementation Notes
- **Google OAuth**: Complete integration with profile data sync
- **LinkedIn OAuth**: Comprehensive implementation with API permission handling
- **Fallback Strategies**: Graceful handling of limited API permissions
- **Profile Data Sync**: OAuth providers sync with local user records
- **Email Verification**: Integrated workflow with OAuth registration
- **Session Management**: Redis-based session storage with CSRF protection

## Design System and UI Guidelines

### Design System Reference
- **Complete Design System**: `frontend/src/UI_DESIGN_SYSTEM.md` contains comprehensive guidelines
- **Color Palette**: Custom brand colors with CSS variables (--main-text, --pill-bg, etc.)
- **Typography**: Consistent sizing scale (text-2xl, text-[16px], text-sm)
- **Component Patterns**: Standardized Button, Card, Badge, and Input patterns
- **Spacing System**: 12px increment-based spacing for consistent rhythm
- **shadcn/ui Integration**: Production-ready components with Radix UI primitives

### UI Implementation Status
- **Component Coverage**: 35+ components across atomic design layers
- **shadcn/ui Components**: Alert, Badge, Button, Card, Input, Progress, Select, Toast
- **Custom Components**: Job-specific cards, search interfaces, application tracking
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Current Project Status

### Frontend Completion (~90%)
As documented in `frontend/FRONTEND_COMPLETION_PLAN.md`:
- **25/30 pages** fully implemented with professional UI/UX
- **Authentication System**: Complete OAuth, email verification, session management  
- **Job Features**: Search, filtering, applications, saved jobs, employer tools
- **Admin Dashboard**: Comprehensive admin interface with user/job management
- **Payment Integration**: Stripe-powered payment processing
- **Legal Compliance**: Privacy policy, terms of service, cookie policy pages

### Key Architectural Decisions
- **TypeScript Migration**: All .jsx files migrated to .tsx with proper interfaces
- **State Management**: Zustand chosen over Redux for simplicity and performance
- **Component Library**: shadcn/ui chosen for accessibility and customization
- **Build Tool**: Vite chosen over Create React App for speed and modern tooling
- **Database**: MongoDB with GridFS for scalable file storage
- **Session Management**: Redis for distributed session storage