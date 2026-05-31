# Changelog — WMS (Warehouse Management System)

## v1.0.0 (2026-05-31)

### Features — Backend
- Inventory management with real-time stock tracking
- Order processing and fulfillment workflow
- Warehouse zone and location management
- Receiving, putaway, picking, and shipping operations
- BullMQ job queues for async processing
- Redis caching for high-frequency lookups
- PostgreSQL with Prisma ORM
- JWT authentication and authorization
- RESTful API with Zod validation

### Features — Frontend
- Dashboard with key warehouse metrics
- Inventory browser with search and filters
- Order management with status tracking
- Warehouse map and zone visualization
- Form-based data entry with react-hook-form
- Real-time data with TanStack Query
- Charts and analytics with Recharts

### UI/UX
- Professional SVG favicon (blue warehouse/roof icon)
- Radix UI primitives for accessible components
- Tailwind CSS responsive design
- Zustand for client-side state

### Infrastructure
- Vite + React 18 (frontend)
- Express.js + TypeScript (backend)
- Port: 3012 (frontend), 4001 (backend)
