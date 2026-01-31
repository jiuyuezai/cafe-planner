import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Task, TimeBlock, TIME_BLOCK_LABELS, Category } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  id: TimeBlock;
  tasks: Task[];
  categories: Category[]; // Receive categories
  onToggleStatus: (id: string) => void;
  onEditTask: (task: Task) => void; // New Prop
}

const Column: React.FC<ColumnProps> = ({ id, tasks, categories, onToggleStatus, onEditTask }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Helper to find category
  const getCategory = (catId: string) => categories.find(c => c.id === catId);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-varela font-bold text-slate-600 mb-4 pl-3">
        {TIME_BLOCK_LABELS[id]}
      </h2>
      
      <motion.div 
        ref={setNodeRef}
        animate={{ 
          backgroundColor: isOver ? 'rgba(255, 228, 230, 0.8)' : 'rgba(255, 255, 255, 0.6)',
          scale: isOver ? 1.02 : 1
        }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
        className={`
          flex-1 p-4 rounded-[2.5rem] min-h-[300px] 
          ${isOver ? 'ring-4 ring-rose-200 ring-opacity-50' : ''}
          border-2 border-white shadow-sm backdrop-blur-md
        `}
      >
        <SortableContext 
          id={id} 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200/50 rounded-3xl p-4">
               <motion.span 
                 className="text-4xl mb-3 opacity-60"
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
               >
                 🍽️
               </motion.span>
               <span className="text-sm font-medium tracking-wide">这里空空如也</span>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                category={getCategory(task.categoryId)}
                onToggleStatus={onToggleStatus} 
                onEdit={onEditTask}
              />
            ))
          )}
        </SortableContext>
      </motion.div>
    </div>
  );
};

export default Column;