import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Image as ImageIcon, RotateCcw, Check, X, Flashlight, FlashlightOff } from 'lucide-react';
import Header from '../components/Header';
import { supabase } from '../utils/supabaseClient';
import { preprocessImage } from '../utils/imagePreprocess';

const ScanScreen: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [captureStage, setCaptureStage] = useState<'camera' | 'adjusting' | 'auto-scanning'>('camera');
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(170);
  const [isProcessing, setIsProcessing] = useState(false);
  const [popupData, setPopupData] = useState<{ id: string | null, error: string | null } | null>(null);
  
  const [scanMethod, setScanMethod] = useState<'automatic' | 'manual'>('automatic');
  const [fetchedProfiles, setFetchedProfiles] = useState<any[]>([]);
  const [autoScanProgress, setAutoScanProgress] = useState(0);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const toggleTorch = async () => {
    try {
      // @ts-ignore - access internal video element
      const video = webcamRef.current?.video;
      if (!video) return;
      
      const stream = video.srcObject as MediaStream;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (!capabilities.torch) {
        setPopupData({ id: null, error: 'Flashlight not supported on this device camera.' });
        setTimeout(() => setPopupData(null), 2000);
        return;
      }

      const nextState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      } as any);
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  useEffect(() => {
    if (captureStage === 'adjusting' && rawImage) {
      const updatePreview = async () => {
        const processed = await preprocessImage(rawImage, threshold);
        setProcessedImage(processed);
      };
      updatePreview();
    }
  }, [threshold, rawImage, captureStage]);

  useEffect(() => {
    return () => {
      // Cleanup: Turn off torch when leaving
      if (isTorchOn) {
        const video = webcamRef.current?.video;
        if (video) {
          const stream = video.srcObject as MediaStream;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track && track.getCapabilities && (track.getCapabilities() as any).torch) {
              track.applyConstraints({ advanced: [{ torch: false }] } as any);
            }
          }
        }
      }
    };
  }, [isTorchOn]);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setRawImage(imageSrc);
        if (scanMethod === 'manual') {
          setThreshold(170); // reset
          setCaptureStage('adjusting');
        } else {
          setCaptureStage('auto-scanning');
          runAutoScan(imageSrc);
        }
      }
    }
  }, [scanMethod]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setRawImage(result);
        if (scanMethod === 'manual') {
          setThreshold(170);
          setCaptureStage('adjusting');
        } else {
          setCaptureStage('auto-scanning');
          runAutoScan(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetake = () => {
    setCaptureStage('camera');
    setRawImage(null);
    setProcessedImage(null);
  };

  const fetchProfilesForIds = async (ids: string[]) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('student_id', ids);

      if (error) throw error;

      if (data && data.length > 0) {
        setFetchedProfiles(data);
      } else {
        const idString = ids.length === 1 ? `ID ${ids[0]}` : `IDs ${ids.join(', ')}`;
        setPopupData({ id: null, error: `${idString} located but not found in the database.` });
        setTimeout(() => {
          setPopupData(null);
          if (scanMethod === 'automatic') {
             setCaptureStage('camera');
             setRawImage(null);
          }
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setPopupData({ id: null, error: 'Database error while fetching profiles.' });
      setTimeout(() => {
        setPopupData(null);
        if (scanMethod === 'automatic') {
           setCaptureStage('camera');
           setRawImage(null);
        }
      }, 3000);
    }
  };

  const runAutoScan = async (imageSrc: string) => {
    setIsProcessing(true);
    setPopupData(null);
    setFetchedProfiles([]);
    const foundIds = new Set<string>();
    const thresholdsToTest = Array.from({ length: 10 }, (_, i) => Math.round(50 + (i * (220 - 50) / 9))); // Test 10 thresholds from 50 to 220

    for (let i = 0; i < thresholdsToTest.length; i++) {
      setAutoScanProgress(Math.round(((i) / thresholdsToTest.length) * 100));
      const t = thresholdsToTest[i];
      try {
        const processed = await preprocessImage(imageSrc, t);
        const result = await Tesseract.recognize(processed, 'eng');
        const textResponse = result.data.text;
        
        const regex = /\d{2}[-\s]*\d{5}[-\s]*\d{3}/g;
        let match;
        while ((match = regex.exec(textResponse)) !== null) {
          const studentId = match[0].replace(/\s/g, '');
          foundIds.add(studentId);
        }
        
        // Continue scanning through all thresholds to find all possible IDs in the frame
      } catch (err) {
        console.error("OCR error at threshold", t, err);
      }
    }

    setAutoScanProgress(100);

    if (foundIds.size > 0) {
      await fetchProfilesForIds(Array.from(foundIds));
    } else {
      setPopupData({ id: null, error: 'No IDs found in scan. Please try again or use manual mode.' });
      setTimeout(() => {
        setPopupData(null);
        setCaptureStage('camera');
        setRawImage(null);
      }, 3000);
    }
    setIsProcessing(false);
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
        await fetchProfilesForIds([studentId]);
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
    <div className="flex flex-col h-[calc(100vh-80px)] relative overflow-hidden page-container p-0">
      <Header 
        title="Scan Student ID" 
      />
      


      {captureStage === 'camera' ? (
        <>

          
          <div className="flex-1 relative my-8 flex justify-center items-center overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="absolute w-full h-full object-cover opacity-60"
              videoConstraints={{
                facingMode: 'environment', // Use back camera on mobile
              }}
            />
            <div className="absolute bottom-5 left-0 w-full text-center text-text-primary opacity-80 text-sm px-4 bg-black/50 py-2 rounded-sm">
              Focus the camera directly on the student ID numbers
            </div>
            
            {/* Flashlight Toggle */}
            <button 
              className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center border transition-all z-20 ${isTorchOn ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-black/40 border-white/20 text-white hover:bg-black/60'}`}
              onClick={toggleTorch}
              title="Toggle Flashlight"
            >
              {isTorchOn ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
            </button>
          </div>

          <div className="flex justify-around items-center px-4 pb-12">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            
            <div className="flex flex-col items-center gap-2">
              <button className="w-14 h-14 rounded-full bg-white/10 text-text-primary flex items-center justify-center border border-white/5 cursor-pointer hover:bg-white/20 active:scale-95 transition-all" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={24} />
              </button>
              <span className="text-[10px] text-text-secondary uppercase tracking-[0.1em] font-bold">Gallery</span>
            </div>

            <button 
              className="group w-24 h-24 rounded-full bg-transparent border-4 border-text-primary flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95" 
              onClick={handleCapture}
            >
              <div className="w-20 h-20 bg-text-primary rounded-full transition-all duration-150 group-active:scale-90 group-active:rounded-[20px]"></div>
            </button>

            <div className="flex flex-col items-center gap-2">
              <button 
                className={`w-14 h-14 rounded-full flex items-center justify-center border border-white/5 cursor-pointer transition-all hover:bg-white/20 active:scale-95 ${scanMethod === 'automatic' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/10 text-text-primary'}`}
                onClick={() => setScanMethod(prev => prev === 'automatic' ? 'manual' : 'automatic')}
              >
                <span className="text-[10px] font-black uppercase">{scanMethod === 'automatic' ? 'Auto' : 'Manu'}</span>
              </button>
              <span className="text-[10px] text-text-secondary uppercase tracking-[0.1em] font-bold">ID Scan</span>
            </div>
          </div>
        </>
      ) : captureStage === 'adjusting' ? (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-black">
          <div className="flex-1 flex items-center justify-center overflow-auto pb-[180px]">
            {processedImage ? (
              <img src={processedImage} alt="Binarized ID" className="max-w-[95%] max-h-[80%] pt-8 object-contain rounded-md shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]" />
            ) : (
              <div className="text-text-secondary font-medium">Processing...</div>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 bg-[#192131]/90 backdrop-blur-md border border-border-subtle rounded-xl p-5 flex flex-col gap-5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-text-secondary text-center">
                {isProcessing ? "Extracting ID..." : "Slide until the Student ID is legible"}
              </label>
              <input 
                type="range" 
                min="0" 
                max="255" 
                value={threshold} 
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-bg-surface-elevated rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-bg-surface [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                disabled={isProcessing}
              />
            </div>

            <div className="flex gap-4">
              <button className="flex-1 text-[0.9rem] p-3 flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 text-text-primary" onClick={handleRetake} disabled={isProcessing}>
                <RotateCcw size={18} /> Retake
              </button>
              <button className="flex-1 text-[0.9rem] p-3 flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover" onClick={handleProcess} disabled={isProcessing}>
                <Check size={18} /> Process ID
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-black flex items-center justify-center p-8 h-full min-h-[400px]">
           <div className="w-full max-w-xs text-center mt-12">
             <div className="animate-pulse mb-6">
                <ImageIcon size={64} className="mx-auto text-primary opacity-50" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Scanning Automatically...</h3>
             <p className="text-secondary text-sm mb-6">Testing different image thresholds to find an ID.</p>
             <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
               <div className="bg-primary h-full transition-all duration-300" style={{ width: `${autoScanProgress}%` }}></div>
             </div>
           </div>
        </div>
      )}

      {/* Popup Modal Overlay for Errors */}
      {popupData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_250ms_ease_forwards]">
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
                </>
              )}
           </div>
        </div>
      )}

      {/* Fetched Profiles Modal Overlay */}
      {fetchedProfiles.length > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_250ms_ease_forwards] pt-16">
          <div className="relative w-full max-w-sm h-full max-h-[50vh] flex items-center justify-center">
            {fetchedProfiles.map((profile, index) => {
              // Stacking effect
              const isTop = index === fetchedProfiles.length - 1;
              const offset = (fetchedProfiles.length - 1 - index) * 15;
              return (
                <div 
                  key={profile.student_id}
                  className="absolute bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl w-[90%] text-center transition-all duration-300"
                  style={{
                    transform: `translateY(-${offset}px) scale(${1 - offset/500})`,
                    zIndex: index,
                    opacity: isTop ? 1 : 0.6
                  }}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name.split(' ')[0]}&backgroundColor=242f44`} 
                    alt="Student Avatar" 
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-zinc-800"
                  />
                  <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                  <p className="text-primary font-mono tracking-wider mb-6">{profile.student_id}</p>
                  
                  {isTop && (
                    <div className="flex gap-4">
                      <button 
                        className="flex-1 text-[0.9rem] p-3 flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition-all duration-150 active:scale-95 bg-white/10 text-text-primary"
                        onClick={() => {
                          setFetchedProfiles(prev => prev.slice(0, -1));
                          if (fetchedProfiles.length === 1) {
                             // Last one dismissed
                             setCaptureStage('camera');
                             setRawImage(null);
                             setProcessedImage(null);
                          }
                        }}
                      >
                        <X size={18} /> Dismiss
                      </button>
                      <button 
                        className="flex-1 text-[0.9rem] p-3 flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition-all duration-150 active:scale-95 bg-primary text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:bg-primary-hover"
                        onClick={() => {
                          localStorage.setItem('activeStudentId', profile.student_id);
                          setFetchedProfiles([]);
                          navigate(`/profile/${profile.student_id}`, { state: { studentData: { studentId: profile.student_id } } });
                        }}
                      >
                        <Check size={18} /> Confirm
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanScreen;
