import type { AirportListParams } from './types'
import request from '@/axios/index'

// 获取机场列表
export const getAirportListApi = (params: AirportListParams) => {
  return request.get({
    url: '/fog/airport/list',
    params
  })
}

// 删除机场
export const deleteAirportApi = (id: number) => {
  return request.post({
    url: '/fog/airport/del',
    data: { id }
  })
}

// 添加机场
export const saveAirportApi = (data: any) => {
  return request.post({
    url: '/fog/airport/add',
    data
  })
}

// 更新机场
export const updateAirportApi = (data: any) => {
  return request.post({
    url: '/fog/airport/update',
    data
  })
}
