# Project Decisions

## Auth Interceptor Fix (Rusty — 2026-04-19)

Fixed silent-failure 401 bug in auth interceptor. When authenticated but token unavailable (InteractionRequiredAuthError / MSAL redirect in flight), return EMPTY instead of forwarding the request unauthenticated. Unauthenticated requests (landing page) still pass through. Pattern: check isAuthenticated() first, then getToken(), then suppress with EMPTY if token is null.

## Recipe New — Dual Save Buttons & UX Feedback (Rusty — 2026-04-22)

At `/recipes/new`, implement dual save buttons with snackbar feedback:
- **Save** button navigates to `/recipes` list (not detail page) after successful create
- **Save & Add Another** button saves, resets form, and stays on `/recipes/new`
- snackbar feedback: "Recipe created" (success new), "Recipe updated" (success edit), "Failed to save recipe. Please try again." (error)
- Button styling: `mat-raised-button` for primary action, `mat-stroked-button` for secondary
- `saveRecipe(continueAdding: boolean = false)` parameter for implementation
- Only applies to new recipe flow; edit flow keeps single "Save Recipe" button

## Database Migration Fix (Linus)

_From previous inbox consolidation._
