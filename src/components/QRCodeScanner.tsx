// src/components/QRCodeScanner.tsx
import React, { useState, useRef, useEffect } from 'react'
import jsQR from 'jsqr'
import QRCode from 'qrcode'

interface HistoryItem {
  id: string;
  content: string;
  qrCodeUrl: string;
  timestamp: Date;
}

const QRCodeScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string>('')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [useCamera, setUseCamera] = useState<boolean>(false)
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null)

  // 从本地存储加载扫描历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('qrScanHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // 转换时间戳为Date对象
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setScanHistory(historyWithDates);
      } catch (e) {
        console.error('Failed to parse scan history', e);
      }
    }
  }, []);

  // 保存扫描历史记录到本地存储
  const saveScanHistory = (newHistory: HistoryItem[]) => {
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));
  };

  // 生成二维码URL
  const generateQRCodeUrl = async (content: string): Promise<string> => {
    try {
      const url = await QRCode.toDataURL(content, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000FF',
          light: '#FFFFFFFF'
        }
      });
      return url;
    } catch (err) {
      console.error('QR Code generation error:', err);
      return '';
    }
  };

  // 添加扫描结果到历史记录
  const addToScanHistory = async (content: string) => {
    const qrCodeUrl = await generateQRCodeUrl(content);
    
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      content: content,
      qrCodeUrl: qrCodeUrl,
      timestamp: new Date()
    };
    
    const newHistory = [newHistoryItem, ...scanHistory.slice(0, 19)]; // 限制最多20条记录
    saveScanHistory(newHistory);
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      decodeFromFile(file)
    }
  }

  // 处理粘贴事件
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (blob) {
          decodeFromFile(blob)
          break
        }
      }
    }
  }

  // 从文件解码
  const decodeFromFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          setError('无法创建画布上下文')
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          setScanResult(code.data)
          setError('')
          // 添加到扫描历史记录
          addToScanHistory(code.data)
        } else {
          setError('未检测到二维码')
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // 启动摄像头
  const startCamera = async () => {
    try {
      let stream: MediaStream;
      
      // 首先尝试使用后置摄像头
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        // 如果后置摄像头失败，尝试默认摄像头
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
        } catch (fallbackErr) {
          throw new Error(`无法访问摄像头: ${fallbackErr instanceof Error ? fallbackErr.message : '未知错误'}`);
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setUseCamera(true);
        setError('');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '无法访问摄像头';
      setError(errorMsg);
      console.error('摄像头错误:', err);
      setIsScanning(false);
      setUseCamera(false);
    }
  }

  // 停止摄像头
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setUseCamera(false)
  }

  // 扫描视频帧
  const scanFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    
    // 确保视频已准备好
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setError('无法获取画布上下文');
      return;
    }
    
    try {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        setScanResult(code.data);
        addToScanHistory(code.data);
        stopCamera();
        return;
      }
    } catch (err) {
      console.error('扫描过程中出错:', err);
    }
    
    requestAnimationFrame(scanFrame);
  }

  // 监控扫描状态
  useEffect(() => {
    if (isScanning) {
      const frameId = requestAnimationFrame(scanFrame)
      return () => cancelAnimationFrame(frameId)
    }
  }, [isScanning])

  // 组件卸载时停止摄像头
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 添加这个 effect 来自动聚焦
  useEffect(() => {
    // 组件挂载后自动聚焦到扫描区域
    if (scannerRef.current) {
      scannerRef.current.tabIndex = -1; // 使 div 可聚焦
      scannerRef.current.focus();
    }
  }, []);

  const clearScanHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('qrScanHistory');
  };

  // 下载历史记录中的二维码
  const downloadHistoryQRCode = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `scanned-qrcode-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="qrcode-scanner" 
      onPaste={handlePaste}
      ref={scannerRef}
      style={{ outline: 'none' }}
    >
      <h2>扫描二维码</h2>
      
      <div className="scanner-controls">
        <div className="upload-section">
          <label className="file-upload-label">
            选择图片文件
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          
          <button 
            onClick={startCamera}
            disabled={isScanning}
            className="camera-button"
          >
            {isScanning ? '正在扫描...' : '启动摄像头'}
          </button>
          
          {isScanning && (
            <button 
              onClick={stopCamera}
              className="stop-button"
            >
              停止摄像头
            </button>
          )}
        </div>
        
        <div className="paste-instruction">
          <p>提示：也可以直接按 Ctrl+V 粘贴图片</p>
        </div>
      </div>
      
      {useCamera && (
        <div className="camera-view">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            onPlay={() => console.log('Video playing')}
            onError={(e) => {
              console.error('Video play error:', e);
              setError('视频播放出错');
            }}
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {scanResult && (
        <div className="scan-result">
          <h3>扫描结果：</h3>
          <div className="result-content">
            <p>{scanResult}</p>
            <a 
              href={scanResult} 
              target="_blank" 
              rel="noopener noreferrer"
              className="result-link"
            >
              访问链接
            </a>
          </div>
        </div>
      )}

      {/* 扫描历史记录 */}
      {scanHistory.length > 0 && (
        <div className="scan-history">
          <div className="history-header">
            <h3>扫描历史</h3>
            <button onClick={clearScanHistory} className="clear-history-button">
              清空历史
            </button>
          </div>
          <div className="history-list">
            {scanHistory.map((item, index) => (
              <div key={item.id} className="history-item">
                <div className="history-content">
                  <p className="history-text">{item.content}</p>
                  <div className="history-qrcode">
                    <img 
                      src={item.qrCodeUrl} 
                      alt={`Scanned QR Code ${index + 1}`} 
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
  )
}

export default QRCodeScanner