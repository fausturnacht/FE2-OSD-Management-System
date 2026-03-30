import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Zap, Image as ImageIcon, Keyboard } from 'lucide-react';
import Header from '../components/Header';
import './ScanScreen.css';

const ScanScreen: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        // Run OCR with Tesseract
        const { data: { text } } = await Tesseract.recognize(
          imageSrc,
          'eng',
          { logger: m => console.log(m) }
        );
        
        console.log('OCR Raw Text:', text);
        
        // Very basic parsing attempt. In reality, would need robust regex for the specific ID format
        // Looking for something that looks like an ID e.g., 23-11865-994
        const idMatch = text.match(/\b\d{2}-\d{5}-\d{3}\b/);
        
        if (idMatch) {
          setScanResult(`Found ID: ${idMatch[0]}`);
          setTimeout(() => {
            navigate(`/profile/${idMatch[0]}`);
          }, 1500);
        } else {
          // If no specific ID format found, just navigate to a mock ID for demo purposes
          setScanResult('ID formatting not found in scan. Proceeding with mock data...');
          setTimeout(() => {
            // Mocking the navigation to John Doe's profile
            navigate('/profile/21-04392-MN');
          }, 2000);
        }
      } catch (err) {
        console.error('OCR Error:', err);
        setError('Failed to process image. Make sure the ID is clear.');
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
        <div className="scanner-overlay">
          <div className="scanner-frame">
            <div className="frame-corner top-left"></div>
            <div className="frame-corner top-right"></div>
            <div className="frame-corner bottom-left"></div>
            <div className="frame-corner bottom-right"></div>
          </div>
          <div className="scanner-helper-text">
            Align the vertical ID card within the frame to automatically scan details
          </div>
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
    </div>
  );
};

export default ScanScreen;
