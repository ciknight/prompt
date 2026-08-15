// src/lib/base-url.ts
// Returns the configured base URL (from astro.config.mjs `base`) with a
// guaranteed trailing slash, so string concatenation like `${base}foo/bar`
// always produces a valid path regardless of whether the user wrote `base:
// '/prompt'` or `base: '/prompt/'` in astro.config.mjs.
//
// Usage in any .astro file:
//   import { baseUrl } from '../lib/base-url';
//   <a href={`${baseUrl()}category/foo/`}>...</a>

export function baseUrl(): string {
  const raw = import.meta.env.BASE_URL || '/';
  return raw.endsWith('/') ? raw : raw + '/';
}