import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Zap, Image as ImageIcon, RotateCcw, Check, X } from 'lucide-react';
import Header from '../components/Header';
import { preprocessImage } from '../utils/imagePreprocess';
import './ScanScreen.css';

const ScanScreen: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [captureStage, setCaptureStage] = useState<'camera' | 'adjusting'>('camera');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(170);
  const [isProcessing, setIsProcessing] = useState(false);
  const [popupData, setPopupData] = useState<{ id: string | null, error: string | null } | null>(null);

  useEffect(() => {
    if (captureStage === 'adjusting' && rawImage) {
      const updatePreview = async () => {
        const processed = await preprocessImage(rawImage, threshold);
        setProcessedImage(processed);
      };
      updatePreview();
    }
  }, [threshold, rawImage, captureStage]);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setRawImage(imageSrc);
        setThreshold(170); // reset
        setCaptureStage('adjusting');
      }
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setRawImage(result);
        setThreshold(170);
        setCaptureStage('adjusting');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCaptureStage('camera');
    setRawImage(null);
    setProcessedImage(null);
  };

  const handleProcess = async () => {
    if (!processedImage) return;

    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(
        processedImage,
        'eng',
      );

      const textResponse = result.data.text;
      const idMatch = textResponse.match(/\d{2}[-\s]*\d{5}[-\s]*\d{3}/);
      
      if (idMatch && idMatch[0]) {
        const studentId = idMatch[0].replace(/\s/g, ''); // cleanup spaces
        setPopupData({ id: studentId, error: null });
        setTimeout(() => {
          setPopupData(null);
          navigate(`/profile/${studentId}`, { state: { studentData: { studentId } } });
        }, 2000);
      } else {
        setPopupData({ id: null, error: 'ID not found in scan. Please adjust slider or retake.' });
        setTimeout(() => {
          setPopupData(null);
        }, 3000);
      }
    } catch (err: any) {
      setPopupData({ id: null, error: 'Failed to process image. Make sure the ID is clear.' });
      setTimeout(() => {
        setPopupData(null);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container scan-screen">
      <Header 
        title="Scan Student ID" 
        showBack={true} 
        rightAction={<Zap size={24} className="text-secondary" />} 
      />
      
      <div className="status-badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        You may just capture the Student Number on the ID
      </div>

      {captureStage === 'camera' ? (
        <>
          <div className="scanner-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="webcam-view"
              videoConstraints={{
                facingMode: 'environment', // Use back camera on mobile
              }}
            />
            <div className="scanner-helper-text" style={{ bottom: '20px', top: 'auto', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '4px' }}>
              Focus the camera directly on the student ID numbers
            </div>
          </div>

          <div className="scan-controls">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />
            <button className="btn-icon secondary cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={24} />
            </button>
            <button 
              className="btn-capture" 
              onClick={handleCapture}
            >
              <div className="capture-inner"></div>
            </button>
            <div style={{ width: '48px' }}></div> {/* Placeholder to keep center alignment since keyboard icon was removed */}
          </div>
        </>
      ) : (
        <div className="adjusting-container">
          <div className="preview-box">
            {processedImage ? (
              <img src={processedImage} alt="Binarized ID" className="binarized-preview" />
            ) : (
              <div className="preview-placeholder">Processing...</div>
            )}
          </div>
          
          <div className="adjustment-panel">
            <div className="slider-wrapper">
              <label className="slider-label">
                {isProcessing ? "Extracting ID..." : "Slide until the Student ID is legible"}
              </label>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={threshold} 
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="threshold-slider"
                disabled={isProcessing}
              />
            </div>

            <div className="adjustment-actions">
              <button className="btn btn-secondary action-btn" onClick={handleRetake} disabled={isProcessing}>
                <RotateCcw size={18} /> Retake
              </button>
              <button className="btn btn-primary action-btn" onClick={handleProcess} disabled={isProcessing}>
                <Check size={18} /> Process ID
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal Overlay */}
      {popupData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl max-w-[80vw] w-full text-center">
              {popupData.error ? (
                <>
                  <X size={48} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Scan Failed</h3>
                  <p className="text-secondary">{popupData.error}</p>
                </>
              ) : (
                <>
                  <Check size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">ID Located</h3>
                  <p className="text-primary text-2xl font-mono tracking-widest">{popupData.id}</p>
                  <p className="text-secondary mt-4 text-sm">Redirecting to profile...</p>
                </>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ScanScreen;
