import React, { useState, useCallback } from 'react';
import { generateRendering, retouchRendering } from './services/geminiService';
import { SettingsIcon, CloseIcon, DownloadIcon } from './components/Icons';
import { Logo } from './components/Logo';
import { useGeminiSystem } from './hooks/useGeminiSystem';
import { useGallery } from './hooks/useGallery';

// Import New Components
import { StepProgress } from './components/StepProgress';
import { RenderingPane } from './components/RenderingPane';
import { RetouchPane } from './components/RetouchPane';
import { HistoryPanel } from './components/HistoryPanel';
import { ApiSettingsModal } from './components/ApiSettingsModal';

const App: React.FC = () => {
  // --- State: Rendering ---
  const [styleRefImage, setStyleRefImage] = useState<string | null>(null);
  const [newSketchupImage, setNewSketchupImage] = useState<string | null>(null);
  const [textFeedback, setTextFeedback] = useState<string>('');

  // --- State: Retouching & UI ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [retouchSourceImage, setRetouchSourceImage] = useState<string | null>(null);
  const [activeRetouchTarget, setActiveRetouchTarget] = useState<'source' | 'result' | null>(null);
  const [retouchPrompt, setRetouchPrompt] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetouching, setIsRetouching] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Hooks ---
  const {
    isApiConnected,
    isTestingApi,
    handleTestApi,
  } = useGeminiSystem();

  const {
    history,
    checkedImages,
    imageNames,
    isZipping,
    lightboxIndex,
    setLightboxIndex,
    addImage,
    clearHistory,
    handleDeleteHistoryItem,
    handleToggleCheck,
    handleRenameImages,
    downloadImage,
    handleDownloadBatch
  } = useGallery();

  // --- Handlers ---

  const handleGenerate = useCallback(async () => {
    if (!styleRefImage || !newSketchupImage) {
      setError('Please upload both a style reference and a SketchUp image.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Generating photorealistic rendering...');
    setError(null);

    setRetouchSourceImage(null);
    setSelectedImage(null);

    try {
      const result = await generateRendering(styleRefImage, newSketchupImage, textFeedback);
      addImage(result);
      setSelectedImage(result);
      setCurrentStep(2);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || '';

      // Detailed Error Parsing
      if (
        errorMessage.includes('API key') ||
        errorMessage.includes('API Key') ||
        errorMessage.includes('unauthenticated') ||
        errorMessage.includes('400') // Bad Request often means invalid key format
      ) {
        setError('API Key appears invalid or missing. Please check your settings.');
        setIsSettingsOpen(true);
      } else {
        setError(`Generation failed: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [styleRefImage, newSketchupImage, textFeedback, addImage]);

  const handleRetouch = useCallback(async () => {
    let sourceToUse = activeRetouchTarget === 'result' ? selectedImage : retouchSourceImage;
    if (!retouchSourceImage) sourceToUse = selectedImage;

    if (!sourceToUse || !retouchPrompt.trim()) return;

    setIsRetouching(true);
    setLoadingMessage('Retouching image...');
    setError(null);

    try {
      const result = await retouchRendering(sourceToUse, retouchPrompt);
      addImage(result);
      setSelectedImage(result);
      setRetouchPrompt('');
    } catch (e: any) {
      console.error(e);
      setError(`Retouch failed: ${e.message}`);
    } finally {
      setIsRetouching(false);
    }
  }, [selectedImage, retouchSourceImage, retouchPrompt, activeRetouchTarget, addImage]);

  const handleEditFromHistory = (image: string) => {
    setRetouchSourceImage(image);
    setSelectedImage(null);
    setActiveRetouchTarget('source');
    setLightboxIndex(null);
    setCurrentStep(2);
  };

  const handleClearResult = () => {
    setSelectedImage(null);
    setRetouchSourceImage(null);
    setActiveRetouchTarget(null);
    setRetouchPrompt('');
  };

  const handleReset = () => {
    setStyleRefImage(null);
    setNewSketchupImage(null);
    setTextFeedback('');
    handleClearResult();
    clearHistory();
    setCurrentStep(1);
  };

  const onDownloadBatchWrapper = () => {
    handleDownloadBatch((msg) => setError(msg));
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto relative">
        <Logo />
        <header className="flex flex-col items-center mb-10 mt-2 relative">
          <h1 className="text-[36px] font-bold text-slate-800">Sketch To Render AI</h1>
          <p className="text-slate-500 text-[18px] mt-1">투시/조감도 자동생성</p>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-0 right-32 p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-sm transition-all group"
            title="API Settings"
          >
            <SettingsIcon className="w-6 h-6 text-slate-600 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </header>

        <StepProgress currentStep={currentStep} />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <RenderingPane
            styleRefImage={styleRefImage}
            onSetStyleRef={setStyleRefImage}
            sketchupImage={newSketchupImage}
            onSetSketchup={setNewSketchupImage}
            feedback={textFeedback}
            onSetFeedback={setTextFeedback}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />

          <RetouchPane
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            retouchSourceImage={retouchSourceImage}
            selectedImage={selectedImage}
            activeRetouchTarget={activeRetouchTarget}
            onSetActiveRetouchTarget={setActiveRetouchTarget}
            retouchPrompt={retouchPrompt}
            onSetRetouchPrompt={setRetouchPrompt}
            isRetouching={isRetouching}
            onRetouch={handleRetouch}
            onClearResult={handleClearResult}
            onZoom={(img) => {
              const idx = history.indexOf(img);
              if (idx !== -1) setLightboxIndex(idx);
            }}
          />

          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-[8px] shadow-md flex-grow">
              <div className="mb-3">
                <h2 className="text-[24px] font-bold text-slate-800 tracking-tight">이미지 선별</h2>
              </div>
              <HistoryPanel
                images={history}
                selectedImage={selectedImage}
                checkedImages={checkedImages}
                imageNames={imageNames}
                onSelectImage={handleEditFromHistory}
                onToggleCheck={handleToggleCheck}
                onZoomImage={(idx) => setLightboxIndex(idx)}
                onDeleteImage={handleDeleteHistoryItem}
                onDownloadBatch={onDownloadBatchWrapper}
                onDownloadImage={downloadImage}
                onRenameImages={handleRenameImages}
                isDownloading={isZipping}
              />
            </div>
          </div>
        </div>

        <ApiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isApiConnected={isApiConnected}
          isTestingApi={isTestingApi}
          onTestApi={handleTestApi}
        />

        {/* Lightbox Modal */}
        {lightboxIndex !== null && history[lightboxIndex] && (
          <div className="fixed inset-0 bg-slate-900/95 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
            <div className="absolute top-6 right-6 flex gap-3">
              <button className="p-3 bg-black/60 text-white rounded-xl" onClick={(e) => { e.stopPropagation(); downloadImage(history[lightboxIndex]!); }}><DownloadIcon className="h-5 w-5" /></button>
              <button className="p-3 bg-black/60 text-white rounded-xl" onClick={() => setLightboxIndex(null)}><CloseIcon className="h-5 w-5" /></button>
            </div>
            <img src={history[lightboxIndex]} alt="Zoom" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {error && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl z-[300] flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <span className="font-bold">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-full"><CloseIcon className="h-4 w-4" /></button>
          </div>
        )}

        <footer className="text-center mt-12 pb-8 text-slate-400 text-xs">
          <p className="font-medium">USUN AX Lab | AI-Powered Architectural Solutions</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
