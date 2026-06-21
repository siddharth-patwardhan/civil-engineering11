# Migration Guide — Design System v2.0

## Overview

This guide explains how to migrate from the legacy light-themed Material 3 UI to the new dark-first enterprise design system.

## What Changed

### 1. CSS / Design Tokens
- **File**: `src/styles/design-system.css` (new)
- **Old file**: `src/index.css` (kept for compatibility during migration)
- New CSS custom properties: `--color-bg-primary`, `--color-bg-surface`, `--color-accent-primary`, etc.
- Dark mode is default. Light mode available via `data-theme="light"` on `<html>`.

### 2. Layout
- **New component**: `src/components/LayoutNew.tsx`
- Collapsible sidebar (72px / 256px)
- Dark mode toggle in sidebar footer
- Command palette trigger in sidebar
- Top bar with breadcrumbs, notifications, user avatar
- Keyboard shortcuts: `Ctrl+1`–`Ctrl+9` for navigation, `Ctrl+Shift+D` for theme toggle

### 3. Global Providers
- **AppShell** (`src/components/AppShell.tsx`) wraps the app with:
  - `DarkModeProvider` — theme state + localStorage + system preference
  - `ToastProvider` — global toast notifications (`showToast(message, type)`)
  - `FloatingAssistant` — AI chat widget on all pages

### 4. Reusable Components
- **DataTable** (`src/components/DataTable.tsx`) — spreadsheet-like table with sticky headers, row selection, hover states, and alternating row backgrounds.
- **CommandPalette** (`src/components/CommandPalette.tsx`) — `Ctrl+K` global search and navigation.

### 5. Refactored Pages
| Old Page | New Page | Key Changes |
|---|---|---|
| `Dashboard.tsx` | `DashboardNew.tsx` | Real data hooks, metric cards, chart stubs |
| `Measurement.tsx` | `MeasurementNew.tsx` | DataTable, undo/redo, keyboard shortcuts, template picker |
| `BOQ.tsx` | `BOQNew.tsx` | Inline editable DataTable, auto-calculate amount, undo/redo |
| `CreateProject.tsx` | `CreateProjectNew.tsx` | Actually calls `POST /api/projects`, validation |

## How to Activate

1. **App.tsx** already imports `design-system.css` and uses `AppShell` + new pages.
2. **JetBrains Mono** font is added to `index.html` for tabular numbers.
3. Run `npm run dev` and test.

## Gradual Migration Strategy

If you want to migrate remaining pages one-by-one:

1. **Copy** the old page to `PageOld.tsx`.
2. **Refactor** the original page to use new classes:
   - Replace `bg-surface` → `bg-bg-surface`
   - Replace `text-on-surface` → `text-text-primary`
   - Replace `text-on-surface-variant` → `text-text-secondary`
   - Replace `border-outline-variant` → `border-border-default`
   - Replace `font-headline-lg` → `font-h1`
   - Replace `font-body-md` → `font-body`
   - Replace `font-table-data` → `font-table`
   - Replace `font-label-caps` → `font-label`
3. **Test** the page in both dark and light modes.
4. **Repeat** for remaining pages.

## Formula & Business Logic

No changes to:
- `src/domain/formula.ts`
- `src/domain/rateEngine.ts`
- `src/domain/boqGenerator.ts`
- `src/domain/measurementTotals.ts`

These are solid and remain unchanged.

## Known Limitations

1. **Charts**: Dashboard chart stubs need Chart.js or Recharts integration.
2. **PDF Export**: Still uses `window.print()` stub. Integrate Puppeteer/Playwright on the server.
3. **Excel Export**: Not yet implemented. Use `xlsx` library.
4. **Drawing AI**: Upload exists but no extraction logic yet.
5. **Settings page**: Still uses old design classes. Refactor to use new tokens.
6. **Backend**: New API endpoints (`/api/dashboard`, `/api/materials`, etc.) are not yet implemented.

## Next Steps

1. Implement missing backend endpoints.
2. Add database migrations (ProjectStatus, ProjectType, BoqSection, MaterialMaster, etc.).
3. Refactor remaining pages: Settings, Reports, Materials, Labour, RateAnalysis, Assistant.
4. Add Recharts or Chart.js for dashboard visualizations.
5. Add Playwright PDF generation for real report exports.
6. Implement DSR import module.
7. Add Tendering, Billing, DPR, and Measurement Book modules.
8. Accessibility audit and ARIA improvements.

## Support

For questions, refer to the full specification:
[`docs/UX_AUDIT_AND_DESIGN_SPEC.md`](./docs/UX_AUDIT_AND_DESIGN_SPEC.md)
