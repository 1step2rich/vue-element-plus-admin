<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table, TableColumn } from '@/components/Table'
// import { getTableListApi } from '@/api/table'
import { TableData } from '@/api/table/types'
import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
// import { BaseButton } from '@/components/Button'
import { getStoryListApi } from '@/api/story'
// import { LongTextDiv } from '@/components/LongTextDiv'

// interface Params {
//   pageIndex?: number
//   pageSize?: number
// }

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '50px'
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
    label: t('tableDemo.action'),
    slots: {
      default: (data) => {
        return (
          data.status === 0 && (
            <BaseButton type="primary" onClick={() => actionFn(data)}>
              {t('tableDemo.action')}
            </BaseButton>
          ),

          (
            <BaseButton type="primary" onClick={() => actionFn(data)}>
              {t('tableDemo.action')}
            </BaseButton>
          )
        )
      }
    }
  }
]

const loading = ref(true)

const tableDataList = ref<TableData[]>([])

const getTableList = async () => {
  const res = await getStoryListApi({ count: 50 })
    .catch((e) => {
      console.log('error', e)
    })
    .finally(() => {
      loading.value = false
    })
  if (res) {
    tableDataList.value = res.data.list
  }
}

getTableList()

const actionFn = (data: any) => {
  console.log(data)
}
</script>

<template>
  <ContentWrap :title="t('tableDemo.table')" :message="t('tableDemo.tableDes')">
    <Table :columns="columns" :data="tableDataList" :loading="loading"
      :defaultSort="{ prop: 'display_time', order: 'descending' }" />
  </ContentWrap>
</template>
