import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import httpClient from '../httpClient';
import { buildApiUrl } from '../config';

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  level: 'high-school' | 'certificate' | 'diploma' | 'bachelor' | 'master' | 'phd' | 'other';
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: string;
  maxGpa?: string;
  description?: string;
  achievements: string[];
  relevantCoursework: string[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserEducationState {
  educations: Education[];
  certifications: Certification[];
  isLoading: boolean;
  error: string | null;
  
  // Education Actions
  addEducation: (education: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEducation: (id: string, updates: Partial<Education>) => void;
  removeEducation: (id: string) => void;
  
  // Certification Actions
  addCertification: (certification: Omit<Certification, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCertification: (id: string, updates: Partial<Certification>) => void;
  removeCertification: (id: string) => void;
  
  // Utility methods
  getEducationById: (id: string) => Education | undefined;
  getCertificationById: (id: string) => Certification | undefined;
  getCurrentEducation: () => Education[];
  getActiveCertifications: () => Certification[];
  getExpiredCertifications: () => Certification[];
  getHighestEducationLevel: () => Education['level'] | null;
  
  // API Actions
  fetchEducations: () => Promise<void>;
  fetchCertifications: () => Promise<void>;
  createEducation: (education: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Education>;
  updateEducationInBackend: (id: string, updates: Partial<Education>) => Promise<Education>;
  deleteEducationFromBackend: (id: string) => Promise<void>;
  createCertification: (certification: Omit<Certification, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Certification>;
  updateCertificationInBackend: (id: string, updates: Partial<Certification>) => Promise<Certification>;
  deleteCertificationFromBackend: (id: string) => Promise<void>;
  clearError: () => void;
}

const educationLevelOrder: Education['level'][] = [
  'high-school',
  'certificate', 
  'diploma',
  'bachelor',
  'master',
  'phd',
  'other'
];

const useUserEducationStore = create<UserEducationState>()(
  persist(
    (set, get) => ({
      educations: [],
      certifications: [],
      isLoading: false,
      error: null,

      // Education methods
      addEducation: (educationData) => {
        const newEducation: Education = {
          ...educationData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          educations: [...state.educations, newEducation]
        }));
        
        // Create in backend
        get().createEducation(educationData).catch(console.error);
      },

      updateEducation: (id, updates) => {
        set((state) => ({
          educations: state.educations.map(edu =>
            edu.id === id
              ? { ...edu, ...updates, updatedAt: new Date().toISOString() }
              : edu
          )
        }));
        
        // Update in backend
        get().updateEducationInBackend(id, updates).catch(console.error);
      },

      removeEducation: (id) => {
        set((state) => ({
          educations: state.educations.filter(edu => edu.id !== id)
        }));
        
        // Delete from backend
        get().deleteEducationFromBackend(id).catch(console.error);
      },

      // Certification methods
      addCertification: (certificationData) => {
        const newCertification: Certification = {
          ...certificationData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          certifications: [...state.certifications, newCertification]
        }));
        
        // Create in backend
        get().createCertification(certificationData).catch(console.error);
      },

      updateCertification: (id, updates) => {
        set((state) => ({
          certifications: state.certifications.map(cert =>
            cert.id === id
              ? { ...cert, ...updates, updatedAt: new Date().toISOString() }
              : cert
          )
        }));
        
        // Update in backend
        get().updateCertificationInBackend(id, updates).catch(console.error);
      },

      removeCertification: (id) => {
        set((state) => ({
          certifications: state.certifications.filter(cert => cert.id !== id)
        }));
        
        // Delete from backend
        get().deleteCertificationFromBackend(id).catch(console.error);
      },

      // Utility methods
      getEducationById: (id) => {
        return get().educations.find(edu => edu.id === id);
      },

      getCertificationById: (id) => {
        return get().certifications.find(cert => cert.id === id);
      },

      getCurrentEducation: () => {
        return get().educations.filter(edu => edu.isCurrent);
      },

      getActiveCertifications: () => {
        const now = new Date();
        return get().certifications.filter(cert => {
          if (cert.doesNotExpire || !cert.expirationDate) return true;
          return new Date(cert.expirationDate) > now;
        });
      },

      getExpiredCertifications: () => {
        const now = new Date();
        return get().certifications.filter(cert => {
          if (cert.doesNotExpire || !cert.expirationDate) return false;
          return new Date(cert.expirationDate) <= now;
        });
      },

      getHighestEducationLevel: () => {
        const educations = get().educations;
        if (educations.length === 0) return null;
        
        let highestLevel = educations[0].level;
        let highestIndex = educationLevelOrder.indexOf(highestLevel);
        
        educations.forEach(edu => {
          const currentIndex = educationLevelOrder.indexOf(edu.level);
          if (currentIndex > highestIndex) {
            highestIndex = currentIndex;
            highestLevel = edu.level;
          }
        });
        
        return highestLevel;
      },

      // API methods - Education
      fetchEducations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get(buildApiUrl('/user/education'));
          const educations = response.data.educations || [];
          set({ educations, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch educations:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to fetch educations',
            isLoading: false 
          });
        }
      },

      createEducation: async (educationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.post(buildApiUrl('/user/education'), {
            ...educationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          const newEducation = response.data.education;
          
          set((state) => ({
            educations: state.educations.map(edu => 
              edu.id === educationData.id ? newEducation : edu
            ),
            isLoading: false
          }));
          
          return newEducation;
        } catch (error: any) {
          console.error('Failed to create education:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to create education',
            isLoading: false 
          });
          throw error;
        }
      },

      updateEducationInBackend: async (id, updates) => {
        try {
          const response = await httpClient.put(buildApiUrl(`/user/education/${id}`), {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
          const updatedEducation = response.data.education;
          
          set((state) => ({
            educations: state.educations.map(edu => 
              edu.id === id ? updatedEducation : edu
            )
          }));
          
          return updatedEducation;
        } catch (error: any) {
          console.error('Failed to update education:', error);
          set({ error: error.response?.data?.message || 'Failed to update education' });
          throw error;
        }
      },

      deleteEducationFromBackend: async (id) => {
        try {
          await httpClient.delete(buildApiUrl(`/user/education/${id}`));
        } catch (error: any) {
          console.error('Failed to delete education:', error);
          set({ error: error.response?.data?.message || 'Failed to delete education' });
        }
      },

      // API methods - Certifications
      fetchCertifications: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.get(buildApiUrl('/user/education/certifications'));
          const certifications = response.data.certifications || [];
          set({ certifications, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch certifications:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to fetch certifications',
            isLoading: false 
          });
        }
      },

      createCertification: async (certificationData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await httpClient.post(buildApiUrl('/user/education/certifications'), {
            ...certificationData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          const newCertification = response.data.certification;
          
          set((state) => ({
            certifications: state.certifications.map(cert => 
              cert.id === certificationData.id ? newCertification : cert
            ),
            isLoading: false
          }));
          
          return newCertification;
        } catch (error: any) {
          console.error('Failed to create certification:', error);
          set({ 
            error: error.response?.data?.message || 'Failed to create certification',
            isLoading: false 
          });
          throw error;
        }
      },

      updateCertificationInBackend: async (id, updates) => {
        try {
          const response = await httpClient.put(buildApiUrl(`/user/education/certifications/${id}`), {
            ...updates,
            updatedAt: new Date().toISOString(),
          });
          const updatedCertification = response.data.certification;
          
          set((state) => ({
            certifications: state.certifications.map(cert => 
              cert.id === id ? updatedCertification : cert
            )
          }));
          
          return updatedCertification;
        } catch (error: any) {
          console.error('Failed to update certification:', error);
          set({ error: error.response?.data?.message || 'Failed to update certification' });
          throw error;
        }
      },

      deleteCertificationFromBackend: async (id) => {
        try {
          await httpClient.delete(buildApiUrl(`/user/education/certifications/${id}`));
        } catch (error: any) {
          console.error('Failed to delete certification:', error);
          set({ error: error.response?.data?.message || 'Failed to delete certification' });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'user-education',
      partialize: (state) => ({ 
        educations: state.educations,
        certifications: state.certifications
      }),
    }
  )
);

export default useUserEducationStore;