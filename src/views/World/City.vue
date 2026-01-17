<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCitiesApi, deleteCityApi, saveCityApi, updateCityApi } from '@/api/city'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElDatePicker } from 'element-plus'
import type { CityItem } from '../../api/city/types'
// 引入新创建的高德地图行政区划组件
import AMapDistrict from '@/components/AMapDistrict/index.vue'

// 筛选条件
const keyword = ref('')
const country = ref('')

// 表格配置
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getCitiesApi({
      page: unref(currentPage),
      page_size: unref(pageSize),
      keyword: unref(keyword),
      country: unref(country)
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
const tableRef = ref<any>(null)

// 表格列配置
const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '80px'
  },
  {
    label: '城市名称',
    field: 'name',
    width: '150px'
  },
  {
    label: '英文名称',
    field: 'english_name',
    width: '150px'
  },
  {
    label: '首次访问日期',
    field: 'first_visit_date',
    width: '150px',
    formatter: (row: CityItem) => {
      return row.first_visit_date ? row.first_visit_date.split(' ')[0] : '暂无数据'
    }
  },
  {
    label: '描述',
    field: 'desc',
    width: '300px'
  },
  {
    label: '创建时间',
    field: 'create_time',
    width: '180px'
  },
  {
    label: '更新时间',
    field: 'update_time',
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '250px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        return (
          <div class="flex gap-10px">
            <BaseButton
              type="primary"
              size="small"
              onClick={() => handleEdit(row as unknown as CityItem)}
            >
              修改
            </BaseButton>
            <BaseButton
              type="success"
              size="small"
              onClick={() => handleShowMap(row as unknown as CityItem)}
            >
              展示地图
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

// 地图弹窗控制
const mapDialogVisible = ref(false)
const showMapDialogVisible = ref(false) // 新增：用于展示已保存地图边界的弹窗
const showMapBounds = ref('') // 新增：用于存储要展示的边界数据

// 打开地图弹窗（搜索边界用）
const openMapDialog = () => {
  mapDialogVisible.value = true
}

// 打开地图展示弹窗（展示已保存边界用）
const openShowMapDialog = (bounds: string, cityName: string) => {
  showMapBounds.value = bounds
  formData.name = cityName // 保存城市名称
  showMapDialogVisible.value = true
}

// 展示地图
const handleShowMap = (row: CityItem) => {
  try {
    if (!row.bounds) {
      ElMessage.warning('该城市没有边界数据')
      return
    }

    // 直接打开地图展示弹窗，并传递城市名称
    openShowMapDialog(row.bounds, row.name)
  } catch (error) {
    console.error('展示地图失败:', error)
    ElMessage.error('解析边界数据失败')
  }
}

// 确认选择边界
const handleConfirmBounds = (bounds: string) => {
  formData.bounds = bounds
}

// 搜索表单配置
const schema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    label: '关键词',
    component: 'Input',
    componentProps: {
      placeholder: '请输入城市名称',
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
    field: 'country',
    label: '国家',
    component: 'Input',
    componentProps: {
      placeholder: '请输入国家名称',
      onInput: (value: string) => {
        country.value = value
      }
    },
    value: country.value,
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
  english_name: '',
  first_visit_date: undefined as string | undefined,
  desc: '',
  bounds: '[]'
})

// 地图弹窗控制 - 已在前面声明，此处删除重复声明
// const mapDialogVisible = ref(false)

// 打开地图弹窗 - 已在前面声明，此处删除重复声明
// const openMapDialog = () => {
//   mapDialogVisible.value = true
// }

// 确认选择边界 - 已在前面声明，此处删除重复声明
// const handleConfirmBounds = (bounds: string) => {
//   formData.bounds = bounds
// }

// 打开编辑弹窗
const handleEdit = (row: CityItem) => {
  dialogTitle.value = '修改城市信息'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    english_name: row.english_name,
    first_visit_date: row.first_visit_date,
    desc: row.desc,
    bounds: row.bounds
  })
  dialogVisible.value = true
}

// 打开添加弹窗
const handleAdd = () => {
  dialogTitle.value = '添加城市'
  Object.assign(formData, {
    id: 0,
    name: '',
    english_name: '',
    first_visit_date: undefined,
    desc: '',
    bounds: '[]'
  })
  dialogVisible.value = true
}

// 保存操作
const handleSave = async () => {
  if (!formData.name) {
    ElMessage.warning('请输入城市名称')
    return
  }
  if (!formData.english_name) {
    ElMessage.warning('请输入英文名称')
    return
  }

  try {
    if (formData.id === 0) {
      await saveCityApi(formData)
      ElMessage.success('添加成功')
    } else {
      await updateCityApi(formData.id, formData)
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
      await deleteCityApi(id)
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
})
</script>

<template>
  <ContentWrap>
    <div class="mb-20px">
      <Form :schema="schema" label-width="80px" />
      <div class="flex gap-10px mt-10px">
        <BaseButton type="primary" @click="refresh">查询</BaseButton>
        <BaseButton type="success" @click="handleAdd">添加城市</BaseButton>
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
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px" maxHeight="700px">
      <ElRow :gutter="20">
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">城市名称 <span style="color: red">*</span></label>
            <ElInput v-model="formData.name" placeholder="请输入城市名称" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">英文名称 <span style="color: red">*</span></label>
            <ElInput v-model="formData.english_name" placeholder="请输入英文名称" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">首次访问日期</label>
            <ElDatePicker
              v-model="formData.first_visit_date"
              type="date"
              placeholder="选择首次访问日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">描述</label>
            <ElInput v-model="formData.desc" placeholder="请输入描述" type="textarea" :rows="3" />
          </div>
        </ElCol>
        <ElCol :span="24">
          <div class="mb-20px">
            <label class="block mb-5px">边界（JSON格式）</label>
            <div class="flex gap-10px mb-10px">
              <BaseButton type="primary" size="small" @click="openMapDialog">
                高德地图搜索边界
              </BaseButton>
            </div>
            <ElInput
              v-model="formData.bounds"
              placeholder="请输入边界数据，格式如[[116.397428,39.90923],[116.410108,39.903719]]"
              type="textarea"
              :rows="4"
            />
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

    <!-- 使用新创建的高德地图行政区划组件，并包裹在项目自定义的Dialog组件中 -->
    <Dialog
      v-model="mapDialogVisible"
      title="高德地图搜索边界"
      width="80%"
      maxHeight="700px"
      class="map-dialog"
    >
      <AMapDistrict
        :city-name="formData.name"
        :visible="mapDialogVisible"
        @confirm="handleConfirmBounds"
        @close="mapDialogVisible = false"
        style="width: 100%; height: 100%"
      />
    </Dialog>

    <!-- 新增：用于展示已保存地图边界的弹窗 -->
    <Dialog
      v-model="showMapDialogVisible"
      title="展示地图边界"
      width="80%"
      maxHeight="500px"
      class="map-dialog"
    >
      <AMapDistrict
        :visible="showMapDialogVisible"
        :city-name="formData.name"
        :existing-bounds="showMapBounds"
        @close="showMapDialogVisible = false"
        style="width: 100%; height: 100%"
      />
    </Dialog>
  </ContentWrap>
</template>
