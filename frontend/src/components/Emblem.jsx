/** Emblème Rukhsati : croissant + étoile en or (identité mauritanienne). */
export default function Emblem({ className = 'rk-emblem' }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <mask id="rk-cres">
        <rect width="100" height="100" fill="#fff" />
        <circle cx="58" cy="50" r="30" fill="#000" />
      </mask>
      <circle cx="47" cy="50" r="34" fill="var(--gold-bright)" mask="url(#rk-cres)" />
      <path
        fill="var(--gold-bright)"
        d="M74 34l4.6 9.9 10.9 1.4-8 7.5 2 10.8L74 68.9 64.5 74.5l2-10.8-8-7.5 10.9-1.4z"
      />
    </svg>
  )
}
