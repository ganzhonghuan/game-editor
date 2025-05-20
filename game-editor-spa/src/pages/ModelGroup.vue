<template>
  <div>
    <a-page-header title="模型编组配置系统" />
    <a-form layout="vertical" style="max-width: 1200px; margin: 0 24px;">
      <a-row :gutter="16">
        <a-col :span="24">
          <a-form-item>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="file" ref="fileInput" accept=".xlsx" style="display: none" @change="loadFile" />
              <a-button type="primary" @click="triggerFileInput">加载配置文件</a-button>
            </div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-card title="当前编组配置" style="margin-bottom: 1.5rem;" :bordered="false">
        <div class="group-header">
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <a-button 
              v-for="group in modelGroups" 
              :key="group.groupId"
              :type="currentGroup?.groupId === group.groupId ? 'primary' : 'default'"
              shape="round"
              style="min-width: 60px;"
              @click="selectGroup(group.groupId)"
            >
              {{ group.groupId }}
            </a-button>
            <a-button 
              type="dashed" 
              shape="round" 
              @click="createNewGroup"
              style="background: #f0f4ff;"
            >
              <template #icon><PlusOutlined /></template>
              添加新组
            </a-button>
          </div>
        </div>
        
        <div v-if="currentGroup">
          <a-divider orientation="left">编组 {{ currentGroup.groupId }} 配置</a-divider>
          <a-space direction="vertical" style="width: 100%">
            <a-typography-paragraph>
              <a-tag color="processing">包含模型数量：{{ currentGroup.selectedMembers?.size || 0 }}</a-tag>
            </a-typography-paragraph>
            
            <a-input
              :value="formatGroupData()"
              readonly
              style="margin-bottom: 16px; font-family: monospace;"
            />
            
            <a-button type="primary" @click="copyGroupData" icon="copy">
              复制配置
            </a-button>
          </a-space>
        </div>
        <div v-else>
          请先选择编组
        </div>
      </a-card>

      <h3 style="margin: 16px 0;">模型列表（点击选择/取消）</h3>
      <div class="model-list">
        <a-card 
          v-for="model in models" 
          :key="model.number"
          class="model-card"
          size="small"
          :bordered="true"
          :hoverable="true"
          :class="{ 'selected-model': currentGroup?.selectedMembers?.has(model.number) }"
          @click="toggleSelection(model.number)"
        >
          <div style="color: #666; font-size: 0.9em;">编号: {{ model.number }}</div>
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
        </a-card>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import * as XLSX from 'xlsx';

// 数据模型
interface Model {
  id: number;
  number: number;
  cubeNum: number;
  data: number[][];
  raw: string;
}

interface ModelGroup {
  groupId: string;
  members: number[];
  selectedMembers?: Set<number>;
  originalMembers?: number[];
}

// 响应式状态
const models = ref<Model[]>([]);
const modelGroups = ref<ModelGroup[]>([]);
const currentGroup = ref<ModelGroup | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// 文件操作方法
function triggerFileInput() {
  fileInput.value?.click();
}

function loadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    if (!e.target?.result) return;
    
    const data = new Uint8Array(e.target.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 解析ModelManage表（从第4行开始）
    const manageSheet = workbook.Sheets['ModelManage'];
    const manageData = XLSX.utils.sheet_to_json(manageSheet, { 
      header: 1, 
      range: 3 // 跳过前3行
    });
    
    models.value = (manageData as any[]).map((row: any) => ({
      id: row[0] || 0,
      number: row[1] || 0,
      cubeNum: row[2] || 0,
      data: parseModelData(row[3]),
      raw: row[3] || ""
    }));

    // 解析ModelGroup表（从第4行开始）
    const groupSheet = workbook.Sheets['ModelGroup'];
    const groupData = XLSX.utils.sheet_to_json(groupSheet, { 
      header: 1,
      range: 3 // 跳过前3行
    });
    
    modelGroups.value = (groupData as any[]).map((row: any) => ({
      groupId: (row[0] || "").toString().replace(/"/g, ''),
      members: parseGroupMembers(row[1])
    }));

    initGroups();
  };
  
  reader.readAsArrayBuffer(file);
}

// 数据处理
function parseModelData(str: string) {
  try {
    const input = (str || "").toString().replace(/^"|"$/g, '').trim();
    const rows = input.split('|').slice(0,5);
    return Array(5).fill(0).map((_, y) => 
      Array(5).fill(0).map((_, x) => {
        const row = rows[y] || "";
        return parseInt(row.split('#')[x] || "0") ? 1 : 0;
      })
    );
  } catch (e) {
    console.error("数据解析失败:", e);
    return Array(5).fill(0).map(() => Array(5).fill(0));
  }
}

function parseGroupMembers(str: string) {
  return (str || "")
    .toString()
    .replace(/"/g, '')
    .split('-')
    .filter(x => x)
    .map(Number);
}

function initGroups() {
  modelGroups.value.forEach(group => {
    // 保留原始成员数据副本
    if (!group.originalMembers) {
      group.originalMembers = [...group.members]; 
    }
    
    // 初始化选中成员
    if (!group.selectedMembers) {
      group.selectedMembers = new Set(group.members);
    }
  });
  
  // 默认选中第一个组
  if (modelGroups.value.length > 0 && !currentGroup.value) {
    selectGroup(modelGroups.value[0].groupId);
  }
}

// 格式化编组数据以供显示
function formatGroupData() {
  if (!currentGroup.value) return '';
  
  const members = Array.from(currentGroup.value.selectedMembers || []).join('-');
  return `"${currentGroup.value.groupId}"\t"-${members}-"`;
}

// 用户交互方法
function selectGroup(groupId: string) {
  currentGroup.value = modelGroups.value.find(g => g.groupId === groupId) || null;
  
  // 确保有选中成员集合
  if (currentGroup.value && !currentGroup.value.selectedMembers) {
    currentGroup.value.selectedMembers = new Set(currentGroup.value.members);
  }
}

function toggleSelection(modelNumber: number) {
  if (!currentGroup.value || !currentGroup.value.selectedMembers) {
    message.warning('请先选择编组');
    return;
  }
  
  if (currentGroup.value.selectedMembers.has(modelNumber)) {
    currentGroup.value.selectedMembers.delete(modelNumber);
  } else {
    currentGroup.value.selectedMembers.add(modelNumber);
  }
  
  // 同步更新原始数据
  currentGroup.value.members = Array.from(currentGroup.value.selectedMembers).sort((a, b) => a - b);
}

function createNewGroup() {
  // 生成新组ID（例如从A-Z顺序）
  const lastGroup = modelGroups.value[modelGroups.value.length - 1];
  let newId = 'A';
  
  if (lastGroup) {
    const lastCharCode = lastGroup.groupId.charCodeAt(0);
    if (lastCharCode < 90) { // 不超过Z
      newId = String.fromCharCode(lastCharCode + 1);
    } else {
      message.warning('已达到最大编组数量（Z）');
      return;
    }
  }

  // 检查是否已存在
  if (modelGroups.value.some(g => g.groupId === newId)) {
    message.warning(`编组 ${newId} 已存在！`);
    return;
  }

  // 创建新组
  const newGroup: ModelGroup = {
    groupId: newId,
    members: [],
    selectedMembers: new Set()
  };
  
  modelGroups.value.push(newGroup);
  selectGroup(newId);
}

function copyGroupData() {
  if (!currentGroup.value) {
    message.warning('请先选择编组');
    return;
  }
  
  const members = Array.from(currentGroup.value.selectedMembers || []).join('-');
  const data = `"${currentGroup.value.groupId}"\t"-${members}-"`;
  
  try {
    navigator.clipboard.writeText(data)
      .then(() => message.success('复制成功！'))
      .catch(() => legacyCopy(data));
  } catch (e) {
    legacyCopy(data);
  }
}

// 兼容旧浏览器的复制方式
function legacyCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  message.success('已复制到剪贴板');
}
</script>

<style scoped>
.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.model-card {
  transition: all 0.2s;
}

.model-card.selected-model {
  border-color: #4CAF50;
  background: #E8F5E9;
}

.grid-editor {
  display: grid;
  grid-template-columns: repeat(5, 16px);
  gap: 2px;
  margin: 1rem 0;
}

.grid-cell {
  width: 16px;
  height: 16px;
  border: 1px solid #ddd;
  transition: all 0.2s;
}

.grid-cell.active {
  background: #2196F3;
  border-color: #2196F3;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
</style> 