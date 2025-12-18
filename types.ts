export interface ActionItem {
  task: string;
  assignee: string | null;
}

export interface Note {
  id: string;
  title: string;
  createdAt: number;
  duration: number; // in seconds
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  transcript: string;
  category?: string;
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
  PROCESSING = 'PROCESSING',
}

export interface ProcessingResponse {
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  transcript: string;
  category: string;
}