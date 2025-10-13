// 机场列表参数
export interface AirportListParams {
  page: number
  page_size: number
  start_time?: string
  end_time?: string
  airport_type?: 1 | 2 // 1是飞机场，2是火车站
}

// 机场项目接口
export interface AirportItem {
  id: number
  name: string
  city: string
  lat: number
  lon: number
  type: 1 | 2 // 1是飞机场，2是火车站
  extra: any
  create_time: string
  modify_time: string
}
