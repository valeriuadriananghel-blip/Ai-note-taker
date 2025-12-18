import React, { useState } from 'react';
import { Note } from '../types';
import { formatDate, formatDuration } from '../utils/audioUtils';
import { Copy, ChevronLeft, Trash2, CheckCircle2, List, FileText, Tag } from 'lucide-react';

interface NoteDetailProps {
  note: Note;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex gap-2">
          <button 
             onClick={() => onDelete(note.id)}
             className="p-2 text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{note.title}</h1>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
               {formatDate(note.createdAt)}
            </span>
            <span className="flex items-center gap-1">
               {formatDuration(note.duration)}
            </span>
             {note.category && (
              <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800/50">
                {note.category}
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-900 rounded-xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'summary' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Structured Notes
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'transcript' 
                ? 'bg-gray-800 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Full Transcript
          </button>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            {/* Summary Section */}
            <section className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-purple-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold">Summary</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                {note.summary}
              </p>
            </section>

            {/* Key Points */}
            <section className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-blue-400">
                <List className="w-5 h-5" />
                <h3 className="font-semibold">Key Points</h3>
              </div>
              <ul className="space-y-2">
                {note.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Action Items */}
            {note.actionItems.length > 0 && (
              <section className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2 mb-3 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-semibold">Action Items</h3>
                </div>
                <div className="space-y-2">
                  {note.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-gray-800/50 rounded-lg">
                      <input type="checkbox" className="mt-1 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500/20" />
                      <span className="text-sm text-gray-200">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm font-mono">
              {note.transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetail;
