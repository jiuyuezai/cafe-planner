import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, AlertCircle } from 'lucide-react';
import { Task, Category, Note } from '../types';
import { exportDataAsJSON, exportTasksAsCSV, importDataFromJSON, validateImportData, ExportData } from '../utils/export';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  tasks: Task[];
  notes: Note[];
  onImportData: (categories: Category[], tasks: Task[], notes: Note[]) => Promise<void>;
  onPlay?: (sound: string) => void;
}

const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  tasks,
  notes,
  onImportData,
  onPlay
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExportJSON = () => {
    try {
      exportDataAsJSON(categories, tasks, notes);
      onPlay?.('click');
      setImportSuccess(false);
      setImportError(null);
    } catch (error) {
      setImportError('导出失败，请重试');
      console.error('Export error:', error);
    }
  };

  const handleExportCSV = () => {
    try {
      exportTasksAsCSV(tasks, categories);
      onPlay?.('click');
      setImportSuccess(false);
      setImportError(null);
    } catch (error) {
      setImportError('导出 CSV 失败，请重试');
      console.error('Export CSV error:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const data = await importDataFromJSON(file);
      const validation = validateImportData(data);

      if (!validation.valid) {
        setImportError('导入的文件数据格式不正确：\n' + validation.errors.join('\n'));
        setIsImporting(false);
        return;
      }

      // 确认导入
      const confirmMessage = `将导入以下数据：
- 分类: ${data.categories.length} 个
- 任务: ${data.tasks.length} 个
- 笔记: ${data.notes.length} 个

这将覆盖您当前的所有数据。确定要继续吗？`;

      if (window.confirm(confirmMessage)) {
        await onImportData(data.categories, data.tasks, data.notes);
        onPlay?.('open');
        setImportSuccess(true);
        setImportError(null);
        
        // 3秒后自动关闭提示
        setTimeout(() => {
          setImportSuccess(false);
        }, 3000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      setImportError('导入失败: ' + errorMsg);
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-varela font-bold text-stone-700">
                数据管理
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X size={20} className="text-stone-400" />
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {importError && (
                <motion.div
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 whitespace-pre-wrap">{importError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {importSuccess && (
                <motion.div
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">数据导入成功！</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                💡 <strong>提示：</strong>导出您的数据以备份，或导入以前的备份来恢复数据。
              </p>
            </div>

            {/* Export Section */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">
                导出数据
              </h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                >
                  <Download size={18} />
                  导出为 JSON 备份
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
                >
                  <Download size={18} />
                  导出任务为 CSV
                </motion.button>
              </div>

              {/* Export Stats */}
              <div className="mt-3 text-xs text-stone-500 space-y-1">
                <p>📊 当前数据统计：</p>
                <p className="ml-4">• 分类: {categories.length} 个</p>
                <p className="ml-4">• 任务: {tasks.length} 个</p>
                <p className="ml-4">• 笔记: {notes.length} 个</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-200 my-6" />

            {/* Import Section */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-stone-600 mb-3 uppercase tracking-wide">
                导入数据
              </h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImportClick}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed text-purple-700 rounded-lg font-medium transition-colors border border-purple-200"
              >
                <Upload size={18} />
                {isImporting ? '导入中...' : '选择 JSON 文件导入'}
              </motion.button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <p className="mt-2 text-xs text-stone-500">
                ⚠️ 选择之前导出的 JSON 文件来恢复您的数据。
              </p>
            </div>

            {/* Footer */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-full mt-6 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors"
            >
              关闭
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DataManagerModal;
