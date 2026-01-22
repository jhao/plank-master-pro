import React, { useState } from 'react';
import { Tab } from './types';
import { Dumbbell, Calendar, Award, User } from 'lucide-react';
import TrainingTab from './components/TrainingTab';
import HistoryTab from './components/HistoryTab';
import AchievementsTab from './components/AchievementsTab';
import ProfileTab from './components/ProfileTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRAINING);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.TRAINING:
        return <TrainingTab />;
      case Tab.HISTORY:
        return <HistoryTab />;
      case Tab.ACHIEVEMENTS:
        return <AchievementsTab />;
      case Tab.PROFILE:
        return <ProfileTab />;
      default:
        return <TrainingTab />;
    }
  };

  const navItems = [
    { id: Tab.TRAINING, label: '开始训练', icon: Dumbbell },
    { id: Tab.HISTORY, label: '历史训练', icon: Calendar },
    { id: Tab.ACHIEVEMENTS, label: '我的成就', icon: Award },
    { id: Tab.PROFILE, label: '个人信息', icon: User },
  ];

  return (
    <div className="h-[100dvh] w-full flex flex-col max-w-md mx-auto bg-gray-900 shadow-2xl relative overflow-hidden">
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative z-0">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 pb-safe safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-all duration-200 ${
                  isActive ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;