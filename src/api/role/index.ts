import request from '@/axios'

export const getRoleListApi = () => {
  return request.get({ url: '/name/admin/role/list' })
}
