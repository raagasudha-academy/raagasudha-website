import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const links = [
    ['/', 'Home'],
    ['/classes', 'Classes'],
    ['/events', 'Events'],
    ['/community', 'Community'],
    ['/gallery', 'Gallery'],
]

function Header() {
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    const isAboutSection =
        location.pathname === '/about' ||
        location.pathname === '/directors' ||
        location.pathname === '/governance'

    useEffect(() => {
        setMenuOpen(false)
    }, [location.pathname])

    return (
        <header className="header">
            <div className="header-inner">

                <div className="brand-lockup">
                    <NavLink
                        to="/"
                        className="brand"
                        aria-label="Raaga Sudha home"
                    >
                        <img
                            src="/raagasudha-logo.webp"
                            alt="Raaga Sudha Music Academy"
                        />
                    </NavLink>

                    <span className="brand-tagline">
            Explore · Experience · Enjoy
          </span>
                </div>

                <button
                    type="button"
                    className={`mobile-menu-toggle ${menuOpen ? 'is-open' : ''}`}
                    aria-label="Toggle navigation"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((current) => !current)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <nav
                    className={`nav ${menuOpen ? 'nav-open' : ''}`}
                    aria-label="Main navigation"
                >
                    {links.map(([path, label]) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            className={({ isActive }) =>
                                isActive ? 'active' : ''
                            }
                        >
                            {label}
                        </NavLink>
                    ))}

                    <div className="nav-dropdown">
                        <NavLink
                            to="/about"
                            className={isAboutSection ? 'active' : ''}
                        >
                            About
                        </NavLink>

                        <div className="nav-dropdown-menu">
                            <NavLink to="/about" end>
                                Our Story
                            </NavLink>

                            <NavLink to="/directors">
                                Directors
                            </NavLink>

                            <NavLink to="/governance">
                                Governance
                            </NavLink>
                        </div>
                    </div>

                    <NavLink
                        className="nav-contact"
                        to="/contact"
                    >
                        Contact
                    </NavLink>
                </nav>

            </div>
        </header>
    )
}

export default Header