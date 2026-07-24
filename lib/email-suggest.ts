// Sugerencia de corrección para dominios de correo mal escritos.
// No bloquea el envío — solo propone "¿Quisiste decir…?" para typos comunes.

const COMMON_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'hotmail.es',
  'hotmail.com.mx',
  'outlook.com',
  'outlook.es',
  'yahoo.com',
  'yahoo.com.mx',
  'icloud.com',
  'live.com',
  'live.com.mx',
  'prodigy.net.mx',
];

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * Devuelve un correo corregido si el dominio parece un typo de uno común,
 * o null si ya es válido / no hay sugerencia clara.
 */
export function suggestEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf('@');
  if (at < 1 || at === trimmed.length - 1) return null;

  const local = email.trim().slice(0, at); // conserva mayúsculas del usuario
  const domain = trimmed.slice(at + 1);
  if (!domain || /\s/.test(domain)) return null;
  if (COMMON_DOMAINS.includes(domain)) return null; // ya correcto

  let best: string | null = null;
  let bestDist = 99;
  for (const d of COMMON_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }

  // Solo sugerir si está muy cerca (1–2 ediciones) para no molestar con dominios reales.
  if (best && bestDist > 0 && bestDist <= 2) return `${local}@${best}`;
  return null;
}
