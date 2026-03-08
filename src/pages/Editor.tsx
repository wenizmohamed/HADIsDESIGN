import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crop, 
  Palette, 
  Eraser, 
  Wand2, 
  Download, 
  Shirt, 
  Undo2, 
  Redo2,
  Save,
  FileText,
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface EditorProps {
  activeDesign: string | null;
  onSave: (url: string) => void;
  onMockup: () => void;
}

export default function Editor({ activeDesign, onSave, onMockup }: EditorProps) {
  const [activeTool, setActiveTool] = useState<'crop' | 'color' | 'erase' | 'ai'>('ai');
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  const generateBrandKitPDF = async () => {
    if (!activeDesign) return;
    setIsGeneratingKit(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please select an API key.");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      // 1. Get base64 of active design
      let base64Image = activeDesign;
      if (activeDesign.startsWith('/api/images/')) {
        const res = await fetch(activeDesign);
        const blob = await res.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `Analyze this logo and generate a brand kit in JSON format.
Include the following fields:
- colors: an array of 3-5 key colors found in the logo. Each object should have: name (e.g., "Navy Blue"), hex, rgb, cmyk, and pantone (approximation).
- typography: an object with "header" and "body" font recommendations that match the style of this logo. Include font name and a brief reason.
- guidelines: an object with "minimumSize" (e.g., "1 inch / 72px") and "clearSpace" (e.g., "Half the width of the logo icon") recommendations.

Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const jsonText = response.text || '{}';
      const brandKit = JSON.parse(jsonText);

      // 3. Generate PDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ format: 'a4', unit: 'pt' });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(24);
      doc.text('Brand Kit Guidelines', 40, 60);
      
      // Logo
      doc.setFontSize(16);
      doc.text('Primary Logo', 40, 100);
      doc.addImage(base64Image, 'PNG', 40, 120, 200, 200);

      // Guidelines
      doc.setFontSize(16);
      doc.text('Usage Guidelines', 300, 100);
      doc.setFontSize(12);
      doc.text(`Minimum Size: ${brandKit.guidelines?.minimumSize || '1 inch'}`, 300, 130);
      doc.text(`Clear Space: ${brandKit.guidelines?.clearSpace || 'Half icon width'}`, 300, 150);

      // Colors
      doc.setFontSize(16);
      doc.text('Color Palette', 40, 360);
      
      let yOffset = 390;
      brandKit.colors?.forEach((color: any, index: number) => {
        // Draw color box
        doc.setFillColor(color.hex);
        doc.rect(40, yOffset, 40, 40, 'F');
        
        // Draw text
        doc.setFontSize(12);
        doc.text(color.name || 'Color', 90, yOffset + 12);
        doc.setFontSize(10);
        doc.text(`HEX: ${color.hex}`, 90, yOffset + 24);
        doc.text(`RGB: ${color.rgb}`, 90, yOffset + 36);
        doc.text(`CMYK: ${color.cmyk}`, 200, yOffset + 24);
        doc.text(`Pantone: ${color.pantone}`, 200, yOffset + 36);
        
        yOffset += 60;
      });

      // Typography
      doc.setFontSize(16);
      doc.text('Typography', 40, yOffset + 20);
      doc.setFontSize(12);
      doc.text(`Header Font: ${brandKit.typography?.header?.name || brandKit.typography?.header || 'Inter'}`, 40, yOffset + 45);
      doc.setFontSize(10);
      doc.text(brandKit.typography?.header?.reason || '', 40, yOffset + 60, { maxWidth: pageWidth - 80 });
      
      doc.setFontSize(12);
      doc.text(`Body Font: ${brandKit.typography?.body?.name || brandKit.typography?.body || 'Inter'}`, 40, yOffset + 90);
      doc.setFontSize(10);
      doc.text(brandKit.typography?.body?.reason || '', 40, yOffset + 105, { maxWidth: pageWidth - 80 });

      doc.save('brand-kit.pdf');

    } catch (error: any) {
      console.error(error);
      alert('Failed to generate Brand Kit: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingKit(false);
    }
  };

  if (!activeDesign) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 glass-panel rounded-3xl p-12">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
          <Wand2 className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">No design selected</h2>
          <p className="text-zinc-400 max-w-sm text-lg">
            Generate or import a design first to start editing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden relative shadow-2xl">
        
        {/* Toolbar Top */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
              <Undo2 className="w-5 h-5" />
            </button>
            <button className="p-2.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onMockup}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-lg"
            >
              <Shirt className="w-4 h-4" />
              Preview Mockup
            </button>
            <button 
              onClick={() => onSave(activeDesign)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-lg shadow-indigo-500/25 border border-white/20"
            >
              <Save className="w-4 h-4" />
              Save Design
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzExMSIvPgo8cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIiLz4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIiLz4KPC9zdmc+')]">
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            src={activeDesign} 
            alt="Active Design" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Tools Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="glass-panel rounded-3xl p-6 space-y-8">
          <div>
            <h3 className="font-semibold text-lg text-white mb-4 tracking-tight">Pro Tools</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'ai', label: 'AI Enhance', icon: Wand2 },
                { id: 'color', label: 'Recolor', icon: Palette },
                { id: 'erase', label: 'Remove BG', icon: Eraser },
                { id: 'crop', label: 'Crop', icon: Crop },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as any)}
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300 shadow-inner' 
                        : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-3" />
                    <span className="text-xs font-semibold tracking-wide">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Export Options</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> PNG
              </button>
              <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> SVG
              </button>
            </div>
            <button className="w-full py-3 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg">
              <Download className="w-4 h-4" /> Download ZIP Bundle
            </button>
            <button 
              onClick={generateBrandKitPDF}
              disabled={isGeneratingKit}
              className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isGeneratingKit ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isGeneratingKit ? 'Generating...' : 'Export Brand Kit (PDF)'}
            </button>
          </div>
        </div>

        {/* AI Assistant Hint */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl border border-white/10 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
              <Wand2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Need help?</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Open the AI Assistant to ask for edits like "make it vintage" or "change the colors to neon".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
