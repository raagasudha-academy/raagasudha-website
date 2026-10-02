import { Link } from 'react-router-dom'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">

                <div className="footer-brand">
                    <Link to="/">
                        <img
                            src={`${import.meta.env.BASE_URL}raagasudha-footer-logo.png`}
                            alt="Raaga Sudha Music Academy"
                        />
                    </Link>

                    <p>
                        Music rooted in tradition.
                        Inspired by creativity.
                    </p>
                </div>

                <div className="footer-links">
                    <div>
                        <h3>Explore</h3>

                        <Link to="/about">About</Link>
                        <Link to="/classes">Classes</Link>
                        <Link to="/events">Events</Link>
                        <Link to="/community">Community</Link>
                        <Link to="/gallery">Gallery</Link>
                    </div>

                    <div>
                        <h3>Organisation</h3>

                        <Link to="/directors">Directors</Link>
                        <Link to="/governance">Governance</Link>
                        <Link to="/contact">Contact</Link>
                    </div>

                    <div>
                        <h3>Contact</h3>

                        <p>Mrs. Praveena</p>

                        <a href="tel:+447702785815">
                            +44 7702 785815
                        </a>

                        <p className="footer-contact-note">
                            Contact Praveena for class enquiries,
                            registration, timings and availability.
                        </p>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>
                    © 2024 by Raaga Sudha Music Academy.
                </p>

                <div className="footer-socials">
                    <a
                        href="https://www.instagram.com/raagasudhamusicacademy/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="5"
                            />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.5" cy="6.5" r="1" />
                        </svg>
                    </a>

                    <a
                        href="https://www.youtube.com/@raagasudhamusicacademy4272"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="YouTube"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M21 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C17.3 5 12 5 12 5s-5.3 0-6.8.5a2.5 2.5 0 0 0-1.8 1.8C3 8.8 3 12 3 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C6.7 19 12 19 12 19s5.3 0 6.8-.5a2.5 2.5 0 0 0 1.8-1.8C21 15.2 21 12 21 12Z" />
                            <path d="m10 9 5 3-5 3V9Z" />
                        </svg>
                    </a>

                    <a
                        href="https://www.linkedin.com/company/raagasudhamusicacademy/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <path d="M8 10v6" />
                            <circle cx="8" cy="7.5" r=".8" />
                            <path d="M12 16v-3.2a2.8 2.8 0 0 1 5.6 0V16" />
                            <path d="M12 10v6" />
                        </svg>
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default Footer