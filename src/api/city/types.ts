export interface CityItem {
  id: number
  name: string
  english_name: string
  first_visit_date: string | null
  desc: string
  bounds: string
  create_time: string
  update_time: string
}

export interface CityListParams {
  page: number
  page_size: number
  keyword?: string
  country?: string
}

export interface CityFormData {
  id: number
  name: string
  english_name: string
  first_visit_date: string | null
  desc: string
  bounds: string
}
