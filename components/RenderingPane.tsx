import React from 'react';
import { ImageUploader } from './ImageUploader';
import { LoadingSpinner } from './LoadingSpinner';
import { SectionHeader } from './SectionHeader';

interface RenderingPaneProps {
    styleRefImage: string | null;
    onSetStyleRef: (img: string | null) => void;
    sketchupImage: string | null;
    onSetSketchup: (img: string | null) => void;
    feedback: string;
    onSetFeedback: (text: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const RenderingPane: React.FC<RenderingPaneProps> = ({
    styleRefImage,
    onSetStyleRef,
    sketchupImage,
    onSetSketchup,
    feedback,
    onSetFeedback,
    onGenerate,
    isLoading
}) => {
    return (
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-[8px] shadow-md flex-grow">
                <SectionHeader title="렌더링 세팅" />
                <div className="space-y-4">
                    <ImageUploader label="레퍼런스 이미지" onImageUpload={onSetStyleRef} currentImage={styleRefImage} />
                    <ImageUploader label="스케치업 모델뷰" onImageUpload={onSetSketchup} currentImage={sketchupImage} />
                </div>
            </div>
            <div className="bg-white p-5 rounded-[8px] shadow-md">
                <SectionHeader title="렌더링 실행" />
                <textarea
                    value={feedback}
                    onChange={(e) => onSetFeedback(e.target.value)}
                    placeholder="추가지침 입력..."
                    className="w-full h-32 p-3 bg-white border border-slate-300 rounded-[8px] text-sm mb-4 resize-none"
                />
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-[8px] flex items-center justify-center gap-2"
                >
                    {isLoading ? <LoadingSpinner /> : '이미지 생성'}
                </button>
            </div>
        </div>
    );
};
