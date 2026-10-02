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

    const isAboutSection =
        location.pathname === '/about' ||
        location.pathname === '/directors' ||
        location.pathname === '/governance'

    return (
        <header className="header">
            <div className="header-inner">
                <NavLink
                    to="/"
                    className="brand"
                    aria-label="Raaga Sudha home"
                >
                    <img
                        src={`${import.meta.env.BASE_URL}raagasudha-logo.png`}
                        alt="Raaga Sudha Music Academy"
                    />
                    <span className="brand-tagline">Explore · Experience · Enjoy</span>
                    <span className="brand-caption">Carnatic Music Academy</span>
                </NavLink>

                <nav className="nav" aria-label="Main navigation">
                    {links.map(([path, label]) => (
                        <NavLink
                            key={path}
                            to={path}
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