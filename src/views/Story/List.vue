<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive } from 'vue'
import { ElMessageBox, ElText } from 'element-plus'
import { getStoryListApi, modifyStoryApi, translateStoryApi } from '@/api/story'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElDivider } from 'element-plus'

const keyword = ref('')
const order_field = ref('id')
const order_type = ref('desc')
const has_content_file = ref<undefined | boolean>(undefined)
const has_content_file_chinese = ref<undefined | boolean>(undefined)

const { tableRegister, tableMethods, tableState } = useTable({
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState
    const res = await getStoryListApi({
      order_field: unref(order_field),
      order_type: unref(order_type),
      page: unref(currentPage),
      count: unref(pageSize),
      keyword: unref(keyword),
      has_content_file: unref(has_content_file),
      has_content_file_chinese: unref(has_content_file_chinese)
    })
    return {
      list: res.data.list,
      total: res.data.total
    }
  }
})

const { loading, dataList, total, currentPage, pageSize } = tableState
const { refresh } = tableMethods
pageSize.value = 20
const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '70px'
  },
  {
    formatter: (row: Recordable) => {
      return `${row.title_chinese} / ${row.title}`
    },
    label: '标题',
    field: '',
    width: '400px'
  },
  {
    formatter: (row: Recordable) => {
      return `${row.detail_chinese}/${row.detail}`
    },
    label: '开头',
    field: '',
    width: '700px'
  },
  {
    field: 'expand',
    type: 'expand',
    slots: {
      default: (data: TableSlotDefault) => {
        const { row } = data
        return (
          <div class="ml-30px">
            译文：
            <div
              v-html={(row.content_file_chinese
                ? row.content_file_chinese
                : row.detail_chinese
              ).replace(/\n/g, '<br/>')}
            ></div>
            <br />
            原文：
            <div v-html={row.content_file.replace(/\n/g, '<br/>')}></div>
          </div>
        )
      }
    }
  },
  {
    field: 'time',
    label: '原创建时间',
    width: '150px'
  },
  {
    field: 'word_count',
    label: '字数',
    width: '100px'
  },
  {
    field: 'rate',
    label: '评分',
    width: '100px'
  },
  {
    field: 'action',
    label: '打开原文',
    slots: {
      default: (data) => {
        const { row } = data
        return (
          <div>
            <BaseButton
              type="primary"
              onClick={function () {
                window.open(row.link)
                console.log(row.link)
              }}
            >
              原文链接
            </BaseButton>
            <BaseButton type="primary" onClick={() => editAction(data)}>
              查看修改
            </BaseButton>
          </div>
        )
      }
    }
  }
]

const schema = reactive<FormSchema[]>([
  {
    field: 'field1',
    label: '搜索关键字',
    component: 'Input',
    value: keyword,
    componentProps: {
      on: {
        change: function (value: string) {
          keyword.value = value
        }
      },
      style: { width: '200px' }
    },
    colProps: {
      span: 3
    }
  },
  {
    field: 'field2',
    label: '排序字段',
    component: 'Select',
    componentProps: {
      options: [
        {
          label: 'id',
          value: 'id'
        },
        {
          label: '评分',
          value: 'rate'
        },
        {
          label: '字数',
          value: 'word_count'
        }
      ],
      on: {
        change: function (value: string) {
          order_field.value = value
        }
      },
      style: { width: '100px' }
    },
    value: order_field.value ? order_field.value : 'id',
    colProps: {
      span: 3
    }
  },
  {
    field: 'field3',
    label: '升序/降序',
    component: 'Select',
    componentProps: {
      options: [
        {
          label: '升序',
          value: 'asc'
        },
        {
          label: '降序',
          value: 'desc'
        }
      ],
      on: {
        change: function (value: string) {
          order_type.value = value
        }
      },
      style: { width: '100px' }
    },
    value: order_type.value ? order_type.value : 'asc',
    colProps: {
      span: 3
    }
  },
  {
    field: 'field4',
    label: '已爬取原文',
    component: 'Select',
    componentProps: {
      options: [
        {
          label: '不限',
          value: ''
        },
        {
          label: '已爬取',
          value: true
        },
        {
          label: '未爬取',
          value: false
        }
      ],
      on: {
        change: function (value: boolean | '') {
          has_content_file.value = value === '' ? undefined : value
        }
      },
      style: { width: '100px' }
    },
    value: has_content_file.value,
    colProps: {
      span: 3
    }
  },
  {
    field: 'field5',
    label: '已翻译成中文',
    component: 'Select',
    componentProps: {
      options: [
        {
          label: '不限',
          value: ''
        },
        {
          label: '已翻译',
          value: true
        },
        {
          label: '未翻译',
          value: false
        }
      ],
      on: {
        change: function (value: boolean | '') {
          has_content_file_chinese.value = value === '' ? undefined : value
        }
      },
      style: { width: '100px' }
    },
    value: has_content_file_chinese.value,
    colProps: {
      span: 3
    }
  }
])

const dialogVisible = ref(false)
const editData = ref<any>({})

const change = ref(false)
function editAction(data) {
  change.value = false
  editData.value = data.row
  editData.value.content_file_chinese_edit = editData.value.content_file_chinese
  editData.value.title_chinese_edit = editData.value.title_chinese
  editData.value.detail_chinese_edit = editData.value.detail_chinese
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
  modifyStoryApi({
    id: editData.value.id,
    detail_chinese: editData.value.detail_chinese_edit ?? undefined,
    title_chinese: editData.value.title_chinese_edit ?? undefined,
    content_file_chinese: editData.value.content_file_chinese_edit ?? undefined
  })
  dialogVisible.value = false
  refresh()
}

const fullscreenLoading = ref(false)
const handlerTranslate = () => {
  fullscreenLoading.value = true
  translateStoryApi(editData.value.id)
    .then((res) => {
      editData.value.content_file_chinese_edit = res.data.content_file_chinese
      fullscreenLoading.value = false
    })
    .catch((err) => {
      console.log(err)
      fullscreenLoading.value = false
    })
}
</script>

<template>
  <ContentWrap :title="`搜索条件`" style="margin-bottom: 20px">
    <Form :schema="schema" label-width="auto" />
    <BaseButton type="primary" @click="refresh()"> 搜索 </BaseButton>
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

  <Dialog
    v-model="dialogVisible"
    title="故事详情"
    fullscreen
    width="100%"
    :before-close="handleClose"
  >
    <ElRow>
      <ElCol :span="12">
        <ElInput v-model:modelValue="editData.title_chinese_edit" @change="change = true" />
      </ElCol>
      <ElCol :span="1" />
      <ElCol :span="11">
        <ElText>{{ editData.title }}</ElText>
      </ElCol>
    </ElRow>
    <ElDivider />
    <ElRow>
      <ElCol :span="12">
        <ElInput
          v-model:modelValue="editData.detail_chinese_edit"
          type="textarea"
          autosize
          @change="change = true"
        />
      </ElCol>
      <ElCol :span="1" />
      <ElCol :span="11">
        <ElText>{{ editData.detail }}</ElText>
      </ElCol>
    </ElRow>
    <ElDivider />
    <ElRow>
      <ElCol :span="12">
        <BaseButton @click="handlerTranslate" v-loading.fullscreen.lock="fullscreenLoading"
          >翻译</BaseButton
        >
        <ElInput
          v-model:modelValue="editData.content_file_chinese_edit"
          type="textarea"
          autosize
          @change="change = true"
        />
      </ElCol>
      <ElCol :span="1" />
      <ElCol :span="11">
        <ElText>原文字数:{{ editData.word_count }}</ElText>
        <ElInput v-model:modelValue="editData.content_file" type="textarea" disabled autosize />
      </ElCol>
    </ElRow>
    <template #footer>
      <BaseButton type="primary" @click="handlerModify">提交修改</BaseButton>
      <BaseButton @click="dialogVisible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
