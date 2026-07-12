import armoiries from '../assets/armoiries.png'

/** Armoiries officielles de la République Islamique de Mauritanie. */
export default function Emblem({ className = 'rk-emblem' }) {
  return (
    <img
      src={armoiries}
      className={className}
      alt="République Islamique de Mauritanie"
      loading="eager"
    />
  )
}
