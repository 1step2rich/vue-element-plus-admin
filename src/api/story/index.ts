import request from '@/axios'
import { StoryInfo, StoryListReq } from './types'

export const getStoryListApi = (data: StoryListReq) => {
  return request.post({ url: '/story/list', data })
}

export const modifyStoryApi = (data: StoryInfo) => {
  return request.post({ url: '/story/modify', data })
}
