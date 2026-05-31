---
inclusion: manual
---

# Accessibility Checklist (WCAG 2.1 AA)

## Keyboard Navigation

- All interactive elements focusable with Tab
- Focus order logical (follows visual order)
- Focus indicator visible (never `outline: none`)
- Skip link to main content
- No keyboard traps
- Custom components work with Enter/Space

## Screen Readers

- Semantic HTML (`<nav>`, `<main>`, `<article>`)
- Headings in logical order (h1 → h2 → h3)
- Images have alt text (empty `alt=""` for decorative)
- Form inputs have labels
- Buttons have accessible names
- Dynamic content announced (aria-live)
- Modals trap focus and have aria-modal

## Visual Design

- Text contrast >= 4.5:1
- Large text contrast >= 3:1
- Information not conveyed by color alone
- Text resizable to 200% without loss
- Line height >= 1.5
- Respect `prefers-reduced-motion`
- No flashing content (> 3 flashes/second)

## Forms

- All inputs have visible labels
- Required fields marked
- Error messages associated with inputs (aria-describedby)
- Autocomplete attributes used

## Testing

```bash
npx axe-cli https://example.com
npx pa11y https://example.com
```

- Navigate with keyboard only
- Test with screen reader (VoiceOver)
- Zoom to 200%
- Use high contrast mode
