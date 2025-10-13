<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElOption, ElTooltip, ElButton } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getFlightListApi,
  deleteFlightApi,
  saveFlightApi,
  getAirportListApi,
  updateFlightApi
} from '@/api/flight'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElSelect } from 'element-plus'
import type { FlightListItem, AirportItem } from '../../api/flight/types'

// 筛选条件
const start_time = ref(undefined as string | undefined)
const end_time = ref(undefined as string | undefined)
const flight_type = ref<1 | 2 | undefined>(undefined)

// 机场列表
const airports = ref<AirportItem[]>([])
const router = useRouter()
const searchKeyword = ref('')
const showAddButton = ref(false)

// 获取机场列表
const loadAirports = async () => {
  try {
    const res = await getAirportListApi()
    airports.value = res.data.list
  } catch (error) {
    ElMessage.error('获取机场列表失败')
  }
}

// 表格配置
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getFlightListApi({
      page: unref(currentPage),
      page_size: unref(pageSize),
      start_time: unref(start_time),
      end_time: unref(end_time),
      flight_type: unref(flight_type)
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
    label: '类型',
    field: 'flight_type',
    width: '80px',
    formatter: (row: FlightListItem) => {
      return row.type === 1 ? '飞机' : '火车'
    }
  },
  {
    label: '航班/车次号',
    field: 'number',
    width: '120px'
  },
  {
    label: '出发地',
    field: '',
    width: '180px',
    formatter: (row: FlightListItem) => {
      return (
        <ElTooltip content={`${row.from_airport_info.city} ${row.from_airport_info.name}`}>
          <span
            style="cursor: pointer; color: #409eff;"
            onClick={() =>
              router.push({
                path: '/world/airport',
                query: { id: row.from_airport_id }
              })
            }
          >
            {row.from_airport_info.name}
          </span>
        </ElTooltip>
      )
    }
  },
  {
    label: '目的地',
    field: '',
    width: '180px',
    formatter: (row: FlightListItem) => {
      return (
        <ElTooltip content={`${row.to_airport_info.city} ${row.to_airport_info.name}`}>
          <span
            style="cursor: pointer; color: #409eff;"
            onClick={() =>
              router.push({
                path: '/world/airport',
                query: { id: row.to_airport_id }
              })
            }
          >
            {row.to_airport_info.name}
          </span>
        </ElTooltip>
      )
    }
  },
  {
    label: '出发时间',
    field: 'depart_time',
    width: '180px'
  },
  {
    label: '到达时间',
    field: 'arrival_time',
    width: '180px'
  },
  {
    label: '座位类型',
    field: 'seat_type',
    width: '100px'
  },
  {
    label: '座位号',
    field: 'seat_number',
    width: '100px'
  },
  {
    label: '价格',
    field: 'price',
    width: '100px',
    formatter: (row: FlightListItem) => {
      return `¥${row.price.toFixed(2)}`
    }
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
              onClick={() => handleEdit(row as unknown as FlightListItem)}
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
    field: 'start_time',
    label: '开始时间',
    component: 'DatePicker',
    value: start_time,
    componentProps: {
      type: 'datetime',
      on: {
        change: (value: string) => {
          start_time.value = value
        }
      },
      style: { width: '200px' }
    },
    colProps: {
      span: 8
    }
  },
  {
    field: 'end_time',
    label: '结束时间',
    component: 'DatePicker',
    value: end_time,
    componentProps: {
      type: 'datetime',
      on: {
        change: (value: string) => {
          end_time.value = value
        }
      },
      style: { width: '200px' }
    },
    colProps: {
      span: 8
    }
  },
  {
    field: 'flight_type',
    label: '类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: undefined },
        { label: '飞机', value: 1 },
        { label: '火车', value: 2 }
      ],
      on: {
        change: (value: 1 | 2 | undefined) => {
          flight_type.value = value
        }
      },
      style: { width: '120px' }
    },
    value: flight_type.value,
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
  from_airport_id: 0,
  to_airport_id: 0,
  depart_time: '',
  arrival_time: '',
  type: 1,
  number: '',
  seat_type: '',
  seat_number: '',
  price: 0
})

// 打开编辑弹窗
const handleEdit = (row: FlightListItem) => {
  dialogTitle.value = '修改航班信息'
  Object.assign(formData, {
    id: row.id,
    from_airport_id: row.from_airport_id,
    to_airport_id: row.to_airport_id,
    depart_time: row.depart_time,
    arrival_time: row.arrival_time,
    type: row.type,
    number: row.number,
    seat_type: row.seat_type,
    seat_number: row.seat_number,
    price: row.price
  })
  dialogVisible.value = true
}

// 打开添加弹窗
const handleAdd = () => {
  dialogTitle.value = '添加航班信息'
  Object.assign(formData, {
    id: 0,
    from_airport_id: 0,
    to_airport_id: 0,
    depart_time: '',
    arrival_time: '',
    type: 1,
    number: '',
    seat_type: '',
    seat_number: '',
    price: 0
  })
  dialogVisible.value = true
}

// 删除操作
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确认要删除这条记录吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteFlightApi(id)
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
      await updateFlightApi({ ...formData })
    } else {
      await saveFlightApi({ ...formData })
    }
    ElMessage.success(formData.id ? '修改成功' : '添加成功')
    dialogVisible.value = false
    refresh()
  } catch (error) {
    ElMessage.error(formData.id ? '修改失败' : '添加失败')
  }
}

// 远程搜索处理
const handleRemoteSearch = async (keyword: string) => {
  if (keyword.trim()) {
    searchKeyword.value = keyword
    try {
      const res = await getAirportListApi()
      const filteredAirports = res.data.list.filter((airport: AirportItem) =>
        `${airport.city} ${airport.name}`.toLowerCase().includes(keyword.toLowerCase())
      )
      // 更新机场列表
      airports.value = filteredAirports
      // 显示添加按钮如果没有找到匹配项
      showAddButton.value = filteredAirports.length === 0
    } catch (error) {
      ElMessage.error('搜索失败')
    }
  } else {
    // 如果没有关键词，加载完整列表
    loadAirports()
    showAddButton.value = false
  }
}

// 下拉框显示状态变化
const handleVisibleChange = (visible: boolean) => {
  if (!visible) {
    showAddButton.value = false
  }
}

// 跳转到添加机场页面
const handleAddAirport = () => {
  dialogVisible.value = false
  nextTick(() => {
    router.push({
      path: '/world/airport',
      query: { add: 'true', keyword: searchKeyword.value }
    })
  })
}

// 组件挂载时加载机场列表
onMounted(() => {
  loadAirports()
})
</script>

<template>
  <ContentWrap :title="`我的航班/火车信息`" style="margin-bottom: 20px">
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

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <ElRow :gutter="20">
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">出发地</label>
        <ElSelect
          v-model="formData.from_airport_id"
          placeholder="请选择出发地"
          style="width: 100%"
          filterable
          remote
          reserveKeyword
          :remote-method="handleRemoteSearch"
          @visible-change="handleVisibleChange"
        >
          <ElOption
            v-for="airport in airports"
            :key="airport.id"
            :label="`${airport.city} ${airport.name}`"
            :value="airport.id"
          />
          <template #empty>
            <div v-if="showAddButton" style="padding: 10px; text-align: center">
              未找到该地点，
              <ElButton type="text" size="small" @click="handleAddAirport"> 前往添加 </ElButton>
            </div>
          </template>
        </ElSelect>
      </ElCol>
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">目的地</label>
        <ElSelect
          v-model="formData.to_airport_id"
          placeholder="请选择目的地"
          style="width: 100%"
          filterable
          remote
          reserveKeyword
          :remote-method="handleRemoteSearch"
          @visible-change="handleVisibleChange"
        >
          <ElOption
            v-for="airport in airports"
            :key="airport.id"
            :label="`${airport.city} ${airport.name}`"
            :value="airport.id"
          />
          <template #empty>
            <div v-if="showAddButton" style="padding: 10px; text-align: center">
              未找到该地点，
              <ElButton type="text" size="small" @click="handleAddAirport"> 前往添加 </ElButton>
            </div>
          </template>
        </ElSelect>
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">类型</label>
        <ElSelect v-model="formData.type" style="width: 100%">
          <el-option label="飞机" :value="1" />
          <el-option label="火车" :value="2" />
        </ElSelect>
      </ElCol>
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">航班/车次号</label>
        <ElInput v-model="formData.number" placeholder="请输入航班/车次号" />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">出发时间</label>
        <ElInput
          v-model="formData.depart_time"
          type="datetime-local"
          placeholder="请选择出发时间"
        />
      </ElCol>
      <ElCol :span="12">
        <label class="block text-sm font-medium mb-2">到达时间</label>
        <ElInput
          v-model="formData.arrival_time"
          type="datetime-local"
          placeholder="请选择到达时间"
        />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20" style="margin-top: 20px">
      <ElCol :span="8">
        <label class="block text-sm font-medium mb-2">座位类型</label>
        <ElInput v-model="formData.seat_type" placeholder="请输入座位类型" />
      </ElCol>
      <ElCol :span="8">
        <label class="block text-sm font-medium mb-2">座位号</label>
        <ElInput v-model="formData.seat_number" placeholder="请输入座位号" />
      </ElCol>
      <ElCol :span="8">
        <label class="block text-sm font-medium mb-2">价格</label>
        <ElInput v-model="formData.price" type="number" placeholder="请输入价格" />
      </ElCol>
    </ElRow>

    <template #footer>
      <BaseButton @click="dialogVisible = false">取消</BaseButton>
      <BaseButton type="primary" @click="handleSave">确定</BaseButton>
    </template>
  </Dialog>
</template>
