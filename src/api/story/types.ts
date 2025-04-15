export interface StoryListReq {
  order_field: string
  order_type: string
  page: number
  count: number
  keyword: string
  has_content_file:boolean 
  has_content_file_chinese:boolean
}

export interface StoryInfo {
  id: number
  title_chinese: string
  detail_chinese: string
  content_file_chinese: string
}
