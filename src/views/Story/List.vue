<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { Table, TableColumn, TableSlotDefault } from '@/components/Table'
import { ref, unref, reactive } from 'vue'
import { ElMessage, ElMessageBox, ElText, UploadProps, ElSwitch } from 'element-plus'
import {
  addStoryDraftApi,
  getStoryListApi,
  modifyStoryApi,
  spamStoryDetailApi,
  translateStoryApi
} from '@/api/story'
import { useTable } from '@/hooks/web/useTable'
import { BaseButton } from '@/components/Button'
import { FormSchema, Form } from '@/components/Form'
import { Dialog } from '@/components/Dialog'
import { ElRow, ElCol, ElInput, ElDivider, ElImage, ElUpload } from 'element-plus'

const keyword = ref('')
const order_field = ref('id')
const order_type = ref('desc')
const has_content_file = ref<undefined | boolean>(undefined)
const has_content_file_chinese = ref<undefined | boolean>(undefined)
const is_publish = ref<undefined | boolean>(undefined)

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
      has_content_file_chinese: unref(has_content_file_chinese),
      is_publish: unref(is_publish)
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
    field: 'is_publish',
    label: '是否发布',
    width: '100px',
    formatter: (row: Recordable) => {
      return row.is_publish ? '是' : '否'
    }
  },
  {
    field: 'draft_media_id',
    label: '草稿ID',
    width: '100px',
    formatter: (row: Recordable) => {
      return row.draft_media_id ? row.draft_media_id : '无'
    }
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
              type="default"
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

            {!row.is_publish && (
              <BaseButton type="primary" onClick={() => draftAdd(data)}>
                发布为公众号草稿
              </BaseButton>
            )}
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
  },
  {
    field: 'field6',
    label: '是否发布',
    component: 'Select',
    componentProps: {
      options: [
        {
          label: '不限',
          value: ''
        },
        {
          label: '已发布',
          value: true
        },
        {
          label: '未发布',
          value: false
        }
      ],
      on: {
        change: function (value: boolean | '') {
          is_publish.value = value === '' ? undefined : value
        }
      },
      style: { width: '100px' }
    },
    value: is_publish.value,
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
  editData.value.cover_edit = editData.value.cover
  editData.value.is_publish_edit = editData.value.is_publish
  dialogVisible.value = true
  console.log(data)
}

const draftAdd = (data) => {
  ElMessageBox.confirm('确认要添加到公众号草稿吗？')
    .then(() => {
      addStoryDraftApi(data.row.id)
        .then((res) => {
          ElMessage.success('添加成功')
          refresh()
        })
        .catch((err) => {
          console.log(err)
        })
    })
    .catch(() => {
      // catch error
    })
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
    content_file_chinese: editData.value.content_file_chinese_edit ?? undefined,
    cover: editData.value.cover_edit ?? undefined,
    is_publish: editData.value.is_publish_edit ?? undefined
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
const handlerReSpamDetail = () => {
  fullscreenLoading.value = true
  spamStoryDetailApi(editData.value.id)
    .then((res) => {
      editData.value.content_file = res.data.content_file
      fullscreenLoading.value = false
    })
    .catch((err) => {
      console.log(err)
      fullscreenLoading.value = false
    })
}

// 上传

const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  editData.value.cover_edit = response.data
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
        <BaseButton @click="handlerReSpamDetail" v-loading.fullscreen.lock="fullscreenLoading"
          >重新抓取原文</BaseButton
        >
        <ElInput v-model:modelValue="editData.content_file" type="textarea" disabled autosize />
      </ElCol>
    </ElRow>
    <ElDivider />
    <ElRow>
      <ElCol :span="12">
        <ElText>封面</ElText><ElImage :src="editData.cover_edit"></ElImage>
      </ElCol>
      <ElCol :span="1" />
      <ElCol :span="11">
        <ElUpload
          :show-file-list="false"
          accept="image/*"
          :on-success="handleAvatarSuccess"
          action="/common/upload_file?scene=story_cover"
        >
          <BaseButton type="default">选择封面图片</BaseButton>
        </ElUpload>
      </ElCol>
    </ElRow>
    <ElDivider />

    <ElRow>
      <ElCol :span="12">
        <ElText>是否已经发布：{{ editData.is_publish ? '是' : '否' }}</ElText>
      </ElCol>
      <ElCol :span="1" />
      <ElCol :span="11">
        <ElSwitch v-model="editData.is_publish_edit"></ElSwitch>
      </ElCol>
    </ElRow>
    <template #footer>
      <BaseButton type="primary" @click="handlerModify">提交修改</BaseButton>
      <BaseButton @click="dialogVisible = false">取消</BaseButton>
    </template>
  </Dialog>
</template>
