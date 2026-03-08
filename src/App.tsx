import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Image as ImageIcon, 
  FolderOpen, 
  Layers, 
  Shirt, 
  X,
  Menu,
  Sparkles,
  Key
} from 'lucide-react';
import Generate from './pages/Generate';
import Import from './pages/Import';
import MyDesigns from './pages/MyDesigns';
import Editor from './pages/Editor';
import MockupStudio from './pages/MockupStudio';
import Assistant from './components/Assistant';

export type Page = 'generate' | 'import' | 'designs' | 'editor' | 'mockup';

const FunkyCharacter = ({ className }: { className?: string }) => (
  <img 
    src="https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=transparent" 
    alt="AI Assistant" 
    className={className}
    referrerPolicy="no-referrer"
  />
);

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('generate');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  // Global state for designs
  const [designs, setDesigns] = useState<string[]>([]);
  const [activeDesign, setActiveDesign] = useState<string | null>(null);

  useEffect(() => {
    // Force dark mode for the state-of-the-art creative tool look
    document.documentElement.classList.add('dark');
    
    // Check API Key
    const checkApiKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasApiKey(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasApiKey(true);
    } catch (e) {
      console.error("Error selecting API key:", e);
    }
  };

  const navItems = [
    { id: 'generate', label: 'Generate', icon: Wand2 },
    { id: 'import', label: 'Import', icon: FolderOpen },
    { id: 'designs', label: 'My Designs', icon: Layers },
    { id: 'editor', label: 'Editor', icon: ImageIcon },
    { id: 'mockup', label: 'Mockup Studio', icon: Shirt },
  ];

  if (hasApiKey === null) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-float-delayed" />
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        </div>
        
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full text-center relative z-10 space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto border border-white/10">
            <FunkyCharacter className="w-16 h-16 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Meet Sparky AI</h1>
          <p className="text-zinc-400">
            To use the advanced image generation and editing features, Sparky needs a valid Gemini API key from a paid Google Cloud project.
          </p>
          <button
            onClick={handleSelectApiKey}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 border border-white/20 hover:scale-[1.02]"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex overflow-hidden relative">
      
      {/* Atmospheric Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen animate-float-delayed" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen animate-float-slow" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex-shrink-0 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">HADIs DESIGN</h1>
          </div>
          <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-inner border border-white/10' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="text-sm font-semibold text-white mb-1">Pro Workspace</h3>
              <p className="text-xs text-zinc-400 mb-3">AI-powered design generation & editing.</p>
              <button 
                onClick={() => setIsAssistantOpen(true)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors flex items-center justify-center gap-2 group-hover:border-indigo-500/50"
              >
                <FunkyCharacter className="w-4 h-4" />
                Open Assistant
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            HADIs DESIGN
          </div>
          <button onClick={() => setIsAssistantOpen(true)} className="text-zinc-400 hover:text-white">
            <FunkyCharacter className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-6xl mx-auto h-full"
            >
              {currentPage === 'generate' && <Generate onDesignGenerated={(url) => {
                setDesigns(prev => [url, ...prev]);
                setActiveDesign(url);
                setCurrentPage('editor');
              }} />}
              {currentPage === 'import' && <Import onDesignImported={(url) => {
                setDesigns(prev => [url, ...prev]);
                setActiveDesign(url);
                setCurrentPage('editor');
              }} />}
              {currentPage === 'designs' && <MyDesigns designs={designs} onSelect={(url) => {
                setActiveDesign(url);
                setCurrentPage('editor');
              }} />}
              {currentPage === 'editor' && <Editor activeDesign={activeDesign} onSave={(url) => {
                setDesigns(prev => [url, ...prev]);
                setActiveDesign(url);
              }} onMockup={() => setCurrentPage('mockup')} />}
              {currentPage === 'mockup' && <MockupStudio activeDesign={activeDesign} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Assistant Button (Desktop) */}
        {!isAssistantOpen && (
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="hidden md:flex absolute bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] items-center justify-center transition-all hover:scale-110 hover:-translate-y-1 z-30 border border-white/20 group"
          >
            <FunkyCharacter className="w-10 h-10 drop-shadow-md group-hover:animate-bounce" />
          </button>
        )}
      </main>

      {/* Assistant Panel */}
      <Assistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        activeDesign={activeDesign}
        onUpdateDesign={(url) => {
          setDesigns(prev => [url, ...prev]);
          setActiveDesign(url);
        }}
      />
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
