# Project Decisions

## Auth Interceptor Fix (Rusty — 2026-04-19)

Fixed silent-failure 401 bug in auth interceptor. When authenticated but token unavailable (InteractionRequiredAuthError / MSAL redirect in flight), return EMPTY instead of forwarding the request unauthenticated. Unauthenticated requests (landing page) still pass through. Pattern: check isAuthenticated() first, then getToken(), then suppress with EMPTY if token is null.

## Database Migration Fix (Linus)

_From previous inbox consolidation._
