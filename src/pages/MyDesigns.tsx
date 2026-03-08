import React from 'react';
import { motion } from 'framer-motion';
import { Download, Edit2, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface MyDesignsProps {
  designs: string[];
  onSelect: (url: string) => void;
}

export default function MyDesigns({ designs, onSelect }: MyDesignsProps) {
  if (designs.length === 0) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center space-y-6 glass-panel rounded-3xl p-12">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
          <ImageIcon className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">No designs yet</h2>
          <p className="text-zinc-400 max-w-sm text-lg">
            Generate a new design or import an existing one to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Your Gallery
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            My <span className="text-gradient">Designs</span>
          </h1>
        </div>
        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {designs.map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
            className="group relative aspect-square glass-panel rounded-3xl overflow-hidden border border-white/10 hover:border-indigo-500/50 transition-colors duration-300"
          >
            {/* Checkerboard background for transparency */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzExMSIvPgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIiLz4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIiLz4KPC9zdmc+')] opacity-50" />
            
            <img 
              src={url} 
              alt={`Design ${i}`} 
              className="w-full h-full object-contain p-6 relative z-10 drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 z-20">
              <button 
                onClick={() => onSelect(url)}
                className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Edit Design
              </button>
              <div className="flex gap-3">
                <button className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors border border-white/10 backdrop-blur-md">
                  <Download className="w-5 h-5" />
                </button>
                <button className="p-3 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 backdrop-blur-md">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
