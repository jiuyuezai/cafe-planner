import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Check, GripVertical, PenLine } from 'lucide-react';
import { Task, Category, THEME_STYLES } from '../types';
import { useSound } from '../hooks/useSound';

interface TaskCardProps {
  task: Task;
  category?: Category; // Now optional/dynamic
  onToggleStatus: (id: string) => void;
  isOverlay?: boolean; // Prop to indicate if this is being rendered in DragOverlay
  onEdit?: (task: Task) => void; // Optional for DragOverlay
}

const TaskCard: React.FC<TaskCardProps> = ({ task, category, onToggleStatus, isOverlay, onEdit }) => {
  const { play } = useSound();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  // If rendered in Overlay, force dragging state visually, but don't apply sortable transforms
  const isDragging = isOverlay || isSortableDragging;

  const style = {
    // If in overlay, we don't apply the sortable transform (DragOverlay handles positioning)
    transform: isOverlay ? undefined : CSS.Translate.toString(transform),
    transition, // dnd-kit's transition for shuffling siblings
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging && !isOverlay ? 0.3 : 1, // Dim the original item placeholder
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'active') {
      play('finish');
      // Sprinkles Confetti Colors
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FDBA74', '#bef264', '#fca5a5', '#EAE0C8'], // Orange, Green, Pink, Cream
        disableForReducedMotion: true
      });
    }
    onToggleStatus(task.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.(task);
  }

  const isCompleted = task.status === 'completed';
  
  // Default to slate if category deleted
  const themeClass = category ? THEME_STYLES[category.theme] : THEME_STYLES.slate;
  const categoryLabel = category ? category.label : '特殊订单';
  const categoryIcon = category ? category.icon : '✨';
  const isSpecial = !category;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="touch-none mb-4 select-none group relative outline-none"
    >
      <motion.div
        layout
        initial={false}
        animate={isDragging 
            ? { 
                scale: 1.05, 
                rotate: 3, 
                boxShadow: "0px 15px 25px rgba(0,0,0,0.1)",
                y: 0
              } 
            : { 
                scale: 1, 
                rotate: 0, 
                boxShadow: "0px 2px 5px rgba(0,0,0,0.05)",
                y: 0
              }
        }
        whileHover={!isDragging ? { scale: 1.02, y: -2 } : undefined}
        whileTap={!isDragging ? { scale: 0.98 } : undefined}
        // SMOOTHER SPRING CONFIGURATION
        transition={{ 
            type: "spring", 
            stiffness: 350, 
            damping: 25,
            mass: 0.8 // Lighter mass for snappier but smooth feel
        }}
        className={`
          relative p-4 rounded-[1.5rem] border-b-[6px] transition-colors duration-200 cursor-grab active:cursor-grabbing
          ${isCompleted 
            ? `${themeClass} shadow-md border-opacity-40` 
            : 'bg-white border-stone-200 text-stone-500 border-2'}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle Indicator (Visual only) */}
          <div className="p-1.5 rounded-xl text-stone-300">
             <GripVertical size={18} />
          </div>

          {/* Content */}
          <div className="flex-1 relative min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
               {/* Label Logic: Neon effect for 'Special Orders' when active */}
               {isSpecial && !isCompleted ? (
                 <motion.span 
                   className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 bg-stone-800 border border-fuchsia-500/30 text-fuchsia-200 shadow-sm"
                   animate={{
                     boxShadow: [
                        "0 0 2px rgba(232, 121, 249, 0.1)", 
                        "0 0 10px rgba(232, 121, 249, 0.6)", 
                        "0 0 2px rgba(232, 121, 249, 0.1)"
                     ],
                     textShadow: [
                        "0 0 0px rgba(232, 121, 249, 0)",
                        "0 0 4px rgba(232, 121, 249, 0.8)",
                        "0 0 0px rgba(232, 121, 249, 0)"
                     ]
                   }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 >
                   {categoryIcon} {categoryLabel}
                 </motion.span>
               ) : (
                  <span className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-full flex items-center gap-1 ${isCompleted ? 'bg-white/40' : 'bg-stone-100 text-stone-400'}`}>
                    <span>{categoryIcon}</span> {categoryLabel}
                  </span>
               )}
            </div>
            {/* Added min-w-0 to parent and whitespace-pre-wrap to handle wrapping correctly */}
            <h3 className={`font-varela font-bold text-[17px] leading-tight break-words whitespace-pre-wrap pr-1 ${isCompleted ? 'opacity-90' : 'text-stone-600'}`}>
              {task.title}
            </h3>
          </div>

          {/* Edit Button - Smaller Size */}
          {!isDragging && (
             <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleEdit}
                whileHover={{ scale: 1.1, backgroundColor: isCompleted ? "rgba(255,255,255,0.5)" : "#F5F5F4" }}
                whileTap={{ scale: 0.9 }}
                className={`
                   w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-colors
                   ${isCompleted ? 'text-white/70 hover:text-white' : 'text-stone-300 hover:text-amber-500'}
                `}
                title="编辑任务"
             >
                <PenLine size={14} strokeWidth={2.5} />
             </motion.button>
          )}

          {/* Serve Button */}
          <motion.button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleComplete}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.8 }}
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm
              transition-all duration-300 shrink-0 cursor-pointer
              ${isCompleted 
                ? 'bg-yellow-400 text-white shadow-md ring-2 ring-yellow-200 ring-offset-1' 
                : 'bg-stone-100 text-stone-300 hover:bg-yellow-100 hover:text-yellow-600'}
            `}
          >
            <AnimatePresence mode='wait'>
                {isCompleted ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1.2, rotate: [0, -15, 15, 0] }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                        {/* Checkmark Icon */}
                        <Check size={28} strokeWidth={4} />
                    </motion.div>
                ) : (
                    <motion.div key="empty" className="w-4 h-4 rounded-full border-2 border-current opacity-50" />
                )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Shine effect for served dishes */}
        {isCompleted && (
           <motion.div 
             initial={{ x: -150, opacity: 0 }}
             animate={{ x: 300, opacity: [0, 0.4, 0] }}
             transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: "linear" }}
             className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 pointer-events-none mix-blend-overlay"
           />
        )}
      </motion.div>
    </div>
  );
};

export default TaskCard;