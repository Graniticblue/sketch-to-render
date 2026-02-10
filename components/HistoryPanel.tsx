
import React, { useState, useEffect } from 'react';
import { ZoomInIcon, CheckIcon, ArrowLeftIcon, DownloadIcon, CloseIcon } from './Icons';

interface HistoryPanelProps {
  images: string[];
  selectedImage: string | null;
  checkedImages: string[];
  imageNames?: Record<string, string>;
  onSelectImage: (image: string) => void;
  onToggleCheck: (image: string) => void;
  onZoomImage: (index: number) => void;
  onDeleteImage: (index: number) => void;
  onDownloadBatch: () => void;
  onDownloadImage: (image: string) => void;
  onRenameImages?: (name: string) => void;
  isDownloading: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  images, 
  selectedImage, 
  checkedImages,
  imageNames = {},
  onSelectImage, 
  onToggleCheck, 
  onZoomImage,
  onDeleteImage,
  onDownloadBatch,
  onDownloadImage,
  onRenameImages,
  isDownloading
}) => {
  const [memoText, setMemoText] = useState('');

  // Update memo text when selection changes
  useEffect(() => {
    if (checkedImages.length === 1) {
        const currentName = imageNames[checkedImages[0]] || '';
        setMemoText(currentName);
    } else {
        setMemoText('');
    }
  }, [checkedImages, imageNames]);

  const handleZoomClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onZoomImage(index);
  };

  const handleCheckClick = (e: React.MouseEvent, image: string) => {
    e.stopPropagation();
    onToggleCheck(image);
  };

  const handleDeleteClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onDeleteImage(index);
  }

  const handleMemoSubmit = () => {
      if (onRenameImages && checkedImages.length > 0) {
          onRenameImages(memoText);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleMemoSubmit();
      }
  }

  return (
    <div className="flex flex-col h-full gap-5 px-2">
       {/* Top: History List */}
       <div className="flex-grow flex flex-col min-h-0 bg-white overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2">
             <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wide ml-1">Generated Items ({images.length})</span>
             {checkedImages.length > 0 && (
                <span className="text-xs font-semibold text-white bg-[#457b5c] px-2 py-0.5 rounded-[8px]">
                    {checkedImages.length} selected
                </span>
             )}
          </div>

          <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {images.length > 0 ? (
                <div className="space-y-2">
                {images.map((image, index) => {
                    const isChecked = checkedImages.includes(image);
                    const isSelected = selectedImage === image;
                    const displayName = imageNames[image] || `Rendering #${images.length - index}`;
                    
                    return (
                        <div
                            key={index}
                            className={`group flex items-center gap-3 p-2 rounded-[8px] border transition-all cursor-pointer
                                ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}
                            `}
                            onClick={(e) => handleZoomClick(e, index)}
                        >
                            {/* Checkbox */}
                            <button
                                onClick={(e) => handleCheckClick(e, image)}
                                className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors
                                    ${isChecked ? 'bg-[#457b5c] border-[#457b5c] text-white' : 'bg-white border-slate-300 text-transparent hover:border-[#457b5c]'}
                                `}
                            >
                                <CheckIcon className="w-3.5 h-3.5" />
                            </button>

                            {/* Thumbnail */}
                            <div className="w-14 h-14 bg-slate-100 rounded-[6px] overflow-hidden shrink-0 border border-slate-200">
                                <img src={image} alt="thumb" className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex-grow min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {displayName}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {new Date().toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions (Hover) */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {e.stopPropagation(); onSelectImage(image);}}
                                    className="p-1.5 hover:bg-slate-100 rounded-[6px] text-slate-500"
                                    title="Edit"
                                >
                                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteClick(e, index)}
                                    className="p-1.5 hover:bg-red-50 rounded-[6px] text-slate-400 hover:text-red-500"
                                    title="Delete"
                                >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 border border-dashed border-slate-200 rounded-[8px]">
                    <p className="text-xs">No renderings yet.</p>
                </div>
            )}
          </div>
       </div>

       {/* Bottom: Actions */}
       <div className="shrink-0 mt-auto border-t border-slate-200 pt-4 h-[210px] flex flex-col justify-between">
            <div className="flex flex-col gap-1">
                 <label className="text-[14px] font-bold text-slate-500">File Name</label>
                 <div className="flex gap-2">
                     <input 
                        type="text"
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={checkedImages.length === 0}
                        placeholder={checkedImages.length === 0 ? "Select items above..." : "Enter filename..."}
                        className="flex-1 bg-white border border-slate-300 rounded-[8px] px-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 h-10 disabled:bg-slate-50"
                     />
                     <button 
                        onClick={handleMemoSubmit}
                        disabled={checkedImages.length === 0}
                        className="bg-white hover:bg-slate-50 text-slate-600 w-10 h-10 rounded-[8px] flex items-center justify-center border border-slate-300 disabled:opacity-50"
                     >
                         <CheckIcon className="w-4 h-4" />
                     </button>
                 </div>
             </div>

            <div>
                <button
                    onClick={onDownloadBatch}
                    disabled={checkedImages.length === 0 || isDownloading}
                    className="w-full bg-[#457b5c] hover:bg-[#356148] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold h-11 px-4 rounded-[8px] transition-colors flex items-center justify-center shadow-sm"
                >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    {checkedImages.length > 0 ? `다운로드 (${checkedImages.length})` : '선택항목 다운로드'}
                </button>
            </div>
       </div>
    </div>
  );
};
