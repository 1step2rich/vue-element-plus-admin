import request from '@/axios'

export const getNameListApi = () => {
  return request.get({ url: '/name/admin/list' })
}
