import type { MetadataRoute } from 'next'

/**
 * PWA manifest — Mẹ & Bé.
 * Theme màu rose #af614e khớp `packages/ui/src/tokens.css` (--mv-primary, WCAG AA).
 * Icon dùng `app/icon.svg` (Next tự serve tại `/icon.svg`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mẹ & Bé',
    short_name: 'Mẹ & Bé',
    description: 'Đồng hành thai kỳ, dinh dưỡng và chăm sóc bé cho gia đình Việt',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf7f4',
    theme_color: '#af614e',
    lang: 'vi',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
