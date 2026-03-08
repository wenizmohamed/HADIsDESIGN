import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wand2, Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface GenerateProps {
  onDesignGenerated: (url: string) => void;
}

export default function Generate({ onDesignGenerated }: GenerateProps) {
  const [tab, setTab] = useState<'logo' | 'pattern' | 'illustration'>('logo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('minimalist');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please select an API key.");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      let finalPrompt = `Create a high-quality ${tab} design. Description: ${prompt}. Style: ${style}. Clean background, professional quality, suitable for print-on-demand merchandise.`;
      
      if (referenceImage) {
        const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, '');
        
        // Analyze style first
        const styleAnalysisResponse = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/png',
                },
              },
              {
                text: 'Analyze the color palette, texture, and artistic style of this image. Provide a concise description (1-2 sentences) that can be used as a style prompt for an image generator.',
              },
            ],
          },
        });

        const styleDescription = styleAnalysisResponse.text;
        
        let intensityModifier = '';
        if (intensity === 'low') {
          intensityModifier = 'Subtly incorporate elements of the following style:';
        } else if (intensity === 'high') {
          intensityModifier = 'Strictly adhere to the following style, colors, and textures:';
        } else {
          intensityModifier = 'Apply the following style:';
        }

        finalPrompt = `${finalPrompt}. ${intensityModifier} ${styleDescription}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: finalPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: '1K',
          },
        },
      });

      let base64Image = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (!base64Image) {
        throw new Error('Failed to generate image');
      }

      const dataUrl = `data:image/png;base64,${base64Image}`;
      onDesignGenerated(dataUrl);
      
    } catch (error: any) {
      console.error(error);
      alert('Error generating image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-zinc-300 mb-4"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI-Powered Design Engine
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Create Your Next <br />
          <span className="text-gradient">Masterpiece</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Generate production-ready logos, seamless patterns, and stunning illustrations for your merchandise in seconds.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 glass-panel rounded-2xl w-fit mx-auto">
        {['logo', 'pattern', 'illustration'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-8 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-300 ${
              tab === t 
                ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="glass-panel rounded-3xl p-8 md:p-10 space-y-8 relative overflow-hidden">
        {/* Subtle glow inside the form */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <label className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            {tab === 'logo' ? 'Brand Name & Description' : 'Design Description'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={tab === 'logo' ? "e.g., 'Brew Brothers', a vintage coffee shop with a hipster vibe" : "e.g., A seamless pattern of watercolor tropical leaves"}
            className="w-full h-36 px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none text-white placeholder-zinc-600 transition-all text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Style</label>
            <select 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none cursor-pointer transition-all"
            >
              <option value="minimalist">Minimalist</option>
              <option value="vintage">Vintage / Retro</option>
              <option value="bold">Bold & Modern</option>
              <option value="playful">Playful & Cartoon</option>
              <option value="luxury">Luxury & Elegant</option>
              <option value="streetwear">Streetwear / Grunge</option>
              <option value="watercolor">Watercolor</option>
              <option value="geometric">Geometric</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Aspect Ratio</label>
            <select 
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none cursor-pointer transition-all"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="4:3">Landscape (4:3)</option>
              <option value="16:9">Widescreen (16:9)</option>
              <option value="3:4">Portrait (3:4)</option>
              <option value="9:16">Story (9:16)</option>
            </select>
          </div>
        </div>

        {/* Style Transfer Section */}
        <div className="pt-8 border-t border-white/10 space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Style Transfer <span className="text-zinc-500 normal-case ml-2">(Optional)</span>
            </label>
            {referenceImage && (
              <button 
                onClick={() => setReferenceImage(null)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
              >
                <X className="w-3 h-3" /> Remove Image
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              {!referenceImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">Upload Reference Image</span>
                </button>
              ) : (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/20 group">
                  <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {referenceImage && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Intensity</label>
                <select 
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value)}
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none cursor-pointer transition-all"
                >
                  <option value="low">Low (Subtle Influence)</option>
                  <option value="medium">Medium (Balanced)</option>
                  <option value="high">High (Strict Adherence)</option>
                </select>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  AI will analyze the colors, texture, and artistic style of your image and apply it to the new design.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 relative z-10">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              isGenerating || !prompt 
                ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-white/20 hover:scale-[1.02]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Masterpiece...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Generate Design
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
