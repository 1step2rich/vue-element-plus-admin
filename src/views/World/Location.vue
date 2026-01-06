<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElImage } from 'element-plus'
import {
  getLocationListApi,
  deleteLocationApi,
  saveLocationApi,
  updateLocationApi,
  getCityListApi
} from '@/api/location'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElSelect, ElUpload } from 'element-plus'
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
      list: res.data.list,
      total: res.data.total
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
    label: '所在城市',
    field: 'city_name',
    width: '120px'
  },
  {
    label: '经度',
    field: 'longitude',
    width: '120px',
    formatter: (row: LocationItem) => {
      return row.longitude?.toFixed(6) || '-'
    }
  },
  {
    label: '纬度',
    field: 'latitude',
    width: '120px',
    formatter: (row: LocationItem) => {
      return row.latitude?.toFixed(6) || '-'
    }
  },
  {
    label: '描述',
    field: 'description',
    width: '200px',
    formatter: (row: LocationItem) => {
      return row.description || '-'
    }
  },
  {
    label: '感受',
    field: 'feeling',
    width: '200px',
    formatter: (row: LocationItem) => {
      return row.feeling || '-'
    }
  },
  {
    label: '图片',
    field: 'images',
    width: '150px',
    formatter: (row: LocationItem) => {
      if (!row.images || row.images.length === 0) {
        return '暂无图片'
      }
      return (
        <div class="flex gap-5px">
          <ElImage
            src={row.images[0]}
            fit="cover"
            style={{ width: '50px', height: '50px', borderRadius: '4px' }}
            preview-src-list={row.images}
          />
          {row.images.length > 1 && (
            <div class="text-gray-500 text-12px">+{row.images.length - 1}</div>
          )}
        </div>
      )
    }
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
            <BaseButton
              type="primary"
              size="small"
              onClick={() => handleEdit(row as unknown as LocationItem)}
            >
              修改
            </BaseButton>
            <BaseButton type="danger" size="small" onClick={() => handleDelete(row.id as number)}>
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
      options: [
        { label: '全部', value: undefined },
        ...cities.value.map((city) => ({
          label: city.name,
          value: city.id
        }))
      ],
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
const formData = reactive({
  id: 0,
  name: '',
  city_id: undefined as number | undefined,
  latitude: 0,
  longitude: 0,
  description: '',
  feeling: '',
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
    const res = await getCityListApi()
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
    city_id: row.city_id,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    feeling: row.feeling,
    images: [...(row.images || [])]
  })
  dialogVisible.value = true
}

// 打开添加弹窗
const handleAdd = () => {
  dialogTitle.value = '添加地点信息'
  Object.assign(formData, {
    id: 0,
    name: '',
    city_id: undefined,
    latitude: 0,
    longitude: 0,
    description: '',
    feeling: '',
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
  if (!formData.city_id) {
    ElMessage.warning('请选择城市')
    return
  }
  if (formData.latitude === 0 && formData.longitude === 0) {
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
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">地点名称 <span style="color: red">*</span></label>
            <ElInput v-model="formData.name" placeholder="请输入地点名称" />
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
            <label class="block mb-5px">经度</label>
            <ElInput v-model.number="formData.longitude" type="number" placeholder="请输入经度" />
          </div>
        </ElCol>
        <ElCol :span="12">
          <div class="mb-20px">
            <label class="block mb-5px">纬度</label>
            <ElInput v-model.number="formData.latitude" type="number" placeholder="请输入纬度" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">描述</label>
            <ElInput
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入地点描述"
            />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">感受</label>
            <ElInput
              v-model="formData.feeling"
              type="textarea"
              :rows="3"
              placeholder="请输入对这个地点的感受"
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
  </ContentWrap>
</template>
