import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
        console.log('All Env Vars:', import.meta.env);
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('VITE_GEMINI_API_KEY environment variable is missing.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-3-flash-preview which matches the available API models for this key
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Split "data:image/jpeg;base64,..." to get pure base64
        const base64Data = imageSrc.split(',')[1];
        
        const prompt = `Extract the student information from this ID card image. 
Return ONLY a JSON object exactly like:
{
  "studentId": "23-11865-994",
  "name": "Lastname, Firstname M.",
  "course": "BS Computer Science",
  "college": "College of Engineering"
}
If a field is not recognizable, use null.
Do not include markdown codeblocks or any other text.`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }
        ]);

        const textResponse = result.response.text();
        console.log('Gemini Raw Response:', textResponse);
        
        let parsedResult: { studentId: string | null, name?: string, course?: string, college?: string } | null = null;
        try {
          parsedResult = JSON.parse(textResponse.trim());
        } catch (jsonErr) {
          console.error('Failed to parse Gemini response as JSON:', textResponse, jsonErr);
        }
        
        if (parsedResult?.studentId) {
          setScanResult(`Found ID: ${parsedResult.studentId}`);
          setTimeout(() => {
            navigate(`/profile/${parsedResult.studentId}`, { state: { studentData: parsedResult } });
          }, 1500);
        } else {
          setScanResult('ID not found in scan. Please try again.');
          setTimeout(() => {
            setScanResult(null);
            setIsProcessing(false);
          }, 3000);
        }
      } catch (err: any) {
        console.error('Gemini API Error:', err);
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
