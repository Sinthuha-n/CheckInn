import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/auth.css'
import './styles/landing.css'
import './styles/booking.css'
import './styles/admin.css'
import { AppProviders } from './app/AppProviders'
import { router } from './app/router'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Unable to find the application root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
