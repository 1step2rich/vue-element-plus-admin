import request from '@/axios'
import type { FlightListParams, AirportItem } from './types.ts'

export const getFlightListApi = (params: FlightListParams) => {
  return request.get({
    url: '/fog/flight/list',
    params
  })
}

export const deleteFlightApi = (id: number) => {
  return request.post({
    url: '/fog/flight/del',
    data: { id }
  })
}

export const saveFlightApi = (data: any) => {
  return request.post({
    url: '/fog/flight/add',
    data
  })
}
export const updateFlightApi = (data: any) => {
  return request.post({
    url: '/fog/flight/update',
    data
  })
}

export const getAirportListApi = () => {
  return request.get<{ list: AirportItem[] }>({
    url: '/fog/airport/list'
  })
}

// 更新航班额外信息
export const updateFlightExtraApi = (data: {
  flight_id: number
  field_name: string
  file: string
}) => {
  return request.post({
    url: '/fog/flight/update_extra',
    data
  })
}
