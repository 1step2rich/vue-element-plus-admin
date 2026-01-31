<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElButton, ElInput } from 'element-plus'
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
  lat: propTypes.number.def(39.90923),
  placeName: propTypes.string.def('')
})

// 定义事件
const emit = defineEmits<{
  (e: 'confirm', lng: number, lat: number): void
  (e: 'close'): void
}>()

// 地图实例
const searchKeyword = ref('')
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let marker: any = null
let placeSearch: any = null
let isMapInitialized = false

// 设置AMap安全配置
window._AMapSecurityConfig = {
  securityJsCode: '602ddf93055d3131dc404c0c9ddf00b6'
}

// 监听弹窗可见性变化
watch(
  () => props.visible,
  (newVisible) => {
    console.log('选择器可见性变动', newVisible)
    if (newVisible) {
      searchKeyword.value = props.placeName
      setTimeout(() => {
        initMap()
      }, 100)
    }
  },
  { immediate: true }
)

// 初始化地图
const initMap = async () => {
  try {
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
      return
    }

    // 使用AMapLoader加载地图
    if (!window.AMap) {
      await AMapLoader.load({
        key: '747223f511e62e5f6732ac3014f9a9ec',
        version: '2.0',
        plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.MapType', 'AMap.PlaceSearch']
      })
    }

    // 初始化地图
    map = new window.AMap.Map(mapContainer.value, {
      resizeEnable: true,
      center: [props.lng, props.lat],
      zoom: 13
    })
    // 添加控件
    map.addControl(new window.AMap.ToolBar())
    map.addControl(new window.AMap.Scale())
    map.addControl(new window.AMap.MapType())
    map.on('click', (e: any) => {
      const { lnglat } = e
      setMarkerPosition(lnglat)
    })
    // 添加搜索功能
    window.AMap.plugin(['AMap.PlaceSearch'], function () {
      if (map && window.AMap) {
        try {
          placeSearch = new window.AMap.PlaceSearch({
            map: map
          })
          if (placeSearch) {
            // 搜索结果回调
            try {
              console.log('这里')
              placeSearch.on('selectChanged', function (e: any) {
                try {
                  const selected = e.selected.data.location
                  console.log('选择', selected)
                  if (!selected) {
                    console.log('没有选择东西', e)
                  } else {
                    setMarkerPosition([selected.getLng(), selected.getLat()])
                  }
                } catch (error) {
                  console.error('处理搜索结果失败:', error)
                }
              })
            } catch (error) {
              console.error('添加搜索结果监听器失败:', error)
            }
          }
        } catch (error) {
          console.error('创建搜索对象失败:', error)
        }
      }
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
    if (searchKeyword.value != '' && (props.lng === 0 || props.lat === 0)) {
      handleSearch()
      return
    }
    const lng = props.lng === 0 ? 116.403547 : props.lng
    const lat = props.lat === 0 ? 39.916243 : props.lat
    setMarkerPosition([lng, lat])
  } catch (error) {
    console.error('初始化地图失败:', error)
    ElMessage.error('地图加载失败')
    isMapInitialized = false
    map = null
    marker = null
  }
}

const setMarkerPosition = (lnglat) => {
  if (marker) {
    marker.setPosition(lnglat)
    return
  }
  marker = new window.AMap.Marker({
    position: lnglat,
    draggable: true,
    map: map,
    zIndex: 9999999999
  })

  // 拖动标记结束后更新位置
  marker.on('dragend', (_: any) => {
    // 拖动结束后位置会自动更新，无需额外处理
  })
}

// 搜索位置
const handleSearch = () => {
  if (!searchKeyword.value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  if (placeSearch) {
    try {
      placeSearch.search(searchKeyword.value)
    } catch (error) {
      console.error('搜索失败:', error)
      ElMessage.error('搜索失败，请稍后重试')
    }
  } else {
    ElMessage.warning('搜索功能尚未初始化，请稍后重试')
  }
}

// 确认选择位置
const confirmLocation = () => {
  if (marker) {
    try {
      const position = marker.getPosition()
      if (position) {
        emit('confirm', position.lng, position.lat)
        closeDialog()
      } else {
        ElMessage.warning('请先在地图上选择位置')
      }
    } catch (error) {
      console.error('获取地图位置失败:', error)
      ElMessage.error('获取位置信息失败')
    }
  } else {
    ElMessage.warning('地图尚未初始化，请稍后重试')
  }
}

// 关闭对话框
const closeDialog = () => {
  emit('close')
}
</script>

<template>
  <div class="map-container">
    <div class="search-box">
      <el-input
        v-model="searchKeyword"
        placeholder="请输入位置关键词进行搜索"
        style="width: 70%"
        clearable
      />
      <el-button type="primary" @click="handleSearch" style="margin-left: 10px"> 搜索 </el-button>
    </div>

    <div class="map-wrapper">
      <div ref="mapContainer" class="map">
        <div v-if="!isMapInitialized" class="map-loading">
          <span>地图加载中...</span>
        </div>
      </div>
    </div>

    <div class="map-actions">
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="confirmLocation">确认选择</el-button>
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

.search-box {
  display: flex;
  margin-bottom: 10px;
  align-items: center;
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
