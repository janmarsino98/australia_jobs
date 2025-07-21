import { create } from 'zustand';
import httpClient from '@/httpClient';
import { ResumeMetadata } from '@/types';
import config from '@/config';

interface ResumeState {
    currentResume: ResumeMetadata | null;
    isUploading: boolean;
    uploadProgress: number;
    uploadError: string | null;

    // Actions
    setCurrentResume: (resume: ResumeMetadata | null) => void;
    setUploadProgress: (progress: number) => void;
    setUploadError: (error: string | null) => void;
    updateResumeName: (newName: string) => Promise<void>;
    deleteResume: () => Promise<void>;
    uploadResume: (file: File) => Promise<ResumeMetadata>;
    fetchCurrentResume: () => Promise<void>;
    clearUploadState: () => void;
}

const useResumeStore = create<ResumeState>()((set, get) => ({
    currentResume: null,
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,

    setCurrentResume: (resume) => set({ currentResume: resume }),

    setUploadProgress: (progress) => set({ uploadProgress: progress }),

    setUploadError: (error) => set({ uploadError: error }),

    clearUploadState: () => set({
        isUploading: false,
        uploadProgress: 0,
        uploadError: null
    }),

    updateResumeName: async (newName: string) => {
        const currentResume = get().currentResume;
        if (!currentResume) throw new Error("No resume to rename");

        try {
            await httpClient.put(`${config.apiBaseUrl}/resume/rename/${currentResume.id}`, {
                custom_name: newName
            }, { withCredentials: true });

            set({
                currentResume: { ...currentResume, custom_name: newName }
            });
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to rename resume");
        }
    },

    deleteResume: async () => {
        try {
            await httpClient.delete(`${config.apiBaseUrl}/resume/current`, {
                withCredentials: true,
            });
            set({ currentResume: null });
        } catch (error: any) {
            throw new Error(error.response?.data?.error || "Failed to delete resume");
        }
    },

    uploadResume: async (file: File) => {
        set({ isUploading: true, uploadProgress: 0, uploadError: null });

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await httpClient.post(`${config.apiBaseUrl}/resume/upload`, formData, {
                withCredentials: true,
                headers: {
                    // Let the browser set the Content-Type with boundary
                    // DO NOT set Content-Type manually for FormData
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        set({ uploadProgress: progress });
                    }
                }
            });

            const resumeData: ResumeMetadata = response.data;
            set({
                currentResume: resumeData,
                isUploading: false,
                uploadProgress: 100
            });

            return resumeData;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Upload failed";
            set({
                uploadError: errorMessage,
                isUploading: false,
                uploadProgress: 0
            });
            throw new Error(errorMessage);
        }
    },

    fetchCurrentResume: async () => {
        try {
            const response = await httpClient.get(`${config.apiBaseUrl}/resume/metadata`, {
                withCredentials: true,
            });

            if (response.data) {
                set({ currentResume: response.data });
            }
        } catch (error) {
            console.error("Error fetching current resume:", error);
            set({ currentResume: null });
        }
    },
}));

export default useResumeStore; 