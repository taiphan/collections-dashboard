---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/*.jsx,**/components/**,**/features/**,**/app/**/*.tsx,**/pages/**"
---

# Frontend Development Standards

## Core Principles

- TypeScript always — never use `any` without justification
- Server Components by default (Next.js) — only add `'use client'` when needed
- Mobile first — design for 320px, enhance upward
- Accessible — WCAG 2.1 AA minimum
- Performant — LCP < 2.5s, CLS < 0.1, INP < 200ms

## Component Pattern

```tsx
import type { FC } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const Component: FC<Props> = ({ children, className }) => {
  return <div className={cn('base-styles', className)}>{children}</div>;
};
```

## Data Fetching

- Server Components: direct DB/API calls (preferred)
- Client Components: TanStack Query with staleTime

## Forms

- React Hook Form + Zod validation
- Labels above inputs (never placeholder-only)
- Inline validation on blur
- Loading state on submit button

## State Management

- Local: useState/useReducer
- Global: Zustand stores
- Server: TanStack Query

## Performance

- Images: `next/image` with explicit dimensions
- Heavy components: `dynamic()` with loading state
- Lists > 100 items: virtualize
- Bundle size monitored (< 200KB initial JS)

## Accessibility

- All interactive elements keyboard accessible
- Focus indicators visible
- Color contrast >= 4.5:1
- Form inputs have associated labels
- Images have alt text
- Modals trap focus
- Respect `prefers-reduced-motion`

## Red Flags

- Adding `'use client'` without specific need
- Component > 200 lines
- Prop drilling > 2 levels
- Not handling loading/error states
- Ignoring mobile viewport
