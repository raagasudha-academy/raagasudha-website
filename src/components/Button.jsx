import { Link } from 'react-router-dom'

function Button({ to, children, variant = 'primary' }) {
    return (
        <Link className={`button button-${variant}`} to={to}>
            {children}
        </Link>
    )
}

export default Button