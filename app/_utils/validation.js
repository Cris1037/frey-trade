// ── Rule functions ─────────────────────────────────────────────────────────

// Stock ticker: 1-10 alphanumeric, dots, hyphens (e.g. AAPL, BRK.B, BF-B)
export function isValidSymbol(symbol) {
  return typeof symbol === "string" && /^[A-Za-z0-9.\-]{1,10}$/.test(symbol.trim());
}

// Search query: non-empty, max 50 chars, no HTML tags
export function isValidSearchQuery(query) {
  if (typeof query !== "string") return false;
  const trimmed = query.trim();
  return trimmed.length > 0 && trimmed.length <= 50 && !/<[^>]*>/.test(trimmed);
}

// Password: min 8 chars, at least one letter and one digit
export function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

// Returns which password requirements are met (for UI feedback)
export function getPasswordStrength(password) {
  return {
    minLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

// Trim whitespace, return empty string for non-strings
export function sanitize(value) {
  return typeof value === "string" ? value.trim() : "";
}

// ── API route helpers ──────────────────────────────────────────────────────
// Each returns { value, error } — if error is set, return it immediately.

function badRequest(message) {
  return new Response(JSON.stringify({ error: message }), { status: 400 });
}

export function validateSymbolParam(request) {
  const raw = new URL(request.url).searchParams.get("symbol");
  if (!isValidSymbol(raw)) return { value: null, error: badRequest("Invalid symbol") };
  return { value: sanitize(raw).toUpperCase(), error: null };
}

export function validateQueryParam(request) {
  const raw = new URL(request.url).searchParams.get("query");
  if (!isValidSearchQuery(raw)) return { value: null, error: badRequest("Invalid query") };
  return { value: sanitize(raw), error: null };
}
