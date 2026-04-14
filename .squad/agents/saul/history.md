# Project Context

- **Owner:** Alec Harrison
- **Project:** EzStem — Azure-hosted Angular + .NET florist application
- **Stack:** Angular (frontend), .NET (backend APIs), Azure (cloud hosting, services)
- **Created:** 2026-04-14

## Learnings

### Domain Constraints & Critical Success Factors (2026-04-14)

**Key Domain Insights:**
1. **Bundle rounding is the hidden complexity** — Florists can't order 47 stems; roses come in 25-stem bunches. Multi-flower rounding (roses + hydrangea + greenery) is complex math that florists get wrong on spreadsheets. If EzStem solves this correctly, it's immediately valuable.

2. **Margin invisibility is the industry-wide problem** — Florists quote from gut feel, rarely calculate actual margin %. A tool showing "You're making $5/arrangement" (not $20) when margin is compressed builds trust. Margin % + dollar visualization is the core insight.

3. **Seasonal volume spikes (10x normal in Feb/May) are non-negotiable stress tests** — Valentine's Day and Mother's Day create ordering chaos. System must not slow down or florists abandon it. UI responsiveness is a feature. Real testing must happen in Feb or May, not summer.

4. **Perishability = fast decision speed required** — Florists operate on 2-3 day timelines. A tool that's 30 seconds slower to calculate = abandoned for spreadsheet. Reaction time matters.

5. **Multi-vendor complexity is real and underestimated** — Florists use 3-5 vendors (primary wholesaler, backup, local farm, online, specialty shipper) with different pricing, lead times, and minimums. Vendor-specific order splitting is mandatory, not optional.

6. **Waste factors and spoilage risk are constant** — 5-10% normal waste + risk of damaged flower returns means system can't assume 100% stem conversion. Florist needs to see "waste impact on margin" and understand it's built into pricing.

7. **Recipe variability, not standardization** — Each client's wedding is 95% unique. System must make recipe copying/variation effortless, not create 300 nearly-identical recipes. Naming/tagging critical.

8. **Seasonality affects availability, not just pricing** — Certain flowers unavailable in winter. If tool suggests peony in February, florist won't trust recommendations. Seasonal availability must be trackable per item.

**Risks for Tess (Product Lead):**
- System adoption fails if margin visibility exposes uncomfortable truths about underpricing (requires florist education + trust-building)
- Flex mode (bulk ordering without recipe) is essential safety valve for florists who don't want rigid structure
- Lead time warnings must be accurate or system gives bad advice (florist orders too late, flowers don't arrive in time)
- Export must be vendor-ready on first try or tool is friction instead of time-saver

**What to Validate with Real Florists:**
1. Is "bundle rounding" visualization clear? ("You need 47 roses; ordering 2 bunches × 25 = 50; waste 3 stems = $1.35")
2. Does margin dashboard build trust or create resistance? (Some florists may not want visibility)
3. Is export format actually used by florist's wholesalers? (CSV format matters)
4. Flex mode adoption: do florists use it or stick to recipes?
5. Seasonal surge: test system with 50 events in Feb to ensure UI doesn't break
