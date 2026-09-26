import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import {
  GuestOnlyRoute,
  ProtectedRoute,
  RoleRoute,
} from '../features/auth/routeGuards'
import { AdminRoomsPage } from '../pages/AdminRoomsPage'
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage'
import { BookingPage } from '../pages/BookingPage'
import { FindYourStayPage } from '../pages/FindYourStayPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { MyBookingsPage } from '../pages/MyBookingsPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RegisterPage } from '../pages/RegisterPage'
import { RoomDetailsPage } from '../pages/RoomDetailsPage'
import { RoomsPage } from '../pages/RoomsPage'

export const appRoutes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
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
            path: 'find-your-stay',
            element: <FindYourStayPage />,
          },
          {
            path: 'rooms',
            element: <RoomsPage />,
          },
          {
            path: 'rooms/:roomId',
            element: <RoomDetailsPage />,
          },
          {
            path: 'rooms/:roomId/book',
            element: <BookingPage />,
          },
          {
            path: 'bookings/:bookingId/confirmation',
            element: <BookingConfirmationPage />,
          },
          {
            path: 'my-bookings',
            element: <MyBookingsPage />,
          },
          {
            element: <RoleRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                path: 'admin',
                element: <AdminRoomsPage />,
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
