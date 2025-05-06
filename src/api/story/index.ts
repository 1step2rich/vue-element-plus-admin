import request from '@/axios'
import { StoryInfo, StoryListReq } from './types'

export const getStoryListApi = (data: StoryListReq) => {
  return request.post({ url: '/story/list', data })
}

export const modifyStoryApi = (data: StoryInfo) => {
  return request.post({ url: '/story/modify', data })
}

export const translateStoryApi = (id: number) => {
  return request.get({ url: `/story/translate?id=${id}` })
}
export const spamStoryDetailApi = (id: number) => {
  return request.get({ url: `/story/spam_detail?id=${id}` })
}

export const addStoryDraftApi = (id: number) => {
  return request.get({ url: `/story/add_draft?id=${id}` })
}
