<template>
  <div ref="mapContainer" style="width: 100%; height: 100%"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

// 声明AMap类型
declare global {
  interface Window {
    AMap: any
  }
}

const props = defineProps<{
  gpsPoints?: Array<{ lng: number; lat: number }>
}>()

const mapContainer: Ref<HTMLElement | null> = ref(null)
let map: any = null
let polyline: any = null
let markers: any[] = []

const loadAMapScript = () => {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById('amap-script')
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = 'amap-script'
    script.src = 'https://webapi.amap.com/maps?v=2.0&key=4c44d7b6c3a165b57ebc9aae7381f120'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load AMap script'))
  })
}

const initMap = async () => {
  try {
    await loadAMapScript()

    const AMap = window.AMap
    if (AMap && mapContainer.value) {
      // 初始化地图
      map = new AMap.Map(mapContainer.value, {
        zoom: 5,
        center: [113.91025000000001, 35.460669951495305], // 初始化地图中心点
        viewMode: '2D'
      })

      // 如果有GPS点，渲染路线
      if (props.gpsPoints && props.gpsPoints.length > 0) {
        renderRoute(props.gpsPoints)
      }
    }
  } catch (error) {
    console.error('地图初始化失败:', error)
  }
}

const renderRoute = (points: Array<{ lng: number; lat: number }>) => {
  if (!map) return

  const AMap = window.AMap
  if (!AMap) return

  // 清除已有的路线和标记
  if (polyline) {
    map.remove(polyline)
  }

  if (markers.length > 0) {
    map.remove(markers)
    markers = []
  }

  // 转换为高德地图需要的格式
  let path = points.map((point) => [point.lng, point.lat])
  console.log('原始路径长度:', path.length)

  // 创建路线（非闭合）
  polyline = new AMap.Polyline({
    path: path,
    strokeColor: '#36648B',
    strokeWeight: 3,
    strokeOpacity: 0.8,
    strokeStyle: 'solid',
    lineJoin: 'round',
    lineCap: 'round'
  })

  polyline.setMap(map)

  // 添加起点和终点标记
  if (points.length > 0) {
    // 起点
    markers.push(
      new AMap.Marker({
        position: [points[0].lng, points[0].lat],
        map: map,
        title: '起点',
        label: {
          content: '起',
          offset: new AMap.Pixel(-10, -30)
        }
      })
    )

    // 终点
    markers.push(
      new AMap.Marker({
        position: [points[points.length - 1].lng, points[points.length - 1].lat],
        map: map,
        title: '终点',
        label: {
          content: '终',
          offset: new AMap.Pixel(-10, -30)
        }
      })
    )
  }

  // 自适应显示路线
  map.setFitView([polyline, ...markers], { padding: [100, 100, 100, 100] })
}

// 监听GPS点变化
watch(
  () => props.gpsPoints,
  (newPoints) => {
    if (newPoints && newPoints.length > 0) {
      renderRoute(newPoints)
    }
  },
  { deep: true }
)

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})

// 组件卸载时清理
onUnmounted(() => {
  if (map) {
    map.destroy()
  }

  // 移除地图脚本
  const script = document.getElementById('amap-script')
  if (script) {
    document.head.removeChild(script)
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
