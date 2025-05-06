<script setup lang="tsx">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElTag, ElText, ElInput, ElDivider, ElSpace } from 'element-plus'

const { t } = useI18n()
</script>

<template>
  <ContentWrap :title="`UseTable ${t('tableDemo.operate')}`" style="margin-bottom: 20px"
    ><ElSpace wrap>
      <ElText type="primary">名称：xxx60天</ElText> <ElDivider direction="vertical" />
      <ElText type="success">上次金额：34234.43</ElText> <ElDivider direction="vertical" />
      <ElText>本次金额:</ElText><ElInput style="width: 240px"></ElInput>
      <ElDivider direction="vertical" /> <ElText>交易记录：</ElText
      ><ElTag closable class="success">转入1000</ElTag
      ><ElTag closable class="danger">转出1000</ElTag> <ElDivider direction="vertical" />
    </ElSpace>
    <ElDivider />
    <ElSpace wrap>
      <ElText type="primary">名称：xxx60天</ElText> <ElDivider direction="vertical" />
      <ElText type="success">上次金额：34234.43</ElText> <ElDivider direction="vertical" />
      <ElText>本次金额:</ElText><ElInput style="width: 240px"></ElInput>
      <ElDivider direction="vertical" /> <ElText>交易记录：</ElText
      ><ElTag closable class="success">转入1000</ElTag
      ><ElTag closable class="danger">转出1000</ElTag> <ElDivider direction="vertical" /> </ElSpace
  ></ContentWrap>
</template>

<style lang="less" scoped>
.el-button {
  margin-top: 10px;
}
</style>
