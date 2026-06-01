'use client';
import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { attendanceApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Camera, CheckCircle2, XCircle, Loader2, RotateCcw, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

type Mode = 'checkin' | 'checkout';
type State = 'idle' | 'capturing' | 'processing' | 'success' | 'error';

export default function AttendancePage() {
  const webcamRef = useRef<Webcam>(null);
  const [state, setState] = useState<State>('idle');
  const [mode, setMode] = useState<Mode>('checkin');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    setState('capturing');
    await new Promise((r) => setTimeout(r, 300)); // flash effect

    const imgSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (!imgSrc) { setState('idle'); return; }

    setState('processing');
    try {
      // Convert base64 to blob
      const res = await fetch(imgSrc);
      const blob = await res.blob();

      const { data } = mode === 'checkin'
        ? await attendanceApi.checkIn(blob)
        : await attendanceApi.checkOut(blob);

      setResult(data);
      setState('success');
      toast.success(data.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không nhận diện được khuôn mặt. Vui lòng thử lại.';
      setError(msg);
      setState('error');
      toast.error(msg);
    }
  }, [mode]);

  const reset = () => { setState('idle'); setResult(null); setError(''); };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Điểm Danh</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Nhìn thẳng vào camera và nhấn nút điểm danh</p>
        </div>
        {/* Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-accent border border-border">
          {(['checkin', 'checkout'] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); reset(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-muted-foreground hover:text-foreground'}`}>
              {m === 'checkin' ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
              {m === 'checkin' ? 'Vào' : 'Ra'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Camera Panel */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="face-camera-container aspect-video w-full">
            {/* Camera Feed */}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
              className="w-full h-full object-cover rounded-xl"
              mirrored
            />

            {/* Oval face guide overlay */}
            {state === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-60">
                  <svg viewBox="0 0 200 250" className="w-full h-full">
                    <ellipse cx="100" cy="125" rx="90" ry="115"
                      fill="none" stroke="hsla(263,85%,65%,0.7)" strokeWidth="2.5"
                      strokeDasharray="8 4" />
                  </svg>
                  {/* Corner guides */}
                  <div className="face-corner top-0 left-0 border-t border-l rounded-tl-lg" />
                  <div className="face-corner top-0 right-0 border-t border-r rounded-tr-lg" />
                  <div className="face-corner bottom-0 left-0 border-b border-l rounded-bl-lg" />
                  <div className="face-corner bottom-0 right-0 border-b border-r rounded-br-lg" />
                </div>
                {/* Scan line */}
                <div className="face-scan-line" style={{ top: '20%' }} />
              </div>
            )}

            {/* Processing overlay */}
            {state === 'processing' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-3" />
                <p className="text-white font-semibold">Đang nhận diện...</p>
                <p className="text-white/60 text-sm mt-1">Vui lòng giữ nguyên</p>
              </div>
            )}

            {/* Capturing flash */}
            {state === 'capturing' && (
              <div className="absolute inset-0 bg-white/30 rounded-xl animate-pulse" />
            )}

            {/* Success overlay */}
            {state === 'success' && result && (
              <div className="absolute inset-0 bg-green-900/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-9 h-9 text-green-400" />
                </div>
                <p className="text-white font-bold text-lg text-center px-4">{result.message}</p>
                <p className="text-green-300 text-sm mt-1">
                  Độ tin cậy: {Math.round((result.confidence || 0) * 100)}%
                </p>
              </div>
            )}

            {/* Error overlay */}
            {state === 'error' && (
              <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                <XCircle className="w-14 h-14 text-red-400 mb-3" />
                <p className="text-white font-semibold text-center px-4">{error}</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-5 flex gap-3">
            {(state === 'idle' || state === 'error') && (
              <button onClick={capture} id="checkin-btn"
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base">
                <Camera className="w-5 h-5" />
                {mode === 'checkin' ? 'ĐIỂM DANH VÀO' : 'ĐIỂM DANH RA'}
              </button>
            )}
            {(state === 'success' || state === 'error') && (
              <button onClick={reset}
                className="btn-secondary flex items-center gap-2 px-5 py-3">
                <RotateCcw className="w-4 h-4" /> Thử lại
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            💡 Đảm bảo khuôn mặt trong khung, đủ ánh sáng, không đeo khẩu trang
          </p>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Success Result Card */}
          {state === 'success' && result?.employee && (
            <div className="glass-card p-5 border border-green-500/30 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                  {result.employee.fullName?.split(' ').map((w: string) => w[0]).slice(-2).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{result.employee.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{result.employee.code} · {result.employee.position}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-accent/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Thời gian</p>
                  <p className="font-bold text-xl text-foreground mt-0.5">
                    {formatDate(result.attendance?.checkInTime || new Date(), 'HH:mm')}
                  </p>
                </div>
                <div className="bg-accent/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Trạng thái</p>
                  <p className={`font-bold mt-0.5 ${result.attendance?.status === 'LATE' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {result.attendance?.status === 'LATE'
                      ? `Muộn ${result.attendance?.lateMinutes} phút`
                      : 'Đúng giờ ✓'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                '📸 Ngồi/đứng thẳng, nhìn vào camera',
                '💡 Đảm bảo khuôn mặt được chiếu sáng tốt',
                '😷 Không che mặt hoặc đeo khẩu trang',
                '📐 Giữ khuôn mặt trong vùng oval',
                '⏱️ Hệ thống nhận diện trong ~1-2 giây',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">{tip}</li>
              ))}
            </ul>
          </div>

          {/* Status Card */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Thời Gian Hiện Tại</h3>
            <div className="text-center">
              <p className="text-4xl font-bold font-mono gradient-text">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
