import React from 'react';
import { MagicWandIcon, ZoomInIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';
import { SectionHeader } from './SectionHeader';

interface RetouchPaneProps {
    isLoading: boolean;
    loadingMessage: string;
    retouchSourceImage: string | null;
    selectedImage: string | null;
    activeRetouchTarget: 'source' | 'result' | null;
    onSetActiveRetouchTarget: (target: 'source' | 'result' | null) => void;
    retouchPrompt: string;
    onSetRetouchPrompt: (prompt: string) => void;
    isRetouching: boolean;
    onRetouch: () => void;
    onClearResult: () => void;
    onZoom: (image: string) => void;
}

export const RetouchPane: React.FC<RetouchPaneProps> = ({
    isLoading,
    loadingMessage,
    retouchSourceImage,
    selectedImage,
    activeRetouchTarget,
    onSetActiveRetouchTarget,
    retouchPrompt,
    onSetRetouchPrompt,
    isRetouching,
    onRetouch,
    onClearResult,
    onZoom
}) => {
    const renderImagePane = (type: 'source' | 'result', image: string | null, label: string) => {
        const isSplitView = !!retouchSourceImage;
        const isTarget = isSplitView && activeRetouchTarget === type;

        return (
            <div
                onClick={() => image && isSplitView && onSetActiveRetouchTarget(type)}
                className={`flex-1 flex flex-col min-h-0 ${image && isSplitView ? 'cursor-pointer' : ''}`}
            >
                <label className="text-[14px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1 self-start">{label}</label>
                <div className={`relative flex-1 w-full flex items-center justify-center bg-slate-50 border border-slate-300 rounded-[8px] overflow-hidden transition-all duration-200
             ${isTarget ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50/30' : 'hover:border-blue-300'}
             ${!image ? 'border-dashed' : ''}
          `}>
                    {image ? (
                        <div className="relative group w-full h-full flex items-center justify-center">
                            <img src={image} alt={label} className="max-h-full max-w-full object-contain shadow-sm" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onZoom(image); }}
                                    className="bg-white text-slate-800 p-2 rounded-xl hover:bg-blue-50 shadow-lg"
                                >
                                    <ZoomInIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-300 text-sm flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3"><MagicWandIcon className="h-6 w-6 opacity-30" /></div>
                            <p>Waiting for result...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-[8px] shadow-md flex-grow flex flex-col relative">
                <SectionHeader title="이미지 생성" />
                <div className="flex-grow flex flex-col gap-4 relative min-h-0">
                    {(isLoading || isRetouching) && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-[8px]">
                            <LoadingSpinner className="h-8 w-8 text-blue-600 mb-3" />
                            <p className="text-slate-600 font-medium">{loadingMessage}</p>
                        </div>
                    )}
                    {retouchSourceImage ? (
                        <>{renderImagePane('source', retouchSourceImage, 'Original')}{renderImagePane('result', selectedImage, 'Result')}</>
                    ) : (
                        renderImagePane('result', selectedImage, 'Result')
                    )}
                </div>
            </div>
            <div className="bg-white p-5 rounded-[8px] shadow-md">
                <SectionHeader title="이미지 리터치" />
                <textarea
                    value={retouchPrompt}
                    onChange={(e) => onSetRetouchPrompt(e.target.value)}
                    placeholder="수정 프롬프트..."
                    className="w-full h-24 p-3 bg-white border border-slate-300 rounded-[8px] text-sm mb-4 resize-none"
                />
                <div className="flex gap-2">
                    <button
                        onClick={onRetouch}
                        disabled={isRetouching || !retouchPrompt.trim()}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-[8px]"
                    >
                        이미지 편집
                    </button>
                    <button onClick={onClearResult} className="px-4 border border-slate-300 rounded-[8px]">Clear</button>
                </div>
            </div>
        </div>
    );
};
