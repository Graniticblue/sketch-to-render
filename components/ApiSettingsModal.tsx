import React from 'react';
import { ShieldCheckIcon, CloseIcon, CheckIcon, AlertCircleIcon, RefreshIcon } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface ApiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isApiConnected: boolean | null;
    isTestingApi: boolean;
    onTestApi: () => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
    isOpen,
    onClose,
    isApiConnected,
    isTestingApi,
    onTestApi,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">서버 연결 상태</h2>
                            <p className="text-xs text-slate-500">Gemini AI 백엔드 프록시</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <CloseIcon className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        {isApiConnected === true ? (
                            <div className="animate-in zoom-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                                    <CheckIcon className="w-8 h-8" />
                                </div>
                                <p className="text-green-700 font-bold">서버 연결 성공</p>
                                <p className="text-xs text-slate-500 mt-1">시스템 사용이 가능합니다.</p>
                            </div>
                        ) : isApiConnected === false ? (
                            <div className="animate-in zoom-in">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                                    <AlertCircleIcon className="w-8 h-8" />
                                </div>
                                <p className="text-red-700 font-bold">서버 연결 실패</p>
                                <p className="text-xs text-slate-500 mt-1">서버 API 키 설정을 확인해 주세요.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-3 mx-auto">
                                    <RefreshIcon className="w-8 h-8" />
                                </div>
                                <p className="text-slate-600 font-medium">상태 확인 중...</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onTestApi}
                        disabled={isTestingApi}
                        className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {isTestingApi ? <LoadingSpinner className="w-5 h-5" /> : '연결 테스트'}
                    </button>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <p className="text-[11px] text-blue-700 leading-relaxed text-center">
                            API 키는 서버 환경변수에만 저장되며, 브라우저에 노출되지 않습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
