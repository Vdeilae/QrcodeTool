// src/components/QRCodeGenerator.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface HistoryItem {
  id: string;
  content: string;
  qrCodeUrl: string;
  timestamp: Date;
}

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://www.example.com');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 从本地存储加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('qrGenerationHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 转换时间戳为Date对象
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // 保存历史记录到本地存储
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('qrGenerationHistory', JSON.stringify(newHistory));
  };

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
      
      // 添加到历史记录
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        content: text,
        qrCodeUrl: url,
        timestamp: new Date()
      };
      
      const newHistory = [newHistoryItem, ...history.slice(0, 19)]; // 限制最多20条记录
      saveHistory(newHistory);
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

  const downloadHistoryQRCode = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `qrcode-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qrGenerationHistory');
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

      {/* 生成历史记录 */}
      {history.length > 0 && (
        <div className="generation-history">
          <div className="history-header">
            <h3>生成历史</h3>
            <button onClick={clearHistory} className="clear-history-button">
              清空历史
            </button>
          </div>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={item.id} className="history-item">
                <div className="history-content">
                  <p className="history-text">{item.content}</p>
                  <div className="history-qrcode">
                    <img 
                      src={item.qrCodeUrl} 
                      alt={`QR Code ${index + 1}`} 
                      className="history-qrcode-image"
                    />
                  </div>
                  <div className="history-actions">
                    <button 
                      onClick={() => downloadHistoryQRCode(item.qrCodeUrl, index)}
                      className="history-download-button"
                    >
                      下载
                    </button>
                  </div>
                  <div className="history-time">
                    {item.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;