import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Zap, Image as ImageIcon, Keyboard } from 'lucide-react';
import Header from '../components/Header';
import { preprocessImage } from '../utils/imagePreprocess';
import './ScanScreen.css';

const ScanScreen: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugText, setDebugText] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  // A mock auto-capture to simulate finding an ID. We'll use manual button for this MVP.
  const handleScan = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      setIsProcessing(true);
      setError(null);
      setScanResult('Processing Image...');

      try {
        console.log('Preprocessing image...');
        const processed = await preprocessImage(imageSrc);
        setProcessedImage(processed);

        console.log('Initializing Tesseract OCR...');
        const result = await Tesseract.recognize(
          processed,
          'eng',
          { logger: m => console.log(m) }
        );

        const textResponse = result.data.text;
        console.log('Tesseract Raw Response:', textResponse);
        setDebugText(textResponse);
        
        // Use Regex to find the student ID. Relaxed to account for OCR missing/replacing dashes with spaces, and no strict boundaries.
        const idMatch = textResponse.match(/\d{2}[-\s]*\d{5}[-\s]*\d{3}/);
        
        if (idMatch && idMatch[0]) {
          const studentId = idMatch[0];
          setScanResult(`Found ID: ${studentId}`);
          setTimeout(() => {
            navigate(`/profile/${studentId}`, { state: { studentData: { studentId } } });
          }, 1500);
        } else {
          setScanResult('ID not found in scan. Please try again.');
          setTimeout(() => {
            setScanResult(null);
            setIsProcessing(false);
          }, 3000);
        }
      } catch (err: any) {
        console.error('OCR Error:', err);
        setError(err.message || 'Failed to process image. Make sure the ID is clear.');
        setIsProcessing(false);
      }
    }
  }, [navigate]);

  return (
    <div className="page-container scan-screen">
      <Header 
        title="Scan Student ID" 
        showBack={true} 
        rightAction={<Zap size={24} className="text-secondary" />} 
      />
      
      <div className="status-badge">
        <span className="dot pulse"></span>
        Auto-Capture On
      </div>

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
        <button className="btn-icon secondary"><ImageIcon size={24} /></button>
        <button 
          className="btn-capture" 
          onClick={handleScan}
          disabled={isProcessing}
        >
          <div className="capture-inner"></div>
        </button>
        <button className="btn-icon secondary"><Keyboard size={24} /></button>
      </div>
      
      <div className="scan-status-text">
        {scanResult ? (
          <span className="text-primary">{scanResult}</span>
        ) : (
          <span className="text-secondary tracking-widest text-sm font-semibold">SCAN ID</span>
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>

      {processedImage && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <strong style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Processed Image (What OCR sees):</strong>
          <img src={processedImage} alt="Processed" style={{ maxWidth: '100%', height: 'auto', border: '1px solid #555' }} />
        </div>
      )}

      {debugText && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#222', color: '#0f0', fontSize: '10px', whiteSpace: 'pre-wrap', textAlign: 'left', wordBreak: 'break-all', maxHeight: '150px', overflowY: 'auto' }}>
          <strong>Debug OCR Output:</strong><br/>
          {debugText}
        </div>
      )}
    </div>
  );
};

export default ScanScreen;
