import React from 'react';

interface StepProgressProps {
    currentStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep }) => {
    return (
        <div className="bg-white rounded-[8px] shadow-lg mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 py-6 px-6">
                    <div className="w-full h-1 bg-blue-600 mb-3 rounded-full"></div>
                    <p className="text-blue-600 font-bold text-[14px] mb-1">Step 1</p>
                    <h3 className="text-slate-800 font-bold text-[14px]">렌더링 세팅 입력</h3>
                </div>
                <div className="lg:col-span-4 py-6 px-6">
                    <div className={`w-full h-1 mb-3 rounded-full ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <p className={`font-bold text-[14px] mb-1 ${currentStep >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>Step 2</p>
                    <h3 className={`font-bold text-[14px] ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>이미지 편집/조정</h3>
                </div>
                <div className="lg:col-span-4 py-6 px-6">
                    <div className={`w-full h-1 mb-3 rounded-full ${currentStep >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>
                    <p className={`font-bold text-[14px] mb-1 ${currentStep >= 3 ? 'text-teal-600' : 'text-slate-400'}`}>Step 3</p>
                    <h3 className={`font-bold text-[14px] ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>이미지 선별/추출</h3>
                </div>
            </div>
        </div>
    );
};
