export interface QRHistoryItem {
  id: string;
  type: 'generated' | 'scanned';
  content: string;
  timestamp: Date;
}

export type QRHistory = QRHistoryItem[];