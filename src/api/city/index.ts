import request from '@/axios'
import type { CityListParams } from './types'

export const getCitiesApi = (params: CityListParams) => {
  return request.get({
    url: '/fog/cities',
    params
  })
}

export const deleteCityApi = (id: number) => {
  return request.delete({
    url: `/fog/cities/${id}`
  })
}

export const saveCityApi = (data: any) => {
  return request.post({
    url: '/fog/cities',
    data
  })
}

export const updateCityApi = (id: number, data: any) => {
  return request.put({
    url: `/fog/cities/${id}`,
    data
  })
}
