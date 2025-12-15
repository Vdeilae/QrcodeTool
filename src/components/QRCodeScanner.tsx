// src/components/QRCodeScanner.tsx
import React, { useState, useRef, useEffect } from 'react'
import jsQR from 'jsqr'

const QRCodeScanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<string>('')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [useCamera, setUseCamera] = useState<boolean>(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null) // 添加这一行

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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        setUseCamera(true)
        setError('')
      }
    } catch (err) {
      setError('无法访问摄像头，请检查权限设置')
      console.error('摄像头错误:', err)
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
    if (!isScanning || !videoRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current
    
    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        setScanResult(code.data)
        stopCamera()
        return
      }
    }
    
    requestAnimationFrame(scanFrame)
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

  return (
    <div 
      className="qrcode-scanner" 
      onPaste={handlePaste}
      ref={scannerRef} // 添加这一行
      style={{ outline: 'none' }} // 避免聚焦时显示轮廓
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
            style={{ width: '100%', maxHeight: '300px' }}
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
    </div>
  )
}

export default QRCodeScanner