import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, Camera } from 'lucide-react';
import { saveLog, getDailyLogs } from '../services/storageService';

const MAX_DAILY_ATTEMPTS = 3;

const TrainingTab: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // States
  const [isTraining, setIsTraining] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null); // For the 3s countdown
  const [timer, setTimer] = useState(0);
  const [permissionError, setPermissionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dailyAttempts, setDailyAttempts] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const logs = getDailyLogs(today);
    setDailyAttempts(logs.length);
  }, []);

  const handleStreamSuccess = (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError(true);
      setErrorMessage("浏览器不支持或未通过HTTPS访问");
      return;
    }

    try {
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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        handleStreamSuccess(stream);
      } catch (fallbackErr: any) {
        setPermissionError(true);
        setErrorMessage("无法启动摄像头，请检查权限");
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

  // Improved Audio Logic
  const playBeep = (currentSeconds: number) => {
    try {
      // Initialize Context if needed
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }
      }
      
      const ctx = audioContextRef.current;
      if (!ctx) return;
      
      // Ensure context is running (mobile browsers suspend it)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle'; // Louder and clearer than sine
      
      // Dynamic frequency based on time
      // Base C5 (523Hz) and going up the scale every 10s
      // 10s -> D5, 20s -> E5, etc.
      const baseFreq = 523.25; 
      const step = Math.floor(currentSeconds / 10) % 8; 
      // Simple major scale intervals
      const scale = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2]; 
      
      osc.frequency.value = baseFreq * scale[step];
      
      // Louder volume
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);

    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const initAudio = () => {
      // Create context on user interaction to unlock audio on iOS
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
              audioContextRef.current = new AudioContext();
          }
      }
  };

  const handleStartSequence = async () => {
    if (dailyAttempts >= MAX_DAILY_ATTEMPTS) {
      alert("您今天的训练次数已用完 (3次)，请明天再来！");
      return;
    }

    initAudio(); // Unlock audio immediately on click
    await startCamera();
    
    // Start Countdown
    setCountdown(3);
    
    countdownRef.current = window.setInterval(() => {
        setCountdown((prev) => {
            if (prev === null || prev <= 1) {
                // Countdown finished
                if (countdownRef.current) clearInterval(countdownRef.current);
                startActualTraining();
                return null;
            }
            return prev - 1;
        });
    }, 1000);
  };

  const startActualTraining = () => {
    setIsTraining(true);
    setTimer(0);
    
    // Play start sound
    playBeep(0);

    timerRef.current = window.setInterval(() => {
      setTimer((prev) => {
        const next = prev + 1;
        if (next > 0 && next % 10 === 0) {
          playBeep(next);
        }
        return next;
      });
    }, 1000);
  };

  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    stopCamera();
    setIsTraining(false);
    setCountdown(null);
    
    if (timer > 5) {
      saveLog(timer);
      setDailyAttempts(prev => prev + 1);
      alert(`训练结束！本次成绩: ${formatTime(timer)}`);
    } else if (timer > 0) {
      alert("时间太短，未记录成绩");
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 pb-20">
      {/* Top Video Section - Fixed Height */}
      <div className="h-[25vh] w-full bg-black relative overflow-hidden border-b border-gray-800 shrink-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0" 
          style={{ 
            transform: 'scaleX(-1) translate3d(0,0,0)', 
            WebkitTransform: 'scaleX(-1) translate3d(0,0,0)'
          }}
        />
        
        {/* Countdown Overlay */}
        {countdown !== null && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 backdrop-blur-sm">
                 <div className="text-9xl font-black text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
                     {countdown}
                 </div>
             </div>
        )}

        {!isTraining && countdown === null && !permissionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
            <div className="text-center text-gray-400">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p>点击下方开始按钮启用摄像头</p>
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

      {/* Main Controls Section - Scrollable with smooth touch */}
      <div className="flex-1 flex flex-col items-center justify-start py-4 px-6 space-y-4 overflow-y-auto no-scrollbar scroll-touch">
        
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
          onClick={isTraining || countdown !== null ? handleStop : handleStartSequence}
          disabled={countdown !== null} // Disable button during countdown
          className={`
            w-24 h-24 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-2xl shrink-0
            ${isTraining 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
              : countdown !== null
                ? 'bg-yellow-500 ring-4 ring-yellow-500/30 cursor-wait'
                : 'bg-green-500 hover:bg-green-600 ring-4 ring-green-500/30 active:scale-95'
            }
          `}
        >
          {isTraining ? (
            <Square size={36} fill="currentColor" className="text-white" />
          ) : countdown !== null ? (
            <span className="text-3xl font-black text-black">{countdown}</span>
          ) : (
            <Play size={36} fill="currentColor" className="text-white ml-1.5" />
          )}
        </button>

        <div className="text-center text-gray-500 text-xs shrink-0 px-8">
          {isTraining 
            ? '坚持就是胜利！每10秒音调会升高' 
            : countdown !== null 
                ? '准备姿势...' 
                : '点击按钮开启3秒倒计时'
          }
        </div>
        
        {/* Spacer for bottom nav */}
        <div className="h-8 shrink-0"></div>
      </div>
    </div>
  );
};

export default TrainingTab;