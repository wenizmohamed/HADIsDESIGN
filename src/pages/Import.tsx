import React, { useCallback, useState } from 'react';
import { UploadCloud, FileImage, Loader2, Sparkles, Paintbrush, Shirt } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImportProps {
  onDesignImported: (url: string) => void;
}

export default function Import({ onDesignImported }: ImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onDesignImported(base64String);
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert('Error uploading file');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-4"
        >
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          Bring Your Own Art
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Import Your <br />
          <span className="text-gradient">Designs</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Upload existing artwork to edit, vectorize, or place on mockups.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
            : 'border-white/20 bg-black/40 hover:bg-white/5 hover:border-white/30'
        }`}
      >
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-6 relative z-10">
            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
            <p className="text-xl font-medium text-white">Uploading your masterpiece...</p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 rounded-full flex items-center justify-center mb-8 shadow-2xl">
              <UploadCloud className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Drag & Drop your image here
            </h3>
            <p className="text-zinc-400 mb-10 text-lg">
              Supports PNG, JPG, SVG, WebP up to 50MB
            </p>
            <label className="cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/25 border border-white/20 hover:scale-105">
              Browse Files
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        {[
          { title: 'Edit & Enhance', desc: 'Use AI to refine, recolor, or remove backgrounds.', icon: Sparkles },
          { title: 'Style Transfer', desc: 'Generate new variations based on your uploaded style.', icon: Paintbrush },
          { title: 'Mockup Studio', desc: 'Place your designs directly onto realistic products.', icon: Shirt },
        ].map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h4 className="font-bold text-white mb-3 text-lg">{feature.title}</h4>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
