import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/weather', label: 'Weather' },
  { to: '/oura', label: 'Oura' },
  { to: '/withings', label: 'Withings' },
  { to: '/habits', label: 'Habits' },
  { to: '/settings', label: 'Settings' },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => 'navbar__link' + (isActive ? ' navbar__link--active' : '')}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
