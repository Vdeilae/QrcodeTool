// src/components/QRCodeGenerator.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface HistoryItem {
  id: string;
  content: string;
  qrCode: string;
  timestamp: Date;
}

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';


const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://www.example.com');
  const [qrCode, setqrCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [qrType, setQrType] = useState<ErrorCorrectionLevel>('M');

  // 定义二维码类型选项
const qrTypes: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: 'M', label: 'M型 (标准, 15%)' },
  { value: 'L', label: 'L型 (低容错, 7%)' },
  { value: 'H', label: 'H型 (高容错, 30%)' },
  { value: 'Q', label: 'Q型 (中高容错, 25%)' }
];
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

  const filteredHistory = history.filter(item =>
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  //判断qrType是否合法
  const isValidLevel = (level: any): level is ErrorCorrectionLevel => {
  return ['L', 'M', 'Q', 'H'].includes(level);
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
        },
        errorCorrectionLevel: qrType, // ← 这里设置：'L' | 'M' | 'Q' | 'H'

      });
      
      setqrCode(url);
      
      // 添加到历史记录
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        content: text,
        qrCode: url,
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

    // 新增：处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      generateQRCode();
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
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
          onKeyPress={handleKeyPress} // 新增：添加回车事件监听
          placeholder="输入网址或文本内容"
          className="qr-input"
          
        />
      </div>
<div className="qr-options">

  <div className="option-group">

        <button 
      onClick={generateQRCode}
      disabled={isGenerating}
      className="generate-button"
    >
      {isGenerating ? '生成中...' : '生成二维码'}
    </button>
    
    <label>二维码类型:</label>
    <select 
      value={qrType} 
      onChange={(e) => setQrType(e.target.value as ErrorCorrectionLevel)}
      className="qr-type-select"
    >
      {qrTypes.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
</select>

  </div>
</div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {qrCode && (
        <div className="qr-code-display">
          <h3>生成的二维码:</h3>
          <img 
            src={qrCode} 
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
            {/* 新增：搜索框 */}
            <input
              type="text"
              placeholder="搜索历史记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="history-search-input"
            />
            <button onClick={clearHistory} className="clear-history-button">
              清空历史
            </button>
          </div>
          <div className="history-list">
            {filteredHistory.map((item, index) => (
              <div key={item.id} className="history-item">
                <div className="history-content">
                  <p className="history-text">{item.content}</p>
                  <div className="history-qrcode">
                    <img 
                      src={item.qrCode} 
                      alt={`QR Code ${index + 1}`} 
                      className="history-qrcode-image"
                    />
                  </div>
                  <div className="history-actions">
                    <button 
                      onClick={() => downloadHistoryQRCode(item.qrCode, index)}
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