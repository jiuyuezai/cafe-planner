import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Settings, PenLine, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Category, ColorTheme, THEME_COLORS, THEME_STYLES, TimeBlock, TIME_BLOCK_LABELS } from '../types';
import { useSound } from '../hooks/useSound';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTask: (title: string, categoryId: string, timeBlock: TimeBlock) => void;
  onAddCategory: (label: string, theme: ColorTheme, icon: string) => void;
  onUpdateCategory: (id: string, label: string, theme: ColorTheme, icon: string) => void;
  onDeleteCategory: (id: string) => void;
  onClearData: () => void;
}

const EMOJI_PRESETS = [
  // 💼 工作与学习
  "💻", "🎓", "📚", "📅", "✍️", "🚀",
  // 🏠 生活与琐事
  "🏠", "🧹", "🛒", "💰", "🔧", "🚗",
  // ❤️ 健康与饮食
  "💪", "💊", "🥗", "💤", "🧘", "🏥",
  // 🎮 娱乐与爱好
  "🎮", "🎬", "🎵", "🎨", "📷", "🐕",
  // 👥 社交与状态
  "☕", "❤️", "✈️", "⭐", "🔥", "✅"
];

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen, onClose, categories, onAddTask, onAddCategory, onUpdateCategory, onDeleteCategory, onClearData
}) => {
  const [view, setView] = useState<'addTask' | 'manageTags'>('addTask');
  const { play } = useSound();

  // Add Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlock>('morning');

  // Add/Edit Tag Form
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatTheme, setNewCatTheme] = useState<ColorTheme>('amber');
  const [newCatIcon, setNewCatIcon] = useState('☕');

  if (!isOpen) return null;

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim() && selectedCatId) {
      play('success');
      onAddTask(taskTitle, selectedCatId, selectedTimeBlock);
      setTaskTitle('');
      onClose();
    }
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatLabel.trim()) {
      play('success');
      if (editingCatId) {
        onUpdateCategory(editingCatId, newCatLabel, newCatTheme, newCatIcon);
        resetCategoryForm();
      } else {
        onAddCategory(newCatLabel, newCatTheme, newCatIcon);
        setNewCatLabel('');
      }
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setNewCatLabel(cat.label);
    setNewCatTheme(cat.theme);
    setNewCatIcon(cat.icon);
    play('open');
  };

  const resetCategoryForm = () => {
    setEditingCatId(null);
    setNewCatLabel('');
    setNewCatTheme('amber');
    setNewCatIcon('☕');
  };

  const handleDelete = (id: string) => {
    play('delete');
    onDeleteCategory(id);
    if (editingCatId === id) resetCategoryForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 20, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="relative bg-white w-full mx-4 max-w-[540px] rounded-[2rem] shadow-2xl overflow-hidden border-[3px] border-amber-100 flex flex-col max-h-[90vh] max-h-[85dvh] sm:max-h-[95dvh]"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          {/* Toggle Switch */}
          <div className="flex bg-stone-50 p-1 rounded-full border border-stone-100">
            <button
              onClick={() => setView('addTask')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'addTask' ? 'bg-white text-amber-500 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <PenLine size={12} strokeWidth={2.5} /> 记单
            </button>
            <button
              onClick={() => setView('manageTags')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${view === 'manageTags' ? 'bg-white text-amber-500 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Settings size={12} strokeWidth={2.5} /> 分区
            </button>
          </div>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-stone-50 text-stone-300 hover:bg-amber-50 hover:text-amber-400 rounded-full transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'addTask' ? (
              <motion.form
                key="addTask"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmitTask}
                className="flex flex-col gap-4"
              >
                {/* Input Bubble */}
                <div className="bg-stone-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-amber-200 transition-colors group">
                  <textarea
                    rows={2}
                    autoFocus
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="记录新订单..."
                    className="w-full bg-transparent outline-none text-stone-600 font-bold placeholder:text-stone-300 text-lg"
                  />
                </div>

                {/* Time Block Selection */}
                <div>
                  <p className="text-[10px] font-bold text-stone-400 mb-2 pl-2 uppercase tracking-wider opacity-60">选择时段</p>
                  <div className="flex gap-2">
                    {(['morning', 'afternoon', 'evening'] as TimeBlock[]).map((block) => (
                      <button
                        key={block}
                        type="button"
                        onClick={() => setSelectedTimeBlock(block)}
                        className={`
                             flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2
                             ${selectedTimeBlock === block
                            ? 'bg-amber-100 border-amber-300 text-amber-600 shadow-sm'
                            : 'bg-white border-stone-100 text-stone-400 hover:bg-stone-50'
                          }
                           `}
                      >
                        {TIME_BLOCK_LABELS[block]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Grid */}
                <div>
                  <p className="text-[10px] font-bold text-stone-400 mb-2 pl-2 uppercase tracking-wider opacity-60">选择制作台</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCatId(cat.id)}
                        className={`
                             px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-2
                             ${selectedCatId === cat.id
                            ? `${THEME_STYLES[cat.theme]} border-current shadow-sm`
                            : 'bg-white border-stone-100 text-stone-400 hover:bg-stone-50'}
                           `}
                      >
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-sm ${selectedCatId === cat.id ? 'bg-white/50' : 'bg-stone-100'}`}>
                          {cat.icon || '✨'}
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!taskTitle || !selectedCatId}
                  className="mt-1 w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-300 text-white font-bold text-base shadow-lg shadow-yellow-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none hover:brightness-105"
                >
                  🛎️ 确认下单
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="manageTags"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-4"
              >
                {/* Compact Tags List */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {categories.map(cat => (
                    <div key={cat.id} className={`flex items-center justify-between p-2 rounded-xl border transition-colors min-h-[44px] ${editingCatId === cat.id ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-100'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm text-lg bg-white border border-stone-100">
                          {cat.icon || '✨'}
                        </div>
                        <span className="font-bold text-stone-600 text-xs">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${editingCatId === cat.id ? 'text-amber-500 bg-amber-100' : 'text-stone-300 hover:text-stone-500 hover:bg-stone-200'}`}
                        >
                          <PenLine size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={categories.length <= 1}
                          className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmitCategory} className={`bg-white rounded-xl border-2 border-dashed p-3 transition-colors ${editingCatId ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200'}`}>
                  {editingCatId && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wide">修改分区</span>
                      <button type="button" onClick={resetCategoryForm} className="text-[9px] font-bold text-stone-400 hover:text-stone-600 flex items-center gap-1">
                        <RotateCcw size={10} /> 取消
                      </button>
                    </div>
                  )}
                  {/* Input Row */}
                  <div className="flex items-center gap-2 mb-3 min-h-[44px]">
                    <div className="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-lg text-lg border border-stone-200">
                      {newCatIcon}
                    </div>
                    <textarea
                      rows={1}
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      placeholder={editingCatId ? "点击修改名称..." : "点击输入新分区名称..."}
                      className="flex-1 bg-transparent text-sm font-bold text-stone-600 placeholder-stone-300 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newCatLabel}
                      className={`w-8 h-8 flex items-center justify-center text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 shrink-0 ${editingCatId ? 'bg-green-300 hover:bg-green-400' : 'bg-amber-400 hover:bg-amber-500'}`}
                    >
                      {editingCatId ? <Save size={16} /> : <Plus size={16} />}
                    </button>
                  </div>

                  {/* Emoji Picker Grid */}
                  <div className="mb-3">
                    <p className="text-[8px] sm:text-[9px] font-bold text-stone-300 mb-1.5 uppercase tracking-wide">选择图标</p>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                      {EMOJI_PRESETS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatIcon(emoji)}
                          className={`
                                        w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-md text-base sm:text-sm transition-all
                                        ${newCatIcon === emoji ? 'bg-amber-100 scale-110 shadow-sm border border-amber-200' : 'hover:bg-stone-50 hover:scale-110'}
                                    `}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-bold text-stone-300 mb-1.5 uppercase tracking-wide">分区颜色</p>
                    <div className="flex justify-between gap-1 flex-wrap">
                      {(Object.keys(THEME_COLORS) as ColorTheme[]).map(theme => (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => setNewCatTheme(theme)}
                          className={`w-6 h-6 sm:w-5 sm:h-5 rounded-full transition-transform border-2 border-white shadow-sm ${newCatTheme === theme ? 'scale-125 ring-1 ring-stone-300' : 'opacity-60 hover:opacity-100'}`}
                          style={{ backgroundColor: THEME_COLORS[theme] }}
                        />
                      ))}
                    </div>
                  </div>
                </form>

                {/* RESET DATA BUTTON */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={onClearData}
                    className="w-full py-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 text-[10px] font-bold tracking-wider flex items-center justify-center gap-1 transition-colors"
                  >
                    <AlertTriangle size={12} strokeWidth={2.5} /> 清空所有数据
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskModal;