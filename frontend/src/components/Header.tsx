import type { User } from '../types'

interface Props {
  user?: User
  onLogout?: () => void
}

export function Header({ user, onLogout }: Props) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-logo">A</div>
        <div>
          <div className="brand-name">ROI Extractor</div>
          <div className="brand-sub">Anglepoint · ROAR Document Analysis</div>
        </div>
      </div>
      <div className="header-right">
        {user ? (
          <>
            <span className="header-user-email">{user.email}</span>
            <button className="btn-logout" onClick={onLogout}>Sign Out</button>
          </>
        ) : (
          <span className="header-pill">Powered by Claude AI</span>
        )}
      </div>
    </header>
  )
}
