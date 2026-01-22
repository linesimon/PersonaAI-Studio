
import React, { useState, useEffect, useCallback } from 'react';
import { CharacterDNA, GeneratedImage, AppView } from './types';
import { GeminiService } from './services/gemini';
import { 
  PlusIcon, 
  SparklesIcon, 
  PhotoIcon, 
  ArrowPathIcon, 
  CloudArrowDownIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function App() {
  const [dna, setDna] = useState<CharacterDNA>({
    species: 'A cute baby sloth',
    style: 'Chibi 2D vector art style, clean lines, flat colors with soft shading',
    features: ['huge green eyes', 'wearing a green party hat', 'very happy expression'],
    basePrompt: ''
  });

  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeView, setActiveView] = useState<AppView>(AppView.CREATOR);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [batchPrompt, setBatchPrompt] = useState('');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const has = await GeminiService.hasKey();
    setHasApiKey(has);
  };

  const handleAuth = async () => {
    await GeminiService.openKeySelector();
    setHasApiKey(true);
  };

  const generateImage = async (promptModifier: string = '') => {
    if (!hasApiKey) return handleAuth();
    setIsGenerating(true);
    try {
      const fullPrompt = `${dna.style}. ${dna.species} with ${dna.features.join(', ')}. ${promptModifier}`;
      const url = await GeminiService.generateCharacterImage(fullPrompt, imageSize);
      const newImg: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt: fullPrompt,
        timestamp: Date.now(),
        size: imageSize
      };
      setImages(prev => [newImg, ...prev]);
    } catch (err) {
      console.error(err);
      if (err.toString().includes('Requested entity was not found')) {
        setHasApiKey(false);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage || !editPrompt) return;
    setIsGenerating(true);
    try {
      const newUrl = await GeminiService.editImage(selectedImage.url, editPrompt);
      const updatedImage = { ...selectedImage, url: newUrl };
      setImages(prev => prev.map(img => img.id === selectedImage.id ? updatedImage : img));
      setSelectedImage(updatedImage);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAll = () => {
    images.forEach((img, idx) => {
      const link = document.createElement('a');
      link.href = img.url;
      link.download = `persona-${idx}.png`;
      link.click();
    });
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black">
        <div className="glass p-12 rounded-3xl text-center max-w-md w-full border border-violet-500/30">
          <div className="w-20 h-20 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 neon-glow">
            <SparklesIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">PersonaAI</h1>
          <p className="text-gray-400 mb-8">Connect your Google Cloud project to unlock 4K character generation and advanced image editing.</p>
          <button 
            onClick={handleAuth}
            className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-500 transition-all rounded-xl font-bold text-lg shadow-lg hover:shadow-violet-500/20"
          >
            Select API Key
          </button>
          <p className="mt-4 text-xs text-gray-500">
            Requires a paid API key. See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">billing documentation</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-20 glass md:min-h-screen border-b md:border-r border-white/5 flex md:flex-col items-center py-4 md:py-8 justify-between z-50">
        <div className="flex md:flex-col gap-6 px-4 md:px-0">
          <button 
            onClick={() => setActiveView(AppView.CREATOR)}
            className={`p-3 rounded-xl transition-all ${activeView === AppView.CREATOR ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <AdjustmentsHorizontalIcon className="w-7 h-7" />
          </button>
          <button 
            onClick={() => setActiveView(AppView.STUDIO)}
            className={`p-3 rounded-xl transition-all ${activeView === AppView.STUDIO ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <SparklesIcon className="w-7 h-7" />
          </button>
          <button 
            onClick={() => setActiveView(AppView.GALLERY)}
            className={`p-3 rounded-xl transition-all ${activeView === AppView.GALLERY ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
          >
            <PhotoIcon className="w-7 h-7" />
          </button>
        </div>
        <div className="flex md:flex-col gap-4 px-4 md:px-0">
          <button onClick={downloadAll} className="p-3 text-gray-500 hover:text-white">
            <CloudArrowDownIcon className="w-7 h-7" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto h-screen p-6 md:p-12">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-violet-500 uppercase mb-2">Workspace</h2>
            <h1 className="text-3xl md:text-5xl font-display font-bold">
              {activeView === AppView.CREATOR && "Character DNA"}
              {activeView === AppView.STUDIO && "Scene Studio"}
              {activeView === AppView.GALLERY && "Generation Vault"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <select 
              value={imageSize} 
              onChange={(e) => setImageSize(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="1K">1024 (1K)</option>
              <option value="2K">2048 (2K)</option>
              <option value="4K">4096 (4K)</option>
            </select>
          </div>
        </header>

        {/* View Routing */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeView === AppView.CREATOR && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <section>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">Base Character / Species</label>
                  <input 
                    type="text"
                    value={dna.species}
                    onChange={(e) => setDna({...dna, species: e.target.value})}
                    className="w-full glass p-4 rounded-xl border-white/10 focus:border-violet-500 transition-colors text-lg"
                    placeholder="e.g. A robotic red panda"
                  />
                </section>
                <section>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">Visual Art Style</label>
                  <textarea 
                    rows={3}
                    value={dna.style}
                    onChange={(e) => setDna({...dna, style: e.target.value})}
                    className="w-full glass p-4 rounded-xl border-white/10 focus:border-violet-500 transition-colors"
                    placeholder="Describe the aesthetic, lines, colors..."
                  />
                </section>
                <section>
                  <label className="block text-sm font-semibold text-gray-400 mb-3">Permanent Features (DNA)</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dna.features.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full text-sm flex items-center gap-2">
                        {f}
                        <button onClick={() => setDna({...dna, features: dna.features.filter((_, idx) => idx !== i)})}><XMarkIcon className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      className="flex-1 bg-white/5 p-3 rounded-lg border border-white/10"
                      placeholder="Add a trait..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setDna({...dna, features: [...dna.features, (e.target as any).value]});
                          (e.target as any).value = '';
                        }
                      }}
                    />
                  </div>
                </section>
                <button 
                  onClick={() => generateImage('neutral pose, white background')}
                  disabled={isGenerating}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-violet-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isGenerating ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                  Generate Base Persona
                </button>
              </div>
              <div className="flex items-center justify-center">
                {images.length > 0 ? (
                  <img src={images[0].url} alt="Latest" className="w-full max-w-lg aspect-square object-contain rounded-3xl shadow-2xl glass p-2" />
                ) : (
                  <div className="w-full max-w-lg aspect-square rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-gray-600">
                    <PhotoIcon className="w-16 h-16 mb-4" />
                    <p>Character preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === AppView.STUDIO && (
            <div className="space-y-8">
              <div className="max-w-2xl">
                <p className="text-gray-400 mb-6">Describe any situation. PersonaAI will inject your character's DNA into the prompt automatically to maintain consistency.</p>
                <div className="relative group">
                  <textarea 
                    rows={4}
                    value={batchPrompt}
                    onChange={(e) => setBatchPrompt(e.target.value)}
                    className="w-full glass p-6 rounded-2xl border-white/10 text-xl focus:border-violet-500 transition-all pr-16"
                    placeholder="e.g. surfing on a giant slice of pizza in outer space..."
                  />
                  <button 
                    onClick={() => {
                      generateImage(batchPrompt);
                      setBatchPrompt('');
                    }}
                    disabled={isGenerating || !batchPrompt}
                    className="absolute right-4 bottom-4 p-3 bg-violet-600 rounded-xl text-white hover:bg-violet-500 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isGenerating ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <PlusIcon className="w-7 h-7" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map(img => (
                  <div 
                    key={img.id} 
                    className="group relative glass rounded-2xl overflow-hidden cursor-pointer aspect-square hover:ring-2 hover:ring-violet-500 transition-all"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-xs line-clamp-2 text-white/80">{img.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === AppView.GALLERY && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.length === 0 && <p className="col-span-full text-center text-gray-500 py-20 italic">No images in the vault yet.</p>}
              {images.map(img => (
                <div key={img.id} className="glass rounded-xl overflow-hidden aspect-square relative group">
                  <img src={img.url} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedImage(img)} className="p-2 bg-black/60 rounded-lg hover:bg-violet-600"><SparklesIcon className="w-4 h-4" /></button>
                    <button onClick={() => setImages(images.filter(i => i.id !== img.id))} className="p-2 bg-black/60 rounded-lg hover:bg-red-600"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Editor Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-10 h-10" />
          </button>

          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex items-center justify-center">
              <img src={selectedImage.url} className="w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl glass p-2" />
            </div>
            
            <div className="flex flex-col justify-center space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-2">Image Modification</h3>
                <p className="text-gray-400">Powered by Gemini 2.5 Flash Image. Ask for changes like "Make the hat red" or "Change the background to a beach".</p>
              </div>

              <div className="space-y-4">
                <textarea 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="w-full glass p-6 rounded-2xl border-white/10 text-xl focus:border-violet-500 transition-all"
                  rows={4}
                  placeholder="Describe your edits..."
                />
                
                <div className="flex gap-4">
                  <button 
                    onClick={handleEdit}
                    disabled={isGenerating || !editPrompt}
                    className="flex-1 py-4 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                    Apply AI Edit
                  </button>
                  <a 
                    href={selectedImage.url} 
                    download={`persona-${selectedImage.id}.png`}
                    className="px-6 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                  >
                    <CloudArrowDownIcon className="w-7 h-7" />
                  </a>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Prompt Context</p>
                <p className="text-sm text-gray-400 italic line-clamp-3">"{selectedImage.prompt}"</p>
                <div className="mt-4 flex gap-4 text-xs text-gray-500">
                   <span>Resolution: {selectedImage.size}</span>
                   <span>Date: {new Date(selectedImage.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Status Indicator */}
      {isGenerating && (
        <div className="fixed bottom-8 right-8 glass px-6 py-4 rounded-full flex items-center gap-4 animate-bounce z-[200]">
          <div className="w-2 h-2 bg-violet-500 rounded-full animate-ping" />
          <span className="text-sm font-bold text-violet-300">Gemini is thinking...</span>
        </div>
      )}
    </div>
  );
}
