<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElOption } from 'element-plus'
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
import AMapSelector from '@/components/AMapSelector/index.vue'
import AMapViewer from '@/components/AMapViewer/index.vue'
import type { LocationItem } from '../../api/location/types'
import type { UploadProps } from 'element-plus'

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
      list: res.data.list, // 新API直接返回数据列表在data字段
      total: res.data.total // 假设新API返回的是完整列表，实际项目中可能需要调整
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
    label: '位置类型',
    field: 'type',
    width: '120px',
    formatter: (row: LocationItem) => {
      return row.type || '-'
    }
  },
  {
    label: '经纬度',
    field: 'coordinates',
    width: '300px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        const locationRow = row as LocationItem
        const hasCoordinates = locationRow.lng && locationRow.lat
        return (
          <div class="flex items-center gap-5px">
            <span>
              {hasCoordinates
                ? `${locationRow.lng?.toFixed(6)}, ${locationRow.lat?.toFixed(6)}`
                : '-'}
            </span>
            {hasCoordinates && (
              <BaseButton
                size="small"
                onClick={() => handleViewMap(locationRow.lng!, locationRow.lat!)}
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
        { label: '全部', value: '0' },
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
const selectPlaceName = ref('')
const showViewMapDialog = ref(false)
const viewMapCenter = ref([116.397428, 39.90923])
const tableRef = ref<any>(null)

function showMapDialogFunc(placeName: string) {
  selectPlaceName.value = placeName
  showMapDialog.value = true
}

// 位置类型列表
const positionTypes = ref<string[]>([])

const formData = reactive({
  id: 0,
  name: '',
  english_name: '',
  city_id: undefined as number | undefined,
  type: '',
  visit_date: '',
  lat: 0,
  lng: 0,
  desc: '',
  images: [] as string[]
})

const compressImage = (
  file: File,
  quality: number = 0.7,
  maxWidth: number = 1920
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 Canvas 上下文'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
  })
}

const handleImageUpload = async (file: File) => {
  try {
    const compressedFile = await compressImage(file, 0.7, 1920)
    console.log(
      `原始大小: ${(file.size / 1024 / 1024).toFixed(2)}MB, 压缩后: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    )
    return compressedFile
  } catch (error) {
    console.error('图片压缩失败:', error)
    ElMessage.error('图片处理失败')
    throw error
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/.test(rawFile.type)
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  return true
}

const httpRequest: UploadProps['httpRequest'] = async (options) => {
  const { file, onSuccess, onError } = options
  try {
    const compressedFile = await handleImageUpload(file as File)
    const uploadFormData = new FormData()
    uploadFormData.append('file', compressedFile)

    const response = await fetch('/common/upload_file?scene=position_view', {
      method: 'POST',
      body: uploadFormData
    })

    const result = await response.json()
    if (result.error_code === 0) {
      const imageUrl = result.data?.url || result.data || result.url
      if (imageUrl) {
        formData.images.push(imageUrl)
      }
      onSuccess?.(result)
    } else {
      ElMessage.error(result.error_message || '上传失败')
      onError?.(new Error(result.error_message || '上传失败') as any)
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
    onError?.(error as any)
  }
}

// 处理超出限制
const handleExceed: UploadProps['onExceed'] = (_, __) => {
  ElMessage.warning(`最多只能上传10张图片`)
}

// 删除图片
const handleRemoveImage = (index: number) => {
  console.log('handleRemoveImage')
  formData.images.splice(index, 1)
}

// 获取城市列表
const loadCities = async () => {
  try {
    const res = await getCitiesApi({ page: 1, page_size: 1000 })
    cities.value = res.data.list
    console.log('获取到的城市列表:', cities.value)
  } catch (error) {
    ElMessage.error('获取城市列表失败')
  }
}

// 获取位置类型列表
const loadPositionTypes = async () => {
  try {
    const res = await fetch('/fog/positions/types')
    const data = await res.json()
    if (data && Array.isArray(data.data)) {
      positionTypes.value = data.data
      console.log('获取到的位置类型列表:', positionTypes.value)
    }
  } catch (error) {
    console.error('获取位置类型列表失败:', error)
    // 失败时不显示错误，允许用户手动输入
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
    type: row.type || '',
    visit_date: row.visit_date,
    lat: row.lat,
    lng: row.lng,
    desc: row.desc,
    images: row.images ? [...row.images] : [] // 保留已上传的图片列表
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
    type: '',
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
    let res
    if (formData.id === 0) {
      res = await saveLocationApi(formData as any)
      ElMessage.success('添加成功')
    } else {
      res = await updateLocationApi(formData as any)
      ElMessage.success('修改成功')
    }
    if (res.error_code == 0) {
      dialogVisible.value = false
      refresh()
    } else {
      console.log('提交失败：', res.error_message)
    }
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
  loadPositionTypes()
})

// 查看地图位置
const handleViewMap = (lng: number, lat: number) => {
  viewMapCenter.value = [lng, lat]
  showViewMapDialog.value = true
}

// 确认地图位置选择
const handleConfirmMapLocation = (lng: number, lat: number) => {
  formData.lng = lng
  formData.lat = lat
  showMapDialog.value = false
}

// 关闭地图选择弹窗
const handleCloseMapDialog = () => {
  showMapDialog.value = false
}

// 关闭地图查看弹窗
const handleCloseViewMapDialog = () => {
  showViewMapDialog.value = false
}
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
      ref="tableRef"
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :pagination="{
        total,
        pageSize
      }"
      v-model:currentPage="currentPage"
      v-model:pageSize="pageSize"
      @register="tableRegister"
    />

    <!-- 编辑/添加弹窗 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px" maxHeight="600px">
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
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
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
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">位置类型</label>
            <ElSelect
              v-model="formData.type"
              placeholder="请选择位置类型（或直接输入）"
              filterable
              allow-create
              default-first-option
              style="width: 100%"
            >
              <ElOption v-for="type in positionTypes" :key="type" :label="type" :value="type" />
            </ElSelect>
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">选择经纬度 <span style="color: red">*</span></label>
            <div class="flex gap-10px">
              <BaseButton type="primary" @click="showMapDialogFunc(formData.name)"
                >高德地图选择</BaseButton
              >
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
            <div class="mb-10px">
              <ElUpload
                :http-request="httpRequest"
                list-type="picture-card"
                :before-upload="beforeUpload"
                :auto-upload="true"
                :multiple="true"
                :limit="10"
                :on-exceed="handleExceed"
                :file-list="
                  formData.images.map((url, index) => ({
                    uid: index,
                    name: `image_${index}.jpg`,
                    status: 'success',
                    url
                  }))
                "
                :on-remove="
                  (file:any, _) => {
                    const index = formData.images.indexOf(file.url)
                    if (index > -1) {
                      handleRemoveImage(index)
                    }
                  }
                "
                :preview-src-list="formData.images"
              >
                <div class="text-center">
                  <span class="text-20px">+</span>
                  <div class="text-12px mt-5px">上传图片</div>
                </div>
              </ElUpload>
            </div>
            <div class="text-gray-500 text-xs mt-5px">
              支持上传JPG、PNG、GIF、WebP格式图片，图片会自动压缩以减少体积，最多10张
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
    <Dialog
      v-model="showMapDialog"
      title="选择经纬度"
      width="800px"
      height="600px"
      maxHeight="600px"
    >
      <AMapSelector
        :visible="showMapDialog"
        :lng="formData.lng"
        :lat="formData.lat"
        @confirm="handleConfirmMapLocation"
        @close="handleCloseMapDialog"
        :place-name="selectPlaceName"
      />
    </Dialog>

    <!-- 高德地图查看弹窗 -->
    <Dialog
      v-model="showViewMapDialog"
      title="查看位置"
      width="800px"
      height="600px"
      maxHeight="600px"
    >
      <AMapViewer
        :visible="showViewMapDialog"
        :lng="viewMapCenter[0]"
        :lat="viewMapCenter[1]"
        @close="handleCloseViewMapDialog"
      />
    </Dialog>
  </ContentWrap>
</template>
