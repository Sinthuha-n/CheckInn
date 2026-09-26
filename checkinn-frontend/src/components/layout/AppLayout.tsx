import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { Footer } from './Footer'
import { Header } from './Header'

export function AppLayout() {
  const { pathname } = useLocation()
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  return (
    <div className={`app-shell${isAuthRoute ? ' app-shell--auth' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      {isAuthRoute ? null : <Footer />}
      <ScrollRestoration />
    </div>
  )
}
