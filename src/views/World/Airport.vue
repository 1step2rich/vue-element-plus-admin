<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElOption } from 'element-plus'
import { useRoute } from 'vue-router'
import {
  getAirportListApi,
  deleteAirportApi,
  saveAirportApi,
  updateAirportApi
} from '@/api/airport'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElSelect } from 'element-plus'
import type { AirportItem } from '../../api/airport/types'

// 筛选条件
const start_time = ref(undefined as string | undefined)
const end_time = ref(undefined as string | undefined)
const airport_type = ref<1 | 2 | undefined>(undefined)

// 表格配置
const route = useRoute()
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getAirportListApi({
      page: unref(currentPage),
      page_size: unref(pageSize),
      start_time: unref(start_time),
      end_time: unref(end_time),
      airport_type: unref(airport_type)
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
    label: '名称',
    field: 'name',
    width: '180px'
  },
  {
    label: '城市',
    field: 'city',
    width: '120px'
  },
  {
    label: '类型',
    field: 'type',
    width: '100px',
    formatter: (row: AirportItem) => {
      return row.type === 1 ? '飞机场' : '火车站'
    }
  },
  {
    label: '纬度',
    field: 'lat',
    width: '120px'
  },
  {
    label: '经度',
    field: 'lon',
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
            <BaseButton
              type="primary"
              size="small"
              onClick={() => handleEdit(row as unknown as AirportItem)}
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
    field: 'airport_type',
    label: '类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: undefined },
        { label: '飞机场', value: 1 },
        { label: '火车站', value: 2 }
      ],
      on: {
        change: (value: 1 | 2 | undefined) => {
          airport_type.value = value
        }
      },
      style: { width: '200px' }
    },
    value: airport_type.value,
    colProps: {
      span: 15
    }
  }
])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formData = reactive({
  id: 0,
  name: '',
  city: '',
  lat: 0,
  lon: 0,
  type: 1
})

// 打开编辑弹窗
const handleEdit = (row: AirportItem) => {
  dialogTitle.value = '修改机场信息'
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    city: row.city,
    lat: row.lat,
    lon: row.lon,
    type: row.type
  })
  dialogVisible.value = true
}

// 打开添加弹窗
const handleAdd = (keyword?: string) => {
  dialogTitle.value = '添加机场信息'
  Object.assign(formData, {
    id: 0,
    name: keyword || '',
    city: '',
    lat: 0,
    lon: 0,
    type: 1
  })
  dialogVisible.value = true
}

// 组件挂载时加载机场列表
onMounted(() => {
  // 组件挂载时加载数据
  refresh()

  // 检查路由参数，如果有添加标识，则打开添加弹窗
  const addParam = route.query.add
  const keyword = route.query.keyword as string

  if (addParam === 'true' && keyword) {
    nextTick(() => {
      handleAdd(keyword)
    })
  }
})

// 删除操作
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确认要删除这条记录吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteAirportApi(id)
        ElMessage.success('删除成功')
        refresh()
      } catch (error) {
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 保存表单
const handleSave = async () => {
  try {
    if (formData.id > 0) {
      await updateAirportApi({ ...formData })
    } else {
      await saveAirportApi({ ...formData })
    }
    ElMessage.success(formData.id ? '修改成功' : '添加成功')
    dialogVisible.value = false
    refresh()
  } catch (error) {
    ElMessage.error(formData.id ? '修改失败' : '添加失败')
  }
}
</script>

<template>
  <ContentWrap :title="`机场/火车站管理`" style="margin-bottom: 20px">
    <div class="flex justify-between items-center mb-20px">
      <Form :schema="schema" label-width="auto" />
      <div>
        <BaseButton type="primary" @click="refresh"> 搜索 </BaseButton>
        <BaseButton type="primary" @click="handleAdd" style="margin-left: 10px"> 添加 </BaseButton>
      </div>
    </div>

    <Table
      v-model:pageSize="pageSize"
      v-model:currentPage="currentPage"
      showAction
      :columns="columns"
      row-key="id"
      :data="dataList"
      :loading="loading"
      :pagination="{
        total: total
      }"
      @register="tableRegister"
      @refresh="refresh"
    />
  </ContentWrap>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
    <ElRow :gutter="20">
      <ElCol :span="24">
        <label class="block text-sm font-medium mb-2">名称</label>
        <ElInput v-model="formData.name" placeholder="请输入机场/火车站名称" />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="24">
        <label class="block text-sm font-medium mb-2">城市</label>
        <ElInput v-model="formData.city" placeholder="请输入所在城市" />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">类型</label>
        <ElSelect v-model="formData.type" style="width: 100%">
          <ElOption label="飞机场" :value="1" />
          <ElOption label="火车站" :value="2" />
        </ElSelect>
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">纬度</label>
        <ElInput v-model="formData.lat" type="number" placeholder="请输入纬度" />
      </ElCol>
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">经度</label>
        <ElInput v-model="formData.lon" type="number" placeholder="请输入经度" />
      </ElCol>
    </ElRow>

    <template #footer>
      <BaseButton @click="dialogVisible = false">取消</BaseButton>
      <BaseButton type="primary" @click="handleSave">确定</BaseButton>
    </template>
  </Dialog>
</template>
