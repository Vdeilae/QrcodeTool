// src/components/QRCodeGenerator.tsx
import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://www.example.com');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!text.trim()) {
      setError('请输入要生成二维码的内容');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // 生成二维码数据URL
      const url = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000FF',
          light: '#FFFFFFFF'
        }
      });
      
      setQrCodeUrl(url);
    } catch (err) {
      setError('生成二维码失败: ' + (err as Error).message);
      console.error('QR Code generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="qr-generator">
      <h2>生成二维码</h2>
      
      <div className="qr-input-group">
        <label htmlFor="qr-text">输入内容:</label>
        <input
          id="qr-text"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入网址或文本内容"
          className="qr-input"
        />
      </div>

      <button 
        onClick={generateQRCode}
        disabled={isGenerating}
        className="generate-button"
      >
        {isGenerating ? '生成中...' : '生成二维码'}
      </button>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {qrCodeUrl && (
        <div className="qr-code-display">
          <h3>生成的二维码:</h3>
          <img 
            src={qrCodeUrl} 
            alt="Generated QR Code" 
            className="qr-code-image"
          />
          <button 
            onClick={downloadQRCode}
            className="download-button"
          >
            下载二维码
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;