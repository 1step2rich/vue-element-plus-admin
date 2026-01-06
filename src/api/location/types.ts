export interface LocationItem {
  id: number
  name: string
  city_id: number
  city_name: string
  latitude: number
  longitude: number
  description: string
  feeling: string
  images: string[]
  create_time: string
  update_time: string
}

export interface LocationListParams {
  page: number
  page_size: number
  keyword?: string
  city_id?: number
}

export interface LocationFormData {
  id: number
  name: string
  city_id: number
  latitude: number
  longitude: number
  description: string
  feeling: string
  images: string[]
}
