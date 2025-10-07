<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn } from '@/components/Table'
import { ref, unref, reactive } from 'vue'
import {
  ElMessageBox,
  ElText,
  ElMessage,
  ElRow,
  ElCol,
  ElInput,
  ElDivider,
  ElSelect,
  ElOption,
  ElLoading
} from 'element-plus'
import { fogFwssList, fogFwssModify, pullFwssForDate } from '@/api/world'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'

// 搜索条件变量
const status = ref('')
// 表格数据加载接口
const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const res = await fogFwssList(unref(status))
    // 计算每条记录与前一条记录的Points差值，从第0条记录开始
    if (res.data && res.data.length > 0) {
      // 第一条记录（索引为0）没有前一条记录，差值设为0
      res.data[0].pointsDiff = 0

      // 从第1条记录开始，计算与前一条记录的差值
      for (let i = 0; i < res.data.length - 1; i++) {
        // 确保points是数字类型
        const currentPoints = parseFloat(res.data[i].points || 0)
        const prevPoints = parseFloat(res.data[i + 1].points || 0)
        res.data[i].pointsDiff = currentPoints - prevPoints
      }
    }
    return {
      list: res.data
    }
  }
})
const { loading, dataList } = tableState
const { refresh } = tableMethods
// 表格列
const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '70px'
  },
  {
    label: '日期',
    field: 'date',
    width: '200px'
  },
  {
    field: 'description',
    label: '备注',
    width: '300px'
  },
  {
    field: 'points',
    label: '点数',
    width: '100px'
  },
  {
    label: '点数差值',
    field: 'pointsDiff',
    width: '120px',
    // 使用slots而不是formatter，确保HTML标签能正常渲染
    slots: {
      default: (data) => {
        const diff = data.row.pointsDiff || 0
        // 根据差值正负返回不同颜色的文本
        if (diff > 0) {
          return <span style={{ color: 'green' }}>+{diff}</span>
        } else if (diff < 0) {
          return <span style={{ color: 'red' }}>{diff}</span>
        } else {
          return <span>{diff.toString()}</span>
        }
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    formatter: (row: Recordable) => {
      return row.status == '0' ? '未删除' : '已删除'
    }
  },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => {
        const { row } = data
        return (
          <div>
            <BaseButton
              type="default"
              onClick={function () {
                window.open(row.file)
                console.log(row.file)
              }}
            >
              下载文件
            </BaseButton>

            <BaseButton type="primary" onClick={() => editAction(data)}>
              修改
            </BaseButton>
          </div>
        )
      }
    }
  }
]

// 筛选条件
const schema = reactive<FormSchema[]>([
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    value: status.value,
    componentProps: {
      options: [
        {
          label: '全部',
          value: 'ALL'
        },
        {
          label: '未删除',
          value: '0'
        },
        {
          label: '已删除',
          value: '1'
        }
      ],
      on: {
        change: function (value: string) {
          status.value = value
        }
      },
      style: { width: '200px' }
    },
    colProps: {
      span: 3
    }
  }
])

// 修改处理流程-----Start
const dialogVisible = ref(false)
const editData = ref<any>({})
const fullscreenLoading = ref(false)
const change = ref(false)
function editAction(data) {
  change.value = false
  editData.value = data.row
  editData.value.status_edit = editData.value.status
  editData.value.description_edit = editData.value.description
  dialogVisible.value = true
  console.log(data)
}
const handleClose = (done: () => void) => {
  if (change.value == false) {
    done()
    return
  }
  ElMessageBox.confirm('确认要关闭吗？修改将丢失！')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}
const handlerModify = () => {
  fullscreenLoading.value = true
  fogFwssModify(
    editData.value.id,
    editData.value.description_edit ?? '',
    editData.value.status_edit ?? 0
  ).then(() => {
    fullscreenLoading.value = false
    dialogVisible.value = false
    refresh()
  })
}
// 修改处理流程-----End

// iCloud 授权相关状态-----Start
const showICloudAuth = ref(false) // 显示授权的弹窗
const authStatus = ref(-1) // -1: 未开始, 0: 输入密码, 1: 输入code, 2: 成功
const authInput = ref('') // 输入框架值
const authMessage = ref('') // 输入框提示词
const eventSource = ref<EventSource | null>(null)
const submitButtonLoading = ref(false) // 单独控制提交按钮的loading状态
const isSubmitting = ref(false) // 控制提交后显示处理中的状态，隐藏输入框和按钮
// 刷新iCloud授权
const genICloudSession = () => {
  // 不显示全屏loading，只显示模态框
  showICloudAuth.value = true
  authStatus.value = -1
  authInput.value = ''
  authMessage.value = ''
  // 关闭之前可能存在的EventSource
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
  // 建立SSE连接
  const baseUrl = import.meta.env.VITE_API_BASE_PATH || ''
  eventSource.value = new EventSource(`${baseUrl}/common/gen_icloud_session`)
  eventSource.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('Received SSE message:', data)

    if (data.status !== undefined) {
      authStatus.value = data.status
      if (data.message) {
        authMessage.value = data.message
      }

      if (data.status === 0) {
        // 需要输入密码
        authMessage.value = '请输入iCloud密码'
      } else if (data.status === 1) {
        // 需要输入验证码
        authMessage.value = '请输入验证码'
        isSubmitting.value = false // 重置提交状态，显示输入框
      } else if (data.status === 2) {
        // 授权成功
        showICloudAuth.value = false
        submitButtonLoading.value = false
        isSubmitting.value = false
        ElMessage.success('iCloud授权刷新成功')
        if (eventSource.value) {
          eventSource.value.close()
          eventSource.value = null
        }
      }
    }
  }

  eventSource.value.onerror = (error) => {
    console.error('SSE连接错误:', error)
    showICloudAuth.value = false
    submitButtonLoading.value = false
    isSubmitting.value = false
    ElMessage.error('iCloud授权连接失败1')
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
  }
}
// 提交iCloud授权信息
const submitICloudAuth = async () => {
  if (!authInput.value.trim()) {
    ElMessage.warning(authStatus.value === 0 ? '请输入密码' : '请输入验证码')
    return
  }

  try {
    submitButtonLoading.value = true // 使用专用的按钮loading状态
    const baseUrl = import.meta.env.VITE_API_BASE_PATH || ''
    const response = await fetch(
      `${baseUrl}/common/gen_icloud_session_complete?data=${encodeURIComponent(authInput.value.trim())}`
    )

    const data = await response.json()
    if (data.error_code === 0) {
      // 提交成功，保持弹窗显示但隐藏输入框和按钮，显示处理中的状态
      isSubmitting.value = true
      authInput.value = ''
      authMessage.value = '授权信息已提交，正在处理中...'
    } else {
      ElMessage.error(data.error_message || '提交失败')
    }
  } catch (error) {
    console.error('提交授权信息失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitButtonLoading.value = false // 确保按钮loading状态被重置
  }
}
// 取消iCloud授权
const cancelICloudAuth = () => {
  showICloudAuth.value = false
  submitButtonLoading.value = false
  isSubmitting.value = false // 重置提交状态
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}
// iCloud 授权相关状态-----End

// 拉取指定日期文件的弹窗状态 ----Start
const selectedDate = ref('')

// 实现拉取指定日期文件的功能
const pullFwssFile = () => {
  ElMessageBox.prompt('请输入日期 (格式: YYYYMMDD)', '拉取指定日期文件', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPattern: /^\d{4}\d{2}\d{2}$/,
    inputErrorMessage: '日期格式不正确，请使用YYYYMMDD格式'
  })
    .then(({ value }) => {
      selectedDate.value = value
      const loading = ElLoading.service({ fullscreen: true, lock: true }) // 创建全屏loading

      // 调用pullFwssForDate接口
      pullFwssForDate(selectedDate.value)
        .then(() => {
          ElMessage.success('拉取文件成功')
        })
        .catch((error) => {
          ElMessage.error(`拉取文件失败：${error?.message || '未知错误'}`)
        })
        .finally(() => {
          loading.close() // 关闭全屏loading
          refresh() // 刷新表格
        })
    })
    .catch(() => {
      // 用户取消输入
    })
}
// 拉取指定日期文件的弹窗状态 ---End
</script>

<template>
  <ContentWrap :title="`搜索条件`" style="margin-bottom: 20px">
    <Form :schema="schema" label-width="auto" />
    <BaseButton type="primary" @click="refresh()"> 搜索 </BaseButton>
    <BaseButton type="primary" @click="genICloudSession()"> 刷新iCloud授权 </BaseButton>
    <BaseButton type="primary" @click="pullFwssFile()"> 拉取指定日期的文件 </BaseButton>
    <Table
      showAction
      :columns="columns"
      row-key="id"
      :data="dataList"
      :loading="loading"
      @register="tableRegister"
      @refresh="refresh"
    />
  </ContentWrap>

  <Dialog v-model="dialogVisible" title="修改" :before-close="handleClose">
    <ElRow>
      <ElCol :span="24">
        <span>ID:{{ editData.id }}, Date:{{ editData.date }}</span>
      </ElCol>
    </ElRow>
    <ElDivider />
    <ElRow>
      <ElCol :span="24">
        <ElText>状态：0表示正常，1表示删除</ElText>
        <ElSelect v-model:model-value="editData.status_edit" @change="change = true">
          <ElOption label="未删除" :value="0" />
          <ElOption label="已删除" :value="1" />
        </ElSelect>
      </ElCol>
    </ElRow>
    <ElRow>
      <ElCol :span="24">
        <ElText>描述/备注</ElText>
        <ElInput v-model:modelValue="editData.description_edit" @change="change = true" />
      </ElCol>
    </ElRow>

    <template #footer>
      <BaseButton
        type="primary"
        @click="handlerModify"
        v-loading.fullscreen.lock="fullscreenLoading"
        >提交修改</BaseButton
      >
      <BaseButton @click="dialogVisible = false">取消</BaseButton>
    </template>
  </Dialog>

  <!-- iCloud授权输入框 -->
  <div v-if="showICloudAuth" class="icloud-auth-modal">
    <div class="icloud-auth-overlay"></div>
    <div class="icloud-auth-container">
      <h3>iCloud授权</h3>
      <div v-if="authStatus >= 0" class="auth-content">
        <p>{{ authMessage }}</p>

        <!-- 根据提交状态和授权状态条件显示输入框和按钮或处理提示 -->
        <div v-if="!isSubmitting">
          <ElInput
            v-model:modelValue="authInput"
            placeholder="请输入"
            :type="authStatus === 0 ? 'password' : 'text'"
            style="margin: 16px 0"
            @keyup.enter="submitICloudAuth"
          />
          <div class="auth-actions">
            <BaseButton type="primary" @click="submitICloudAuth" :loading="submitButtonLoading">
              提交
            </BaseButton>
            <BaseButton @click="cancelICloudAuth" style="margin-left: 12px"> 取消 </BaseButton>
          </div>
        </div>

        <!-- 提交后显示处理中的提示 -->
        <div v-else style="margin-top: 16px">
          <span>正在处理，请稍候...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icloud-auth-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icloud-auth-overlay {
  position: absolute;
  inset: 0;
  z-index: -100;
  background-color: rgb(0 0 0 / 50%);
}

.icloud-auth-container {
  width: 400px;
  padding: 24px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}

.auth-content {
  margin-top: 16px;
}

.auth-actions {
  margin-top: 16px;
}
</style>
