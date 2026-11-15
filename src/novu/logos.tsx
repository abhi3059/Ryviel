// Platform marks for the Streams and Socials sections (simplified for small sizes).

export function KickLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#53FC18" />
      {/* Kick's blocky K */}
      <path
        fill="#0b0b0b"
        d="M6 5h3.6v4.2h1.8V7.4h1.8V5.6h1.8V5H18v3.6h-1.8v1.8h-1.8v3.2h1.8v1.8H18V19h-3v-.6h-1.8v-1.8h-1.8v-1.8H9.6V19H6z"
      />
    </svg>
  )
}

export function YouTubeLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="0" y="4" width="24" height="16.8" rx="4.6" fill="#FF0000" />
      <path d="M9.6 8.4v8l6.9-4z" fill="#fff" />
    </svg>
  )
}

export function InstagramLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="0.3" cy="1.05" r="1.25">
          <stop offset="0" stopColor="#feda75" />
          <stop offset="0.25" stopColor="#fa7e1e" />
          <stop offset="0.5" stopColor="#d62976" />
          <stop offset="0.75" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6.5" fill="url(#ig-grad)" />
      <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.2" cy="7.8" r="1.05" fill="#fff" />
    </svg>
  )
}

export function ReelIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M3 8.5h18M8.5 3l2.8 5.5M14.2 3l2.8 5.5" />
      <path d="M10 12v5l4.2-2.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}
