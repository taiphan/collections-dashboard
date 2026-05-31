# Changelog — LOS (Loan Origination System)

## v1.0.0 (2026-05-31)

### Features — Backend
- Case processing pipeline with stage management
- Decision engine with automated rule evaluation
- SLA monitoring with breach detection
- Worker-based background job processing (BullMQ)
- Redis caching layer
- PostgreSQL with Prisma ORM
- JWT authentication with bcrypt password hashing
- Rate limiting on auth endpoints
- Comprehensive API with RESTful conventions

### Features — Frontend
- Case management dashboard with filtering and search
- Application intake and processing workflow
- Real-time case status tracking
- Role-based access control UI
- Toast notifications and form validation
- TanStack Router for type-safe routing
- TanStack Query for server state management

### UI/UX
- Professional SVG favicon (amber document/loan icon)
- Radix UI primitives for accessible components
- Tailwind CSS responsive design
- Zustand for client-side state

### Infrastructure
- Vite + React 18 (frontend)
- Express.js + TypeScript (backend)
- Port: 3011 (frontend), 4000 (backend)
