import request from '@/axios'
import type { LocationListParams, LocationFormData } from './types'

export const getLocationListApi = (params: LocationListParams) => {
  return request.get({
    url: '/fog/positions',
    params
  })
}

export const deleteLocationApi = (id: number) => {
  return request.delete({
    url: `/fog/positions/delete/${id}`
  })
}

export const saveLocationApi = (data: LocationFormData) => {
  return request.post({
    url: '/fog/positions',
    data
  })
}

export const updateLocationApi = (data: LocationFormData) => {
  return request.put({
    url: `/fog/positions/${data.id}`,
    data
  })
}
