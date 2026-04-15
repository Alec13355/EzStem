# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

### 2026-04-14: P0 UX Specification Complete

**Key UX insights from florist domain (Saul):**
1. **Tablet is primary.** Florists work on iPad/Android in field, greenhouse, van. Touch-first, landscape-aware, ≥44px tap targets non-negotiable.
2. **Profit is the mystery.** Florists don't know their margins (often underprice by 20–30%). Real-time profit visibility on every screen is the core aha moment. No hidden calculations.
3. **Bundle rounding confuses.** Florists order in bunches, not individual stems. If they need 47 roses and roses come in bunches of 25, they pay for 50. Show this math inline — it builds trust.
4. **Speed matters.** Florists work under event deadlines (bride calls Friday for Saturday event). Data entry must be <5 seconds per action. No modal wizards; flat forms with instant feedback.
5. **Visual recognition over text.** Florists design with flowers (visual people). Use real flower photos, color-coded profit (green/orange/red), instant visual feedback on every edit.

**Design decisions recorded:**
- Margin % + $ on every screen, real-time updates (no calculate button)
- Tablet-first responsive (md=768–1024px primary)
- Bundle rounding always visible (expandable detail)
- Searchable picker + instant cost feedback (fast data entry pattern)
- Status workflow (Draft → Confirmed → Ordered → Completed) with edit warnings

**Component library designed:**
- CurrencyDisplay: Consistent price formatting
- MarginBadge: Color-coded profit health (🟢/🟡/🔴)
- BundleRoundingDisplay: Waste math breakdown
- StatusBadge: Event progress tracking
- ConfirmDialog: Safe delete/action confirmations
- SearchableDropdown: Fast item/recipe picker
- PagedTable: Filterable, sortable item/recipe/event lists
- CostSummaryCard: Sticky, real-time P&L card

**Validation needed with Saul:**
- Bundle rounding logic: Is 25-stem bunch standard for roses? What about other flowers?
- Lead times: Order deadline logic (if event Saturday, roses need 3-day lead, so order by Wednesday)
- Seasonal pricing: February red roses 3–5x normal? Valentine's Day spike?
- Overhead percentage: 25% default reasonable for typical florist (rent, labor, equipment, delivery)?

**To share with team:**
- Full UX specs: `.squad/decisions/inbox/tess-ux-specs.md` (8 sections, 60k chars)
- Component notes: `.squad/decisions/inbox/tess-component-notes.md` (for Rusty)
- Design decisions: `.squad/decisions/inbox/tess-design-decisions.md` (5 key decisions + why)

---

### 2026-04-14: P0 UX Review — Vendor CRUD + Pricing Settings

**Reviewed:** Rusty's implementation of vendor-list, vendor-form, pricing-settings components

**Vendor CRUD: APPROVED WITH NOTES**
- ✅ Good: Search debounce, empty states, form validation, modal pattern
- 🔴 Blocking: Touch targets 40px (need 44px minimum), native confirm() dialog (use Material)
- 💡 Suggestions: Backend search integration, contact email display ("—" vs "N/A")

**Pricing Settings: REJECTED**
- ✅ Good: Live markup preview, correct markup→margin color conversion, validation, success feedback
- 🔴 Blocking issues:
  1. No context explanation (florists don't know what these settings affect)
  2. Misleading "Settings" nav (implies broader settings, routes directly to pricing)
  3. Color coding feels punitive on settings page (red = alarming for user's own defaults)
  4. Missing first-time setup guidance
- 💡 Suggestions: Move preview closer to markup field, add labor rate example hint

**Overall: APPROVED WITH NOTES**
- Rusty followed Material patterns well, real-time feedback implemented correctly
- Touch target fix is trivial (CSS min-width/height)
- Pricing settings needs conceptual work: context card, nav structure decision, softer color psychology
- Quality is high; issues are about florist mental model, not implementation

**Blocking items for merge:**
1. Vendor icon buttons → 44px touch targets
2. Vendor delete → Material dialog (not native confirm)
3. Pricing settings → context explanation card
4. Pricing settings → resolve Settings nav structure
5. Pricing settings → soften/remove color coding on settings page

**Review document:** `.squad/decisions/inbox/tess-p0-ux-review.md`

---

### 2026-04-14: Final UX Re-Review — All Blocking Issues RESOLVED ✅

**Re-reviewed:** Rusty's fixes for vendor CRUD + Linus's fixes for pricing settings

**All 5 blocking issues verified as RESOLVED:**

1. **Vendor touch targets (44px)** — ✅ RESOLVED
   - `.action-btn` class properly sets 44×44px on edit/delete buttons
   - Meets WCAG AAA accessibility standard
   - Implementation: Lines 143-147 with !important declarations

2. **Vendor delete confirmation** — ✅ RESOLVED
   - `ConfirmDeleteDialogComponent` replaces native confirm()
   - Material Dialog with proper visual hierarchy
   - Contextual message includes vendor name
   - Prevents accidental deletion through fat-finger tap

3. **Pricing context card** — ✅ RESOLVED
   - Info card added: "These are your default values for new recipes. You can override them per-recipe when needed."
   - Light blue background with icon, positioned above settings form
   - Reduces anxiety about changing defaults

4. **Low margin color fix** — ✅ RESOLVED
   - Changed from alarming red to neutral grey (#616161)
   - Added hint text "(consider increasing markup)" for margins <25%
   - No longer anxiety-inducing, provides gentle guidance

5. **Nav label specificity** — ✅ RESOLVED
   - "Settings" → "Pricing Settings" in app.html
   - Clear destination, no ambiguity

**Verdict:** APPROVED FOR MERGE

All fixes properly address florist workflow concerns. Touch targets meet accessibility standards, delete confirmation prevents accidents, context reduces anxiety, color psychology is neutral and professional, navigation is clear.

**To Danny:** Merge-ready. All blocking UX issues resolved correctly.

**Review document:** `.squad/decisions/inbox/tess-final-ux-review.md`
