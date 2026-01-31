import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Plus, Trash2 } from 'lucide-react';
import { Note, ColorTheme, THEME_STYLES } from '../types';
import { useSound } from '../hooks/useSound';

interface QuickNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
}

const QuickNotesModal: React.FC<QuickNotesModalProps> = ({ 
  isOpen, onClose, notes, onAddNote, onDeleteNote 
}) => {
  const [inputValue, setInputValue] = useState('');
  const { play } = useSound();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      play('note');
      onAddNote(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
      />
      
      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative bg-[#FFFEF0] w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-6 pb-4 bg-[#FFFEF0] z-10 flex justify-between items-center border-b border-amber-100/50">
            <div>
                <h2 className="text-2xl font-varela font-bold text-stone-700 flex items-center gap-2">
                    ⚡ 灵感闪念 
                </h2>
                <p className="text-amber-500/60 text-xs font-bold mt-1 tracking-wider uppercase">
                   速速记下，别让好点子溜走！
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-white text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all shadow-sm border border-stone-100"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[radial-gradient(#E5E7EB_1px,transparent_1px)] [background-size:20px_20px]">
            
            {/* Input Area */}
            <div className="max-w-xl mx-auto mb-10">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-amber-300 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                    <div className="relative bg-white rounded-2xl shadow-sm border border-amber-100 p-2 flex gap-2 items-start">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="有什么新点子？写下来..."
                            className="w-full bg-transparent p-3 outline-none text-stone-600 font-bold placeholder:text-stone-300 resize-none h-[60px] custom-scrollbar"
                        />
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!inputValue.trim()}
                            className="shrink-0 w-14 h-14 bg-amber-400 text-white rounded-xl flex items-center justify-center hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-400 transition-colors shadow-sm active:scale-95"
                        >
                            <Zap size={24} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Grid */}
            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-30 text-stone-400">
                    <Zap size={48} className="mb-2" />
                    <span className="font-bold">暂无灵感</span>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                    <AnimatePresence>
                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 4 - 2 }}
                                animate={{ opacity: 1, scale: 1, rotate: Math.random() * 2 - 1 }}
                                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                className={`
                                    break-inside-avoid relative p-4 rounded-xl shadow-sm border border-white/50 group
                                    ${THEME_STYLES[note.theme].replace('border-', 'border-opacity-0 ')}
                                    hover:shadow-md hover:scale-[1.02] transition-all duration-300
                                `}
                            >
                                <p className="font-varela font-bold text-stone-700 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {note.content}
                                </p>
                                <div className="mt-3 flex justify-between items-end border-t border-black/5 pt-2">
                                    <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => { play('delete'); onDeleteNote(note.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/50 hover:bg-white text-stone-400 hover:text-rose-500 rounded-full transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                {/* Pin visual */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 shadow-sm border border-red-500 opacity-80" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickNotesModal;