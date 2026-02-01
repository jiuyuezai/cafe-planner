import { Task, Category, Note } from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  categories: Category[];
  tasks: Task[];
  notes: Note[];
}

/**
 * 导出数据为 JSON 文件
 */
export const exportDataAsJSON = (
  categories: Category[],
  tasks: Task[],
  notes: Note[]
): void => {
  const exportData: ExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    categories,
    tasks,
    notes,
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cafe-planner-backup-${timestamp}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 导出数据为 CSV 格式（仅包含任务）
 */
export const exportTasksAsCSV = (
  tasks: Task[],
  categories: Category[]
): void => {
  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.label || 'Unknown';
  };

  const timeBlockLabels: Record<string, string> = {
    morning: '早餐 🥨',
    afternoon: '下午茶 🍭',
    evening: '宵夜 🍷'
  };

  const headers = ['任务标题', '分类', '时段', '状态', '完成时间'];
  const rows = tasks.map(task => [
    task.title,
    getCategoryLabel(task.categoryId),
    timeBlockLabels[task.timeBlock],
    task.status === 'completed' ? '已完成' : '进行中',
    task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '-'
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cafe-planner-tasks-${timestamp}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 导入 JSON 数据文件
 */
export const importDataFromJSON = (
  file: File
): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 验证数据结构
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('Invalid data format: missing or invalid categories');
        }
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid data format: missing or invalid tasks');
        }
        if (!data.notes || !Array.isArray(data.notes)) {
          throw new Error('Invalid data format: missing or invalid notes');
        }
        
        resolve(data as ExportData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 验证导入的数据是否有效
 */
export const validateImportData = (data: ExportData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 检查基本结构
  if (!data.categories || !Array.isArray(data.categories)) {
    errors.push('Missing or invalid categories');
  }
  if (!data.tasks || !Array.isArray(data.tasks)) {
    errors.push('Missing or invalid tasks');
  }
  if (!data.notes || !Array.isArray(data.notes)) {
    errors.push('Missing or invalid notes');
  }

  // 检查任务引用的分类是否存在
  if (data.tasks && data.categories) {
    const validCategoryIds = new Set(data.categories.map(c => c.id));
    data.tasks.forEach((task, index) => {
      if (!validCategoryIds.has(task.categoryId)) {
        errors.push(`Task ${index + 1} references non-existent category "${task.categoryId}"`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
