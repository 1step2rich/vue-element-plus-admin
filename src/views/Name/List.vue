<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table, TableColumn } from '@/components/Table'
import { getTableListApi } from '@/api/table'
import { TableData } from '@/api/table/types'
import { ref, h } from 'vue'
import { ElTag } from 'element-plus'
import { BaseButton } from '@/components/Button'
import { getNameListApi } from '@/api/name'
import { LongTextDiv } from '@/components/LongTextDiv'

interface Params {
  pageIndex?: number
  pageSize?: number
}

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    label: 'ID',
    field: 'id',
    width: '50px'
  },
  {
    formatter: (row: Recordable) => {
      return `${row.surname} ${row.given_name}`
    },
    label: '姓名',
    field: '',
    width: '100px'
  },
  {
    label: '出处',
    field: 'source'
  },
  {
    formatter: (row: Recordable) => {
      return `${row.rhythm_monotony_score}/${row.rhythm_monotony_evaluation}`
    },
    label: '韵律音调评分评价',
    field: 'rhythm_monotony_evaluation'
  },

  {
    formatter: (row: Recordable) => {
      return `${row.glyph_structure_score}/${row.glyph_structure_evaluation}`
    },
    label: '字形结构评分评价',
    field: 'rhythm_monotony_evaluation'
  },

  {
    formatter: (row: Recordable) => {
      return `${row.meaning_score}/${row.meaning_evaluation}`
    },
    label: '寓意评分评价',
    field: 'meaning_evaluation'
  },
  {
    formatter: (row: Recordable) => {
      return `${row.score}/${row.fixed_score}/${row.overall_evaluation}`
    },
    label: '总分/修正/总评',
    field: 'source'
  },
  {
    field: 'create_time',
    label: '创建时间',
    sortable: true
  },
  {
    field: 'importance',
    label: t('tableDemo.importance'),
    formatter: (_: Recordable, __: TableColumn, cellValue: number) => {
      return h(
        ElTag,
        {
          type: cellValue === 1 ? 'success' : cellValue === 2 ? 'warning' : 'danger'
        },
        () =>
          cellValue === 1
            ? t('tableDemo.important')
            : cellValue === 2
              ? t('tableDemo.good')
              : t('tableDemo.commonly')
      )
    }
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
          )
        )
      }
    }
  }
]

const loading = ref(true)

const tableDataList = ref<TableData[]>([])

const getTableList = async () => {
  const res = await getNameListApi()
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
    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :defaultSort="{ prop: 'display_time', order: 'descending' }"
    />
  </ContentWrap>
</template>
