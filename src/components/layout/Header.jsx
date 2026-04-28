import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-logo">삼터</Link>
    </header>
  )
}

export default Header
