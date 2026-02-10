import { useState } from 'react';
import JSZip from 'jszip';

interface UseGalleryProps {
    initialHistory?: string[];
}

export const useGallery = ({ initialHistory = [] }: UseGalleryProps = {}) => {
    const [history, setHistory] = useState<string[]>(initialHistory);
    const [checkedImages, setCheckedImages] = useState<string[]>([]);
    const [imageNames, setImageNames] = useState<Record<string, string>>({});
    const [isZipping, setIsZipping] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const addImage = (image: string) => {
        setHistory(prev => [image, ...prev]);
    };

    const clearHistory = () => {
        setHistory([]);
        setCheckedImages([]);
        setImageNames({});
    };

    const handleDeleteHistoryItem = (index: number) => {
        setHistory(prev => {
            const newHistory = [...prev];
            newHistory.splice(index, 1);
            return newHistory;
        });
        // Also remove from checked images if deleted
        const deletedImage = history[index];
        if (checkedImages.includes(deletedImage)) {
            setCheckedImages(prev => prev.filter(img => img !== deletedImage));
        }
    };

    const handleToggleCheck = (image: string) => {
        setCheckedImages(prev => prev.includes(image) ? prev.filter(img => img !== image) : [...prev, image]);
    };

    const handleRenameImages = (newName: string) => {
        if (checkedImages.length === 0) return;
        setImageNames(prev => {
            const next = { ...prev };
            checkedImages.forEach(img => { next[img] = newName; });
            return next;
        });
    };

    const downloadImage = (imageUrl: string) => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        const customName = imageNames[imageUrl];
        const filename = customName?.trim() || `Rendering-${Date.now()}`;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadBatch = async (onError?: (msg: string) => void) => {
        if (checkedImages.length === 0) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            for (let i = 0; i < checkedImages.length; i++) {
                const url = checkedImages[i];
                // Simple base64 extraction
                const base64Data = url.split(',')[1];
                const fileName = imageNames[url] || `generated-${i + 1}`;
                zip.file(`${fileName}.png`, base64Data, { base64: true });
            }
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `renderings-${Date.now()}.zip`;
            link.click();
        } catch (e) {
            if (onError) onError("Failed to create zip file.");
        } finally {
            setIsZipping(false);
        }
    };

    return {
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
    };
};
