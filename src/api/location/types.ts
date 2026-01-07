export interface LocationItem {
  id: number
  name: string
  english_name: string
  city_id: number
  visit_date: string
  visit_city_record_id: number | null
  lat: number
  lng: number
  desc: string
  create_time: string
  update_time: string
  city: {
    id: number
    name: string
    english_name: string
    first_visit_date: string
    desc: string
    bounds: string
    create_time: string
    update_time: string
  }
  visit_city_record: any | null
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
  english_name: string
  city_id: number
  visit_date: string
  lat: number
  lng: number
  desc: string
  images?: string[]
}
