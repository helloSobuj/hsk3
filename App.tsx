import React, { useState, useEffect } from 'react';
import { INITIAL_WORDS } from './constants';
import { Word, HSKLevel, AppMode, Difficulty } from './types';
import { WordList } from './components/WordList';
import { Flashcard } from './components/Flashcard';
import { ProgressBar } from './components/ProgressBar';
import { GrammarSection } from './components/GrammarSection';
import { Layers, Book, GraduationCap, Menu, List, X as XIcon } from 'lucide-react';

// Helper to deterministically assign difficulty based on the character code
// This ensures the same word always gets the same difficulty without modifying constants.ts
const assignDifficulty = (word: Word): Word => {
  const code = word.char.charCodeAt(0);
  let difficulty = Difficulty.EASY;
  
  if (code % 3 === 1) difficulty = Difficulty.MEDIUM;
  if (code % 3 === 2) difficulty = Difficulty.HARD;
  
  return { ...word, difficulty };
};

export default function App() {
  const [level, setLevel] = useState<HSKLevel>(HSKLevel.HSK1);
  const [mode, setMode] = useState<AppMode>(AppMode.FLASHCARDS);
  // Initialize words with assigned difficulties
  const [words, setWords] = useState<Word[]>(() => INITIAL_WORDS.map(assignDifficulty));
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load progress from local storage
  useEffect(() => {
    const savedMastered = localStorage.getItem('hsk_mastered');
    if (savedMastered) {
      setMasteredIds(new Set(JSON.parse(savedMastered)));
    }
    
    // Set initial word
    const hsk1Words = words.filter(w => w.level === HSKLevel.HSK1);
    if (hsk1Words.length > 0) setCurrentWord(hsk1Words[0]);
  }, []); // Run only once, words dependency is stable from initial state

  // Filter words by level
  const currentLevelWords = words.filter(w => w.level === level);

  const handleLevelChange = (newLevel: HSKLevel) => {
    setLevel(newLevel);
    // Find first word of new level
    const newWords = words.filter(w => w.level === newLevel);
    if (newWords.length > 0) {
      setCurrentWord(newWords[0]);
    } else {
      setCurrentWord(null);
    }
  };

  const goToNextWord = () => {
    if (!currentWord) return;
    
    // Find index of current word
    const currentIndex = currentLevelWords.findIndex(w => w.id === currentWord.id);
    if (currentIndex === -1) return;

    // Calculate next index (loop back to start if at end)
    const nextIndex = (currentIndex + 1) % currentLevelWords.length;
    setCurrentWord(currentLevelWords[nextIndex]);
  };

  const handleToggleStatus = (wordId: string, isMastered: boolean) => {
    const newSet = new Set(masteredIds);
    if (isMastered) {
      newSet.add(wordId);
    } else {
      newSet.delete(wordId);
    }
    setMasteredIds(newSet);
    localStorage.setItem('hsk_mastered', JSON.stringify(Array.from(newSet)));

    // Auto-advance logic
    goToNextWord();
  };

  const getThemeColor = (lvl: HSKLevel) => {
    switch (lvl) {
      case HSKLevel.HSK1: return 'text-emerald-500';
      case HSKLevel.HSK2: return 'text-blue-500';
      case HSKLevel.HSK3: return 'text-amber-500';
      default: return 'text-slate-500';
    }
  };

  const getThemeBg = (lvl: HSKLevel) => {
    switch (lvl) {
      case HSKLevel.HSK1: return 'bg-emerald-500';
      case HSKLevel.HSK2: return 'bg-blue-500';
      case HSKLevel.HSK3: return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const handleWordSelect = (w: Word) => {
    setCurrentWord(w);
    setMode(AppMode.FLASHCARDS); // Switch to flashcard mode when selecting a word from the list
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-20">
         <div className="font-serif font-bold text-xl text-slate-800 flex items-center gap-2">
           <GraduationCap className={getThemeColor(level)} />
           HanziHero
         </div>
         <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
           {sidebarOpen ? <XIcon /> : <Menu />}
         </button>
      </div>

      {/* Sidebar (Desktop: Fixed, Mobile: Overlay) */}
      <div className={`
        fixed inset-0 z-10 md:static md:z-0 flex transition-transform duration-300 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full w-64 lg:w-72 bg-white border-r border-slate-200 shadow-xl md:shadow-none flex-shrink-0">
          {/* Brand */}
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-slate-100">
             <div className={`p-2 rounded-lg text-white ${getThemeBg(level)}`}>
               <GraduationCap className="w-6 h-6" />
             </div>
             <div>
               <h1 className="font-serif font-bold text-xl text-slate-800 tracking-tight">HanziHero</h1>
               <p className="text-xs text-slate-400 font-medium tracking-wide">HSK MASTERY</p>
             </div>
          </div>

          {/* Level Selector */}
          <div className="p-4 grid grid-cols-3 gap-2 border-b border-slate-100 bg-slate-50/50">
            {[HSKLevel.HSK1, HSKLevel.HSK2, HSKLevel.HSK3].map((l) => (
              <button
                key={l}
                onClick={() => handleLevelChange(l)}
                className={`
                  py-2 px-1 rounded-lg text-xs font-bold transition-all border
                  ${level === l 
                    ? 'bg-white border-slate-300 shadow-sm text-slate-800' 
                    : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'}
                `}
              >
                HSK {l}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col gap-1 p-3">
             <button 
               onClick={() => setMode(AppMode.FLASHCARDS)}
               className={`w-full py-3 px-4 text-sm font-medium rounded-xl flex items-center gap-3 transition-all ${mode === AppMode.FLASHCARDS ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               <Layers className="w-5 h-5" /> Flashcards
             </button>
             <button 
               onClick={() => setMode(AppMode.WORDLIST)}
               className={`w-full py-3 px-4 text-sm font-medium rounded-xl flex items-center gap-3 transition-all ${mode === AppMode.WORDLIST ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               <List className="w-5 h-5" /> Word List
             </button>
             <button 
               onClick={() => setMode(AppMode.GRAMMAR)}
               className={`w-full py-3 px-4 text-sm font-medium rounded-xl flex items-center gap-3 transition-all ${mode === AppMode.GRAMMAR ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               <Book className="w-5 h-5" /> Grammar
             </button>
          </div>

          {/* Sidebar Footer */}
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50">
             <ProgressBar 
               label={`HSK ${level} Progress`} 
               current={currentLevelWords.filter(w => masteredIds.has(w.id)).length} 
               total={currentLevelWords.length} 
               colorClass={getThemeBg(level)}
             />
          </div>
        </div>
        
        {/* Overlay backdrop for mobile */}
        <div 
          className="flex-1 bg-slate-900/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
           <div className="max-w-6xl w-full mx-auto h-full flex flex-col">
             {mode === AppMode.FLASHCARDS && (
               <div className="h-full flex flex-col justify-center">
                   {currentWord ? (
                     <div className="space-y-8">
                       <div className="text-center md:text-left">
                         <h2 className="text-2xl font-bold text-slate-800">Flashcards</h2>
                         <p className="text-slate-500">Master the HSK {level} vocabulary list.</p>
                       </div>
                       <Flashcard 
                          word={currentWord}
                          isMastered={masteredIds.has(currentWord.id)}
                          onToggleStatus={handleToggleStatus}
                          colorTheme={getThemeColor(level)}
                       />
                     </div>
                   ) : (
                     <div className="text-center text-slate-400">
                       No words available for this level.
                     </div>
                   )}
               </div>
             )}
             
             {mode === AppMode.WORDLIST && (
                <WordList 
                  words={words} 
                  currentLevel={level}
                  masteredIds={masteredIds}
                  onSelectWord={handleWordSelect}
                  selectedWordId={currentWord?.id || null}
                />
             )}
             
             {mode === AppMode.GRAMMAR && (
               <GrammarSection level={level} />
             )}
           </div>
        </div>
      </main>
    </div>
  );
}