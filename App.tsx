import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, FileText, Calendar, Clock, Plus, Settings, Home, Library, ChevronRight } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import NoteDetail from './NoteDetail';
import { RecorderState, Note } from './types';
import { blobToBase64, formatDuration, formatDate, getShortDate } from './audioUtils';
import { processAudioWithGemini } from './geminiService';

type View = 'record' | 'library';

const App: React.FC = () => {
  // State
  const [activeView, setActiveView] = useState<View>('record');
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('ai_notes_data');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((n: any) => ({
        ...n,
        actionItems: n.actionItems.map((item: any) => 
          typeof item === 'string' ? { task: item, assignee: null } : item
        )
      }));
    } catch (e) {
      return [];
    }
  });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('ai_notes_data', JSON.stringify(notes));
  }, [notes]);

  // Start Recording
  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecorderState(RecorderState.RECORDING);
      
      setRecordingDuration(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      alert("Please allow microphone access to record notes.");
    }
  };

  // Stop Recording & Process
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || recorderState !== RecorderState.RECORDING) return;

    mediaRecorderRef.current.stop();
    setRecorderState(RecorderState.PROCESSING);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const duration = recordingDuration;

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await processAudioWithGemini(base64Audio, "audio/webm");
      
      // Smart Title with Date
      const dateSuffix = getShortDate();
      const finalTitle = `${result.title} - ${dateSuffix}`;

      const newNote: Note = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        duration: duration,
        title: finalTitle,
        summary: result.summary,
        keyPoints: result.keyPoints,
        actionItems: result.actionItems,
        transcript: result.transcript,
        category: result.category
      };

      setNotes(prev => [newNote, ...prev]);
      setRecorderState(RecorderState.IDLE);
      setSelectedNote(newNote); 
    } catch (error) {
      alert("There was an issue processing your audio. Please check your connection.");
      setRecorderState(RecorderState.IDLE);
    }
  }, [recorderState, recordingDuration, stream]);

  const deleteNote = (id: string) => {
    if (confirm("Delete this note?")) {
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    }
  };

  if (selectedNote) {
    return (
      <NoteDetail 
        note={selectedNote} 
        onBack={() => setSelectedNote(null)} 
        onDelete={(id) => {
          deleteNote(id);
          setSelectedNote(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="px-6 py-5 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-lg z-20 border-b border-gray-100 safe-top">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI Recorder</h1>
        </div>
        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 rounded-full">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-6 pb-32 max-w-2xl mx-auto w-full">
        
        {activeView === 'record' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Recorder Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[340px] gap-8">
              
              {recorderState === RecorderState.RECORDING ? (
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-red-50 text-red-500 text-xs font-bold rounded-full animate-pulse mb-2">
                      RECORDING LIVE
                    </span>
                    <div className="text-5xl font-bold text-gray-900 tabular-nums">
                      {formatDuration(recordingDuration)}
                    </div>
                  </div>
                  <AudioVisualizer stream={stream} isRecording={true} />
                </div>
              ) : recorderState === RecorderState.PROCESSING ? (
                <div className="flex flex-col items-center gap-5 text-center">
                   <div className="relative">
                     <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                     <Loader2 className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
                   </div>
                   <div>
                     <p className="text-lg font-semibold text-gray-800">Analyzing Speech</p>
                     <p className="text-sm text-gray-500">Extracting tasks and summaries...</p>
                   </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto animate-float">
                    <Mic className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Capture an Idea</h2>
                  <p className="text-gray-500 max-w-[240px] mx-auto text-sm leading-relaxed">
                    Tap the button below to start your meeting or voice memo.
                  </p>
                </div>
              )}

              {/* Action Button */}
              {recorderState === RecorderState.IDLE && (
                <button 
                  onClick={startRecording}
                  className="w-20 h-20 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-200 group"
                >
                  <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </button>
              )}

              {recorderState === RecorderState.RECORDING && (
                <button 
                  onClick={stopRecording}
                  className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-900 hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200"
                >
                  <Square className="w-6 h-6 text-white fill-current" />
                </button>
              )}
            </div>

            {/* Quick Recent Section */}
            {notes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Latest Note</h3>
                  <button onClick={() => setActiveView('library')} className="text-sm font-semibold text-indigo-600 flex items-center gap-1">
                    See All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div 
                  onClick={() => setSelectedNote(notes[0])}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{notes[0].title}</h4>
                    <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                      {notes[0].category || 'Memo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{notes[0].summary}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Your Library</h2>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                {notes.length} Total
              </span>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                   <Library className="w-8 h-8" />
                </div>
                <p className="text-gray-400 font-medium">Your library is empty.</p>
                <button 
                  onClick={() => setActiveView('record')}
                  className="mt-4 text-sm font-bold text-indigo-600"
                >
                  Record your first note
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {notes.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 line-clamp-1">{note.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {note.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(note.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(note.duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 safe-bottom z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveView('record')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'record' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeView === 'record' ? 'bg-indigo-50' : ''}`}>
              <Home className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>

          <button 
            onClick={() => setActiveView('library')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeView === 'library' ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeView === 'library' ? 'bg-indigo-50' : ''}`}>
              <Library className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
        </div>
      </nav>

    </div>
  );
};

export default App;