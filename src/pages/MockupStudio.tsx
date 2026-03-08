import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Download, Shirt, Coffee, Smartphone, Package, AlertCircle } from 'lucide-react';

interface MockupStudioProps {
  activeDesign: string | null;
}

const MOCKUPS = [
  { id: 'tshirt-white', name: 'T-Shirt (White)', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800', type: 'apparel' },
  { id: 'tshirt-black', name: 'T-Shirt (Black)', url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800', type: 'apparel' },
  { id: 'tote', name: 'Tote Bag', url: 'https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?auto=format&fit=crop&q=80&w=800', type: 'accessories' },
  { id: 'mug', name: 'Coffee Mug', url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800', type: 'accessories' },
];

export default function MockupStudio({ activeDesign }: MockupStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedMockup, setSelectedMockup] = useState(MOCKUPS[0]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      preserveObjectStacking: true,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    // Load background
    fabric.Image.fromURL(selectedMockup.url, { crossOrigin: 'anonymous' }).then((img) => {
      // Scale image to fit canvas
      const scale = Math.min(800 / img.width!, 600 / img.height!);
      img.scale(scale);
      
      // Center image
      img.set({
        left: (800 - img.width! * scale) / 2,
        top: (600 - img.height! * scale) / 2,
        selectable: false,
        evented: false,
      });

      fabricCanvas.clear();
      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img);

      // Load design if exists
      if (activeDesign) {
        fabric.Image.fromURL(activeDesign, { crossOrigin: 'anonymous' }).then((designImg) => {
          // Default size and position
          designImg.scaleToWidth(200);
          designImg.set({
            left: 300,
            top: 200,
            cornerColor: '#818cf8',
            cornerStrokeColor: '#ffffff',
            borderColor: '#818cf8',
            transparentCorners: false,
            cornerSize: 12,
            padding: 10,
            cornerStyle: 'circle'
          });
          fabricCanvas.add(designImg);
          fabricCanvas.setActiveObject(designImg);
          fabricCanvas.renderAll();
        });
      } else {
        fabricCanvas.renderAll();
      }
    });
  }, [fabricCanvas, selectedMockup, activeDesign]);

  const handleDownload = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 1,
      multiplier: 2, // High res export
    });
    
    const link = document.createElement('a');
    link.download = `mockup-${selectedMockup.id}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Mockup Selection Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          <h3 className="font-semibold text-lg text-white tracking-tight">Select Product</h3>
          
          <div className="space-y-3">
            {MOCKUPS.map((mockup) => (
              <button
                key={mockup.id}
                onClick={() => setSelectedMockup(mockup)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${
                  selectedMockup.id === mockup.id 
                    ? 'border-indigo-500/50 bg-indigo-500/20 shadow-inner' 
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <img 
                  src={mockup.url} 
                  alt={mockup.name} 
                  className="w-12 h-12 object-cover rounded-xl shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className={`font-semibold text-sm tracking-wide ${
                  selectedMockup.id === mockup.id 
                    ? 'text-indigo-300' 
                    : 'text-zinc-400'
                }`}>
                  {mockup.name}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-white/10">
            <button 
              onClick={handleDownload}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 border border-white/20 hover:scale-[1.02]"
            >
              <Download className="w-5 h-5" />
              Export High-Res Mockup
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex items-center justify-center relative min-h-[600px] shadow-2xl">
        {!activeDesign && (
          <div className="absolute top-6 left-6 right-6 bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-2xl text-sm font-medium z-10 flex items-center gap-3 backdrop-blur-md shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            No design selected. Go to the Generate or Import tab to create a design first.
          </div>
        )}
        <div className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden bg-black border border-white/10">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
