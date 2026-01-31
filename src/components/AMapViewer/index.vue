<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage, ElButton } from 'element-plus'
import { propTypes } from '@/utils/propTypes'
import AMapLoader from '@amap/amap-jsapi-loader'

// 声明AMap类型
declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

// 定义组件属性
const props = defineProps({
  visible: propTypes.bool.def(false),
  lng: propTypes.number.def(116.397428),
  lat: propTypes.number.def(39.90923)
})

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void
}>()

// 地图实例
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let marker: any = null
let isMapInitialized = false

// 设置AMap安全配置
window._AMapSecurityConfig = {
  securityJsCode: '602ddf93055d3131dc404c0c9ddf00b6'
}

// 监听弹窗可见性变化
watch(
  () => props.visible,
  (newVisible) => {
    console.log('可视化变动', newVisible)
    if (newVisible) {
      setTimeout(() => {
        initMap()
      }, 100)
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('AMapViewer组件已挂载', props.visible)
})

// 监听经纬度变化
watch(
  [() => props.lng, () => props.lat],
  ([newLng, newLat]) => {
    if (isMapInitialized && map && marker) {
      const newPosition = [newLng, newLat]
      marker.setPosition(newPosition)
      map.setCenter(newPosition)
    }
  },
  { deep: true }
)

// 初始化地图
const initMap = async () => {
  try {
    console.log('初始化地图...')
    // 确保地图容器已挂载
    if (!mapContainer.value) {
      console.error('地图容器未找到或未挂载')
      ElMessage.error('地图容器未找到')
      return
    }

    // 检查地图容器的尺寸
    const containerRect = mapContainer.value.getBoundingClientRect()
    console.log('地图容器尺寸:', containerRect)
    if (containerRect.width <= 0 || containerRect.height <= 0) {
      ElMessage.warning('地图容器尺寸异常，可能还未完全渲染')
      // 尝试设置最小尺寸
      mapContainer.value.style.minWidth = '400px'
      mapContainer.value.style.minHeight = '400px'
      // 等待DOM更新后重试
      setTimeout(() => {
        initMap()
      }, 100)
      return
    }

    // 如果地图已初始化，直接使用现有实例
    if (isMapInitialized && map) {
      console.log('地图已初始化，直接使用现有实例')
      // 确保地图容器可见
      mapContainer.value.style.display = 'block'
      mapContainer.value.style.visibility = 'visible'
      mapContainer.value.style.opacity = '1'
      // 强制调整地图大小
      setTimeout(() => {
        if (map) {
          map.resize()
          console.log('地图大小已调整')
        }
      }, 50)
      // 更新标记位置
      if (marker) {
        marker.setPosition([props.lng, props.lat])
        map.setCenter([props.lng, props.lat])
      }
      return
    }

    // 使用AMapLoader加载地图
    if (!window.AMap) {
      await AMapLoader.load({
        key: '747223f511e62e5f6732ac3014f9a9ec',
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType']
      })
    }

    // 初始化地图
    map = new window.AMap.Map(mapContainer.value, {
      resizeEnable: true,
      center: [props.lng, props.lat],
      zoom: 13
    })

    isMapInitialized = true
    console.log('地图初始化成功')

    // 地图初始化后，强制调整大小以确保正确显示
    setTimeout(() => {
      if (map) {
        map.resize()
        console.log('地图大小已调整')
      }
    }, 100)

    // 创建标记
    if (marker) {
      marker.remove()
    }

    marker = new window.AMap.Marker({
      position: [props.lng, props.lat],
      draggable: false,
      map: map
    })

    // 添加控件
    map.addControl(new window.AMap.ToolBar())
    map.addControl(new window.AMap.Scale())
    map.addControl(new window.AMap.MapType())
  } catch (error) {
    console.error('初始化地图失败:', error)
    ElMessage.error('地图加载失败')
    isMapInitialized = false
    map = null
    marker = null
  }
}

// 关闭对话框
const closeDialog = () => {
  emit('close')
}
</script>

<template>
  <div class="map-container">
    <div class="map-wrapper">
      <div ref="mapContainer" class="map">
        <div v-if="!isMapInitialized" class="map-loading">
          <span>地图加载中...{{ visible }}</span>
        </div>
      </div>
    </div>

    <div class="map-actions">
      <el-button @click="closeDialog">关闭</el-button>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
}

.map-wrapper {
  flex: 1;
  min-height: 300px;
  margin-bottom: 10px;
  overflow: hidden;
}

.map {
  position: relative;
  width: 100%;
  height: 450px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 14px;
  color: #606266;
  transform: translate(-50%, -50%);
}

.map-actions {
  display: flex;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px solid #eee;
  justify-content: flex-end;
  gap: 10px;
}
</style>
