import request from '@/axios'
import type { LocationListParams, LocationFormData } from './types'

export const getLocationListApi = (params: LocationListParams) => {
  return request.get({
    url: '/mock/fog/location/list',
    params
  })
}

export const deleteLocationApi = (id: number) => {
  return request.post({
    url: '/mock/fog/location/del',
    data: { id }
  })
}

export const saveLocationApi = (data: LocationFormData) => {
  return request.post({
    url: '/mock/fog/location/add',
    data
  })
}

export const updateLocationApi = (data: LocationFormData) => {
  return request.post({
    url: '/mock/fog/location/update',
    data
  })
}

export const getCityListApi = () => {
  return request.get({
    url: '/mock/fog/city/simple_list'
  })
}
