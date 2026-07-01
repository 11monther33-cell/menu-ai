import React, { useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InteractiveScanner from '@/components/3d/InteractiveScanner';

interface ObjectCapturePageProps {
  dishId?: string;
}

const ObjectCapturePage: React.FC<ObjectCapturePageProps> = () => {
  const { dishId } = useParams<{ dishId: string }>();
  const camera = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [numberOfImages, setNumberOfImages] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const navigate = useNavigate();
  const TOTAL_CAPTURES = 30; // العدد المستهدف من الصور

  // بدء الكاميرا
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // الكاميرا الخلفية
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
      }
    } catch (error: any) {
      toast.error(`خطأ في الوصول إلى الكاميرا: ${error.message}`);
      console.error('Camera error:', error);
    }
  }, []);

  // إيقاف الكاميرا
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // التقاط صورة من الفيديو
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImages((prev) => [...prev, imageData]);
    setNumberOfImages((prev) => prev + 1);
    toast.success(`تم التقاط الصورة رقم ${numberOfImages + 1}`);
  }, [numberOfImages]);

  // بدء عملية الالتقاط
  const handleStartCapture = async () => {
    setIsCapturing(true);
    setCapturedImages([]);
    setNumberOfImages(0);
    setShowScanner(true);
    await startCamera();
    toast.info('بدء عملية التقاط الكائن. ابدأ بالتقاط الصور.');
  };

  // إنهاء عملية الالتقاط
  const handleFinishCapture = async () => {
    setIsCapturing(false);
    setShowScanner(false);
    stopCamera();

    if (capturedImages.length < 20) {
      toast.error(
        `الرجاء التقاط 20 صورة على الأقل. تم التقاط ${capturedImages.length} فقط.`
      );
      return;
    }

    setIsLoading(true);
    toast.loading('جاري إرسال الصور للمعالجة... قد يستغرق هذا بعض الوقت.');

    try {
      const formData = new FormData();

      // إضافة الصور إلى FormData
      capturedImages.forEach((image, index) => {
        const byteString = atob(image.split(',')[1]);
        const mimeString = image.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        formData.append(
          `image_${index}.jpg`,
          new Blob([ab], { type: mimeString })
        );
      });

      formData.append('dishId', dishId || '');

      // إرسال الصور إلى الواجهة الخلفية
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/process-object-capture`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'فشل في معالجة التقاط الكائن.'
        );
      }

      const result = await response.json();
      toast.dismiss();
      toast.success('تم إرسال الصور بنجاح! سيتم إعلامك عند اكتمال النموذج.');

      // العودة إلى صفحة الطبق
      if (dishId) {
        navigate(`/restaurant/dishes/${dishId}`);
      } else {
        navigate('/restaurant');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`خطأ: ${error.message}`);
      console.error('خطأ في إرسال الصور:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة تعيين العملية
  const handleReset = () => {
    setIsCapturing(false);
    setShowScanner(false);
    setCapturedImages([]);
    setNumberOfImages(0);
    stopCamera();
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* الماسح الضوئي التفاعلي */}
      {showScanner && isCapturing && (
        <>
          <InteractiveScanner
            onCapture={capturePhoto}
            captureCount={numberOfImages}
            totalCaptures={TOTAL_CAPTURES}
            isCapturing={isCapturing}
          />

          {/* فيديو الكاميرا المخفي */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* أزرار التحكم */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 z-50">
            <Button
              onClick={handleFinishCapture}
              disabled={numberOfImages < 20 || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              {isLoading ? 'جاري الإرسال...' : 'إنهاء الالتقاط'}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-white border-white hover:bg-white/10"
            >
              إلغاء
            </Button>
          </div>
        </>
      )}

      {/* الواجهة الأولية (قبل بدء الالتقاط) */}
      {!showScanner && !isCapturing && (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                التقاط كائن ثلاثي الأبعاد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-gray-300 mb-4">
                  سيتم التقاط صور متعددة للطبق من زوايا مختلفة لإنشاء نموذج ثلاثي الأبعاد عالي الجودة.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>✓ تأكد من إضاءة جيدة</p>
                  <p>✓ ضع الطبق على سطح مستوٍ</p>
                  <p>✓ التقط {TOTAL_CAPTURES} صورة على الأقل</p>
                  <p>✓ حرك الجهاز ببطء حول الطبق</p>
                </div>
              </div>

              <Button
                onClick={handleStartCapture}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              >
                بدء التقاط الكائن
              </Button>

              <Button
                onClick={() => navigate(`/restaurant/dishes/${dishId}`)}
                variant="outline"
                className="w-full text-gray-300 border-gray-600 hover:bg-gray-800"
              >
                إلغاء
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* معلومات الحالة */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">جاري معالجة الصور...</p>
            <p className="text-gray-400 text-sm mt-2">قد يستغرق هذا عدة دقائق</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectCapturePage;
