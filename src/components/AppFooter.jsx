import { ArrowUpRight, ShieldPlus } from 'lucide-react'

export default function AppFooter() {
  return (
    <footer className="footer">
      <a className="footer-brand" href="#top"><ShieldPlus size={16} /> dephealth<span>.</span></a>
      <span>Built for the people who maintain the dependencies.</span>
      <a href="https://osv.dev" target="_blank" rel="noreferrer">Powered by public data <ArrowUpRight size={13} /></a>
    </footer>
  )
}
