// API key is now hardcoded in geminiService.ts — this hook simply returns "always connected".
export const useGeminiSystem = () => {
    return {
        isApiConnected: true as const,
    };
};
