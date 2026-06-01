# Changelog — Collection Portal

## v2.1.0 (2026-06-01)

### Features
- Renamed app to **Collection Portal** (FE CREDIT)
- Role-based usage guide at `/guide` (admin, manager, collector, viewer)
- Welcome banner on dashboard with personalized role tip
- Route guard enforces permissions on direct URL access
- Sidebar navigation filtered by user permissions

### Branding
- Adopted FE CREDIT corporate identity (fecredit.com.vn)
- Primary red `#E31837`, dark navy sidebar `#1a1a2e`
- Light mode default (matches fecredit.com.vn)
- Vietnamese UI throughout
- VND currency formatting

### Infrastructure
- Pushed to GitHub (taiphan/collections-dashboard)
- Pushed to GitLab (taiphan/collections-dashboard)
- Deployed to Vercel (sunshineai team)

## v2.0.0 (2026-05-31)

### Features
- Multi-page navigation (cases, strategies, analytics, agents, scoring, compliance)
- Case management with detailed debtor profiles
- Strategy designer for collection workflows
- Advanced analytics with ML-powered insights
- Multi-theme support (light/dark/system)
- Digital self-collection portal concept
- Monitoring & continuous improvement dashboard

## v1.0.0 (2026-05-30)

### Features
- Initial dashboard with bucket monitoring (B1–B5)
- CSV data import/export via PapaParse
- Stats cards and chart visualizations
- Status management for collection records
- Filterable records table
- Agent performance tracking and scoring
- Compliance monitoring module
- Strategy configuration and management
- Responsive layout with shadcn/ui components
- Zustand state management with persistence

### Infrastructure
- Next.js 16 App Router with Turbopack
- TypeScript strict mode
- Tailwind CSS v4
