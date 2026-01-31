import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, PieChart, Award, Zap, X, TrendingUp } from 'lucide-react';
import { Task, Category, ColorTheme } from '../types';

interface MoodBoardProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
}

// Maps theme to a stronger color for progress bars
const PROGRESS_COLORS: Record<ColorTheme, string> = {
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  orange: 'bg-orange-400',
  rose: 'bg-rose-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  slate: 'bg-slate-400',
};

const MoodBoard: React.FC<MoodBoardProps> = ({ isOpen, onClose, tasks, categories }) => {
  // --- Statistics Logic ---
  
  // 1. Completion Rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Category Breakdown
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tasks.forEach(t => {
      const catId = t.categoryId;
      stats[catId] = (stats[catId] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([id, count]) => ({
        category: categories.find(c => c.id === id),
        count,
        percentage: Math.round((count / totalTasks) * 100)
      }))
      .filter(item => item.category)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [tasks, categories, totalTasks]);

  // 3. Peak Time Block
  const peakTime = useMemo(() => {
    const counts = { morning: 0, afternoon: 0, evening: 0 };
    tasks.filter(t => t.status === 'completed').forEach(t => {
      if (counts[t.timeBlock] !== undefined) counts[t.timeBlock]++;
    });
    const max = Math.max(counts.morning, counts.afternoon, counts.evening);
    if (max === 0) return '暂无数据';
    if (counts.morning === max && counts.morning > 0) return '早高峰';
    if (counts.afternoon === max && counts.afternoon > 0) return '下午茶';
    if (counts.evening === max && counts.evening > 0) return '晚间档';
    return '暂无数据';
  }, [tasks]);

//   // 4. Mock Weekly Data
//   const weeklyData = useMemo(() => {
//     const days = ['一', '二', '三', '四', '五', '六', '日'];
//     const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1; 
    
//     return days.map((day, i) => {
//         let val = Math.floor(Math.random() * 6) + 1;
//         if (i === todayIndex) val = completedTasks;
//         if (i > todayIndex) val = 0;
//         return { day, value: val, isToday: i === todayIndex };
//     });
//   }, [completedTasks]);

// 4. Real Weekly Data
  const weeklyData = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const now = new Date();
    // JS中周日是0，这里将其转为索引6 (周一为0)
    const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1; 
    
    // 1. 计算本周一的零点时间 (作为基准线)
    const startOfWeek = new Date(now);
    const currentDay = now.getDay() || 7; // 把周日0变为7，方便计算
    startOfWeek.setDate(now.getDate() - currentDay + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. 初始化本周7天的计数器 [0, 0, 0, 0, 0, 0, 0]
    const counts = new Array(7).fill(0);

    // 3. 遍历任务并归类
    tasks.forEach(t => {
      if (t.status === 'completed' && t.completedAt) {
        const taskDate = new Date(t.completedAt);
        const taskTime = taskDate.getTime();
        
        // 计算该任务距离本周一相差几天
        const diffTime = taskTime - startOfWeek.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // 如果该任务属于本周 (0 到 6 之间)，则对应那天的计数+1
        if (diffDays >= 0 && diffDays <= 6) {
          counts[diffDays]++;
        }
      }
    });

    // 4. 组装数据给 UI 渲染
    return days.map((day, i) => ({
      day,
      value: counts[i],
      isToday: i === todayIndex
    }));
  }, [tasks]); // 依赖项改为 tasks，只要任务变动就重新计算

  if (!isOpen) return null;

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
        className="relative bg-[#FDFDFD] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-white flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center bg-white z-10">
            <div>
                <h2 className="text-2xl font-varela font-bold text-stone-700 flex items-center gap-2">
                    📊 经营报表
                </h2>
                <p className="text-stone-400 text-sm font-bold mt-1">
                    今日已成功出品 {completedTasks} 份订单
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center bg-stone-50 text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-all"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Chart 1: Weekly */}
                <div className="bg-stone-50/50 rounded-[2rem] p-5 border border-stone-100 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-amber-400" />
                        <h3 className="text-stone-600 font-bold text-sm">本周完成情况</h3>
                    </div>
                    {/* Updated Layout for Chart */}
                    <div className="flex justify-between items-stretch h-36 px-2 pb-1">
                        {weeklyData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center justify-end gap-2 group cursor-pointer flex-1">
                                <div className="relative w-full flex-1 flex justify-center items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${d.value === 0 ? 2 : Math.min(d.value * 15, 100)}%` }}
                                        transition={{ delay: i * 0.05, type: 'spring' }}
                                        className={`
                                            w-3 md:w-5 rounded-t-full transition-colors min-h-[4px]
                                            ${d.isToday 
                                                ? 'bg-amber-400' 
                                                : d.value === 0 ? 'bg-stone-100' : 'bg-stone-200 group-hover:bg-amber-200'}
                                        `}
                                    />
                                    {/* Tooltip for value */}
                                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-800 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap z-20 pointer-events-none">
                                        {d.value} 单
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold ${d.isToday ? 'text-amber-500' : 'text-stone-300'}`}>
                                    {d.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Key Metrics */}
                <div className="bg-rose-50/30 rounded-[2rem] p-5 border border-rose-100 flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-center gap-2 mb-4">
                        <Award size={18} className="text-rose-400" />
                        <h3 className="text-stone-600 font-bold text-sm">高光时刻</h3>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-bold text-stone-700">{completionRate}<span className="text-sm text-stone-400 ml-1">%</span></div>
                            <div className="text-xs text-stone-400 mt-1 font-bold">出餐完成率</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-stone-700">{peakTime}</div>
                            <div className="text-xs text-stone-400 mt-1 font-bold">时间段</div>
                        </div>
                    </div>
                </div>

                {/* Chart 3: Categories */}
                <div className="bg-sky-50/30 rounded-[2rem] p-5 border border-sky-100 min-h-[140px]">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart size={18} className="text-sky-400" />
                        <h3 className="text-stone-600 font-bold text-sm">热门榜</h3>
                    </div>
                    <div className="space-y-3">
                        {categoryStats.length > 0 ? categoryStats.map((stat, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                                    <span>{stat.category?.icon} {stat.category?.label}</span>
                                    <span>{stat.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.percentage}%` }}
                                        transition={{ delay: 0.3 + (idx * 0.1) }}
                                        className={`h-full rounded-full ${PROGRESS_COLORS[stat.category?.theme || 'slate']}`}
                                    />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-xs text-stone-300 py-2">
                                暂无销售记录
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MoodBoard;