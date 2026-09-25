export type Role = 'USER' | 'ADMIN'

export type BookingStatus = 'CONFIRMED' | 'CANCELLED'

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  name: string
  email: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  id: number
  name: string
  email: string
  role: Role
  token: string
}

export interface Room {
  id: number
  roomNumber: string
  roomType: string
  description: string
  pricePerNight: number
  capacity: number
  available: boolean
}

export interface BookingRequest {
  roomId: number
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
}

export interface BookingResponse {
  id: number
  userName: string
  roomId: number
  roomNumber: string
  roomType: string
  pricePerNight: number
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalPrice: number
  status: BookingStatus
}

export interface ReviewRequest {
  roomId: number
  rating: number
  comment: string
}

export interface ReviewResponse {
  id: number
  roomId: number
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface ApiErrorShape {
  status: number
  message: string
  fieldErrors?: Record<string, string>
}
