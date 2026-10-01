import { ShieldPlus } from 'lucide-react'

export default function AppHeader() {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="DepHealth home">
        <span className="brand-mark"><ShieldPlus size={19} strokeWidth={2.3} /></span>
        <span>dephealth<span className="brand-period">.</span></span>
      </a>
      <nav className="top-nav" aria-label="Main navigation">
        <a className="nav-link active" href="#scanner">Scanner</a>
        <a className="nav-link" href="#method">How scoring works</a>
      </nav>
      <div className="topbar-meta"><span className="live-dot" />
       Public package data</div>
    </header>
  )
}
