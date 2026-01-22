import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, Camera } from 'lucide-react';
import { saveLog, getDailyLogs } from '../services/storageService';

const MAX_DAILY_ATTEMPTS = 3;

const TrainingTab: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [timer, setTimer] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dailyAttempts, setDailyAttempts] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check daily attempts on mount
    const today = new Date().toISOString().split('T')[0];
    const logs = getDailyLogs(today);
    setDailyAttempts(logs.length);
  }, []);

  const handleStreamSuccess = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      // iOS Safari requires explicit play() in some contexts, and handling the promise is safer
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(e => console.error("Video play failed:", e));
      };
    }
    setPermissionError(false);
    setErrorMessage('');
  };

  const startCamera = async () => {
    setPermissionError(false);
    setErrorMessage('');

    // Check if browser supports mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError(true);
      setErrorMessage("浏览器不支持或未通过HTTPS访问");
      return;
    }

    try {
      // First try: Ideal settings for mobile (User facing, modest resolution)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      });
      handleStreamSuccess(stream);
    } catch (err: any) {
      console.warn('Preferred camera settings failed, retrying with defaults...', err);
      
      // Fallback: Try minimal constraints
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, // Just ask for any video
          audio: false,
        });
        handleStreamSuccess(stream);
      } catch (fallbackErr: any) {
        console.error('Camera fallback error:', fallbackErr);
        setPermissionError(true);
        
        // Determine specific error message
        if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
            setErrorMessage("访问被拒绝，请检查浏览器权限设置");
        } else if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
            setErrorMessage("未检测到摄像头设备");
        } else if (fallbackErr.name === 'NotReadableError' || fallbackErr.name === 'TrackStartError') {
            setErrorMessage("摄像头可能被其他应用占用");
        } else {
            setErrorMessage(`无法启动摄像头: ${fallbackErr.name || '未知错误'}`);
        }
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = 880; // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const handleStart = async () => {
    if (dailyAttempts >= MAX_DAILY_ATTEMPTS) {
      alert("您今天的训练次数已用完 (3次)，请明天再来！");
      return;
    }

    await startCamera();
    
    setIsTraining(true);
    setTimer(0);
    
    // Start Timer
    timerRef.current = window.setInterval(() => {
      setTimer((prev) => {
        const next = prev + 1;
        if (next > 0 && next % 10 === 0) {
          playBeep();
        }
        return next;
      });
    }, 1000);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopCamera();
    setIsTraining(false);
    
    if (timer > 5) { // Only save if > 5 seconds to avoid accidental clicks
      saveLog(timer);
      setDailyAttempts(prev => prev + 1);
      alert(`训练结束！本次成绩: ${formatTime(timer)}`);
    } else {
      alert("时间太短，未记录成绩");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20">
      {/* Top Video Section - 25% height */}
      <div className="h-1/4 w-full bg-black relative overflow-hidden flex items-center justify-center border-b border-gray-800 shrink-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover transform scale-x-[-1]" 
        />
        {!isTraining && !permissionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="text-center text-gray-400">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p>点击开始启用摄像头</p>
            </div>
          </div>
        )}
        {permissionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/90 z-20 px-4">
             <div className="text-center text-white">
              <AlertCircle size={48} className="mx-auto mb-2 text-red-500" />
              <p className="font-bold mb-1">无法访问摄像头</p>
              <p className="text-sm text-gray-300">{errorMessage || '请检查权限设置'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Controls Section */}
      <div className="flex-1 flex flex-col items-center justify-start py-4 px-6 space-y-4 overflow-y-auto no-scrollbar">
        
        {/* Demonstration Image */}
        <div className="w-full max-w-[280px] bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg shrink-0">
             <div className="relative h-24 w-full">
                <img 
                  src="https://static.vecteezy.com/system/resources/thumbnails/008/573/039/small/man-doing-plank-abdominals-exercise-flat-illustration-isolated-on-white-background-vector.jpg" 
                  alt="Standard Plank Position"
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-[2px] py-1">
                    <p className="text-center text-[10px] text-gray-200">
                        保持身体成一直线，核心收紧
                    </p>
                </div>
             </div>
        </div>

        {/* Timer Display */}
        <div className="text-7xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 drop-shadow-lg shrink-0">
          {formatTime(timer)}
        </div>

        {/* Daily Stats Mini View */}
        <div className="text-gray-400 text-xs font-medium bg-gray-800 px-4 py-1.5 rounded-full shrink-0">
          今日已打卡: <span className="text-white">{dailyAttempts}</span> / {MAX_DAILY_ATTEMPTS}
        </div>

        {/* Action Button */}
        <button
          onClick={isTraining ? handleStop : handleStart}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-2xl shrink-0
            ${isTraining 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
              : 'bg-green-500 hover:bg-green-600 ring-4 ring-green-500/30'
            }
          `}
        >
          {isTraining ? (
            <Square size={36} fill="currentColor" className="text-white" />
          ) : (
            <Play size={36} fill="currentColor" className="text-white ml-1.5" />
          )}
        </button>

        <div className="text-center text-gray-500 text-xs shrink-0">
          {isTraining ? '保持核心收紧，每10秒会有提示音' : '点击按钮开始计时'}
        </div>
      </div>
    </div>
  );
};

export default TrainingTab;
