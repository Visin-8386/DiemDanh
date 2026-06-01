'use client';
import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeeApi, faceApi } from '@/lib/api';
import { Camera, X, ChevronLeft, Loader2, CheckCircle2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterFacePage() {
  const { id } = useParams();
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [capturing, setCapturing] = useState(false);

  const { data: emp } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.get(id as string).then((r) => r.data),
  });

  const registerMut = useMutation({
    mutationFn: () => faceApi.register(id as string, photos.map((p) => p.blob)),
    onSuccess: (res) => {
      toast.success(`Đăng ký thành công! ${res.data.embeddings_stored} ảnh được xử lý.`);
      router.push('/dashboard/employees');
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Lỗi đăng ký khuôn mặt'),
  });

  const capturePhoto = async () => {
    if (!webcamRef.current || photos.length >= 5) return;
    setCapturing(true);
    const imgSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
    if (imgSrc) {
      const res = await fetch(imgSrc);
      const blob = await res.blob();
      setPhotos((prev) => [...prev, { blob, url: imgSrc }]);
    }
    setCapturing(false);
  };

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đăng Ký Khuôn Mặt</h1>
          {emp && <p className="text-sm text-muted-foreground">{emp.fullName} · {emp.code}</p>}
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-4 border border-blue-500/20 bg-blue-500/5">
        <p className="text-sm text-blue-300 font-medium mb-2">📸 Hướng dẫn đăng ký</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Chụp <strong className="text-foreground">3–5 ảnh</strong> từ các góc độ khác nhau (thẳng, hơi nghiêng trái/phải)</li>
          <li>• Đảm bảo khuôn mặt <strong className="text-foreground">rõ ràng, đủ ánh sáng</strong></li>
          <li>• Không đeo kính mắt đen hoặc khẩu trang</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Camera */}
        <div className="glass-card p-5">
          <div className="face-camera-container aspect-video mb-4">
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg"
              videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
              className="w-full h-full object-cover rounded-xl" mirrored />
            {capturing && <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />}
            {/* Oval guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg width="140" height="180" viewBox="0 0 140 180">
                <ellipse cx="70" cy="90" rx="62" ry="82" fill="none" stroke="hsla(263,85%,65%,0.6)" strokeWidth="2" strokeDasharray="6 3" />
              </svg>
            </div>
          </div>
          <button onClick={capturePhoto} disabled={photos.length >= 5 || capturing}
            id="capture-photo-btn"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
            <Camera className="w-5 h-5" />
            Chụp Ảnh ({photos.length}/5)
          </button>
        </div>

        {/* Photos Preview */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Ảnh Đã Chụp</h3>
          {photos.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Camera className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Chưa có ảnh nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p, i) => (
                <div key={i} className="relative group aspect-square">
                  <img src={p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Tiến độ</span>
              <span>{photos.length}/5 ảnh {photos.length >= 3 && '✓ Đủ để đăng ký'}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(photos.length / 5) * 100}%`, background: 'linear-gradient(90deg, hsl(263,85%,55%), hsl(220,85%,55%))' }} />
            </div>
          </div>

          <button onClick={() => registerMut.mutate()} disabled={photos.length === 0 || registerMut.isPending}
            id="register-face-btn"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
            {registerMut.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>)
              : (<><CheckCircle2 className="w-4 h-4" /> Đăng Ký Khuôn Mặt</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
