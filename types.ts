
export type TimeBlock = 'morning' | 'afternoon' | 'evening';
export type TaskStatus = 'active' | 'completed';

// Color themes available for user selection
export type ColorTheme = 'sky' | 'violet' | 'orange' | 'rose' | 'emerald' | 'amber' | 'slate';

export interface Category {
  id: string;
  label: string;
  icon: string; // New: Emoji icon
  theme: ColorTheme;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string; // Links to Category.id
  timeBlock: TimeBlock;
  status: TaskStatus;
  completedAt?: number; // Timestamp for history
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  theme: ColorTheme;
}

// Visual definitions for the themes
export const THEME_STYLES: Record<ColorTheme, string> = {
  sky:    'bg-sky-100 text-sky-700 border-sky-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  rose:   'bg-rose-100 text-rose-700 border-rose-200',
  emerald:'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber:  'bg-amber-100 text-amber-700 border-amber-200',
  slate:  'bg-slate-100 text-slate-600 border-slate-200',
};

// For color picker swatches
export const THEME_COLORS: Record<ColorTheme, string> = {
  sky:    '#E0F2FE',
  violet: '#EDE9FE',
  orange: '#FFEDD5',
  rose:   '#FFE4E6',
  emerald:'#D1FAE5',
  amber:  '#FEF3C7',
  slate:  '#F1F5F9',
};

export const TIME_BLOCK_LABELS: Record<TimeBlock, string> = {
  morning: '🥨 早餐',
  afternoon: '🍭 下午茶',
  evening: '🍷 宵夜'
};