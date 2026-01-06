import { SUCCESS_CODE } from '@/constants'

const timeout = 1000

// 模拟城市数据
let cityList: any[] = [
  {
    id: 1,
    name: '北京',
    english_name: 'beijing',
    first_visit_date: '2023-05-01 10:00:00',
    desc: '工作，居住的地方',
    bounds: '[116.397428,39.90923,116.410108,39.903719]',
    create_time: '2023-01-01 10:00:00',
    update_time: '2023-10-15 14:30:00'
  },
  {
    id: 2,
    name: '上海',
    english_name: 'shanghai',
    first_visit_date: '2023-06-20 09:00:00',
    desc: '国际化大都市',
    bounds: '[121.472644,31.231706,121.487219,31.224009]',
    create_time: '2023-01-02 10:00:00',
    update_time: '2023-12-01 11:00:00'
  },
  {
    id: 3,
    name: '东京',
    english_name: 'tokyo',
    first_visit_date: '2023-04-15 08:30:00',
    desc: '日本首都',
    bounds: '[139.745431,35.658611,139.759664,35.652083]',
    create_time: '2023-01-03 10:00:00',
    update_time: '2023-04-15 08:30:00'
  },
  {
    id: 4,
    name: '纽约',
    english_name: 'newyork',
    first_visit_date: '2023-07-01 12:00:00',
    desc: '美国最大城市',
    bounds: '[-74.0060,40.7128,-73.9352,40.7484]',
    create_time: '2023-01-04 10:00:00',
    update_time: '2023-09-20 15:00:00'
  },
  {
    id: 5,
    name: '伦敦',
    english_name: 'london',
    first_visit_date: '2023-03-10 09:00:00',
    desc: '英国首都',
    bounds: '[-0.127647,51.507322,-0.106006,51.519864]',
    create_time: '2023-01-05 10:00:00',
    update_time: '2023-03-10 09:00:00'
  }
]

let cityIdCounter = 6

// 模拟地点数据
let locationList: any[] = [
  {
    id: 1,
    name: '北京火车站',
    city_id: 1,
    city_name: '北京',
    latitude: 39.9042,
    longitude: 116.4276,
    description: '北京站是北京铁路枢纽的重要组成部分，位于北京市东城区。',
    feeling: '非常宏伟的建筑，充满了历史的厚重感。',
    images: [
      'https://images.unsplash.com/photo-1548685913-fe6678b0d5c7?w=400',
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400'
    ],
    create_time: '2023-05-01 10:00:00',
    update_time: '2023-05-01 10:00:00'
  },
  {
    id: 2,
    name: '上海外滩',
    city_id: 2,
    city_name: '上海',
    latitude: 31.2397,
    longitude: 121.493,
    description: '外滩是上海市中心的一个著名景点，位于黄浦江畔。',
    feeling: '夜景非常美丽，是上海的标志性景观。',
    images: ['https://images.unsplash.com/photo-1548685913-fe6678b0d5c7?w=400'],
    create_time: '2023-06-20 09:00:00',
    update_time: '2023-06-20 09:00:00'
  },
  {
    id: 3,
    name: '东京塔',
    city_id: 3,
    city_name: '东京',
    latitude: 35.6586,
    longitude: 139.7454,
    description: '东京塔是东京的标志性建筑，位于港区。',
    feeling: '从塔顶俯瞰东京全景，景色壮观。',
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400'
    ],
    create_time: '2023-04-15 08:30:00',
    update_time: '2023-04-15 08:30:00'
  },
  {
    id: 4,
    name: '自由女神像',
    city_id: 4,
    city_name: '纽约',
    latitude: 40.6892,
    longitude: -74.0445,
    description: '自由女神像是纽约的标志性建筑，位于自由岛上。',
    feeling: '象征着自由和民主，非常震撼。',
    images: ['https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?w=400'],
    create_time: '2023-07-01 12:00:00',
    update_time: '2023-07-01 12:00:00'
  },
  {
    id: 5,
    name: '大本钟',
    city_id: 5,
    city_name: '伦敦',
    latitude: 51.5007,
    longitude: -0.1246,
    description: '大本钟是伦敦的标志性建筑，位于威斯敏斯特宫。',
    feeling: '钟声悠扬，充满了英伦风情。',
    images: ['https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400'],
    create_time: '2023-03-10 09:00:00',
    update_time: '2023-03-10 09:00:00'
  }
]

let locationIdCounter = 6

export default [
  // 城市列表接口（旧接口，保留兼容性）
  {
    url: '/mock/fog/city/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { page = 1, page_size = 10, keyword = '', country = '' } = query

      let filteredList = cityList.filter((item) => {
        if (keyword && !item.name.includes(keyword)) return false
        if (country && !item.english_name.includes(country)) return false
        return true
      })

      const total = filteredList.length
      const startIndex = (page - 1) * page_size
      const endIndex = startIndex + page_size
      const list = filteredList.slice(startIndex, endIndex)

      return {
        code: SUCCESS_CODE,
        data: {
          list,
          total
        }
      }
    }
  },

  // 城市列表接口（新接口，按照用户要求的格式返回）
  {
    url: '/mock/fog/cities',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { page = 1, page_size = 10, keyword = '', country = '' } = query

      let filteredList = cityList.filter((item) => {
        if (keyword && !item.name.includes(keyword)) return false
        if (country && !item.english_name.includes(country)) return false
        return true
      })

      const startIndex = (page - 1) * page_size
      const endIndex = startIndex + page_size
      const list = filteredList.slice(startIndex, endIndex)

      return {
        data: list,
        error_code: 0,
        error_message: ''
      }
    }
  },

  // 城市简单列表接口（用于地点管理选择城市）
  {
    url: '/mock/fog/city/simple_list',
    method: 'get',
    timeout,
    response: () => {
      return {
        code: SUCCESS_CODE,
        data: {
          list: cityList.map((item) => ({
            id: item.id,
            name: item.name
          }))
        }
      }
    }
  },

  // 添加城市接口
  {
    url: '/mock/fog/cities',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const newCity = {
        id: cityIdCounter++,
        name: body.name,
        english_name: body.english_name,
        first_visit_date: body.first_visit_date,
        desc: body.desc || '',
        bounds: body.bounds || '[]',
        create_time: new Date().toLocaleString('zh-CN'),
        update_time: new Date().toLocaleString('zh-CN')
      }
      cityList.push(newCity)
      return {
        code: SUCCESS_CODE,
        data: newCity
      }
    }
  },

  // 更新城市接口
  {
    url: '/mock/fog/cities/:id',
    method: 'put',
    timeout,
    response: ({ params, body }) => {
      const cityId = Number(params.id)
      const index = cityList.findIndex((item) => item.id === cityId)
      if (index !== -1) {
        cityList[index] = {
          ...cityList[index],
          name: body.name,
          english_name: body.english_name,
          first_visit_date: body.first_visit_date,
          desc: body.desc,
          bounds: body.bounds,
          update_time: new Date().toLocaleString('zh-CN')
        }
      }
      return {
        code: SUCCESS_CODE,
        data: cityList[index]
      }
    }
  },

  // 删除城市接口
  {
    url: '/mock/fog/cities',
    method: 'delete',
    timeout,
    response: ({ query }) => {
      const cityId = Number(query.id)
      const index = cityList.findIndex((item) => item.id === cityId)
      if (index !== -1) {
        cityList.splice(index, 1)
      }
      return {
        code: SUCCESS_CODE,
        data: null
      }
    }
  },

  // 地点列表接口
  {
    url: '/mock/fog/location/list',
    method: 'get',
    timeout,
    response: ({ query }) => {
      const { page = 1, page_size = 10, keyword = '', city_id } = query

      let filteredList = locationList.filter((item) => {
        if (keyword && !item.name.includes(keyword)) return false
        if (city_id && item.city_id !== Number(city_id)) return false
        return true
      })

      const total = filteredList.length
      const startIndex = (page - 1) * page_size
      const endIndex = startIndex + page_size
      const list = filteredList.slice(startIndex, endIndex)

      return {
        code: SUCCESS_CODE,
        data: {
          list,
          total
        }
      }
    }
  },

  // 添加地点接口
  {
    url: '/mock/fog/location/add',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const city = cityList.find((item) => item.id === body.city_id)
      const newLocation = {
        id: locationIdCounter++,
        name: body.name,
        city_id: body.city_id,
        city_name: city ? city.name : '',
        latitude: body.latitude,
        longitude: body.longitude,
        description: body.description,
        feeling: body.feeling,
        images: body.images || [],
        create_time: new Date().toLocaleString('zh-CN'),
        update_time: new Date().toLocaleString('zh-CN')
      }
      locationList.push(newLocation)
      return {
        code: SUCCESS_CODE,
        data: newLocation
      }
    }
  },

  // 更新地点接口
  {
    url: '/mock/fog/location/update',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const index = locationList.findIndex((item) => item.id === body.id)
      if (index !== -1) {
        const city = cityList.find((item) => item.id === body.city_id)
        locationList[index] = {
          ...locationList[index],
          name: body.name,
          city_id: body.city_id,
          city_name: city ? city.name : '',
          latitude: body.latitude,
          longitude: body.longitude,
          description: body.description,
          feeling: body.feeling,
          images: body.images,
          update_time: new Date().toLocaleString('zh-CN')
        }
      }
      return {
        code: SUCCESS_CODE,
        data: locationList[index]
      }
    }
  },

  // 删除地点接口
  {
    url: '/mock/fog/location/del',
    method: 'post',
    timeout,
    response: ({ body }) => {
      const index = locationList.findIndex((item) => item.id === body.id)
      if (index !== -1) {
        locationList.splice(index, 1)
      }
      return {
        code: SUCCESS_CODE,
        data: null
      }
    }
  }
]
