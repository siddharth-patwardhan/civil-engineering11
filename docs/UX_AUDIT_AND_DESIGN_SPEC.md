# UX Audit & Design Specification
## Civil Engineering Estimation Platform

**Date:** 2025-06-02  
**Auditor:** Kimi (Senior Civil Engineer / QS / UX Auditor)  
**Scope:** Full-stack audit of frontend UI/UX, backend APIs, database schema, business logic, and engineering formulas.

---

## 1. Executive Summary

The current application has a **solid technical foundation** (React 19, Vite, Tailwind v4, Prisma, PostgreSQL, Express) but suffers from **significant UX gaps** that prevent it from competing with CostX, PlanSwift, or Buildxact. The UI is a light-themed Material 3 derivative that feels generic, the data flow is partially hardcoded, and critical QS workflows are missing or underdeveloped.

### Overall Grade: C+ (Good Foundation, Poor Polish)

| Category | Grade | Notes |
|---|---|---|
| Tech Stack | A | Modern, scalable, well-chosen |
| Database Schema | B+ | Good foundations, missing some tables |
| API Design | B | RESTful, authenticated, audit-logged |
| Formula Engine | B+ | Strict, traceable, extensible |
| UI/UX Design | C | Light theme, generic, low information density |
| BOQ Experience | D | Hardcoded, not editable inline, no spreadsheet UX |
| Measurement Book | C+ | Good grid, missing keyboard nav, bulk ops |
| Mobile UX | C | Bottom nav too limited, tables overflow |
| Dark Mode | F | Toggle exists, CSS has no dark variant |
| Accessibility | D | No ARIA labels, low contrast risks |
| AI Integration | B | Good assistant, not integrated into workflow |

---

## 2. Bugs & Formula Errors Found

### 2.1 Critical Bugs

| ID | Severity | Location | Description | Fix |
|---|---|---|---|---|
| BUG-001 | **Critical** | `src/pages/BOQ.tsx` | All BOQ quantities are **hardcoded** or derived from `totalVolume` only. The server snapshot is displayed read-only but not used for actual calculation. | BOQ must be fully data-driven from server state |
| BUG-002 | **Critical** | `src/pages/BOQ.tsx` | BOQ page uses `formatCurrency` with `currency: 'USD'` but the project is clearly Indian/international civil engineering. No currency preference is respected. | Use settings currency; default INR |
| BUG-003 | **High** | `src/pages/Settings.tsx` | Dark mode toggle is a dead control. The CSS has no `prefers-color-scheme` or `[data-theme="dark"]` rules. | Implement full dark theme |
| BUG-004 | **High** | `src/pages/Measurement.tsx` | No `useMemo` on `quantityResult` calls; every keystroke re-computes all rows. | Memoize per-row or use virtualized computed state |
| BUG-005 | **High** | `src/pages/CreateProject.tsx` | Form does not actually call the API. It only navigates to `/measurement` and sets a dummy localStorage row. | Wire to `POST /api/projects` |
| BUG-006 | **High** | `server/routes/reports.ts` | PDF export is literally HTML with `text/html` content-type. Not a real PDF. | Integrate Puppeteer/Playwright or a PDF library |
| BUG-007 | **Medium** | `src/pages/BOQ.tsx` | `export HTML` button actually calls `/reports/boq/.../pdf` but opens it as a blob. The endpoint returns HTML, not PDF. Misleading label. | Rename or fix |
| BUG-008 | **Medium** | `src/pages/RateAnalysis.tsx` | Server-side `totalRate` is computed but the UI shows a hardcoded `$250.00` in the header. | Bind to server data or compute locally |
| BUG-009 | **Medium** | `src/pages/Dashboard.tsx` | All dashboard metrics are **static hardcoded strings** ("142", "$4.2M", "-1.4%"). No API calls. | Connect to real aggregated endpoints |
| BUG-010 | **Medium** | `src/pages/Projects.tsx` | After creating a project, user must manually navigate to it. No auto-redirect to project workspace. | Auto-open new project |

### 2.2 Formula Verification

| Formula | Status | Notes |
|---|---|---|
| `Volume = N × L × W × H` | **PASS** | Correct, validated in `formula.ts` |
| `Area = N × L × W` | **PASS** | Correct |
| `Linear = N × L` | **PASS** | Correct |
| `Steel weight = (D²/162) × L` | **PASS** | Correct for kg per metre. Good for rebar estimation |
| `Rate = M + L + E + OH + Profit` | **PASS** | `rateEngine.ts` computes correctly: OH on direct, profit on (direct+OH) |
| `BOQ Amount = Qty × Rate` | **PASS** | But hardcoded in UI |
| **Missing: Brick calculator** | **NEEDS** | No formula for brick quantities (volume → brick count) |
| **Missing: Paint calculator** | **NEEDS** | No area → paint litres formula |
| **Missing: Tile calculator** | **NEEDS** | No area → tile count + wastage |
| **Missing: Concrete mix calculator** | **NEEDS** | No cement:sand:aggregate ratio calculator |
| **Missing: Road quantities** | **NEEDS** | No GSB, WMM, DBM, BC volume/area formulas |

### 2.3 Database Issues

| Issue | Severity | Description | Fix |
|---|---|---|---|
| DB-001 | Medium | `Project` has no `status` field (no enum for Active/Completed/OnHold) | Add `ProjectStatus` enum |
| DB-002 | Medium | No `ProjectType` enum (Residential, Commercial, etc.) | Add enum or free-text with validation |
| DB-003 | Medium | `Project.startDate` / `endDate` missing from schema | Add fields |
| DB-004 | High | No `Section` / `SubSection` for BOQ hierarchy | Add `BoqSection`, `BoqSubSection` models |
| DB-005 | High | `BoqLine` has no `sectionId` or `category` | Add grouping fields |
| DB-006 | Medium | No `MaterialMaster` table | Materials are hardcoded UI only |
| DB-007 | Medium | No `LabourCategory` table | Labour is static UI only |
| DB-008 | Medium | No `Supplier` / `Vendor` table | Rate history has no supplier link |
| DB-009 | Medium | `Drawing` has no `uploadedBy` or `drawingType` | Add metadata fields |
| DB-010 | Low | No `DsrItem` table for CPWD/State PWD integration | Add table for DSR import |

---

## 3. Missing Features (vs Mission Spec)

### 3.1 Core Modules Completely Missing

| Module | Priority | Notes |
|---|---|---|
| **Tender Estimation** | P1 | No tender BOQ import, no bid analysis, no rate comparison |
| **Measurement Book (MB)** | P1 | Only Measurement page exists; no government-style MB with running measurements |
| **Billing Module** | P1 | No RA bills, client bills, contractor bills, final bills |
| **DPR Module** | P1 | No daily progress report generation |
| **DSR Integration** | P1 | CPWD, State PWD, MORTH DSR search/import not implemented |
| **Drawing-Based Estimation** | P2 | Upload exists but no auto-detection / quantity extraction |
| **Contractor/Vendor Database** | P2 | No contractor management module |
| **Material Stock Tracking** | P2 | No inventory management |
| **Labour Attendance** | P2 | Static UI only, no actual attendance tracking |
| **Project Calendar / Gantt** | P3 | No timeline visualization |

### 3.2 UX Features Missing

| Feature | Priority | Notes |
|---|---|---|
| **Command Palette** | P1 | No `Ctrl+K` global search/navigation |
| **Keyboard Shortcuts** | P1 | No `Ctrl+S`, `Ctrl+Z`, arrow-key navigation in tables |
| **Undo/Redo** | P1 | Critical for measurement/BOQ editing |
| **Bulk Paste (Excel)** | P1 | QS users paste from Excel constantly |
| **Inline BOQ Editing** | P1 | BOQ is read-only grid, not editable |
| **Column Customization** | P2 | No hide/show columns in tables |
| **Frozen Columns** | P2 | Important for wide BOQ tables |
| **Drag Reorder** | P2 | Rows cannot be reordered in measurement or BOQ |
| **Multi-Select + Bulk Actions** | P2 | No checkbox selection in tables |
| **Recent Projects** | P2 | Not shown in sidebar or dashboard |
| **Breadcrumbs** | P2 | No navigation context (Project > BOQ > Item) |
| **Contextual Help / Tooltips** | P3 | No help on formula inputs |
| **Toast Notifications** | P2 | No success/error toast system |
| **Floating AI Assistant** | P2 | Only a separate page, not floating widget |

### 3.3 Accessibility (A11y) Missing

| Check | Status |
|---|---|
| ARIA labels on icon buttons | **FAIL** |
| Focus visible states | **FAIL** (focus rings are minimal) |
| Color contrast (WCAG AA) | **FAIL** (text-on-surface-variant on some backgrounds may fail) |
| Screen reader table headers | **FAIL** (no `scope="col"` on table headers) |
| Skip navigation link | **FAIL** |
| Reduced motion support | **FAIL** |
| Form error associations (`aria-describedby`) | **FAIL** |

---

## 4. UX Improvements by Screen

### 4.1 Global Navigation

**Current:**
- Fixed 260px sidebar with 11 items + mobile bottom nav with 5 items
- No project context switching
- No search
- No collapsible state

**Required:**
- Collapsible sidebar (icon-only mode at ~72px)
- Recently opened projects section
- Project switcher dropdown
- Keyboard shortcut badges (`Ctrl+1` … `Ctrl+9`)
- Search bar (`Ctrl+K`) for pages, projects, BOQ items
- Bottom section for user profile, org settings, dark mode toggle

### 4.2 Dashboard

**Current:**
- 4 hardcoded metric cards
- Static project table with 3 dummy rows
- No charts, no cost distribution, no material breakdown

**Required:**
- Real data from aggregated API (`/api/dashboard`)
- Charts: Cost Distribution (Pie), Material Breakdown (Bar), Project Progress (Line)
- Command-center feel: dense, actionable, real-time
- Recent activity feed (audit log events)
- Quick actions: New Project, Import BOQ, Generate DPR
- Project status summary cards (Active, On Hold, Completed)

### 4.3 Project Workspace (NEW PATTERN)

**Current:**
- Projects are global lists; opening a project goes to Measurement
- No project-level tabs
- User loses context when navigating to Rates or Materials

**Required:**
- **Project Workspace**: When a project is selected, the sidebar changes to project context
- Tabs: Overview | BOQ | Estimates | Materials | Labour | Reports | Documents | Settings
- Breadcrumbs: `Projects / Downtown Core Plaza / BOQ / v3`
- Project header with status, budget, dates, quick actions

### 4.4 Measurement Book

**Current:**
- Grid layout using CSS grid (not `<table>`)
- No keyboard navigation between cells
- No bulk paste
- Add row only via button
- No undo after delete
- No row reordering
- Sync is manual push/pull

**Required:**
- Spreadsheet-like `<table>` with `contenteditable` or optimized inputs
- `Tab` key navigates right, `Enter` navigates down, `Shift+Tab` left
- Arrow keys move between cells
- Bulk paste from Excel (CSV parser)
- Undo/Redo (`Ctrl+Z` / `Ctrl+Y`)
- Drag handle for reordering
- Auto-save debounce (no manual push button)
- Template suggestions in sidebar
- Deductions column (add/remove deductions per row)
- Formula preview tooltip per row

### 4.5 BOQ Module

**Current:**
- Hardcoded 4-line BOQ (site clearance, excavation, concrete, steel)
- Static grid with no editing
- Server snapshot shown separately but not primary
- No sections/subsections
- No rate book linking
- No version comparison UI

**Required:**
- **Editable inline table**: click cell → edit → auto-calculate amount
- Section/Subsection tree on left
- Properties panel on right (when row selected)
- Rate lookup from rate book / DSR
- Auto-generate from Measurement Book
- Version sidebar with diff highlighting
- Export: PDF, Excel, CSV
- Multi-select + bulk rate apply
- Keyboard navigation identical to Measurement

### 4.6 Rate Analysis

**Current:**
- Single hardcoded example (Concrete C30/37)
- Manual cost inputs only
- No material library linking
- No equipment library

**Required:**
- Material picker from Material Library
- Labour picker from Labour Library
- Equipment picker with rental/day rates
- Wastage % per material
- Profit & OH on chosen base
- Side-by-side comparison of multiple analyses
- Link to BOQ line item (which rate applies to which BOQ item)

### 4.7 Materials & Labour

**Current:**
- Both are completely static / mock data
- No CRUD operations
- No rate history
- No supplier management

**Required:**
- Full CRUD tables
- Rate history chart per material
- Supplier/vendor linking
- Search + filter + sort
- Category grouping
- Import from CSV/Excel

### 4.8 Reports

**Current:**
- Two static cards with `window.print()`
- No actual PDF generation
- No Excel export
- No data

**Required:**
- Report builder with date range, project, filters
- Actual PDF generation (via Puppeteer/Playwright on server)
- Excel export (via `xlsx` library)
- CSV export
- Preview before download
- Scheduled reports (email)

### 4.9 AI Assistant

**Current:**
- Separate page with text input
- Good IS 456 integration
- No integration into BOQ or Measurement workflow

**Required:**
- **Floating widget** (bottom-right) on all pages
- Context-aware: suggests BOQ items when on BOQ page, suggests templates when on Measurement
- Can detect missing items (e.g., curing compound for concrete)
- Can explain calculations inline
- Can generate DPR from project data

---

## 5. Design System Specification

### 5.1 Color System (Dark-First)

```text
--bg-primary:     #0B0F14    (app background)
--bg-surface:     #121821    (cards, panels)
--bg-elevated:    #1A2230    (modals, dropdowns, hover)
--bg-input:       #0E131A    (form fields)
--border-default: #2A3441    (dividers, borders)
--border-focus:   #3B82F6    (focused elements)
--accent-primary: #3B82F6    (buttons, links, active states)
--accent-success: #22C55E    (positive, approved)
--accent-warning: #F59E0B    (pending, caution)
--accent-danger:  #EF4444    (errors, reject, delete)
--text-primary:   #F8FAFC    (headings, primary data)
--text-secondary: #94A3B8    (labels, descriptions)
--text-muted:     #64748B    (disabled, placeholders)
--text-on-accent: #FFFFFF    (text on primary buttons)
```

### 5.2 Light Mode (Optional)

```text
--bg-primary:     #F8FAFC
--bg-surface:     #FFFFFF
--bg-elevated:    #F1F5F9
--border-default: #E2E8F0
--text-primary:   #0F172A
--text-secondary: #475569
```

### 5.3 Typography

```text
Font: 'Inter' (keep) + 'JetBrains Mono' for numbers/code

Display:   36px / 700 / -0.02em (metrics)
H1:        28px / 700 / -0.01em
H2:        22px / 600 / 0
H3:        18px / 600 / 0
Body:      14px / 400 / 0.01em (main body, not 16px — too large for dense data)
Table:     13px / 500 / 0.01em (dense tabular data)
Label:     11px / 600 / 0.05em / uppercase
Mono:      13px / 400 / 0 (quantities, rates, item numbers)
```

### 5.4 Spacing & Density

```text
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-8:  48px

Sidebar width:     256px (expanded) / 72px (collapsed)
Top bar height:    56px
Table row height:  40px
Input height:      36px (compact, not 48px)
Button height:     36px (standard) / 32px (small)
Card padding:      16px
Page padding:      24px
```

### 5.5 Component Patterns

- **Cards**: `bg-surface`, `border: 1px solid border-default`, `border-radius: 8px`, no heavy shadow (subtle `0 1px 2px rgba(0,0,0,0.2)`)
- **Tables**: No card wrapper for data grids. Use full-width table with sticky header, alternating subtle row backgrounds (`bg-primary` vs `bg-surface`), border-bottom only.
- **Inputs**: `bg-input`, `border: 1px solid border-default`, `border-radius: 6px`, focus: `border-accent-primary` + `ring: 0 0 0 2px rgba(59,130,246,0.2)`
- **Buttons**: 
  - Primary: `bg-accent-primary`, `text-on-accent`, `border-radius: 6px`
  - Secondary: `bg-surface`, `border: 1px solid border-default`, `text-primary`
  - Danger: `bg-accent-danger/10`, `text-accent-danger`, `border: 1px solid accent-danger/20`
- **Status badges**: Pill shape, small font, color-coded background at 10% opacity
- **Tooltips**: `bg-elevated`, `text-primary`, `border-radius: 6px`, `padding: 6px 10px`

---

## 6. New Architecture Plan

### 6.1 Frontend File Structure

```text
src/
  styles/
    design-system.css          # Replaces index.css
    light-theme.css            # Optional light overrides
  components/
    Layout.tsx                 # New: collapsible sidebar, dark mode, project context
    CommandPalette.tsx         # New: Ctrl+K global search
    DarkModeProvider.tsx       # New: context + localStorage + system preference
    ProjectWorkspace.tsx       # New: project tab wrapper
    AppShell.tsx               # New: top bar + sidebar composition
    DataTable.tsx              # New: reusable spreadsheet-like table
    InlineEdit.tsx             # New: cell editing component
    FloatingAssistant.tsx      # New: floating AI widget
    ToastProvider.tsx          # New: toast notifications
    StatusBadge.tsx            # New: status pill
    MetricCard.tsx             # New: dashboard metric
    SectionHeader.tsx          # New: page section header
  features/
    project/
      projectUiStore.ts        # Expand: add recentProjects, sidebarCollapsed
      ProjectHeader.tsx        # New: project detail header
    measurement/
      MeasurementTable.tsx     # New: spreadsheet table with keyboard nav
      useMeasurementKeyboard.ts # New: keyboard hook
    boq/
      BoqTable.tsx             # New: editable BOQ table
      BoqSectionTree.tsx       # New: left section tree
      BoqPropertiesPanel.tsx   # New: right properties
    command-palette/
      useCommandPalette.ts     # New: hook for palette state
  hooks/
    useKeyboardShortcuts.ts    # New: global shortcut handler
    useUndoRedo.ts             # New: generic undo/redo hook
    useAutoSave.ts             # New: debounced save hook
    useDarkMode.ts             # New: dark mode hook
  pages/
    Dashboard.tsx              # Refactor: real data, charts, density
    ProjectWorkspace.tsx       # New: replaces linear flow
    Projects.tsx               # Refactor: denser list, quick actions
    CreateProject.tsx          # Refactor: actual API call, validation
    Measurement.tsx            # Refactor: new DataTable, keyboard nav
    BOQ.tsx                    # Refactor: 3-pane layout
    RateAnalysis.tsx           # Refactor: material picker, comparison
    Materials.tsx              # Refactor: CRUD table, rate history
    Labour.tsx                 # Refactor: CRUD table, attendance
    Reports.tsx                # Refactor: report builder, previews
    Assistant.tsx              # Refactor: floating, not page
    Settings.tsx               # Refactor: working dark mode, more options
```

### 6.2 Backend API Additions

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/dashboard` | GET | Aggregated metrics for dashboard |
| `/api/projects/:id/overview` | GET | Project summary, progress, budget vs actual |
| `/api/projects/:id/boq/sections` | GET/POST | BOQ section hierarchy |
| `/api/projects/:id/boq/lines` | PUT | Bulk update BOQ lines (inline edit) |
| `/api/projects/:id/reports/pdf` | POST | Generate real PDF |
| `/api/projects/:id/reports/xlsx` | POST | Generate Excel |
| `/api/materials` | CRUD | Material master |
| `/api/labour` | CRUD | Labour categories |
| `/api/rate-books/:id/import` | POST | Import DSR/CSV |
| `/api/dsr/search` | GET | Search CPWD/State PWD items |
| `/api/tenders` | CRUD | Tender management |

### 6.3 Database Migrations Needed

```prisma
// Add to schema
enum ProjectStatus { ACTIVE ON_HOLD COMPLETED ARCHIVED }
enum ProjectType { RESIDENTIAL COMMERCIAL INDUSTRIAL ROAD BRIDGE IRRIGATION GOVERNMENT INFRASTRUCTURE }

model Project {
  status      ProjectStatus @default(ACTIVE)
  type        ProjectType?
  startDate   DateTime?
  endDate     DateTime?
  // ... existing fields
}

model BoqSection {
  id        String @id @default(uuid())
  projectId String
  name      String
  sortOrder Int    @default(0)
  subSections BoqSubSection[]
  lines       BoqLine[]
}

model BoqSubSection {
  id        String @id @default(uuid())
  sectionId String
  name      String
  sortOrder Int    @default(0)
  lines     BoqLine[]
}

model BoqLine {
  // Add:
  sectionId    String?
  subSectionId String?
  category     String? // Earthwork, Concrete, etc.
  isGenerated  Boolean @default(false)
}

model MaterialMaster {
  id       String @id @default(uuid())
  orgId    String
  name     String
  category String
  unit     String
  spec     String?
  rates    MaterialRate[]
}

model MaterialRate {
  id         String   @id @default(uuid())
  materialId String
  supplierId String?
  rate       Decimal  @db.Decimal(18,4)
  effectiveFrom DateTime @default(now())
}

model LabourCategory {
  id       String @id @default(uuid())
  orgId    String
  name     String
  dailyRate Decimal @db.Decimal(18,2)
  unit     String // day, hour, job
  skillLevel String // skilled, unskilled, semi-skilled
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Implement dark theme CSS + toggle
- [ ] Refactor `Layout.tsx` → collapsible sidebar + project context
- [ ] Add `CommandPalette.tsx` + `useKeyboardShortcuts.ts`
- [ ] Add `ToastProvider`
- [ ] Add `DataTable` reusable component
- [ ] Fix `CreateProject.tsx` to call API
- [ ] Fix `Dashboard.tsx` to call real API (or mock from db)

### Phase 2: Core Workflows (Week 2)
- [ ] Refactor `Measurement.tsx` with new DataTable + keyboard nav + undo/redo
- [ ] Refactor `BOQ.tsx` with 3-pane layout + inline editing + auto-calculate
- [ ] Add `ProjectWorkspace.tsx` tab wrapper
- [ ] Add floating `Assistant.tsx` widget
- [ ] Refactor `RateAnalysis.tsx` with material picker

### Phase 3: Data & Libraries (Week 3)
- [ ] Add `MaterialMaster` CRUD UI + backend
- [ ] Add `LabourCategory` CRUD UI + backend
- [ ] Add DSR import stub (UI + backend route)
- [ ] Add real PDF generation (Playwright on server)
- [ ] Add Excel export (via `xlsx` library)

### Phase 4: Advanced (Week 4)
- [ ] Tender module UI + backend
- [ ] Billing module (RA Bills)
- [ ] DPR generation from project data
- [ ] Drawing upload + AI quantity extraction stub
- [ ] Measurement Book (government style) UI
- [ ] Mobile responsiveness polish
- [ ] Accessibility audit + fixes

---

## 8. Risk Assessment

| Risk | Mitigation |
|---|---|
| Large refactor breaks existing features | Keep old pages as `*Old.tsx` until new ones are e2e tested |
| Dark theme has contrast issues | Test all color combinations with WCAG AA tool |
| Keyboard navigation conflicts with browser shortcuts | Use `Alt` or `Ctrl+Shift` prefixes where needed |
| Performance with large BOQ (1000+ lines) | Virtualize table rows, use `react-window` or `tanstack-virtual` |
| Database migrations on production data | Write reversible migrations, test on copy |

---

## 9. Benchmarking Against Competitors

| Feature | CostX | PlanSwift | Buildxact | Current App | Target |
|---|---|---|---|---|---|
| Spreadsheet-like BOQ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Drawing takeoff | ✅ | ✅ | ❌ | ❌ | ✅ |
| 3D model integration | ✅ | ❌ | ❌ | ❌ | Future |
| DSR/Rate library | ✅ | ❌ | ❌ | Partial | ✅ |
| Mobile app | ❌ | ❌ | ✅ | Partial | ✅ |
| Cloud sync | ✅ | ❌ | ✅ | ✅ | ✅ |
| Keyboard shortcuts | ✅ | ✅ | ✅ | ❌ | ✅ |
| Excel import/export | ✅ | ✅ | ✅ | Partial | ✅ |
| Tender comparison | ✅ | ❌ | ❌ | ❌ | ✅ |
| AI suggestions | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 10. Conclusion

The application has **strong bones** but needs a **complete UI/UX overhaul** to become a production-grade tool. The most critical improvements are:

1. **Dark theme implementation** (currently dead control)
2. **Project Workspace pattern** (tabs instead of linear navigation)
3. **Spreadsheet-like Measurement & BOQ** (keyboard nav, inline edit, bulk paste)
4. **Real data everywhere** (dashboard, BOQ, materials, labour)
5. **Command palette + keyboard shortcuts** (productivity for power users)
6. **Missing core modules** (Tendering, Billing, DPR, MB, DSR)

With the design system and roadmap provided in this document, the team can execute a phased refactor that transforms this from a demo/MVP into a competitive Civil Engineering Estimation Platform.
