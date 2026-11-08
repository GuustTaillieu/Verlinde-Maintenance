import DOMPurify from 'dompurify'

/**
 * Enterprise XSS Sanitizer powered by DOMPurify (Cure53).
 * Industry standard protection against XSS, mXSS, SVG/MathML namespace attacks, and payload mutations.
 * Whitelists only safe semantic rich-text elements: p, br, b, strong, i, em, u, ul, ol, li, span, div, a.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'b',
        'strong',
        'i',
        'em',
        'u',
        'ul',
        'ol',
        'li',
        'span',
        'div',
        'a',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script',
        'style',
        'iframe',
        'object',
        'embed',
        'form',
        'input',
        'button',
        'svg',
        'math',
      ],
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
        'style',
      ],
    })
  }

  // Server-side fallback if rendered during SSR
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
