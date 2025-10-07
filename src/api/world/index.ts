import request from '@/axios'

export const fogFwssList = (status: string) => {
  if (status == '') {
    status = 'ALL'
  }
  return request.get({ url: `/fog/fwss/list?status=${status}` })
}

export const fogFwssModify = (id: number, description: string, status: number) => {
  return request.get({
    url: `/fog/fwss/modify?id=${id}&description=${description}&status=${status}`
  })
}

export const pullFwssForDate = (date: string) => {
  return request.get({ url: `/fog/fwss/pull_fwss_for_date?date=${date}` })
}
