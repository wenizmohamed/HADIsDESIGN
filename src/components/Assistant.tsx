import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Wand2, Loader2, Image as ImageIcon, Sparkles, User } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
  activeDesign: string | null;
  onUpdateDesign: (url: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const FunkyCharacter = ({ className }: { className?: string }) => (
  <img 
    src="https://api.dicebear.com/7.x/bottts/svg?seed=Sparky&backgroundColor=transparent" 
    alt="AI Assistant" 
    className={className}
    referrerPolicy="no-referrer"
  />
);

export default function Assistant({ isOpen, onClose, activeDesign, onUpdateDesign }: AssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I am your HADIs DESIGN AI Assistant. I can help you generate designs, edit your current work, or answer questions about printing and merchandise.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing. Please select an API key.");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const contents: any[] = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      
      const currentUserParts: any[] = [{ text: userMsg.content }];
      
      let base64Data = '';
      if (activeDesign) {
        if (activeDesign.startsWith('data:image')) {
          base64Data = activeDesign.replace(/^data:image\/\w+;base64,/, '');
        } else if (activeDesign.startsWith('/api/images/')) {
          const res = await fetch(activeDesign);
          const blob = await res.blob();
          const base64Str = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
        }

        if (base64Data) {
          currentUserParts.push({
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          });
        }
      }

      contents.push({
        role: 'user',
        parts: currentUserParts
      });

      const editDesignDeclaration = {
        name: 'edit_active_design',
        description: 'Edits the currently active design based on a prompt. Use this when the user asks to change, color, or modify the current image.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: 'The prompt describing how to edit the image. Be specific about colors and styles.',
            },
          },
          required: ['prompt'],
        },
      };

      const generateDesignDeclaration = {
        name: 'generate_new_design',
        description: 'Generates a completely new design based on a prompt. Use this when the user asks to create something new from scratch.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: 'The prompt describing the new image to generate.',
            },
          },
          required: ['prompt'],
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          systemInstruction: `You are the HADIs DESIGN AI Assistant, an agent capable of taking action. You help users design logos, patterns, and merchandise. 
If the user asks you to edit, color, or modify the current design, use the edit_active_design tool.
If the user asks you to create or generate a new design, use the generate_new_design tool.
Otherwise, provide helpful design advice. Do not tell the user you cannot edit the image; instead, use the tool to do it.`,
          tools: [{ functionDeclarations: [editDesignDeclaration, generateDesignDeclaration] }],
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + 'working', role: 'assistant', content: `Working on it: ${call.name === 'edit_active_design' ? 'Editing design' : 'Generating new design'}...` },
        ]);

        try {
          let newBase64Image = '';
          
          if (call.name === 'edit_active_design') {
            if (!base64Data) {
               throw new Error("No active design to edit. Please generate or import one first.");
            }
            const editPrompt = (call.args as any).prompt;
            const editResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: 'image/png',
                    },
                  },
                  { text: editPrompt },
                ],
              },
            });
            
            for (const part of editResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                newBase64Image = part.inlineData.data;
                break;
              }
            }
          } else if (call.name === 'generate_new_design') {
            const genPrompt = (call.args as any).prompt;
            const genResponse = await ai.models.generateContent({
              model: 'gemini-3.1-flash-image-preview',
              contents: {
                parts: [{ text: genPrompt }],
              },
              config: {
                imageConfig: {
                  aspectRatio: '1:1',
                  imageSize: '1K',
                },
              },
            });
            
            for (const part of genResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                newBase64Image = part.inlineData.data;
                break;
              }
            }
          }

          if (newBase64Image) {
            const dataUrl = `data:image/png;base64,${newBase64Image}`;
            onUpdateDesign(dataUrl);
            setMessages((prev) => [
              ...prev.filter(m => !m.id.endsWith('working')),
              { id: Date.now().toString(), role: 'assistant', content: "I've updated the design for you! Check it out in the editor." },
            ]);
          } else {
             throw new Error("Failed to generate image data.");
          }
        } catch (err: any) {
          console.error("Tool execution error:", err);
          setMessages((prev) => [
            ...prev.filter(m => !m.id.endsWith('working')),
            { id: Date.now().toString(), role: 'assistant', content: `Sorry, I couldn't complete the action: ${err.message}` },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: response.text || 'Sorry, I encountered an error.' },
        ]);
      }
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error: ' + (error.message || 'Unknown error') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full md:w-96 glass-panel shadow-2xl border-l border-white/10 flex flex-col z-50 overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-full h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-fuchsia-600/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
                <FunkyCharacter className="w-10 h-10 drop-shadow-md" />
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight">Sparky AI</h3>
                <p className="text-xs text-indigo-300 font-medium">Design Agent</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Design Context */}
          {activeDesign && (
            <div className="p-4 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-4 relative z-10 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                <img src={activeDesign} alt="Context" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="text-sm font-medium text-indigo-200">
                Assistant can see your active design
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-600/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                    <FunkyCharacter className="w-6 h-6 drop-shadow-sm" />
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-white/10">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-sm border border-white/10'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-zinc-100 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-600/20 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <FunkyCharacter className="w-6 h-6 drop-shadow-sm animate-pulse" />
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span className="text-sm text-zinc-400">Sparky is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md relative z-10">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-zinc-500 transition-all shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-zinc-500 text-white rounded-xl transition-all disabled:border disabled:border-white/5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
