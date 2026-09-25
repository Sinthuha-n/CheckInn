import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import {
  GuestOnlyRoute,
  ProtectedRoute,
  RoleRoute,
} from '../features/auth/routeGuards'
import { FeaturePreviewPage } from '../pages/FeaturePreviewPage'
import { FoundationPage } from '../pages/FoundationPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RegisterPage } from '../pages/RegisterPage'

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <FoundationPage /> },
      {
        element: <GuestOnlyRoute />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'rooms',
            element: <FeaturePreviewPage area="rooms" />,
          },
          {
            element: <RoleRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                path: 'admin',
                element: <FeaturePreviewPage area="admin" />,
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(appRoutes)
