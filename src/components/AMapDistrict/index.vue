<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  cityName: propTypes.string.def(''),
  visible: propTypes.bool.def(false),
  // 新增：接收已有的边界数据用于展示
  existingBounds: propTypes.string.def('')
})

// 定义事件
const emit = defineEmits<{
  (e: 'confirm', bounds: string): void
  (e: 'close'): void
}>()

// 地图实例
const searchInput = ref('朝阳区')
const levelSelect = ref('district') // 添加行政级别选择变量
const boundsData = ref('')
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let isMapInitialized = false
let districtSearch: any = null
let polygon: any = null

// 设置AMap安全配置
window._AMapSecurityConfig = {
  securityJsCode: '195bfb7983cf42035fc117aa3d23a1d8'
}

// 监听城市名称变化，自动填充搜索框
watch(
  () => props.cityName,
  (newName) => {
    console.log('城市名称变化:', newName)
    if (!boundsData.value) {
      searchInput.value = newName || '朝阳区'
    }
  },
  { immediate: true } // 立即执行监听回调
)

// 添加对visible属性的监听，确保弹窗显示时地图能初始化
watch(
  () => props.visible,
  (newVisible) => {
    console.log('弹窗可见性变化:', newVisible)
    if (newVisible) {
      setTimeout(() => {
        initMap()
        // 如果有传入边界数据，绘制边界
        if (props.existingBounds) {
          setTimeout(() => {
            drawExistingBounds()
          }, 100)
        }
      }, 100)
    }
  }
)

// 监听已有的边界数据变化
watch(
  () => props.existingBounds,
  (newBounds) => {
    console.log('边界数据变化:', newBounds)
    if (newBounds && props.visible && isMapInitialized) {
      drawExistingBounds()
    }
  },
  { immediate: true }
)

// 绘制已有的边界数据
const drawExistingBounds = () => {
  if (!map || !props.existingBounds) {
    return
  }

  try {
    // 清除已有多边形
    if (polygon) {
      map.remove(polygon)
      polygon = null
    }

    // 解析边界数据
    const bounds = JSON.parse(props.existingBounds)
    if (!Array.isArray(bounds) || bounds.length === 0) {
      ElMessage.warning('边界数据格式不正确')
      return
    }

    console.log('开始绘制已有的边界数据:', bounds)
    // 生成行政区划polygon
    polygon = new window.AMap.Polygon({
      strokeWeight: 1,
      path: bounds,
      fillOpacity: 0.4,
      fillColor: '#80d8ff',
      strokeColor: '#0091ea'
    })

    map.add(polygon)
    map.setFitView(polygon) // 视口自适应
    ElMessage.success('边界数据绘制成功')
  } catch (error) {
    console.error('绘制边界失败:', error)
    ElMessage.error('解析边界数据失败')
  }
}

// 组件挂载时检查是否需要初始化地图
onMounted(() => {
  console.log('AMapDistrict组件已挂载', props.visible)
  setTimeout(() => {
    console.log('地图容器:', document.querySelector('.map-container .map'))
    if (props.visible) {
      initMap()
    }
  }, 100)
})

// 初始化地图
const initMap = async () => {
  try {
    // 确保地图容器已挂载
    if (!mapContainer.value) {
      console.error('地图容器未找到或未挂载')
      console.log('mapContainer:', mapContainer.value)
      // 尝试重新获取地图容器
      mapContainer.value = document.querySelector('.map-container .map') as HTMLElement
      if (!mapContainer.value) {
        ElMessage.error('地图容器未找到')
        return
      }
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

    // 如果地图已初始化，直接返回
    if (isMapInitialized && map) {
      console.log('地图已初始化，直接使用现有实例')
      // 强制调整地图大小
      map.resize()
      return
    }

    console.log('使用AMapLoader加载高德地图...')
    // 使用AMapLoader加载地图
    await AMapLoader.load({
      key: '4c44d7b6c3a165b57ebc9aae7381f120', // 您的高德地图API密钥
      version: '2.0', // 指定要加载的高德地图JSAPI的版本，目前支持2.0
      plugins: ['AMap.DistrictSearch', 'AMap.Polygon'] // 加载行政区划查询和多边形绘制插件
    })

    if (!window.AMap) {
      console.error('高德地图对象未找到')
      ElMessage.error('高德地图加载失败')
      return
    }

    console.log('开始初始化地图...')
    // 初始化地图
    map = new window.AMap.Map(mapContainer.value, {
      resizeEnable: true,
      center: [116.397428, 39.90923],
      zoom: 10
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

    // 初始化后默认查询一次
    drawBounds()
  } catch (error) {
    console.error('地图初始化失败:', error)
    ElMessage.error('地图初始化失败')
    isMapInitialized = false
  }
}

// 绘制行政区边界
const drawBounds = () => {
  if (!map) {
    ElMessage.error('地图未初始化')
    return
  }

  const keyword = searchInput.value
  if (keyword === '') {
    ElMessage.warning('名称不能为空')
    return
  }

  // 加载行政区划插件
  if (!districtSearch) {
    // 实例化DistrictSearch
    const opts = {
      subdistrict: 0, // 获取边界不需要返回下级行政区
      extensions: 'all', // 返回行政区边界坐标组等具体信息
      level: levelSelect.value // 设置行政级别
    }
    districtSearch = new window.AMap.DistrictSearch(opts)
  }

  // 行政区查询
  districtSearch.search(keyword, function (status, result) {
    if (polygon) {
      map.remove(polygon) // 清除上次结果
      polygon = null
    }

    if (status !== 'complete' || !result || !result.districtList || !result.districtList[0]) {
      ElMessage.warning('请正确填写名称或更新其他名称')
      return
    }

    const districtList = result.districtList[0]
    const bounds = districtList.boundaries

    if (bounds && bounds.length > 0) {
      // 生成行政区划polygon
      for (let i = 0; i < bounds.length; i += 1) {
        bounds[i] = [bounds[i]]
      }
      boundsData.value = JSON.stringify(bounds)

      polygon = new window.AMap.Polygon({
        strokeWeight: 1,
        path: bounds,
        fillOpacity: 0.4,
        fillColor: '#80d8ff',
        strokeColor: '#0091ea'
      })

      map.add(polygon)
      map.setFitView(polygon) // 视口自适应
      ElMessage.success('行政区边界查询成功')
    } else {
      ElMessage.warning('未查询到该行政区的边界数据')
    }
  })
}

// 搜索城市边界
const searchCityBounds = () => {
  drawBounds()
}

// 确认选择边界
const confirmBounds = () => {
  if (!boundsData.value) {
    ElMessage.warning('请先搜索城市边界数据')
    return
  }

  emit('confirm', boundsData.value)
  closeDialog()
}

// 关闭对话框
const closeDialog = () => {
  emit('close')
}
</script>

<template>
  <div class="map-container">
    <div class="search-box" v-if="boundsData === undefined">
      <div class="search-item">
        <span class="label">城市名称</span>
        <el-input
          v-model="searchInput"
          placeholder="请输入城市名称"
          @keyup.enter="searchCityBounds"
          clearable
          style="width: 200px; margin-right: 10px"
        >
          <template #append>
            <el-button type="primary" @click="searchCityBounds">查询</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="map-wrapper">
      <div ref="mapContainer" class="map">
        <div v-if="!isMapInitialized" class="map-loading">
          <span>地图加载中...</span>
        </div>
      </div>
    </div>

    <!-- 组件内部的操作按钮 -->
    <div class="map-actions">
      <el-button @click="closeDialog">取 消</el-button>
      <el-button type="primary" @click="confirmBounds">确 定</el-button>
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
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  margin-bottom: 10px;
}

.search-item .label {
  margin-right: 8px;
  font-size: 14px;
  color: #606266;
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
  height: 400px; /* 设置固定高度 */
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

.bounds-wrapper {
  max-height: 150px;
  margin-bottom: 10px;
  overflow-y: auto;
}

.bounds-wrapper h4 {
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: bold;
}

.bounds-content {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
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
