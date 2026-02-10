import { useState, useEffect } from 'react';
import { testConnection, setGeminiApiKey, getGeminiApiKey } from '../services/geminiService';

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio: AIStudio;
    }
}

export const useGeminiSystem = () => {
    const [isApiConnected, setIsApiConnected] = useState<boolean | null>(null);
    const [isTestingApi, setIsTestingApi] = useState(false);

    useEffect(() => {
        checkApiConnection();
    }, []);

    const checkApiConnection = async () => {
        // 1. Check Local Storage or Env
        const localKey = getGeminiApiKey();
        if (localKey) {
            setIsApiConnected(true);
            // Optional: Verify silently? 
            // For now, trust presence of key implies "connected" state until tested.
            return;
        }

        // 2. Fallback to AI Studio Bridge
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (hasKey) {
                const connected = await testConnection();
                setIsApiConnected(connected);
            } else {
                setIsApiConnected(false);
            }
        } else {
            setIsApiConnected(false);
        }
    };

    const handleOpenApiKeyDialog = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            const connected = await testConnection();
            setIsApiConnected(connected);
        }
    };

    const saveLocalApiKey = async (key: string) => {
        setGeminiApiKey(key);
        const connected = await testConnection();
        setIsApiConnected(connected);
        return connected;
    };

    const handleTestApi = async () => {
        setIsTestingApi(true);
        const connected = await testConnection();
        setIsApiConnected(connected);
        setIsTestingApi(false);
    };

    return {
        isApiConnected,
        isTestingApi,
        checkApiConnection,
        handleOpenApiKeyDialog,
        saveLocalApiKey,
        handleTestApi,
        hasWindowAIStudio: typeof window !== 'undefined' && !!window.aistudio
    };
};
