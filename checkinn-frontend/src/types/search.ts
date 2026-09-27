export interface RoomSearchParams {
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
}

export type RoomSearchErrors = Partial<
  Record<keyof RoomSearchParams, string>
>
