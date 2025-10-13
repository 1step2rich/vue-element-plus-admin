export interface FlightListParams {
  page: number
  page_size: number
  start_time?: string
  end_time?: string
  flight_type?: 1 | 2 // 1是飞机，2是火车
}

export interface AirportInfo {
  id: number
  name: string
  city: string
  lat: number
  lon: number
  extra: any
  create_time: string
  modify_time: string
}

export interface FlightListItem {
  id: number
  from_airport_id: number
  to_airport_id: number
  depart_time: string
  arrival_time: string
  type: 1 | 2
  number: string
  seat_type: string
  seat_number: string
  price: number
  extra: any
  create_time: string
  modify_time: string
  from_airport_info: AirportInfo
  to_airport_info: AirportInfo
}

export interface AirportItem {
  id: number
  name: string
  city: string
}
