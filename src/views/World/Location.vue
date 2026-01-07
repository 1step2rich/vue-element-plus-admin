<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElImage } from 'element-plus'
import {
  getLocationListApi,
  deleteLocationApi,
  saveLocationApi,
  updateLocationApi
} from '@/api/location'
import { getCitiesApi } from '@/api/city'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElSelect, ElUpload, ElDatePicker } from 'element-plus'
import type { LocationItem } from '../../api/location/types'
import type { UploadProps } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'

// 筛选条件
const keyword = ref('')
const city_id = ref<number | undefined>(undefined)

// 城市列表
const cities = ref<any[]>([])

// 表格配置
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getLocationListApi({
      page: unref(currentPage),
      page_size: unref(pageSize),
      keyword: unref(keyword),
      city_id: unref(city_id)
    })
    return {
      list: res.data, // 新API直接返回数据列表在data字段
      total: res.data.length // 假设新API返回的是完整列表，实际项目中可能需要调整
    }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { refresh } = tableMethods
pageSize.value = 10

// 表格列配置
const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '80px'
  },
  {
    label: '地点名称',
    field: 'name',
    width: '180px'
  },
  {
    label: '英文名称',
    field: 'english_name',
    width: '180px'
  },
  {
    label: '所在城市',
    field: 'city.name',
    width: '120px'
  },
  {
    label: '经度',
    field: 'lng',
    width: '200px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        return (
          <div class="flex items-center gap-5px">
            <span>{(row as LocationItem).lng?.toFixed(6) || '-'}</span>
            {(row as LocationItem).lng && (row as LocationItem).lat && (
              <BaseButton
                size="small"
                onClick={() =>
                  handleViewMap((row as LocationItem).lng!, (row as LocationItem).lat!)
                }
              >
                定位
              </BaseButton>
            )}
          </div>
        )
      }
    }
  },
  {
    label: '纬度',
    field: 'lat',
    width: '200px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        return (
          <div class="flex items-center gap-5px">
            <span>{(row as LocationItem).lat?.toFixed(6) || '-'}</span>
            {(row as LocationItem).lng && (row as LocationItem).lat && (
              <BaseButton
                size="small"
                onClick={() =>
                  handleViewMap((row as LocationItem).lng!, (row as LocationItem).lat!)
                }
              >
                定位
              </BaseButton>
            )}
          </div>
        )
      }
    }
  },
  {
    label: '描述',
    field: 'desc',
    width: '200px',
    formatter: (row: LocationItem) => {
      return row.desc || '-'
    }
  },
  {
    label: '访问日期',
    field: 'visit_date',
    width: '120px'
  },
  {
    label: '创建时间',
    field: 'create_time',
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '150px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        return (
          <div class="flex gap-10px">
            <BaseButton size="small" onClick={() => handleEdit(row as LocationItem)}>
              修改
            </BaseButton>
            <BaseButton
              size="small"
              type="danger"
              onClick={() => handleDelete((row as LocationItem).id!)}
            >
              删除
            </BaseButton>
          </div>
        )
      }
    }
  }
]

// 搜索表单配置
const schema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    label: '关键词',
    component: 'Input',
    componentProps: {
      placeholder: '请输入地点名称',
      onInput: (value: string) => {
        keyword.value = value
      }
    },
    value: keyword.value,
    colProps: {
      span: 8
    }
  },
  {
    field: 'city_id',
    label: '城市',
    component: 'Select',
    componentProps: {
      placeholder: '请选择城市',
      options: computed(() => [
        { label: '全部', value: undefined },
        ...cities.value.map((city) => ({
          label: city.name,
          value: city.id
        }))
      ]),
      onChange: (value: number | undefined) => {
        city_id.value = value
      }
    },
    value: city_id.value,
    colProps: {
      span: 8
    }
  }
])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const showMapDialog = ref(false)
const showViewMapDialog = ref(false)
const viewMapCenter = ref([116.397428, 39.90923])
let map: any = null
let marker: any = null
let viewMap: any = null
let viewMarker: any = null
let isMapInitialized = false
let isViewMapInitialized = false

// 设置AMap安全配置
window._AMapSecurityConfig = {
  securityJsCode: '195bfb7983cf42035fc117aa3d23a1d8'
}

const formData = reactive({
  id: 0,
  name: '',
  english_name: '',
  city_id: undefined as number | undefined,
  visit_date: '',
  lat: 0,
  lng: 0,
  desc: '',
  images: [] as string[]
})

// 图片上传相关
const fileList = ref<any[]>([])
const imageUrl = ref('')

// 处理图片上传
const handleImageChange: UploadProps['onChange'] = (uploadFile) => {
  fileList.value = [uploadFile]
  const response = uploadFile.response as { url?: string }
  if (response?.url) {
    imageUrl.value = response.url
  }
}

// 处理图片上传前
const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}

// 删除图片
const handleRemoveImage = (index: number) => {
  formData.images.splice(index, 1)
}

// 获取城市列表
const loadCities = async () => {
  try {
    const res = await getCitiesApi({})
    cities.value = res.data.list
  } catch (error) {
    ElMessage.error('获取城市列表失败')
  }
}

// 打开编辑弹窗
const handleEdit = (row: LocationItem) => {
  dialogTitle.value = '修改地点信息'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    english_name: row.english_name,
    city_id: row.city_id,
    visit_date: row.visit_date,
    lat: row.lat,
    lng: row.lng,
    desc: row.desc,
    images: [] // 清空图片列表，因为新API返回数据中没有images字段
  })
  dialogVisible.value = true
}

// 打开添加弹窗
const handleAdd = () => {
  dialogTitle.value = '添加地点信息'
  Object.assign(formData, {
    id: 0,
    name: '',
    english_name: '',
    city_id: undefined,
    visit_date: '',
    lat: 0,
    lng: 0,
    desc: '',
    images: []
  })
  dialogVisible.value = true
}

// 保存操作
const handleSave = async () => {
  if (!formData.name) {
    ElMessage.warning('请输入地点名称')
    return
  }
  if (!formData.english_name) {
    ElMessage.warning('请输入英文名称')
    return
  }
  if (!formData.city_id) {
    ElMessage.warning('请选择城市')
    return
  }
  if (!formData.visit_date) {
    ElMessage.warning('请选择访问日期')
    return
  }
  if (formData.lat === 0 && formData.lng === 0) {
    ElMessage.warning('请输入经纬度')
    return
  }

  try {
    if (formData.id === 0) {
      await saveLocationApi(formData as any)
      ElMessage.success('添加成功')
    } else {
      await updateLocationApi(formData as any)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    refresh()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除操作
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确认要删除这条记录吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteLocationApi(id)
      ElMessage.success('删除成功')
      refresh()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  refresh()
  loadCities()
})

// 打开地图弹窗时初始化地图
watch(
  () => showMapDialog.value,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        initMap()
      }, 100)
    }
  }
)

// 初始化高德地图
const initMap = async () => {
  try {
    // 确保地图容器已挂载
    const mapContainer = document.getElementById('mapContainer')
    if (!mapContainer) {
      console.error('地图容器未找到或未挂载')
      ElMessage.error('地图容器未找到')
      return
    }

    // 检查地图容器的尺寸
    const containerRect = mapContainer.getBoundingClientRect()
    console.log('地图容器尺寸:', containerRect)
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      ElMessage.warning('地图容器尺寸异常，可能还未完全渲染')
      // 尝试设置最小尺寸
      mapContainer.style.minWidth = '400px'
      mapContainer.style.minHeight = '400px'
      // 等待DOM更新后重试
      setTimeout(() => {
        initMap()
      }, 100)
      return
    }

    // 如果地图已初始化，直接返回
    if (isMapInitialized && map) {
      console.log('地图已初始化，直接使用现有实例')
      // 强制调整地图大小
      map.resize()
      return
    }

    if (!window.AMap) {
      await AMapLoader.load({
        key: '4c44d7b6c3a165b57ebc9aae7381f120',
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType', 'AMap.PlaceSearch']
      })
    }

    if (map) {
      map.destroy()
    }

    map = new window.AMap.Map('mapContainer', {
      resizeEnable: true,
      center: [formData.lng || 116.397428, formData.lat || 39.90923],
      zoom: 13
    })

    isMapInitialized = true
    console.log('地图初始化成功')

    // 地图初始化后，强制调整大小以确保正确显示
    setTimeout(() => {
      if (map) {
        map.resize()
        console.log('地图大小已调整')
      }
    }, 100)

    if (marker) {
      marker.remove()
    }

    marker = new window.AMap.Marker({
      position: [formData.lng || 116.397428, formData.lat || 39.90923],
      draggable: true,
      map: map
    })

    // 点击地图添加标记
    map.on('click', (e: any) => {
      const { lnglat } = e
      marker.setPosition(lnglat)
    })

    // 拖动标记结束后更新位置
    marker.on('dragend', (_: any) => {
      // 拖动结束后位置会自动更新，无需额外处理
    })

    // 添加控件
    map.addControl(new window.AMap.ToolBar())
    map.addControl(new window.AMap.Scale())
    map.addControl(new window.AMap.MapType())

    // 添加搜索功能
    window.AMap.plugin(['AMap.PlaceSearch'], function () {
      const placeSearch = new window.AMap.PlaceSearch({
        map: map
      })
      // 搜索结果回调
      window.AMap.event.addListener(placeSearch, 'selectChanged', function () {
        const selected = placeSearch.getSelect()
        if (selected) {
          marker.setPosition(selected.lnglat)
        }
      })
    })
  } catch (error) {
    console.error('初始化地图失败:', error)
    ElMessage.error('地图加载失败')
    isMapInitialized = false
  }
}

// 查看地图位置
const handleViewMap = (lng: number, lat: number) => {
  viewMapCenter.value = [lng, lat]
  showViewMapDialog.value = true
}

// 确认地图位置选择
const confirmMapLocation = () => {
  if (marker) {
    const position = marker.getPosition()
    formData.lng = position.lng
    formData.lat = position.lat
    showMapDialog.value = false
  }
}

// 初始化查看地图
const initViewMap = async () => {
  try {
    // 确保地图容器已挂载
    const viewMapContainer = document.getElementById('viewMapContainer')
    if (!viewMapContainer) {
      console.error('查看地图容器未找到或未挂载')
      ElMessage.error('地图容器未找到')
      return
    }

    // 检查地图容器的尺寸
    const containerRect = viewMapContainer.getBoundingClientRect()
    console.log('查看地图容器尺寸:', containerRect)
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      ElMessage.warning('地图容器尺寸异常，可能还未完全渲染')
      // 尝试设置最小尺寸
      viewMapContainer.style.minWidth = '400px'
      viewMapContainer.style.minHeight = '400px'
      // 等待DOM更新后重试
      setTimeout(() => {
        initViewMap()
      }, 100)
      return
    }

    // 如果地图已初始化，直接返回
    if (isViewMapInitialized && viewMap) {
      console.log('查看地图已初始化，直接使用现有实例')
      // 强制调整地图大小
      viewMap.resize()
      return
    }

    if (!window.AMap) {
      await AMapLoader.load({
        key: '4c44d7b6c3a165b57ebc9aae7381f120',
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType']
      })
    }

    if (viewMap) {
      viewMap.destroy()
    }

    viewMap = new window.AMap.Map('viewMapContainer', {
      resizeEnable: true,
      center: viewMapCenter.value,
      zoom: 15
    })

    isViewMapInitialized = true
    console.log('查看地图初始化成功')

    // 地图初始化后，强制调整大小以确保正确显示
    setTimeout(() => {
      if (viewMap) {
        viewMap.resize()
        console.log('查看地图大小已调整')
      }
    }, 100)

    if (viewMarker) {
      viewMarker.remove()
    }

    viewMarker = new window.AMap.Marker({
      position: viewMapCenter.value,
      map: viewMap
    })

    viewMap.addControl(new window.AMap.ToolBar())
    viewMap.addControl(new window.AMap.Scale())
    viewMap.addControl(new window.AMap.MapType())
  } catch (error) {
    console.error('初始化查看地图失败:', error)
    ElMessage.error('地图加载失败')
    isViewMapInitialized = false
  }
}

// 监听查看地图弹窗
watch(
  () => showViewMapDialog.value,
  (newVal) => {
    if (newVal) {
      setTimeout(() => {
        initViewMap()
      }, 100)
    }
  }
)
</script>

<template>
  <ContentWrap>
    <div class="mb-20px">
      <Form :schema="schema" label-width="80px" />
      <div class="flex gap-10px mt-10px">
        <BaseButton type="primary" @click="refresh">查询</BaseButton>
        <BaseButton type="success" @click="handleAdd">添加地点</BaseButton>
      </div>
    </div>

    <Table
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="{
        total,
        currentPage,
        pageSize
      }"
      @register="tableRegister"
    />

    <!-- 编辑/添加弹窗 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">地点名称 <span style="color: red">*</span></label>
            <ElInput v-model="formData.name" placeholder="请输入地点名称" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">英文名称 <span style="color: red">*</span></label>
            <ElInput v-model="formData.english_name" placeholder="请输入英文名称" />
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">所在城市 <span style="color: red">*</span></label>
            <ElSelect v-model="formData.city_id" placeholder="请选择城市" style="width: 100%">
              <ElOption v-for="city in cities" :key="city.id" :label="city.name" :value="city.id" />
            </ElSelect>
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">访问日期 <span style="color: red">*</span></label>
            <ElDatePicker
              v-model="formData.visit_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
            />
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">经度 <span style="color: red">*</span></label>
            <ElInput v-model.number="formData.lng" type="number" placeholder="请输入经度" />
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">纬度 <span style="color: red">*</span></label>
            <ElInput v-model.number="formData.lat" type="number" placeholder="请输入纬度" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">选择经纬度 <span style="color: red">*</span></label>
            <div class="flex gap-10px">
              <BaseButton type="primary" @click="showMapDialog = true">高德地图选择</BaseButton>
            </div>
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">描述</label>
            <ElInput
              v-model="formData.desc"
              type="textarea"
              :rows="3"
              placeholder="请输入地点描述"
            />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">图片上传</label>
            <ElUpload
              action="/api/upload"
              list-type="picture-card"
              :on-change="handleImageChange"
              :before-upload="beforeUpload"
              :auto-upload="false"
              :file-list="fileList"
            >
              <div class="text-center">
                <span class="text-20px">+</span>
                <div class="text-12px mt-5px">上传图片</div>
              </div>
            </ElUpload>
            <div v-if="formData.images.length > 0" class="mt-10px">
              <label class="block mb-5px">已上传图片</label>
              <div class="flex flex-wrap gap-10px">
                <div
                  v-for="(img, index) in formData.images"
                  :key="index"
                  class="relative"
                  style="width: 100px; height: 100px"
                >
                  <ElImage
                    :src="img"
                    fit="cover"
                    style="width: 100%; height: 100%; border-radius: 4px"
                    :preview-src-list="formData.images"
                  />
                  <div
                    class="absolute top-0 right-0 bg-red-500 text-white w-20px h-20px flex items-center justify-center cursor-pointer rounded-full"
                    style="font-size: 12px"
                    @click="handleRemoveImage(index)"
                  >
                    ×
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
      <template #footer>
        <div class="flex justify-end gap-10px">
          <BaseButton @click="dialogVisible = false">取消</BaseButton>
          <BaseButton type="primary" @click="handleSave">确定</BaseButton>
        </div>
      </template>
    </Dialog>

    <!-- 高德地图选择弹窗 -->
    <Dialog v-model="showMapDialog" title="选择经纬度" width="800px" height="600px">
      <div id="mapContainer" style="width: 100%; height: 450px"></div>
      <template #footer>
        <div class="flex justify-end gap-10px">
          <BaseButton @click="showMapDialog = false">取消</BaseButton>
          <BaseButton type="primary" @click="confirmMapLocation">确认选择</BaseButton>
        </div>
      </template>
    </Dialog>

    <!-- 高德地图查看弹窗 -->
    <Dialog v-model="showViewMapDialog" title="查看位置" width="800px" height="600px">
      <div id="viewMapContainer" style="width: 100%; height: 450px"></div>
      <template #footer>
        <div class="flex justify-end gap-10px">
          <BaseButton @click="showViewMapDialog = false">关闭</BaseButton>
        </div>
      </template>
    </Dialog>
  </ContentWrap>
</template>
