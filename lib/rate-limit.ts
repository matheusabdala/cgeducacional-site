type Bucket = { count: number; resetAt: number };

// Best-effort, em memória e por container. Para deploy single-instance (Coolify)
// é suficiente para conter abuso; multi-instância pediria Redis/Upstash.
const store = new Map<string, Bucket>();

/**
 * Rate limit por janela fixa. Retorna `ok:false` quando o limite da janela
 * estourou, com `retryAfterSec` para o header `Retry-After`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();

  // Limpeza oportunista para o Map não crescer sem limite.
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
  }

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}
