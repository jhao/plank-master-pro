import React, { useState, useMemo } from 'react';
import { getLogs } from '../services/storageService';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar as CalIcon, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HistoryTab: React.FC = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);

  // Memoized data processing
  const { logs, logsByDate, lastSession } = useMemo(() => {
    const allLogs = getLogs();
    const map = new Map<string, number>(); // Date -> Max Duration
    
    allLogs.forEach(log => {
      const currentMax = map.get(log.dateString) || 0;
      if (log.duration > currentMax) {
        map.set(log.dateString, log.duration);
      }
    });

    const sortedLogs = [...allLogs].sort((a, b) => b.timestamp - a.timestamp);

    return {
      logs: allLogs,
      logsByDate: map,
      lastSession: sortedLogs[0],
    };
  }, []); // Re-calculate when component mounts/remounts (could add refresh trigger)

  // Chart Data: Last 20 days
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 19; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const duration = logsByDate.get(dateStr) || 0;
      data.push({
        date: dateStr.slice(5), // MM-DD
        duration: Math.round(duration / 60 * 10) / 10, // Minutes
        rawDuration: duration,
      });
    }
    return data;
  }, [logsByDate]);

  // Calendar Helpers
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Adjust so Monday is first (if desired) or Sunday. Let's stick to Standard Sunday start for simplicity or adjust grid.
  // Prompt implies simple calendar.

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
    setSelectedLogDate(null);
  };

  const getDayColor = (day: number) => {
    const currentMonthStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
    const duration = logsByDate.get(dateStr);
    
    // Check previous day
    const prevDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevDuration = logsByDate.get(prevDateStr) || 0;

    if (!duration) return 'bg-gray-800 text-gray-500'; // Missing

    if (duration >= prevDuration) return 'bg-green-500 text-black font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]'; // Improvement or Equal
    return 'bg-yellow-500 text-black font-bold'; // Regression
  };

  const renderCalendar = () => {
    const days = [];
    // Empty slots for start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const colorClass = getDayColor(i);
      const isFuture = new Date(viewDate.getFullYear(), viewDate.getMonth(), i) > new Date();
      
      days.push(
        <button
          key={i}
          disabled={isFuture}
          onClick={() => setSelectedLogDate(`${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`)}
          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all ${isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-80'} ${colorClass}`}
        >
          <span>{i}</span>
          {selectedLogDate?.endsWith(`-${String(i).padStart(2, '0')}`) && (
            <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20 overflow-y-auto no-scrollbar">
      {/* Header Stat */}
      <div className="p-6 bg-gray-800 rounded-b-3xl shadow-xl">
        <h2 className="text-gray-400 text-sm font-medium mb-1 flex items-center gap-2">
          <Clock size={16} /> 上次训练
        </h2>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {lastSession ? Math.floor(lastSession.duration / 60) : 0}
          </span>
          <span className="text-sm text-gray-400">分</span>
          <span className="text-4xl font-bold text-white">
            {lastSession ? lastSession.duration % 60 : 0}
          </span>
          <span className="text-sm text-gray-400">秒</span>
        </div>
        {lastSession && <div className="text-xs text-gray-500 mt-1">{lastSession.dateString}</div>}
      </div>

      {/* Calendar Controls */}
      <div className="px-6 mt-6 mb-2 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><ChevronLeft size={20} /></button>
        <span className="text-lg font-semibold">
          {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
        </span>
        <button 
          onClick={() => changeMonth(1)} 
          disabled={new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) > new Date()}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs text-gray-500">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedLogDate && (
         <div className="mx-6 mb-8 p-4 bg-gray-800 rounded-xl border border-gray-700 animate-fade-in">
           <h3 className="text-gray-300 text-sm mb-2 flex items-center gap-2"><CalIcon size={16}/> {selectedLogDate} 详情</h3>
           {logsByDate.get(selectedLogDate) ? (
             <div className="text-2xl font-bold text-green-400">
                {Math.floor((logsByDate.get(selectedLogDate) || 0) / 60)}分 {(logsByDate.get(selectedLogDate) || 0) % 60}秒
             </div>
           ) : (
             <div className="text-gray-500">无训练记录</div>
           )}
         </div>
      )}

      {/* Charts Section */}
      <div className="px-6 mb-8">
        <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={16} /> 近20天趋势
        </h3>
        <div className="h-48 w-full bg-gray-800/50 rounded-xl p-2 border border-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 10}} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="m" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#4ADE80' }}
                formatter={(value: number) => [`${value} 分钟`, '时长']}
              />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="#4ADE80" 
                strokeWidth={3} 
                dot={{fill: '#4ADE80', r: 3}}
                activeDot={{r: 6, fill: '#fff'}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;