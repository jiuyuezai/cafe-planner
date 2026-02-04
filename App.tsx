import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, BarChart2, Zap, Loader2, HardDrive } from 'lucide-react';

import { Task, TimeBlock, Category, ColorTheme, Note, TaskStatus } from './types';
import Column from './components/Column';
import TaskCard from './components/TaskCard';
import ProgressBar from './components/ProgressBar';
import MoodBoard from './components/MoodBoard';
import TaskModal from './components/TaskModal';
import EditTaskModal from './components/EditTaskModal';
import HistoryModal from './components/HistoryModal';
import QuickNotesModal from './components/QuickNotesModal';
import DataManagerModal from './components/DataManagerModal';
import { useSound } from './hooks/useSound';
import { DB } from './utils/db'; // Import IndexedDB wrapper

// --- INITIAL DEFAULT DATA (CAFE THEME - CHINESE) ---

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat1', label: '默认分区1', icon: '📚', theme: 'amber' },
  { id: 'cat2', label: '默认分区2', icon: '🥐', theme: 'rose' },
];

const INITIAL_TASKS: Task[] = [
];

const THEMES: ColorTheme[] = ['amber', 'rose', 'sky', 'emerald', 'violet', 'orange'];

// Custom drop animation to match Framer Motion's feel
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const App: React.FC = () => {
  // Sound Hook
  const { play } = useSound();

  // State: Categories
  const [categories, setCategories] = useState<Category[]>([]);
  // State: Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  // State: Quick Notes
  const [quickNotes, setQuickNotes] = useState<Note[]>([]);

  // Loading State for Async DB
  const [isLoading, setIsLoading] = useState(true);

  // State: UI
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);

  // --- DATA MIGRATION ---
  // Migrate old tasks without createdAt field
  const migrateTaskData = async (tasks: Task[]): Promise<Task[]> => {
    let hasMigrated = false;
    const migratedTasks = tasks.map(task => {
      // If createdAt is missing, use completedAt or current time
      if (!task.createdAt) {
        hasMigrated = true;
        return {
          ...task,
          createdAt: task.completedAt || Date.now()
        };
      }
      return task;
    });
    
    // If migration happened, update all tasks in DB
    if (hasMigrated) {
      console.log('🔄 自动迁移：为旧任务补充 createdAt 时间戳');
      await Promise.all(migratedTasks.map(task => DB.tasks.put(task)));
    }
    return migratedTasks;
  };

  // --- INDEXEDDB INITIALIZATION ---
  useEffect(() => {
    const initData = async () => {
      try {
        // Load Categories
        let dbCats = await DB.categories.getAll();
        if (dbCats.length === 0) {
          await DB.categories.seed(DEFAULT_CATEGORIES);
          dbCats = DEFAULT_CATEGORIES;
        }
        setCategories(dbCats);

        // Load Tasks
        let dbTasks = await DB.tasks.getAll();
        if (dbTasks.length === 0) {
          // Only seed if absolutely empty (first run)
          const hasNotes = (await DB.notes.getAll()).length > 0;
          if (!hasNotes && dbCats.length === DEFAULT_CATEGORIES.length) {
            await DB.tasks.seed(INITIAL_TASKS);
            dbTasks = INITIAL_TASKS;
          }
        } else {
          // Migrate old tasks that lack createdAt field
          dbTasks = await migrateTaskData(dbTasks);
        }
        setTasks(dbTasks);

        // Load Notes
        const dbNotes = await DB.notes.getAll();
        setQuickNotes(dbNotes.sort((a, b) => b.createdAt - a.createdAt));

      } catch (error) {
        console.error("Failed to load data from IndexedDB:", error);
      } finally {
        // Short timeout to let the font load/prevent harsh flash
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    initData();
  }, []);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Logic Helpers
  
  // Helper: Get Beijing time (UTC+8) start of day (00:00:00)
  const getBeijingTodayStart = (): number => {
    const now = new Date();
    // getTimezoneOffset() returns minutes west of UTC (negative for east)
    // Beijing is UTC+8, so offset is -480 minutes
    const userOffsetMinutes = now.getTimezoneOffset();
    const beijingOffsetMinutes = -8 * 60; // UTC+8 = -480 minutes
    const diffMinutes = beijingOffsetMinutes - userOffsetMinutes;
    
    const beijingTime = new Date(now.getTime() + diffMinutes * 60 * 1000);
    beijingTime.setHours(0, 0, 0, 0);
    return beijingTime.getTime();
  };

  // Helper: Check if a completed task should be hidden
  // Hide completed tasks if they were completed before today (Beijing time)
  const shouldHideTask = (task: Task): boolean => {
    if (task.status !== 'completed') return false; // Only hide completed tasks
    if (!task.completedAt) return false; // Safety check - task must have completion time
    
    const beijingTodayStart = getBeijingTodayStart();
    // Hide if completed before today (Beijing time)
    // Tasks completed today stay visible, only hide tasks completed before today
    return task.completedAt < beijingTodayStart;
  };

  // Filter tasks by timeBlock and hide old completed tasks
  const getTasksByBlock = (block: TimeBlock) => 
    tasks.filter(task => task.timeBlock === block && !shouldHideTask(task));
  
  const getCategory = (id: string) => categories.find(c => c.id === id);

  const calculateProgress = () => {
    // Only count visible tasks (filter out hidden old completed tasks)
    const visibleTasks = tasks.filter(task => !shouldHideTask(task));
    if (visibleTasks.length === 0) return 0;
    const completed = visibleTasks.filter(t => t.status === 'completed').length;
    return (completed / visibleTasks.length) * 100;
  };

  const handleToggleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus: TaskStatus = t.status === 'active' ? 'completed' : 'active';
        const updated: Task = {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'completed' ? Date.now() : undefined
        };
        DB.tasks.put(updated); // Sync DB
        return updated;
      }
      return t;
    }));
  };

  // --- HANDLERS ---

  const handleAddTask = (title: string, categoryId: string, timeBlock: TimeBlock) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      categoryId,
      timeBlock,
      status: 'active',
      createdAt: Date.now()
    };
    setTasks(prev => [...prev, newTask]);
    DB.tasks.put(newTask); // Sync DB
  };

  const handleUpdateTask = (id: string, title: string, categoryId: string, timeBlock: TimeBlock) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { 
          ...t, 
          title, 
          categoryId, 
          timeBlock,
          createdAt: t.createdAt || Date.now() // Preserve existing createdAt or set if missing
        };
        DB.tasks.put(updated); // Sync DB
        return updated;
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    DB.tasks.delete(id); // Sync DB
  };

  const handleAddCategory = (label: string, theme: ColorTheme, icon: string) => {
    const newCat: Category = {
      id: Date.now().toString(),
      label,
      theme,
      icon
    };
    setCategories(prev => [...prev, newCat]);
    DB.categories.put(newCat); // Sync DB
  };

  const handleUpdateCategory = (id: string, label: string, theme: ColorTheme, icon: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, label, theme, icon };
        DB.categories.put(updated); // Sync DB
        return updated;
      }
      return c;
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    DB.categories.delete(id); // Sync DB
  };

  const handleAddNote = (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      createdAt: Date.now(),
      // Assign a random pleasant theme
      theme: THEMES[Math.floor(Math.random() * THEMES.length)]
    };
    setQuickNotes(prev => [newNote, ...prev]);
    DB.notes.put(newNote); // Sync DB
  };

  const handleDeleteNote = (id: string) => {
    setQuickNotes(prev => prev.filter(n => n.id !== id));
    DB.notes.delete(id); // Sync DB
  };

  const handleClearData = async () => {
    if (window.confirm('⚠️ 警告：确定要清空所有数据吗？\n此操作将重置所有任务、笔记和分类，且无法撤销。\n\nWarning: Reset all data? This cannot be undone.')) {
      play('delete');
      try {
        await DB.deleteDatabase();
        window.location.reload();
      } catch (e) {
        alert('Reset failed. Please restart the application.');
      }
    }
  };

  const handleImportData = async (newCategories: Category[], newTasks: Task[], newNotes: Note[]) => {
    try {
      // First, clear all existing data
      for (const task of tasks) {
        await DB.tasks.delete(task.id);
      }
      for (const category of categories) {
        await DB.categories.delete(category.id);
      }
      for (const note of quickNotes) {
        await DB.notes.delete(note.id);
      }

      // Ensure all imported tasks have createdAt timestamp
      const tasksWithTimestamp = newTasks.map(task => ({
        ...task,
        createdAt: task.createdAt || Date.now()
      }));

      // Then, import new data
      if (newCategories.length > 0) {
        await DB.categories.seed(newCategories);
      }
      if (tasksWithTimestamp.length > 0) {
        await DB.tasks.seed(tasksWithTimestamp);
      }
      if (newNotes.length > 0) {
        await Promise.all(newNotes.map(note => DB.notes.put(note)));
      }

      // Update state
      setCategories(newCategories);
      setTasks(tasksWithTimestamp);
      setQuickNotes(newNotes.sort((a, b) => b.createdAt - a.createdAt));

      play('open');
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请重试。');
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    play('open');
  };

  // --- DRAG HANDLERS ---

  const handleDragStart = (event: DragStartEvent) => {
    play('grab');
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeTask = tasks.find(t => t.id === activeId);
    const overTask = tasks.find(t => t.id === overId);

    if (!activeTask) return;

    // If over a container directly (empty column)
    if (over.data.current?.sortable?.containerId !== 'active' && ['morning', 'afternoon', 'evening'].includes(overId as string)) {
      if (activeTask.timeBlock !== overId) {
        setTasks((prev) => {
          return prev.map(t => {
            if (t.id === activeId) {
              const updated = { ...t, timeBlock: overId as TimeBlock };
              DB.tasks.put(updated); // Sync DB
              return updated;
            }
            return t;
          });
        });
      }
    }
    // If over another task
    else if (overTask && activeTask.timeBlock !== overTask.timeBlock) {
      setTasks((prev) => {
        return prev.map(t => {
          if (t.id === activeId) {
            const updated = { ...t, timeBlock: overTask.timeBlock };
            DB.tasks.put(updated); // Sync DB
            return updated;
          }
          return t;
        });
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Play drop sound only if actually dropped (activeId was set)
    if (activeId) play('drop');

    setActiveId(null);

    if (!over) return;

    const activeIdVal = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeIdVal);
    const overTask = tasks.find(t => t.id === overId);

    if (activeTask && overTask && activeTask.timeBlock === overTask.timeBlock) {
      const blockTasks = getTasksByBlock(activeTask.timeBlock);
      const oldIndex = blockTasks.findIndex(t => t.id === activeIdVal);
      const newIndex = blockTasks.findIndex(t => t.id === overId);

      if (oldIndex !== newIndex) {
        setTasks((items) => {
          const currentBlockItems = items.filter(t => t.timeBlock === activeTask.timeBlock);
          const otherItems = items.filter(t => t.timeBlock !== activeTask.timeBlock);
          const reorderedBlockItems = arrayMove(currentBlockItems, oldIndex, newIndex);
          // Note: We don't need to sync 'order' to DB in this simple version unless we add an order index field.
          // The current app relies on array order which persists in LocalStorage but IndexedDB getAll() 
          // doesn't guarantee insertion order without a specific index. 
          // For a robust app, we'd add an 'order' field to Task. 
          // For now, we keep visual order state.
          return [...otherItems, ...reorderedBlockItems];
        });
      }
    }
  };

  const activeTaskData = activeId ? tasks.find(t => t.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF0F5] text-stone-400 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} />
        </motion.div>
        <p className="font-varela font-bold tracking-widest text-sm">LOADING CAFE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-3 sm:px-4 pt-8 sm:pt-10 max-w-6xl mx-auto selection:bg-amber-100 relative">

      {/* Top Right Fixed Actions */}
      <div className="fixed top-4 right-2 sm:right-4 z-40 flex flex-col gap-2 sm:gap-3">
        {/* Flash Ideas Button (New) */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            play('open');
            setIsNotesOpen(true);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-yellow-400 rounded-xl shadow-md border-2 border-white flex items-center justify-center text-white hover:bg-amber-450 hover:border-amber-100 transition-colors"
          title="灵感闪念"
        >
          <Zap size={18} fill="currentColor" />
        </motion.button>

        {/* Stats Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            play('open');
            setIsStatsOpen(true);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl shadow-md border-2 border-white flex items-center justify-center text-amber-500 hover:text-amber-600 hover:border-amber-100 transition-colors"
          title="经营数据"
        >
          <BarChart2 size={18} />
        </motion.button>

        {/* History Button (Recipe Book) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            play('open');
            setIsHistoryOpen(true);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl shadow-md border-2 border-white flex items-center justify-center text-rose-400 hover:text-rose-500 hover:border-rose-100 transition-colors"
          title="已出餐记录"
        >
          <BookOpen size={18} />
        </motion.button>

        {/* Data Manager Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            play('open');
            setIsDataManagerOpen(true);
          }}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl shadow-md border-2 border-white flex items-center justify-center text-slate-500 hover:text-slate-600 hover:border-slate-100 transition-colors"
          title="数据管理"
        >
          <HardDrive size={18} />
        </motion.button>
      </div>

      {/* Header */}
      <header className="mb-10 text-center relative z-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-4xl font-varela font-bold text-stone-700 mb-2 tracking-tight drop-shadow-sm flex items-center gap-2">
            魔法喫茶店 <span className="text-3xl">☕</span>
          </h1>
          <p className="text-stone-400 font-bold tracking-widest text-xs uppercase bg-white/50 px-3 py-1 rounded-full inline-block">
            — 经营你的今日特供菜单 —
          </p>
        </motion.div>
      </header>

      {/* Progress */}
      <ProgressBar progress={calculateProgress()} />

      {/* Main Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Column
            id="morning"
            tasks={getTasksByBlock('morning')}
            categories={categories}
            onToggleStatus={handleToggleStatus}
            onEditTask={openEditTask}
          />
          <Column
            id="afternoon"
            tasks={getTasksByBlock('afternoon')}
            categories={categories}
            onToggleStatus={handleToggleStatus}
            onEditTask={openEditTask}
          />
          <Column
            id="evening"
            tasks={getTasksByBlock('evening')}
            categories={categories}
            onToggleStatus={handleToggleStatus}
            onEditTask={openEditTask}
          />
        </div>

        {/* Drag Overlay for smooth visual */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTaskData ? (
            <div className="cursor-grabbing">
              <TaskCard
                task={activeTaskData}
                category={getCategory(activeTaskData.categoryId)}
                onToggleStatus={() => { }}
                isOverlay={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating Action Button - CENTERED BOTTOM */}
      <motion.button
        style={{ x: "-50%" }} 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          play('open');
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 sm:bottom-10 left-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-yellow-300 to-amber-300 text-white rounded-2xl shadow-xl shadow-yellow-200 flex items-center justify-center hover:brightness-110 transition-all z-40 border-4 border-white"
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            categories={categories}
            onAddTask={handleAddTask}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onClearData={handleClearData}
          />
        )}
        {editingTask && (
          <EditTaskModal
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            task={editingTask}
            categories={categories}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {isHistoryOpen && (
          <HistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            tasks={tasks}
            categories={categories}
          />
        )}
        {isStatsOpen && (
          <MoodBoard
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            tasks={tasks}
            categories={categories}
          />
        )}
        {isNotesOpen && (
          <QuickNotesModal
            isOpen={isNotesOpen}
            onClose={() => setIsNotesOpen(false)}
            notes={quickNotes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
        {isDataManagerOpen && (
          <DataManagerModal
            isOpen={isDataManagerOpen}
            onClose={() => setIsDataManagerOpen(false)}
            categories={categories}
            tasks={tasks}
            notes={quickNotes}
            onImportData={handleImportData}
            onPlay={play}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;