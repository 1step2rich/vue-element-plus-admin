<template>
  <el-tooltip :content="fullText" placement="top">
    <template #content>
      {{ fullText }}
    </template>
    <div>{{ shortText }}</div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElTooltip } from 'element-plus'

// 假设这是传入的很长的字符串
const props = defineProps<{
  text: string
  maxLength: number
}>()

const fullText = ref(props.text)
const maxLength = ref(props.maxLength)

// 计算只显示前 10 个字符的文本
const shortText = computed(() => {
  return fullText.value.slice(0, maxLength.value)
})
</script>

<style scoped>
div {
  display: inline-block;
  max-width: fit-content;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
