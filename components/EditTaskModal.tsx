import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Save } from 'lucide-react';
import { Task, Category, THEME_STYLES, TimeBlock } from '../types';
import { useSound } from '../hooks/useSound';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  categories: Category[];
  onUpdateTask: (id: string, title: string, categoryId: string, timeBlock: TimeBlock) => void;
  onDeleteTask: (id: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen, onClose, task, categories, onUpdateTask, onDeleteTask
}) => {
  const { play } = useSound();
  const [title, setTitle] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setSelectedCatId(task.categoryId);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && selectedCatId) {
      play('success');
      // Pass the original timeBlock since we removed the ability to edit it here
      onUpdateTask(task.id, title, selectedCatId, task.timeBlock);
      onClose();
    }
  };

  const handleDelete = () => {
    play('delete');
    onDeleteTask(task.id);
    onClose();
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
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative bg-white w-full mx-4 max-w-[540px] rounded-[2rem] shadow-2xl overflow-hidden border-[3px] border-amber-100 flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
            <h3 className="text-base sm:text-lg font-varela font-bold text-stone-700">编辑订单</h3>
            <button 
                onClick={onClose} 
                className="w-8 h-8 flex items-center justify-center bg-stone-50 text-stone-300 hover:bg-amber-50 hover:text-amber-400 rounded-full transition-colors"
            >
                <X size={16} strokeWidth={2.5} />
            </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
            {/* Title Input */}
            <div className="bg-stone-50 rounded-2xl p-3 sm:p-4 border-2 border-transparent focus-within:border-amber-200 transition-colors">
                <textarea 
                    placeholder=""
                    rows={2}
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent outline-none text-stone-600 font-bold placeholder:text-stone-300 text-base sm:text-lg"
                />
            </div>

            {/* Category Selection */}
            <div>
                <p className="text-[10px] font-bold text-stone-400 mb-2 pl-2 uppercase tracking-wider opacity-60">
                    更改制作台
                </p>
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

            <div className="flex gap-2 sm:gap-3 mt-2 flex-col sm:flex-row min-h-[44px]">
                <button
                    type="button"
                    onClick={handleDelete}
                    className="flex-1 py-3 rounded-xl bg-rose-100 text-rose-500 font-bold text-xs sm:text-sm hover:bg-rose-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Trash2 size={16} /> 删除
                </button>
                <button 
                    type="submit"
                    disabled={!title.trim()}
                    className="flex-1 sm:flex-[2] py-3 rounded-xl bg-amber-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-200 hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                    <Save size={16} /> 保存修改
                </button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditTaskModal;