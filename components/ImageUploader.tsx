
import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  label: string;
  onImageUpload: (base64: string | null) => void;
  currentImage: string | null;
  variant?: 'blue' | 'indigo' | 'slate';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, onImageUpload, currentImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = `file-upload-${label.replace(/\s+/g, '-')}`;

  const handleFileChange = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        onImageUpload(null);
    }
  }, [onImageUpload]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] || null);
  };
  
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  }, [handleFileChange]);

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      <label 
          htmlFor={inputId} 
          className="text-[14px] font-bold text-slate-500 uppercase tracking-wide ml-1"
      >
          {label}
      </label>

      {/* Content Area */}
      <div 
        className={`relative group w-full aspect-[16/10] flex items-center justify-center transition-all duration-300 bg-slate-50 border border-slate-300 rounded-[8px]
        ${isDragging ? 'bg-blue-50 border-blue-400' : 'hover:border-blue-300'}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id={inputId}
        />
        {currentImage ? (
          <>
            <img src={currentImage} alt={label} className="object-contain w-full h-full p-2 rounded-[8px]" />
            <button
                onClick={(e) => {
                  e.preventDefault();
                  onImageUpload(null);
                }}
                className="absolute top-2 right-2 bg-white text-slate-500 hover:text-red-600 shadow-sm border border-slate-200 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all z-20"
                aria-label="Remove image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </>
        ) : (
          <div className="text-center text-slate-400 p-4 pointer-events-none">
            <div className="bg-white p-2 rounded-full inline-block mb-2 border border-slate-200 shadow-sm">
                <UploadIcon className="h-5 w-5 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500 text-xs">
              파일추가 또는 드래그앤드롭
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
