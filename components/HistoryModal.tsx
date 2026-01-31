import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Filter, CalendarDays, BookOpen } from 'lucide-react';
import { Task, Category, THEME_STYLES, THEME_COLORS } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, tasks, categories }) => {
  const [filterCatId, setFilterCatId] = useState<string | 'all'>('all');

  // --- Helpers ---

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Previously';
    return new Date(timestamp).toLocaleDateString('zh-CN', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getGroupTitle = (timestamp?: number) => {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    const now = new Date();
    // Reset times to compare dates only
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(n);
    yesterday.setDate(n.getDate() - 1);

    if (d.getTime() === n.getTime()) return '今日特供 🌟';
    if (d.getTime() === yesterday.getTime()) return '昨日菜单 🌙';
    
    return `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()}`;
  };

  // --- Data Processing ---

  // 1. Filter completed tasks
  const completedTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed')
      .filter(t => filterCatId === 'all' || t.categoryId === filterCatId)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [tasks, filterCatId]);

  // 2. Group by Date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    completedTasks.forEach(task => {
        const title = getGroupTitle(task.completedAt);
        if (!groups[title]) groups[title] = [];
        groups[title].push(task);
    });
    return groups;
  }, [completedTasks]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative bg-[#FFFBF7] w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/50">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-varela font-bold text-stone-700 flex items-center gap-2">
                        📜 历史菜单存档
                    </h2>
                    <p className="text-stone-400 text-sm font-bold mt-1">
                        累计出餐数: {tasks.filter(t => t.status === 'completed').length} 份
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 flex items-center justify-center bg-white text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all shadow-sm border border-stone-100"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Category Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar select-none">
                <button
                    onClick={() => setFilterCatId('all')}
                    className={`
                        px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all
                        ${filterCatId === 'all' 
                            ? 'bg-stone-700 border-stone-700 text-white shadow-md' 
                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'}
                    `}
                >
                    全部
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setFilterCatId(cat.id === filterCatId ? 'all' : cat.id)}
                        className={`
                            px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all flex items-center gap-2
                            ${filterCatId === cat.id 
                                ? 'bg-white border-current shadow-md scale-105' 
                                : 'bg-white border-transparent hover:bg-stone-50 opacity-60 hover:opacity-100'}
                        `}
                        style={{ 
                            color: filterCatId === cat.id ? THEME_COLORS[cat.theme] : undefined,
                            borderColor: filterCatId === cat.id ? undefined : 'transparent' 
                        }}
                    >
                        <span>{cat.icon}</span>
                        <span className={filterCatId === cat.id ? 'text-stone-600' : 'text-stone-500'}>
                            {cat.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-[#FFFBF7] to-white">
            {Object.keys(groupedTasks).length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-300">
                    <span className="text-6xl mb-4 grayscale opacity-50">🍽️</span>
                    <p className="font-bold">暂无存档记录</p>
                </div>
            ) : (
                <div className="space-y-8 pb-10">
                    {Object.entries(groupedTasks).map(([dateTitle, groupTasks]) => (
                        <div key={dateTitle}>
                            {/* Date Separator */}
                            <div className="flex items-center gap-3 mb-4 opacity-50 pl-2">
                                <CalendarDays size={16} className="text-stone-400" />
                                <span className="text-sm font-bold text-stone-500 tracking-wider">
                                    {dateTitle}
                                </span>
                                <div className="h-[2px] flex-1 bg-stone-100 rounded-full" />
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {(groupTasks as Task[]).map((task, index) => {
                                    const category = getCategory(task.categoryId);
                                    const themeClass = category ? THEME_STYLES[category.theme] : THEME_STYLES.slate;
                                    
                                    return (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`
                                                p-3 rounded-2xl border ${themeClass} bg-opacity-30 border-opacity-40 
                                                relative group overflow-hidden hover:bg-opacity-50 transition-all
                                            `}
                                        >
                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 bg-white/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                                        {category?.icon || '✨'} {category?.label || '其他'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-stone-700 text-sm line-through decoration-amber-400 decoration-2 decoration-wavy opacity-70 mb-2">
                                                    {task.title}
                                                </h3>
                                                {task.completedAt && (
                                                    <div className="flex items-center justify-end gap-1 text-[9px] font-bold opacity-40">
                                                        <Clock size={9} />
                                                        {new Date(task.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Decorative Stamp */}
                                            <div className="absolute -bottom-2 -right-2 text-4xl opacity-5 rotate-12 group-hover:opacity-20 transition-opacity">
                                                {category?.icon || '☕'}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default HistoryModal;