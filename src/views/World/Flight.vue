<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElOption, ElTooltip, ElButton, ElUpload } from 'element-plus'
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
import request from '@/axios'

// 筛选条件
const start_time = ref(null as string | null)
const end_time = ref(null as string | null)
const flight_type = ref<1 | 2 | null>(null)

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
    width: '60px'
  },
  {
    label: '类型',
    field: 'flight_type',
    width: '60px',
    formatter: (row: FlightListItem) => {
      return row.type === 1 ? '飞机' : '火车'
    }
  },
  {
    label: '航班/车次号',
    field: 'number',
    width: '100px'
  },
  {
    label: '地点信息',
    field: '',
    width: '200px',
    formatter: (row: FlightListItem) => {
      return (
        <div>
          <ElTooltip content={`${row.from_airport_info.city} ${row.from_airport_info.name}`}>
            <div>
              <span>出发: </span>
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
            </div>
          </ElTooltip>
          <ElTooltip content={`${row.to_airport_info.city} ${row.to_airport_info.name}`}>
            <div>
              <span>到达: </span>
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
            </div>
          </ElTooltip>
        </div>
      )
    }
  },
  {
    label: '时间信息',
    field: '',
    width: '200px',
    formatter: (row: FlightListItem) => {
      return (
        <div>
          <div>出发: {row.depart_time}</div>
          <div>到达: {row.arrival_time}</div>
        </div>
      )
    }
  },
  {
    label: '座位信息',
    field: '',
    width: '120px',
    formatter: (row: FlightListItem) => {
      return (
        <div>
          <div>{row.seat_type}</div>
          <div>{row.seat_number}</div>
        </div>
      )
    }
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
    label: '路线图',
    field: '',
    width: '600px',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        const flight = row as unknown as FlightListItem
        const roadMap = flight.extra?.road_map || ''

        return (
          <div class="flex flex-col gap-5px">
            {roadMap && (
              <a href={roadMap} target="_blank">
                {roadMap}
              </a>
            )}
            <div class="flex flex-wrap gap-5px">
              <BaseButton
                type="primary"
                size="small"
                onClick={() => handleUploadRoadMap(flight.id)}
              >
                上传
              </BaseButton>
              <BaseButton
                type="primary"
                size="small"
                onClick={() => handleGenerateRoadMap(flight.id)}
              >
                抓取
              </BaseButton>
              {roadMap && (
                <>
                  <BaseButton
                    type="primary"
                    size="small"
                    onClick={() => handleViewRoadMap(flight.id, roadMap)}
                  >
                    展示路线图
                  </BaseButton>
                  <BaseButton
                    type="primary"
                    size="small"
                    onClick={() => handleSyncToIcloud(flight.id)}
                  >
                    同步到iCloud
                  </BaseButton>
                </>
              )}
            </div>
          </div>
        )
      }
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
        { label: '全部', value: 0 },
        { label: '飞机', value: 1 },
        { label: '火车', value: 2 }
      ],
      on: {
        change: (value: 1 | 2 | 0) => {
          if (value === 0) {
            flight_type.value = null
          } else {
            flight_type.value = value
          }
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

// 路线图相关弹窗
const uploadDialogVisible = ref(false)
const generateDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentFlightId = ref(0)
const currentRoadMap = ref('')
const generateMessages = ref<string[]>([])
const uploadFile = ref<any>(null)

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

// 处理文件选择变化
const handleFileChange = (fileOrFileList: any, fileList?: any[]) => {
  // 处理不同版本Element Plus可能的参数差异
  let selectedFile = null

  if (fileList && Array.isArray(fileList) && fileList.length > 0) {
    // 某些版本中，第二个参数是文件列表
    selectedFile = fileList[fileList.length - 1]
  } else if (fileOrFileList && fileOrFileList.raw) {
    // 直接使用第一个参数作为文件
    selectedFile = fileOrFileList
  } else if (Array.isArray(fileOrFileList) && fileOrFileList.length > 0) {
    // 某些版本中，第一个参数是文件列表
    selectedFile = fileOrFileList[fileOrFileList.length - 1]
  }

  console.log('文件选择变化 - 原始参数1:', fileOrFileList)
  console.log('文件选择变化 - 原始参数2:', fileList)
  console.log('解析出的文件:', selectedFile)

  if (uploadFile && selectedFile) {
    uploadFile.value = selectedFile
    console.log('uploadFile已设置:', uploadFile.value)
    console.log('uploadFile.value.raw存在:', !!uploadFile.value.raw)
  } else {
    console.error('uploadFile为空或没有选择文件')
  }
}

// 处理上传路线图
const handleUploadRoadMap = (flightId: number) => {
  console.log('打开上传弹窗前:')
  console.log('uploadFile对象:', uploadFile)
  currentFlightId.value = flightId
  if (uploadFile) {
    uploadFile.value = null
    console.log('已将uploadFile.value重置为null')
  }
  uploadDialogVisible.value = true
  console.log('上传弹窗已打开')
}

// 上传文件处理
const handleUploadFile = async () => {
  console.log('点击确认按钮，检查uploadFile状态:')
  console.log('uploadFile对象:', uploadFile)
  console.log('uploadFile.value:', uploadFile?.value)
  console.log('uploadFile.value.raw:', uploadFile?.value?.raw)

  if (!uploadFile || !uploadFile.value || !uploadFile.value.raw) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('flight_id', currentFlightId.value.toString())
    formData.append('field_name', 'road_map')
    formData.append('file', uploadFile.value.raw)

    // 直接使用axios实例上传文件，使用multipart/form-data
    await request.post({
      url: '/fog/flight/update_extra',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    refresh()
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

// 处理抓取路线图
const handleGenerateRoadMap = (flightId: number) => {
  currentFlightId.value = flightId
  generateMessages.value = []
  generateDialogVisible.value = true
  startGenerateRoadMap()
}

// 开始抓取路线图

// 同步到iCloud相关状态
const syncDialogVisible = ref(false)
const syncMessages = ref<string[]>([])
const syncProgress = ref(0)
const syncStatus = ref<'pending' | 'syncing' | 'success' | 'error'>('pending')
const syncFlightId = ref(0)

// 处理同步到icloud
const handleSyncToIcloud = async (flightId: number) => {
  syncFlightId.value = flightId
  syncMessages.value = ['开始同步到iCloud...']
  syncProgress.value = 0
  syncStatus.value = 'syncing'
  syncDialogVisible.value = true

  // 先初始化定时器变量
  let progressInterval: number = 0

  // 模拟进度更新函数
  const simulateProgress = () => {
    progressInterval = window.setInterval(() => {
      if (syncProgress.value < 90) {
        // 保留10%在请求完成后更新
        syncProgress.value += Math.random() * 10
        if (syncProgress.value >= 30 && syncProgress.value < 40) {
          syncMessages.value.push('正在准备同步数据...')
        } else if (syncProgress.value >= 60 && syncProgress.value < 70) {
          syncMessages.value.push('正在同步到iCloud...')
        }
      }
    }, 200)
  }

  // 开始模拟进度
  simulateProgress()

  try {
    // 使用POST请求而不是SSE
    await request.post({
      url: '/fog/flight/road_map/sync2icloud',
      data: {
        flight_id: flightId
      }
    })

    // 请求成功后更新进度和状态
    clearInterval(progressInterval)
    syncProgress.value = 100
    syncStatus.value = 'success'
    syncMessages.value.push('同步到iCloud成功')

    setTimeout(() => {
      syncDialogVisible.value = false
      refresh()
    }, 1500)
  } catch (error) {
    // 请求失败处理
    clearInterval(progressInterval)
    syncStatus.value = 'error'
    syncMessages.value.push('同步失败，请重试')
  }
}
const startGenerateRoadMap = () => {
  // 创建 SSE 连接
  const eventSource = new EventSource(
    `/fog/flight/road_map/generate?flight_id=${currentFlightId.value}`
  )

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    generateMessages.value.push(data.message)

    if (data.status === 'success') {
      eventSource.close()
      ElMessage.success('抓取成功')
      setTimeout(() => {
        generateDialogVisible.value = false
        refresh()
      }, 1000)
    }
  }

  eventSource.onerror = () => {
    eventSource.close()
    ElMessage.error('抓取失败')
  }
}

// 处理查看路线图
const handleViewRoadMap = (flightId: number, roadMap: string) => {
  currentRoadMap.value = roadMap
  viewDialogVisible.value = true
  console.log(flightId)
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

  <!-- 上传路线图弹窗 -->
  <Dialog v-model="uploadDialogVisible" title="上传路线图" width="500px">
    <ElUpload
      class="upload-demo"
      action="#"
      :before-upload="() => false"
      :auto-upload="false"
      :on-change="handleFileChange"
    >
      <ElButton>选择文件</ElButton>
    </ElUpload>
    <div style="margin-top: 20px">{{ uploadFile && uploadFile.value?.name }}</div>
    <template #footer>
      <BaseButton @click="uploadDialogVisible = false">取消</BaseButton>
      <BaseButton type="primary" @click="handleUploadFile">确定</BaseButton>
    </template>
  </Dialog>

  <!-- 抓取路线图弹窗 -->
  <Dialog v-model="generateDialogVisible" title="抓取路线图" width="600px">
    <div style="max-height: 400px; padding: 10px; overflow-y: auto">
      <div v-for="(msg, index) in generateMessages" :key="index" class="mb-2">
        {{ msg }}
      </div>
    </div>
  </Dialog>

  <!-- 查看路线图弹窗 -->
  <Dialog v-model="viewDialogVisible" title="路线图" width="100%" height="100%" fullscreen>
    <div style="width: 100%; height: 100%">
      <!-- 这里需要引入KML文件解析和地图展示的库 -->
      <!-- 由于没有具体的KML展示库，这里只做简单显示 -->
      <div style="display: flex; justify-content: center; align-items: center; height: 100%">
        <div>路线图文件: {{ currentRoadMap }}</div>
        <div style="margin-top: 20px">KML地图展示区域(需要引入地图库实现)</div>
      </div>
    </div>
    <template #footer>
      <BaseButton @click="viewDialogVisible = false">关闭</BaseButton>
    </template>
  </Dialog>

  <!-- 同步到iCloud弹窗 -->
  <Dialog
    v-model="syncDialogVisible"
    title="同步到iCloud"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div>
      <!-- 进度条 -->
      <div class="mb-4">
        <el-progress
          :percentage="syncProgress"
          :status="syncStatus === 'error' ? 'exception' : syncStatus === 'success' ? 'success' : ''"
        />
      </div>

      <!-- 同步消息 -->
      <div
        style="
          max-height: 400px;
          padding: 10px;
          overflow-y: auto;
          background-color: #fafafa;
          border: 1px solid #ebeef5;
          border-radius: 4px;
        "
      >
        <div v-for="(msg, index) in syncMessages" :key="index" class="mb-2">
          {{ msg }}
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton :disabled="syncStatus === 'syncing'" @click="syncDialogVisible = false">
        关闭
      </BaseButton>
      <BaseButton
        v-if="syncStatus === 'error'"
        type="primary"
        @click="handleSyncToIcloud(syncFlightId)"
      >
        重新同步
      </BaseButton>
    </template>
  </Dialog>
</template>
