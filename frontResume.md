# Frontend Resume Implementation Plan

## Current State Analysis

### Existing Implementation Issues:
1. **Upload Association**: Resume upload doesn't properly associate with the current user
2. **Mock Data**: ResumePreview component displays hardcoded mock data instead of real file content
3. **No Rename Feature**: Missing ability to rename uploaded resumes
4. **No Real Preview**: First page preview is not implemented - only mock content shown
5. **State Management**: Inconsistent state management between upload and preview components
6. **Error Handling**: Limited error handling for upload failures and edge cases

### Existing Working Features:
- Basic file upload UI with drag & drop
- File validation (PDF, DOC, DOCX)
- Upload progress simulation
- Delete resume functionality
- Responsive layout with preview panel

## Implementation Tasks

### Task 1: Fix Resume-User Association in Upload
**Priority: High**
**Files: `frontend/src/pages/ResumeUpload.jsx`**

**Changes Needed:**
- Update `handleFileUpload` function to wait for successful upload response
- Ensure backend returns resume metadata after upload
- Update user state after successful upload
- Add proper error handling for upload failures

**Implementation:**
```javascript
const handleFileUpload = async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", file);

      const response = await httpClient.post("http://127.0.0.1:5000/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      // Backend should return: { file_id, filename, custom_name, upload_date }
      const resumeData = response.data;
      setResumeUploaded(true);
      setResumeName(resumeData.custom_name || resumeData.filename);
      setUploadedFile(file);
      setResumeId(resumeData.file_id);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error.response?.data?.error || "Upload failed");
    }
  }
};
```

### Task 2: Implement Resume Rename Functionality
**Priority: High**
**Files: `frontend/src/pages/ResumeUpload.jsx`, `frontend/src/components/molecules/ResumeRenameModal.tsx`**

**New Component: ResumeRenameModal.tsx**
```typescript
interface ResumeRenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

export const ResumeRenameModal: React.FC<ResumeRenameModalProps> = ({
  isOpen, currentName, onClose, onSave
}) => {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setIsLoading(true);
    try {
      await onSave(newName.trim());
      onClose();
    } catch (error) {
      console.error("Failed to rename resume:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modal implementation with form validation
};
```

**Integration in ResumeUpload.jsx:**
- Add rename button next to resume name
- Implement `handleRenameResume` function that calls backend API
- Add state management for rename modal

### Task 3: Implement Real PDF First Page Preview
**Priority: Medium**
**Files: `frontend/src/components/molecules/PDFPreview.tsx`**

**New Dependencies Needed:**
```json
{
  "react-pdf": "^7.5.1",
  "pdfjs-dist": "^3.11.174"
}
```

**Implementation:**
```typescript
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  fileUrl?: string;
  file?: File;
  className?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ fileUrl, file, className }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  return (
    <div className={cn("pdf-preview", className)}>
      {loading && <LoadingSpinner />}
      <Document
        file={file || fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<LoadingSpinner />}
      >
        <Page 
          pageNumber={1} 
          width={400}
          renderAnnotationLayer={false}
          renderTextLayer={false}
        />
      </Document>
      {numPages > 1 && (
        <p className="text-sm text-gray-500 mt-2">
          Showing page 1 of {numPages}
        </p>
      )}
    </div>
  );
};
```

### Task 4: Enhance ResumePreview Component
**Priority: Medium**
**Files: `frontend/src/components/molecules/ResumePreview.tsx`**

**Changes Needed:**
- Remove mock data and replace with real resume metadata from backend
- Integrate PDFPreview component for first page display
- Add loading states for metadata fetching
- Implement proper error handling

**Implementation Updates:**
```typescript
export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resumeId, 
  resumeFile,
  onAnalysisComplete,
  className = "" 
}) => {
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchResumeMetadata();
      setPreviewUrl(`http://127.0.0.1:5000/resume/preview/${resumeId}`);
    }
  }, [resumeId]);

  const fetchResumeMetadata = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/resume/metadata/${resumeId}`);
      setResumeMetadata(response.data);
    } catch (error) {
      console.error("Failed to fetch resume metadata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Replace mock analysis with real implementation
  // Integrate PDFPreview component
};
```

### Task 5: Add Resume State Management Store
**Priority: Medium**
**Files: `frontend/src/stores/useResumeStore.ts`**

**Implementation:**
```typescript
import { create } from 'zustand';

interface ResumeState {
  currentResume: ResumeMetadata | null;
  isUploading: boolean;
  uploadProgress: number;
  
  // Actions
  setCurrentResume: (resume: ResumeMetadata | null) => void;
  updateResumeName: (newName: string) => Promise<void>;
  deleteResume: () => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  fetchCurrentResume: () => Promise<void>;
}

const useResumeStore = create<ResumeState>()((set, get) => ({
  currentResume: null,
  isUploading: false,
  uploadProgress: 0,

  setCurrentResume: (resume) => set({ currentResume: resume }),

  updateResumeName: async (newName: string) => {
    const currentResume = get().currentResume;
    if (!currentResume) return;

    try {
      await httpClient.put(`/resume/rename/${currentResume.id}`, { 
        custom_name: newName 
      });
      
      set({ 
        currentResume: { ...currentResume, custom_name: newName } 
      });
    } catch (error) {
      throw new Error("Failed to rename resume");
    }
  },

  // Implement other actions...
}));
```

### Task 6: Improve Error Handling and User Feedback
**Priority: Low**
**Files: Multiple components**

**Enhancements:**
- Add toast notifications for upload success/failure
- Implement retry mechanism for failed uploads
- Add validation for file size limits (e.g., max 10MB)
- Show specific error messages for different failure types
- Add confirmation dialogs for destructive actions (delete, rename)

### Task 7: Add Resume Management Dashboard
**Priority: Low**
**Files: `frontend/src/components/molecules/ResumeManager.tsx`**

**Features:**
- List all user resumes
- Quick actions (rename, delete, set as default)
- Upload new resume
- Resume analytics/stats
- Export options

## File Structure Changes

### New Files to Create:
```
frontend/src/
├── components/molecules/
│   ├── PDFPreview.tsx
│   ├── ResumeRenameModal.tsx
│   └── ResumeManager.tsx
├── stores/
│   └── useResumeStore.ts
└── types/
    └── resume.ts
```

### Files to Modify:
```
frontend/src/
├── pages/ResumeUpload.jsx
├── components/molecules/ResumePreview.tsx
└── types/index.ts
```

## Dependencies to Add

**Package.json additions:**
```json
{
  "react-pdf": "^7.5.1",
  "pdfjs-dist": "^3.11.174"
}
```

## Testing Requirements

### Unit Tests:
- Upload functionality with mocked API calls
- Rename modal validation
- PDF preview component rendering
- Resume store state management

### Integration Tests:
- End-to-end upload flow
- Resume rename workflow
- Delete resume flow
- Error handling scenarios

### Manual Testing:
- File upload with various file types and sizes
- PDF preview rendering across different documents
- Responsive design on mobile devices
- Error scenarios (network failures, invalid files)

## Performance Considerations

1. **PDF Preview**: Implement lazy loading and caching for PDF pages
2. **File Upload**: Add progress tracking and ability to cancel uploads
3. **State Management**: Optimize re-renders with proper memoization
4. **Error Boundaries**: Add error boundaries around PDF preview components

## Accessibility Requirements

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Readers**: Add proper ARIA labels and descriptions
3. **Color Contrast**: Ensure all text meets WCAG guidelines
4. **Focus Management**: Proper focus handling in modals and dynamic content

## Timeline Estimation

- **Task 1**: 2-3 days
- **Task 2**: 2-3 days  
- **Task 3**: 3-4 days
- **Task 4**: 2-3 days
- **Task 5**: 2 days
- **Task 6**: 1-2 days
- **Task 7**: 3-4 days

**Total Estimated Time**: 15-21 days 