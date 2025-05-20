<template>
  <div>
    <a-page-header title="可配置关卡编辑器" />
    <div style="max-width: 1200px; margin: 0 24px; padding: 20px;">
      <!-- 基础设置 -->
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="胜利条件">
              <a-select v-model:value="winType" @change="onWinTypeChange">
                <a-select-option value="1">积分通关</a-select-option>
                <a-select-option value="2">收集通关</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="最大障碍物">
              <a-input-number v-model:value="maxObstacles" :min="0" :max="50" @change="scheduleRender" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 钻石配置（仅收集通关模式） -->
        <a-row v-if="isCollectMode()" :gutter="16">
          <a-col :span="12">
            <a-form-item label="钻石生成数量">
              <a-input-number v-model:value="diamondTarget" :min="1" @change="scheduleRender" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="钻石颜色配置">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div v-for="(color, index) in diamondTypeInputs" :key="index">
                  颜色{{ index + 1 }}
                  <a-input-number 
                    v-model:value="diamondTypeInputs[index]" 
                    :min="11" 
                    :max="17" 
                    @change="updateDiamondTypes"
                  />
                </div>
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="横向块数">
              <a-select v-model:value="blockType" @change="initGrid">
                <a-select-option value="12">12</a-select-option>
                <a-select-option value="18">18</a-select-option>
                <a-select-option value="24">24</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="纵向层数">
              <a-select v-model:value="levelHeight" @change="initGrid">
                <a-select-option value="8">8</a-select-option>
                <a-select-option value="12">12</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- 颜色图例 -->
      <div class="color-legend">
        <span><div class="color-box" style="background:#4CAF50"></div>11=绿</span>
        <span><div class="color-box" style="background:#00BCD4"></div>12=蓝光</span>
        <span><div class="color-box" style="background:#2196F3"></div>13=蓝</span>
        <span><div class="color-box" style="background:#dbdbdb"></div>14=白</span>
        <span><div class="color-box" style="background:#9C27B0"></div>15=紫</span>
        <span><div class="color-box" style="background:#FFEB3B"></div>16=黄</span>
        <span><div class="color-box" style="background:#F44336"></div>17=红</span>
      </div>

      <!-- 网格编辑器 -->
      <a-card 
        title="关卡编辑器" 
        style="margin-top: 16px;"
        :bordered="false"
      >
        <template #extra>
          <a-space>
            <a-button type="primary" @click="initGrid">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
            <a-button type="primary" @click="optimizedFill">
              <template #icon><ThunderboltOutlined /></template>
              智能填充
            </a-button>
          </a-space>
        </template>

        <!-- 网格显示区域 -->
        <div class="grid-container" :style="gridStyle">
          <template v-for="(row, y) in currentGrid" :key="`row-${y}`">
            <template v-for="(cell, x) in row" :key="`cell-${y}-${x}`">
              <div 
                class="grid-cell" 
                :class="`cell-${cell}`"
                @click="() => handleCellClick(x, y)"
              >
                {{ cell }}
                <div class="coord">{{ x }},{{ y }}</div>
              </div>
            </template>
          </template>
        </div>

        <!-- 计数器区域 -->
        <div v-if="isCollectMode()" :class="['counter', getDiamondCountClass()]" style="margin-top: 10px;">
          钻石：{{ countDiamonds() }}/{{ diamondTarget }}
          <span v-if="countDiamonds() !== diamondTarget" class="diamond-warning">
            ⚠️ 钻石数量不符合要求
          </span>
        </div>

        <div :class="['counter', getObstacleCountClass()]" style="margin-top: 10px;">
          障碍物：{{ countObstacles() }}/{{ maxObstacles }}
        </div>

        <div 
          v-if="gridErrors.length > 0" 
          class="counter over" 
          style="background:#FFF3E0; color:#EF6C00; border: 1px solid #FFB74D; padding: 10px; margin-top: 10px;"
        >
          <div>⚠️ 配置错误：</div>
          <div v-for="(error, index) in gridErrors" :key="index">{{ error }}</div>
        </div>
      </a-card>

      <!-- 操作按钮 -->
      <div style="margin-top: 16px;">
        <a-space>
          <a-button type="primary" @click="generateExcelConfig">
            <template #icon><SaveOutlined /></template>
            生成配置
          </a-button>
          <a-button @click="copyConfig">
            <template #icon><CopyOutlined /></template>
            复制数据
          </a-button>
        </a-space>
      </div>

      <!-- 配置输出 -->
      <div v-html="excelOutput" style="margin-top: 20px;"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { useRoute } from 'vue-router';
import { 
  ReloadOutlined, 
  ThunderboltOutlined, 
  SaveOutlined,
  CopyOutlined
} from '@ant-design/icons-vue';

// 路由参数处理
const route = useRoute();

// 配置参数
const winType = ref('1');
const blockType = ref('12');
const levelHeight = ref('8');
const maxObstacles = ref(0);
const diamondTarget = ref(5);
const diamondTypeInputs = ref([11, 12, 13]);
const DIAMOND_TYPES = ref([11, 12, 13]);
const currentGrid = ref<number[][]>([]);
const currentObstacles = ref(0);
const gridErrors = ref<string[]>([]);
const excelOutput = ref('');

// 计算网格样式
const gridStyle = computed(() => {
  return { 
    gridTemplateColumns: `repeat(${parseInt(blockType.value)}, 30px)` 
  };
});

// 初始化
onMounted(() => {
  initFromRouteParams();
  initGrid();
  checkGridErrors();
});

// 从URL参数初始化
function initFromRouteParams() {
  const query = route.query;
  
  if (query.blockType) {
    blockType.value = query.blockType as string;
  }
  
  if (query.levelHeight) {
    levelHeight.value = query.levelHeight as string;
  }
  
  if (query.winType) {
    winType.value = query.winType as string;
    
    if (query.winType === '2' && query.color1 && query.color2 && query.color3) {
      diamondTypeInputs.value = [
        clampValue(parseInt(query.color1 as string), 11, 17, 11),
        clampValue(parseInt(query.color2 as string), 11, 17, 12),
        clampValue(parseInt(query.color3 as string), 11, 17, 13)
      ];
      updateDiamondTypes();
    }
  }
}

// 网格初始化
function initGrid() {
  const width = parseInt(blockType.value);
  const height = parseInt(levelHeight.value);
  
  currentGrid.value = Array.from({ length: height }, () => 
    Array(width).fill(0)
  );
  
  currentObstacles.value = 0;
  updateDiamondTypes();
  checkGridErrors();
}

// 辅助函数：值范围限制
function clampValue(value: number, min: number, max: number, defaultValue: number): number {
  if (isNaN(value)) return defaultValue;
  return Math.max(min, Math.min(max, value));
}

// 更新钻石类型
function updateDiamondTypes() {
  DIAMOND_TYPES.value = diamondTypeInputs.value
    .filter(v => v >= 11 && v <= 17)
    .slice(0, 3);
}

// 胜利条件变更
function onWinTypeChange() {
  if (winType.value === '2') {
    diamondTarget.value = 5;
  }
  scheduleRender();
}

// 智能填充
function optimizedFill() {
  updateDiamondTypes();
  
  const width = parseInt(blockType.value);
  const height = parseInt(levelHeight.value);
  const newGrid: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  // 生成基础方块
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      newGrid[y][x] = Math.random() < 0.6 && canPlaceBlock(x, y, newGrid) ? 1 : 0;
    }
  }

  // 放置障碍物
  let obstaclesAdded = 0;
  const obstacleCandidates: {x: number, y: number}[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (newGrid[y][x] === 1 && hasAdjacentBlocks(x, y, newGrid)) {
        obstacleCandidates.push({x, y});
      }
    }
  }
  
  while (obstaclesAdded < maxObstacles.value && obstacleCandidates.length > 0) {
    const index = Math.floor(Math.random() * obstacleCandidates.length);
    const {x, y} = obstacleCandidates.splice(index, 1)[0];
    newGrid[y][x] = 2;
    obstaclesAdded++;
  }

  // 放置钻石
  if (isCollectMode()) {
    let diamondsPlaced = 0;
    const safeSpots: {x: number, y: number}[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (newGrid[y][x] === 0 && isDiamondSafe(x, y, newGrid)) {
          safeSpots.push({x, y});
        }
      }
    }
    
    for (let i = safeSpots.length - 1; i >= 0 && diamondsPlaced < diamondTarget.value; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [safeSpots[i], safeSpots[j]] = [safeSpots[j], safeSpots[i]];
      const {x, y} = safeSpots[i];
      
      const randomDiamondType = DIAMOND_TYPES.value[Math.floor(Math.random() * DIAMOND_TYPES.value.length)];
      newGrid[y][x] = randomDiamondType;
      diamondsPlaced++;
    }
  }

  currentGrid.value = newGrid;
  currentObstacles.value = obstaclesAdded;
  checkGridErrors();
}

// 辅助函数：检查是否可以放置方块
function canPlaceBlock(x: number, y: number, grid: number[][]) {
  return !(
    (x >= 2 && grid[y][x-1] === 1 && grid[y][x-2] === 1) ||
    (y >= 2 && grid[y-1][x] === 1 && grid[y-2][x] === 1)
  );
}

// 辅助函数：检查是否有相邻方块
function hasAdjacentBlocks(x: number, y: number, grid: number[][]) {
  const directions = [[-1,0], [1,0], [0,-1], [0,1]];
  return directions.some(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    return nx >= 0 && nx < grid[0].length &&
           ny >= 0 && ny < grid.length &&
           grid[ny][nx] === 1;
  });
}

// 辅助函数：检查钻石位置是否安全
function isDiamondSafe(x: number, y: number, grid: number[][]) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < grid[0].length && 
          ny >= 0 && ny < grid.length &&
          grid[ny][nx] === 1) {
        return false;
      }
    }
  }
  return true;
}

// 单元格点击处理
function handleCellClick(x: number, y: number) {
  const prevValue = currentGrid.value[y][x];
  const types = isCollectMode() 
    ? [0, 1, 2, ...DIAMOND_TYPES.value] 
    : [0, 1, 2];
  
  const idx = types.indexOf(prevValue);
  const newValue = types[(idx !== -1 ? idx : 0 + 1) % types.length];
  
  // 更新障碍物计数
  if (prevValue === 2) currentObstacles.value--;
  if (newValue === 2) currentObstacles.value++;
  
  currentGrid.value[y][x] = newValue;
  checkGridErrors();
}

// 检查网格错误
function checkGridErrors() {
  const errors: string[] = [];
  
  // 检查行
  currentGrid.value.forEach((row, y) => {
    if (row.length > 0 && row.every(cell => cell >= 1)) {
      errors.push(`第${y+1}行不能全部是方块,会自动消除`);
    }
  });

  // 检查列
  const colCount = currentGrid.value[0]?.length || 0;
  for (let x = 0; x < colCount; x++) {
    if (currentGrid.value.length > 0 && currentGrid.value.every(row => row[x] >= 1)) {
      errors.push(`第${x+1}列不能全部是方块,会自动消除`);
    }
  }

  gridErrors.value = errors;
}

// 是否为收集模式
function isCollectMode() {
  return winType.value === '2';
}

// 钻石计数
function countDiamonds() {
  if (!isCollectMode()) return 0;
  
  return currentGrid.value.flat().filter(cell => 
    DIAMOND_TYPES.value.includes(cell)
  ).length;
}

// 障碍物计数
function countObstacles() {
  return currentGrid.value.flat().filter(cell => cell === 2).length;
}

// 获取钻石计数样式
function getDiamondCountClass() {
  if (!isCollectMode()) return '';
  return countDiamonds() === diamondTarget.value ? 'ok' : 'over';
}

// 获取障碍物计数样式
function getObstacleCountClass() {
  return countObstacles() <= maxObstacles.value ? 'ok' : 'over';
}

// 渲染防抖
let renderDebounce: number | null = null;
function scheduleRender() {
  if (renderDebounce) {
    clearTimeout(renderDebounce);
  }
  renderDebounce = window.setTimeout(() => {
    checkGridErrors();
    renderDebounce = null;
  }, 100);
}

// 生成Excel配置
function generateExcelConfig() {
  const width = parseInt(blockType.value);
  const layers = currentGrid.value.map(layer => 
    [...layer, ...Array(24 - width).fill(0)]
  );
  
  const tableHTML = `
  <table class="config-table">
    <tr>${['配置', ...Array.from({length:24}, (_,i)=>i+1)].map(h => `<th>${h}</th>`).join('')}</tr>
    ${layers.map((layer, i) => `
      <tr>
        <td>${i+1}</td>
        ${layer.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `).join('')}
  </table>`;
  
  excelOutput.value = tableHTML;
}

// 复制配置
function copyConfig() {
  const width = parseInt(blockType.value);
  
  // 生成Excel兼容数据
  const excelData = currentGrid.value.map((layer, index) => {
    const validData = Array.from(layer).slice(0, width);
    const padding = Array(24 - width).fill(0);
    return [index + 1, ...validData, ...padding];
  });
  
  // 转换为制表符分隔文本
  const tsvContent = excelData.map(row => 
    row.join('\t')
  ).join('\n');

  // 复制到剪贴板
  const textarea = document.createElement('textarea');
  textarea.value = tsvContent;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  
  try {
    textarea.select();
    if (document.execCommand('copy')) {
      message.success('数据已复制！可直接粘贴到Excel');
    } else {
      handleManualCopy(textarea);
    }
  } catch (err) {
    handleManualCopy(textarea);
  } finally {
    document.body.removeChild(textarea);
  }
}

// 手动复制处理
function handleManualCopy(element: HTMLTextAreaElement) {
  element.style.opacity = '1';
  element.style.position = 'fixed';
  element.style.top = '50%';
  element.style.left = '50%';
  element.style.transform = 'translate(-50%, -50%)';
  element.style.zIndex = '9999';
  element.style.background = 'white';
  element.style.padding = '20px';
  element.style.border = '2px solid #2F27CE';
  
  message.warning('请按Ctrl+C复制内容，然后关闭此消息', 10);
  element.select();
}
</script>

<style scoped>
.color-legend {
  padding: 10px;
  background: #f5f5f5;
  margin: 10px 0;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.color-box {
  width: 12px;
  height: 12px;
  display: inline-block;
  margin-right: 5px;
  border-radius: 2px;
}

.grid-container {
  display: grid;
  gap: 2px;
  background: #333;
  padding: 5px;
  width: fit-content;
  border-radius: 4px;
}

.grid-cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.coord {
  position: absolute;
  font-size: 6px;
  bottom: 1px;
  right: 1px;
  color: #666;
}

.cell-0 { background: white; color: #333; }
.cell-1 { background: #dad9d9; color: #333; }
.cell-2 { background: #616161; color: white; }
.cell-11 { background: #4CAF50; color: white; }
.cell-12 { background: #00BCD4; color: white; }
.cell-13 { background: #2196F3; color: white; }
.cell-14 { background: #dbdbdb; color: #333;}
.cell-15 { background: #9C27B0; color: white; }
.cell-16 { background: #FFEB3B; color: #333; }
.cell-17 { background: #F44336; color: white; }

.counter {
  margin: 10px 0;
  padding: 8px;
  border-radius: 4px;
}

.counter.ok {
  background: #E8F5E9;
  color: #2E7D32;
}

.counter.over {
  background: #FFEBEE;
  color: #C62828;
}

.diamond-warning::before {
  content: "⚠️ ";
  margin-right: 4px;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 14px;
}

.config-table th, .config-table td {
  border: 1px solid #ddd;
  padding: 8px;
  min-width: 40px;
  text-align: center;
}

.config-table th {
  background-color: #2F27CE;
  color: white;
}

.config-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style> 