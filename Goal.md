🧠 1. What EveryStem actually is (core insight)

EveryStem is NOT a full florist CRM. It’s a focused “profit engine” tool for:

Pricing floral designs
Calculating exact stem quantities
Generating wholesale orders
Preventing over/under buying

It’s intentionally narrow + composable (designed to pair with tools like HoneyBook)

👉 This is the key product strategy:

“Do one thing extremely well: profitability + ordering”

🧩 2. Core Feature Breakdown (reverse engineered)
A. Recipe & Design Engine (THE CORE)
Create “recipes” for floral arrangements
Define:
Stem types
Quantities
Cost per stem
Labor cost
Real-time pricing calculation
Key behaviors:
Save & reuse recipes across events
Swap flowers without recalculating everything
Scale recipes (e.g., 1 → 10 centerpieces)

👉 This is essentially:
“Composable bill-of-materials (BOM) for florists”

B. Profit & Pricing Engine
Automatic markup + margin calculation
Tracks:
Cost of goods (flowers)
Labor
Retail price
Shows profitability in real-time

👉 This is the “secret sauce”

Eliminates spreadsheet math errors
Prevents underpricing (huge industry problem)
C. Order Aggregation Engine
Automatically totals all stems across recipes
Rounds to supplier bundle sizes
Splits orders by vendor
Output:
Exportable order sheets
Vendor-specific purchase lists
Leftover/waste tracking

👉 This is basically:
“ERP-lite for floral procurement”

D. Inventory / Item Library
Custom database of:
Flowers
Greenery
Supplies
Stores:
Cost
Notes
Images (recent feature)

👉 Acts as:
“domain-specific product catalog”

E. Event-Level Planning
Create an “event”
Attach:
Multiple recipes
Quantities per recipe
Generate:
Full event order in one shot
F. Workflow / Team Output
Export:
Recipe sheets
Production summaries
Used for:
Setup checklists
Delivery prep
G. Flex Mode (Important Differentiator)
Can operate WITHOUT strict recipes
Allows bulk ordering instead

👉 This is key UX insight:

Not all users want rigid structure

H. Advanced / Hidden Features
Multi-currency support
Unlimited events/usage
Vendor separation
Waste visibility (leftover stems)
Swap feature (dynamic substitution)
🧱 3. Product Architecture (what you’d build)
Core domain objects:
User
Event
Recipe
RecipeItem (stem, qty, cost)
ItemLibrary (flower catalog)
Vendor
Order
OrderLineItem
Key relationships:
Event → many Recipes
Recipe → many RecipeItems
Order = aggregation of RecipeItems across Event
⚙️ 4. PM Prompt (Use This to Kick Off Product Development)

Copy/paste this into your planning doc or AI tool 👇

🧾 PRODUCT REQUIREMENTS PROMPT

Design and prioritize a SaaS application for event-based businesses (starting with florists) that enables profit-aware design planning and automated procurement.

🎯 Core Goal

Help users:

Price accurately
Order efficiently
Eliminate waste
Maximize profit per event
🧩 Core Feature Areas
1. Recipe Builder (P0)
Create reusable “recipes” (bill of materials)
Inputs:
Item (flower/material)
Quantity per unit
Cost per unit
Labor cost
Features:
Scale recipes dynamically
Swap items without breaking calculations
Save and reuse recipes
2. Pricing Engine (P0)
Real-time calculation:
Total cost
Markup
Profit margin
Configurable markup rules
Visual profit indicators
3. Event Planner (P0)
Create event
Add recipes + quantities
View full cost + revenue
4. Order Generator (P0)
Aggregate all materials across event
Group by vendor
Round to supplier packaging constraints
Export:
CSV / PDF
Vendor-specific lists
5. Item Library (P0)
CRUD system for:
Flowers/materials
Fields:
Cost
Vendor
Notes
Image
6. Waste & Optimization Engine (P1)
Show leftover quantities
Suggest optimizations:
Reduce waste
Adjust quantities
7. Flex Mode (P1)
Allow:
Bulk ordering without recipes
Hybrid workflows
8. Collaboration / Output (P1)
Export:
Production sheets
Setup checklists
Share with team
9. Vendor Management (P2)
Multiple vendors
Split orders automatically
10. Insights / Analytics (P2+)
Profit per event
Cost trends
Most-used items
🧠 UX Principles
Spreadsheet replacement (but safer)
Extremely fast data entry
Minimal clicks
No unnecessary CRM features
🚫 Explicit Non-Goals (important)
No client communication
No proposal builder
No invoicing

👉 (This constraint is WHY the product works)

🚀 5. Strategic Opportunities (Where You Can Beat Them)

If you’re rebuilding this, here’s where you win:

1. AI Layer (obvious for you)
Auto-generate recipes from:
Pinterest board
Image upload
Suggest substitutions based on:
seasonality
cost optimization
2. Supplier Integrations
Live pricing from wholesalers
Auto-order via API
3. Mobile-first UX
Florists work on-site → huge gap
4. Vertical expansion

Same engine applies to:

Catering (ingredients)
Events (rentals)
Construction (materials)
🧨 Final Take (important)

EveryStem is deceptively simple.

It’s basically:

“Notion + Excel + BOM + Profit calculator… for florists”

But the real moat is:
👉 domain-specific UX + opinionated constraints