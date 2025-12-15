// src/App.tsx
import { useState } from 'react'
import './App.css'
import QRCodeGenerator from './components/QRCodeGenerator.tsx'
import QRCodeScanner from './components/QRCodeScanner'

function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate')

  return (
    <div className="app-container">
      {/* 简洁头部 */}
      <header className="app-header-simple">
        <h1 className="app-title">二维码工具</h1>
      </header>

      {/* 标签切换 - 移动端优化 */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'generate' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('generate')}
        >
          生成
        </button>
        <button 
          className={activeTab === 'scan' ? 'tab-button active' : 'tab-button'}
          onClick={() => setActiveTab('scan')}
        >
          扫描
        </button>
      </div>

      {/* 主要内容区域 - 响应式优化 */}
      <main className="main-content-split">
        <div className="content-wrapper">
          {activeTab === 'generate' ? <QRCodeGenerator /> : <QRCodeScanner />}
        </div>
      </main>

      {/* 简洁页脚 */}
      <footer className="app-footer-simple">
        <p>二维码生成与识别工具（幻乐科技制作 vfun@vfun.top）</p>
      </footer>
    </div>
  )
}

export default App