
// Add missing Calendar and Clock icons to the lucide-react import
import React, { useState } from 'react';
import { Note } from './types';
import { formatDate, formatDuration } from './audioUtils';
import { ChevronLeft, Trash2, CheckCircle2, List, FileText, UserCircle, Share, Calendar, Clock } from 'lucide-react';

interface NoteDetailProps {
  note: Note;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

  return (
    <div className="flex flex-col h-full min-h-screen bg-white text-gray-900 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* Detail Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 safe-top">
        <button 
          onClick={onBack}
          className="p-2.5 bg-gray-50 text-gray-600 hover:text-indigo-600 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <button className="p-2.5 bg-gray-50 text-gray-600 hover:text-indigo-600 rounded-full transition-colors">
            <Share className="w-5 h-5" />
          </button>
          <button 
             onClick={() => onDelete(note.id)}
             className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Title & Stats */}
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{note.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
               <Calendar className="w-3 h-3" />
               {formatDate(note.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
               <Clock className="w-3 h-3" />
               {formatDuration(note.duration)}
            </div>
             {note.category && (
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                {note.category}
              </div>
            )}
          </div>
        </div>

        {/* Professional Tab Switcher */}
        <div className="flex p-1.5 bg-gray-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'summary' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'transcript' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Transcript
          </button>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Summary Section - Using Indigo colors for consistency */}
            <section className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-wider text-xs">AI Summary</h3>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium">
                {note.summary}
              </p>
            </section>

            {/* Key Points */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-gray-400 px-1">
                <List className="w-4 h-4" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Highlights</h3>
              </div>
              <div className="space-y-3">
                {note.keyPoints.map((point, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Items */}
            {note.actionItems.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 px-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Action Items</h3>
                </div>
                <div className="space-y-3">
                  {note.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-indigo-200 transition-colors">
                      <div className="relative flex items-center mt-1">
                         <input 
                           type="checkbox" 
                           readOnly
                           className="w-5 h-5 rounded-md border-gray-300 bg-white text-indigo-600 focus:ring-indigo-500/20 cursor-pointer accent-indigo-600" 
                         />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm text-gray-800 font-bold">{item.task}</p>
                        {item.assignee && (
                          <div className="flex items-center gap-1.5 w-fit px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                            <UserCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">
                              {item.assignee}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-gray-600 whitespace-pre-wrap leading-loose text-sm font-medium italic">
              "{note.transcript}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetail;
