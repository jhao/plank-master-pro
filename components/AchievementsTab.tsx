import React, { useMemo, useState } from 'react';
import { getLogs } from '../services/storageService';
import { Trophy, Medal, Award, Share2, X, Download, Star } from 'lucide-react';
import { Achievement } from '../types';

const AchievementsTab: React.FC = () => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const { stats, achievements } = useMemo(() => {
    const logs = getLogs();
    
    // Calculate Unique Days
    const uniqueDays = new Set(logs.map(l => l.dateString));
    const totalDays = uniqueDays.size;

    // Calculate Streak
    const sortedDays = Array.from(uniqueDays).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    
    if (sortedDays.length > 0) {
      // Simple streak logic
      let streak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i-1]);
        const curr = new Date(sortedDays[i]);
        const diffTime = Math.abs(curr.getTime() - prev.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
            streak++;
        } else {
            maxStreak = Math.max(maxStreak, streak);
            streak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, streak);
      
      // Check if streak is current (i.e. includes today or yesterday)
      const lastDay = new Date(sortedDays[sortedDays.length - 1]);
      const today = new Date();
      const diffToToday = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 3600 * 24));
      if (diffToToday <= 1) {
          currentStreak = streak;
      }
    }

    // Generate Achievements
    const list: Achievement[] = [];

    // Newbie Achievement
    list.push({
        id: 'first-workout',
        title: '初出茅庐',
        description: '完成你的第一次平板支撑训练！',
        icon: '🌟',
        type: 'total',
        threshold: 1,
        unlockedAt: logs.length > 0 ? Date.now() : undefined
    });

    const milestones = [5, 10, 20, 50, 100, 200, 300, 400, 500];

    milestones.forEach(day => {
        // Consecutive
        list.push({
            id: `streak-${day}`,
            title: `连续坚持${day}天`,
            description: `不可思议！你连续坚持了${day}天。`,
            icon: '🔥',
            type: 'streak',
            threshold: day,
            unlockedAt: maxStreak >= day ? Date.now() : undefined
        });
        
        // Total
        list.push({
            id: `total-${day}`,
            title: `累计训练${day}天`,
            description: `积少成多，你已经累计训练了${day}天。`,
            icon: '🛡️',
            type: 'total',
            threshold: day,
            unlockedAt: totalDays >= day ? Date.now() : undefined
        });
    });

    return {
        stats: { totalDays, maxStreak, currentStreak },
        achievements: list
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20 overflow-y-auto no-scrollbar scroll-touch">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span className="text-3xl font-bold text-orange-500">{stats.maxStreak}</span>
            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">最长连续(天)</span>
        </div>
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-700">
            <span className="text-3xl font-bold text-blue-500">{stats.totalDays}</span>
            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">累计天数</span>
        </div>
      </div>

      {/* Achievement List */}
      <div className="px-6">
        <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
            <Award size={16}/> 成就墙
        </h3>
        <div className="grid grid-cols-2 gap-4 pb-10">
            {achievements.map((ach) => (
                <button 
                    key={ach.id}
                    onClick={() => ach.unlockedAt && setSelectedAchievement(ach)}
                    className={`
                        relative p-4 rounded-xl text-left transition-all duration-300 overflow-hidden active:scale-95
                        ${ach.unlockedAt 
                            ? 'bg-gradient-to-br from-gray-800 to-gray-700 border border-yellow-500/30 hover:border-yellow-500 shadow-lg' 
                            : 'bg-gray-800/50 border border-gray-800 opacity-60 grayscale cursor-not-allowed'
                        }
                    `}
                >
                    <div className="text-3xl mb-2">{ach.icon}</div>
                    <div className={`font-bold text-sm ${ach.unlockedAt ? 'text-white' : 'text-gray-500'}`}>
                        {ach.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight line-clamp-2">{ach.description}</div>
                    {ach.unlockedAt && (
                        <div className="absolute top-2 right-2 text-yellow-500">
                            <Medal size={16} fill="currentColor" />
                        </div>
                    )}
                </button>
            ))}
        </div>
      </div>

      {/* Share Modal */}
      {selectedAchievement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm">
              <div className="w-full max-w-sm bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 relative animate-fade-in">
                  <button 
                    onClick={() => setSelectedAchievement(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2 bg-black/20 rounded-full"
                  >
                      <X size={24} />
                  </button>

                  {/* Poster Area - Designed to be screenshotted */}
                  <div id="share-card" className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                      
                      <div className="relative z-10">
                        <div className="mx-auto w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-6xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-white/20">
                            {selectedAchievement.icon}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            我达成了新成就！
                        </h2>
                        <h3 className="text-xl font-black text-yellow-400 mb-6 uppercase">
                            {selectedAchievement.title}
                        </h3>
                        
                        <div className="bg-black/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                            <p className="text-gray-200 text-sm leading-relaxed italic">
                                "{selectedAchievement.description}"
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-mono">
                            <span>PLANK MASTER PRO</span>
                            <span>•</span>
                            <span>{new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                  </div>

                  <div className="p-4 bg-gray-900 text-center">
                    <p className="text-gray-400 text-xs mb-3">长按图片保存，或截屏分享到微信/小红书</p>
                    <button className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        <Share2 size={18} /> 分享成就
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AchievementsTab;