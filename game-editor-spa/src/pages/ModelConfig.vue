<template>
  <div>
    <a-page-header title="3D模型配置管理系统" />
    <a-form layout="vertical" style="max-width: 1200px; margin: 0 24px;">
      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="file" ref="fileInput" accept=".xlsx" style="display: none" @change="loadFile" />
              <a-button type="primary" @click="triggerFileInput">加载配置</a-button>
            </div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-card title="模型编辑器" style="margin-bottom: 1.5rem;" :bordered="false">
        <a-row :gutter="16">
          <a-col :span="12">
            <div class="grid-editor">
              <template v-for="y in 5" :key="`row-${y-1}`">
                <div 
                  v-for="x in 5" 
                  :key="`${y-1}-${x-1}`"
                  class="grid-cell" 
                  :class="{ 'active': currentData[y-1][x-1] === 1 }"
                  @click="toggleCell(y-1, x-1)"
                ></div>
              </template>
            </div>
          </a-col>
          <a-col :span="12">
            <a-form-item label="模型ID">
              <a-input-number 
                v-model:value="modelId" 
                placeholder="ID" 
                style="width: 120px;" 
                @dblclick="quickFillId"
              />
            </a-form-item>
            
            <a-form-item label="模型编号">
              <a-input-number 
                v-model:value="modelNum" 
                placeholder="编号" 
                style="width: 120px;" 
                @dblclick="quickFillNum"
              />
            </a-form-item>
            
            <div style="color: #666; font-size: 0.9em; margin-bottom: 16px;">
              {{ autoFillHint }}
            </div>
            
            <div>
              <a-button type="primary" @click="saveModel" style="margin-right: 8px;">保存模型</a-button>
              <a-button danger @click="clearEditor">清空</a-button>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <a-row :gutter="16">
        <a-col :span="24">
          <h3>模型列表</h3>
        </a-col>
      </a-row>
      
      <div class="model-list">
        <a-card 
          v-for="model in models" 
          :key="model.id"
          class="model-card"
          size="small"
          :bordered="true"
          :hoverable="true"
          style="width: 220px;"
        >
          <div style="color: #666; font-size: 0.9em;">ID: {{ model.id }} | 编号: {{ model.number }}</div>
          <div class="grid-editor" style="margin: 8px 0;">
            <template v-for="(row, y) in model.data" :key="`row-${y}`">
              <div 
                v-for="(cell, x) in row" 
                :key="`${y}-${x}`"
                class="grid-cell" 
                :class="{ 'active': cell === 1 }"
              ></div>
            </template>
          </div>
          <a-button 
            size="small"
            style="width: 100%; background: #666; color: white;"
            @click="copyModelData(model)"
          >
            复制配置
          </a-button>
        </a-card>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import * as XLSX from 'xlsx';

// 数据模型
interface Model {
  id: number;
  number: number;
  data: number[][];
  raw: string;
}

// 响应式状态
const models = ref<Model[]>([]);
const currentData = ref(initializeGrid());
const modelId = ref<number | null>(null);
const modelNum = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// 计算属性
const autoFillHint = computed(() => {
  if (models.value.length === 0) {
    return '下一个可用 ID: 1 | 下一个编号: 1';
  }
  
  const nextId = Math.max(...models.value.map(m => m.id)) + 1;
  const nextNum = Math.max(...models.value.map(m => m.number)) + 1;
  
  return `下一个可用 ID: ${nextId} | 下一个编号: ${nextNum}`;
});

// 工具函数
function initializeGrid() {
  return Array.from({length: 5}, () => Array(5).fill(0));
}

function toggleCell(y: number, x: number) {
  currentData.value[y][x] = currentData.value[y][x] ? 0 : 1;
}

function triggerFileInput() {
  fileInput.value?.click();
}

// Excel文件处理
function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    if (!e.target?.result) return;
    
    const data = new Uint8Array(e.target.result as ArrayBuffer);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 跳过前3行标题
    const rawData = XLSX.utils.sheet_to_json(sheet, {header: 1, range: 3});
    
    models.value = (rawData as any[]).map((row: any) => ({
      id: row[0] || 0,
      number: row[1] || 0,
      data: parseModelData(row[3]), // 解析模型数据
      raw: row[3] || ""
    }));
  };
  
  reader.readAsArrayBuffer(file);
}

function parseModelData(str: string) {
  try {
    // 去除双引号并清理数据
    const input = (str || "")
      .toString()
      .replace(/^"|"$/g, '') // 去除首尾双引号
      .trim();

    const rows = input.split('|').slice(0,5);
    
    return Array.from({length: 5}, (_, y) => 
      Array.from({length: 5}, (_, x) => {
        const row = rows[y] || "";
        // 处理每个单元格数据，支持数字和字符串格式
        const cellValue = row.split('#')[x] || "0";
        return parseInt(cellValue.replace(/"/g, '')) ? 1 : 0;
      })
    );
  } catch (e) {
    console.error("数据解析失败:", e);
    return initializeGrid();
  }
}

// 模型操作
function saveModel() {
  if (!modelId.value) {
    return message.error('请输入有效ID');
  }
  if (!modelNum.value) {
    return message.error('请输入有效编号');
  }

  // 生成紧凑格式数据
  const rawData = currentData.value
    .map(row => {
      // 去除行末的0
      let lastIndex = row.length - 1;
      while(lastIndex >= 0 && row[lastIndex] === 0) lastIndex--;
      return row.slice(0, lastIndex + 1).join('#');
    })
    .filter(row => row !== '') // 过滤空行
    .join('|');

  const newModel = {
    id: modelId.value,
    number: modelNum.value,
    data: JSON.parse(JSON.stringify(currentData.value)), // 深拷贝
    raw: rawData
  };

  // 更新模型列表
  const index = models.value.findIndex(m => m.id === modelId.value);
  if (index > -1) models.value.splice(index, 1);
  models.value.push(newModel);
  
  clearEditor();
}

function clearEditor() {
  currentData.value = initializeGrid();
  modelId.value = null;
  modelNum.value = null;
}

function copyModelData(model: Model) {
  const configData = [
    model.id,
    model.number,
    `"""modelA"""`,
    `"""${model.raw}"""` // 直接使用原始紧凑数据
  ].join('\t');

  try {
    navigator.clipboard.writeText(configData)
      .then(() => message.success('复制成功'))
      .catch(() => legacyCopy(configData));
  } catch (e) {
    legacyCopy(configData);
  }
}

// 传统复制方法
function legacyCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  message.success('已复制到剪贴板');
}

// 快速填充ID和编号
function quickFillId() {
  if (models.value.length === 0) {
    modelId.value = 1;
    return;
  }
  
  modelId.value = Math.max(...models.value.map(m => m.id)) + 1;
}

function quickFillNum() {
  if (models.value.length === 0) {
    modelNum.value = 1;
    return;
  }
  
  modelNum.value = Math.max(...models.value.map(m => m.number)) + 1;
}
</script>

<style scoped>
.grid-editor {
  display: grid;
  grid-template-columns: repeat(5, 40px);
  gap: 4px;
  margin: 1rem 0;
}

.grid-cell {
  width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.grid-cell.active {
  background: #2196F3;
  border-color: #2196F3;
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.model-card .grid-editor {
  grid-template-columns: repeat(5, 16px);
  gap: 2px;
}

.model-card .grid-cell {
  width: 16px;
  height: 16px;
}
</style> 