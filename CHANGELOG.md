# Changelog — Project Platform

## v1.0.0 (2026-05-31)

All systems upgraded to v1.0.0 with standardized UI/UX, consistent branding, and production-ready features.

### System-Wide Upgrades
- All packages bumped to v1.0.0
- Standardized SVG favicons (dark slate background, themed icons)
- Consistent port allocation (frontends: 3010–3013, backends: 4000–4002)
- Professional UI/UX across all applications
- TypeScript strict mode in all packages
- Unified design language and component patterns

### Port Allocation

| Service | Port | Type |
|---------|------|------|
| Collections Dashboard | 3010 | Frontend (Next.js) |
| LOS System Frontend | 3011 | Frontend (Vite + React) |
| Warehouse Management Frontend | 3012 | Frontend (Vite + React) |
| Data Viz | 3013 | Frontend (Next.js) |
| LOS System Backend | 4000 | Backend (Express) |
| Warehouse Management Backend | 4001 | Backend (Express) |
| Data Viz Connector Proxy | 4002 | Backend (Express) |

### Favicon Design Standard
All apps use the same design language:
- 32x32 SVG with `rx="8"` rounded rectangle
- Dark slate background (`#0f172a`)
- App-specific colored icon strokes/fills
- Collections: Green (#10b981) — dollar/circle
- LOS: Amber (#f59e0b) — document/plus
- Warehouse: Blue (#60a5fa) — warehouse/roof
- Data Viz: Blue gradient (#3b82f6 → #93c5fd) — bar chart

### Individual System Changelogs
- [Collections Dashboard](./collections-dashboard/CHANGELOG.md)
- [LOS System](./los-system/CHANGELOG.md)
- [Warehouse Management](./warehouse-management/CHANGELOG.md)
- [Data Viz](./data-viz/CHANGELOG.md)
