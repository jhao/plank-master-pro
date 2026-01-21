import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile, addBodyMetric } from '../services/storageService';
import { UserProfile, BodyMetric } from '../types';
import { User, Ruler, Weight, Activity, Save } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProfileTab: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<BodyMetric>({ date: new Date().toISOString().split('T')[0], weight: 0, waist: 0, age: 0 });
  const [activeMetric, setActiveMetric] = useState<'weight' | 'waist'>('weight');

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    const lastMetric = p.metrics[p.metrics.length - 1];
    setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: lastMetric?.weight || 60,
        waist: lastMetric?.waist || 70,
        age: lastMetric?.age || 25,
    });
  }, []);

  const handleSave = () => {
    if (!profile) return;
    
    // Update basic info
    const updatedProfile = { ...profile }; // Shallow copy
    saveProfile(updatedProfile);

    // Add metric log
    addBodyMetric(formData);
    
    // Refresh local state
    setProfile(getProfile());
    alert('信息已更新');
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20 overflow-y-auto no-scrollbar">
      
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-1">个人中心</h1>
        <p className="text-gray-400 text-sm">记录身体变化，见证更好的自己</p>
      </div>

      {/* Inputs Card */}
      <div className="mx-4 bg-gray-800 rounded-2xl p-6 shadow-lg mb-6 border border-gray-700">
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">体重 (kg)</label>
                <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 border border-gray-700 focus-within:border-green-500">
                    <Weight size={20} className="text-gray-500 mr-3" />
                    <input 
                        type="number" 
                        value={formData.weight} 
                        onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                        className="bg-transparent text-white w-full focus:outline-none font-mono text-lg"
                    />
                </div>
            </div>

            <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">腰围 (cm)</label>
                <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 border border-gray-700 focus-within:border-green-500">
                    <Ruler size={20} className="text-gray-500 mr-3" />
                    <input 
                        type="number" 
                        value={formData.waist} 
                        onChange={e => setFormData({...formData, waist: Number(e.target.value)})}
                        className="bg-transparent text-white w-full focus:outline-none font-mono text-lg"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">年龄</label>
                    <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 border border-gray-700">
                        <User size={20} className="text-gray-500 mr-3" />
                        <input 
                            type="number" 
                            value={formData.age} 
                            onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                            className="bg-transparent text-white w-full focus:outline-none font-mono text-lg"
                        />
                    </div>
                </div>
                 <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">性别</label>
                    <select 
                        className="w-full h-[52px] bg-gray-900 text-white rounded-lg px-4 border border-gray-700 focus:outline-none"
                        value={profile.gender}
                        onChange={(e) => {
                             const p = getProfile();
                             p.gender = e.target.value as any;
                             saveProfile(p);
                             setProfile(p);
                        }}
                    >
                        <option value="male">男</option>
                        <option value="female">女</option>
                        <option value="other">其他</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors"
            >
                <Save size={18} /> 更新今日数据
            </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mx-4 mb-8">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium flex items-center gap-2">
                <Activity size={16} /> 变化趋势
            </h3>
            <div className="flex bg-gray-800 rounded-lg p-1">
                <button 
                    onClick={() => setActiveMetric('weight')}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${activeMetric === 'weight' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
                >
                    体重
                </button>
                <button 
                    onClick={() => setActiveMetric('waist')}
                    className={`px-3 py-1 text-xs rounded-md transition-all ${activeMetric === 'waist' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
                >
                    腰围
                </button>
            </div>
        </div>

        <div className="h-64 w-full bg-gray-800 rounded-xl p-2 border border-gray-700">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={profile.metrics}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetric === 'weight' ? '#3B82F6' : '#EC4899'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={activeMetric === 'weight' ? '#3B82F6' : '#EC4899'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                tick={{fontSize: 10}} 
                tickMargin={10} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val.slice(5)} 
              />
              <YAxis 
                domain={['auto', 'auto']} 
                stroke="#9CA3AF" 
                tick={{fontSize: 10}} 
                axisLine={false} 
                tickLine={false} 
                unit={activeMetric === 'weight' ? 'kg' : 'cm'}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey={activeMetric} 
                stroke={activeMetric === 'weight' ? '#3B82F6' : '#EC4899'} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
