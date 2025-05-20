<template>
  <div>
    <a-page-header title="游戏关卡配置生成器" />
    <a-form layout="vertical" :model="form" style="max-width: 1200px; margin: 0 24px;">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="关卡名称" required>
            <a-input v-model:value="form.LevelName" placeholder="31" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="块数类型" required>
            <a-select v-model:value="form.blockType">
              <a-select-option value="12">12</a-select-option>
              <a-select-option value="18">18</a-select-option>
              <a-select-option value="24">24</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="层高" required>
            <a-select v-model:value="form.levelHeight">
              <a-select-option value="8">8</a-select-option>
              <a-select-option value="12">12</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="刷新模型">
            <div style="display: flex; align-items: center; gap: 8px;">
              <a-select v-model:value="form.refreshModel" :options="modelGroupOptions" style="flex: 1;" />
              <input ref="modelGroupFile" type="file" accept=".xlsx" style="display:none" @change="onModelGroupFileChange" />
              <a-button @click="triggerModelGroupFile">加载模型组</a-button>
              <a-button @click="() => showTooltip = true">查看模型</a-button>
            </div>
            <a-tooltip v-if="showTooltip" :visible="showTooltip" placement="right" @visibleChange="(v: boolean) => showTooltip = v">
              <template #title>
                <div v-if="currentGroup">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <div v-for="model in currentGroupModels" :key="model.number" style="border:1px solid #2196F3;border-radius:4px;padding:4px;background:#f8fbff;">
                      <div style="text-align:center;color:#2196F3;font-size:12px;">{{ model.number }}</div>
                      <div style="display:grid;grid-template-columns:repeat(5,16px);gap:1px;">
                        <div v-for="(cell,idx) in model.data.flat()" :key="idx" :style="{width:'16px',height:'16px',background:cell?'#2196F3':'#eee'}"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else style="color:#dc3545;">未选择模型组</div>
              </template>
              <span></span>
            </a-tooltip>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="胜利条件">
            <a-select v-model:value="form.winType" @change="onWinTypeChange">
              <a-select-option value="1">积分通关</a-select-option>
              <a-select-option value="2">收集通关</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="初始方块">
            <div style="display: flex; align-items: center;">
              <a-input-number v-model:value="form.block1" min="1" style="width:100px;" />
              <a-input-number v-model:value="form.block2" min="1" style="width:100px;margin-left:8px;" />
              <a-input-number v-model:value="form.block3" min="1" style="width:100px;margin-left:8px;" />
            </div>
            <span v-if="blockError" style="color:red;font-size:12px;">方块ID必须≥1</span>
          </a-form-item>
        </a-col>
      </a-row>
      <template v-if="form.winType==='1'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="星级分数阈值">
              <div style="display: flex; align-items: center;">
                <a-input-number v-model:value="form.star1" placeholder="1星" style="width:100px;" />
                <a-input-number v-model:value="form.star2" placeholder="2星" style="width:100px;margin-left:8px;" />
                <a-input-number v-model:value="form.star3" placeholder="3星" style="width:100px;margin-left:8px;" />
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="障碍颜色">
              <div style="display: flex; align-items: center;">
                <a-input type="color" v-model:value="form.obstacleColor" style="width:60px;height:32px;" />
                <span :style="{display:'inline-block',width:'32px',height:'32px',background:form.obstacleColor,border:'1px solid #ccc',marginLeft:'8px',borderRadius:'2px'}"></span>
                <span style="margin-left:8px;">{{ form.obstacleColor }}</span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
      </template>
      <template v-else>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="钻石数量">
              <div style="display: flex; align-items: center;">
                <a-input-number v-model:value="form.diamond1" placeholder="钻石1" style="width:100px;" />
                <a-input-number v-model:value="form.diamond2" placeholder="钻石2" style="width:100px;margin-left:8px;" />
                <a-input-number v-model:value="form.diamond3" placeholder="钻石3" style="width:100px;margin-left:8px;" />
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="障碍颜色">
              <div style="display: flex; align-items: center;">
                <a-input type="color" v-model:value="form.obstacleColor" style="width:60px;height:32px;" />
                <span :style="{display:'inline-block',width:'32px',height:'32px',background:form.obstacleColor,border:'1px solid #ccc',marginLeft:'8px',borderRadius:'2px'}"></span>
                <span style="margin-left:8px;">{{ form.obstacleColor }}</span>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="颜色代码">
              <div style="display: flex; align-items: center;">
                <a-input-number v-model:value="form.color1" min="11" max="17" placeholder="颜色1" style="width:100px;" />
                <a-input-number v-model:value="form.color2" min="11" max="17" placeholder="颜色2" style="width:100px;margin-left:8px;" />
                <a-input-number v-model:value="form.color3" min="11" max="17" placeholder="颜色3" style="width:100px;margin-left:8px;" />
              </div>
              <div style="font-size:12px;color:#666;margin-top:4px;">11=绿 12=蓝光 13=蓝 14=白 15=紫 16=黄 17=红</div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="视频名称">
              <a-input v-model:value="form.videoName" placeholder="请输入视频文件名" />
            </a-form-item>
          </a-col>
        </a-row>
      </template>
      <a-row :gutter="16" v-if="form.winType==='1'">
        <a-col :span="12">
          <a-form-item label="视频名称">
            <a-input v-model:value="form.videoName" placeholder="请输入视频文件名" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <!-- 空白列，保持布局一致 -->
        </a-col>
      </a-row>
      <a-row :gutter="16" style="margin-top:16px;">
        <a-col :span="24">
          <a-button type="primary" @click="generateConfig" style="margin-right:8px;">生成配置</a-button>
          <a-button @click="copyLatestRow" style="margin-right:8px;">复制最新行</a-button>
          <a-button danger @click="resetForm" style="margin-right:8px;">重置配置</a-button>
          <a-button @click="openGridEditor">配置关卡格子</a-button>
        </a-col>
      </a-row>
    </a-form>
    <a-table 
      :columns="columns" 
      :data-source="tableData" 
      row-key="id" 
      :scroll="{ x: 'max-content' }" 
      :pagination="{ pageSize: 10 }"
      style="margin: 24px 12px" 
      bordered 
      size="small" 
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, h } from 'vue';
import { message } from 'ant-design-vue';
import * as XLSX from 'xlsx';

interface Model {
  number: number;
  data: number[][];
}
interface ModelGroup {
  groupId: string;
  members: number[];
}

const form = reactive({
  LevelName: '',
  blockType: '12',
  levelHeight: '8',
  refreshModel: '',
  winType: '1',
  star1: 160,
  star2: 180,
  star3: 240,
  diamond1: 15,
  diamond2: 15,
  diamond3: 12,
  color1: 11,
  color2: 12,
  color3: 13,
  block1: 1,
  block2: 3,
  block3: 3,
  obstacleColor: '#FFFF67',
  videoName: ''
});

const blockError = ref(false);
const tableData = ref<any[]>([]);
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80, fixed: 'left' },
  { title: '关卡名称', dataIndex: 'LevelName', width: 100 },
  { title: '块数', dataIndex: 'blockType', width: 80 },
  { title: '层高', dataIndex: 'levelHeight', width: 80 },
  { title: '配置', dataIndex: 'LevelConfig', width: 120 },
  { title: '刷新模型', dataIndex: 'refreshModel', width: 120 },
  { title: '胜利类型', dataIndex: 'winType', width: 100, 
    customRender: ({ text }: { text: string }) => text === '1' ? '积分通关' : '收集通关' },
  { title: '星级分数', dataIndex: 'WinStar1', width: 150,
    customRender: ({ text }: { text: any[] }) => Array.isArray(text) ? text.join(' / ') : '' },
  { title: '钻石数量', dataIndex: 'diamondStarNum2', width: 150,
    customRender: ({ text }: { text: any[] }) => Array.isArray(text) ? text.join(' / ') : '' },
  { title: '钻石颜色', dataIndex: 'diamondStarColor2', width: 150,
    customRender: ({ text }: { text: any[] }) => Array.isArray(text) ? text.join(' / ') : '' },
  { title: '初始方块', dataIndex: 'InitialRefresh', width: 150,
    customRender: ({ text }: { text: any[] }) => Array.isArray(text) ? text.join(' / ') : '' },
  { title: '障碍颜色', dataIndex: 'cubecolor', width: 120,
    customRender: ({ text }: { text: string }) => {
      if (!text) return '';
      return h('div', { 
        style: {
          display: 'flex',
          alignItems: 'center'
        }
      }, [
        h('span', {
          style: {
            display: 'inline-block',
            width: '16px',
            height: '16px',
            background: `#${text}`,
            border: '1px solid #ccc',
            marginRight: '8px',
            borderRadius: '2px'
          }
        }),
        text
      ]);
    }
  },
  { title: '视频', dataIndex: 'videoplay', width: 120 }
];

const modelGroupOptions = ref<any[]>([]);
const models = ref<Model[]>([]);
const modelGroups = ref<ModelGroup[]>([]);
const showTooltip = ref(false);
const currentGroup = computed(() => modelGroups.value.find((g: ModelGroup) => g.groupId === form.refreshModel));
const currentGroupModels = computed(() => {
  if (!currentGroup.value) return [];
  return currentGroup.value.members.map((num: number) => models.value.find((m: Model) => m.number === num)).filter(Boolean) as Model[];
});

const modelGroupFile = ref<HTMLInputElement | null>(null);

function triggerModelGroupFile() {
  modelGroupFile.value?.click();
}

function onModelGroupFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      // 解析ModelManage表
      const modelSheet = workbook.Sheets['ModelManage'];
      const modelRows = XLSX.utils.sheet_to_json(modelSheet, { header: 1 });
      models.value = modelRows.slice(1).map((row: any) => ({
        number: row[1],
        data: parseModelData(row[3] || "")
      }));
      // 解析ModelGroup表
      const groupSheet = workbook.Sheets['ModelGroup'];
      const groupRows = XLSX.utils.sheet_to_json(groupSheet, { header: 1, range: 3 });
      modelGroups.value = groupRows.filter((row: any) => row[0] !== undefined).map((row: any) => ({
        groupId: String(row[0]).replace(/"/g, ''),
        members: parseGroupMembers(row[1]?.toString())
      }));
      modelGroupOptions.value = modelGroups.value.map(g => ({ label: g.groupId + '型', value: g.groupId }));
      message.success('数据加载成功！');
    } catch (error: any) {
      message.error('文件解析失败: ' + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseGroupMembers(str: string): number[] {
  return (str || "")
    .replace(/^[-"]+|[-"]+$/g, '')
    .split('-')
    .filter(x => x !== '')
    .map(Number);
}

function parseModelData(str: string): number[][] {
  try {
    const cleanStr = (str || "").toString().replace(/["\s]/g, '').replace(/[^0-9|#]/g, '');
    const rows = cleanStr.split('|').slice(0, 5);
    const grid: number[][] = [];
    for (let row of rows) {
      const cells = row.split('#').slice(0, 5).map(Number).map(v => v > 0 ? 1 : 0);
      while (cells.length < 5) cells.push(0);
      grid.push(cells);
    }
    while (grid.length < 5) grid.push(Array(5).fill(0));
    return grid;
  } catch (e) {
    return Array(5).fill(0).map(() => Array(5).fill(0));
  }
}

function onWinTypeChange() {
  // 切换胜利条件时重置相关字段
  if (form.winType === '1') {
    form.diamond1 = 15;
    form.diamond2 = 15;
    form.diamond3 = 12;
    form.color1 = 11;
    form.color2 = 12;
    form.color3 = 13;
  } else {
    form.star1 = 160;
    form.star2 = 180;
    form.star3 = 240;
  }
}

function validate() {
  blockError.value = [form.block1, form.block2, form.block3].some(b => !b || b < 1);
  return !blockError.value;
}

function generateConfig() {
  if (!validate()) return;
  const levelNumber = parseInt(form.LevelName);
  const config = {
    id: 1000 + (levelNumber || 0),
    LevelName: form.LevelName,
    blockType: form.blockType,
    levelHeight: form.levelHeight,
    LevelConfig: 'level' + form.LevelName,
    refreshModel: form.refreshModel,
    winType: form.winType,
    WinStar1: form.winType === '1' ? [form.star1, form.star2, form.star3] : [],
    diamondStarNum2: form.winType === '2' ? [form.diamond1, form.diamond2, form.diamond3] : [],
    diamondStarColor2: form.winType === '2' ? [form.color1, form.color2, form.color3] : [],
    InitialRefresh: [form.block1, form.block2, form.block3],
    cubecolor: form.obstacleColor.slice(1),
    videoplay: form.videoName || ''
  };
  tableData.value.push(config);
  message.success('配置已生成');
}

let latestRow: any = null;

function copyLatestRow() {
  if (!tableData.value.length) {
    message.warning('请先生成配置！');
    return;
  }
  const row = tableData.value[tableData.value.length - 1];
  const rowData = [
    row.id,
    row.LevelName,
    row.blockType,
    row.levelHeight,
    `"${row.LevelConfig}"`,
    `"${row.refreshModel}"`,
    row.winType,
    `"[${row.WinStar1.join(',')}]"`,
    `"[${row.diamondStarNum2.join(',')}]"`,
    `"[${row.diamondStarColor2.join(',')}]"`,
    `"[${row.InitialRefresh.join(',')}]"`,
    `"${row.cubecolor}"`,
    `"${row.videoplay}"`
  ];
  const excelText = rowData.join('\t');
  copyToClipboard(excelText);
}

function copyToClipboard(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const success = document.execCommand('copy');
    if (success) {
      message.success('复制成功！请到Excel中按Ctrl+V粘贴');
    } else {
      message.warning('请手动复制内容：' + text);
    }
  } catch (err) {
    message.warning('请手动复制内容：' + text);
  } finally {
    document.body.removeChild(textarea);
  }
}

function resetForm() {
  form.LevelName = '';
  form.blockType = '12';
  form.levelHeight = '8';
  form.refreshModel = '';
  form.winType = '1';
  form.star1 = 160;
  form.star2 = 180;
  form.star3 = 240;
  form.diamond1 = 15;
  form.diamond2 = 15;
  form.diamond3 = 12;
  form.color1 = 11;
  form.color2 = 12;
  form.color3 = 13;
  form.block1 = 1;
  form.block2 = 3;
  form.block3 = 3;
  form.obstacleColor = '#FFFF67';
  form.videoName = '';
  blockError.value = false;
  tableData.value = [];
}

function openGridEditor() {
  // 跳转到关卡格子配置页面，带参数
  const params = new URLSearchParams({
    blockType: form.blockType,
    levelHeight: form.levelHeight,
    winType: form.winType,
    color1: String(form.color1),
    color2: String(form.color2),
    color3: String(form.color3)
  });
  if (form.winType === '1') {
    params.delete('color1');
    params.delete('color2');
    params.delete('color3');
  }
  window.open(`/level-grid?${params.toString()}`, '_blank');
}
</script> 