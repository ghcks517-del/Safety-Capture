import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  Building2, 
  Briefcase, 
  Calendar,
  FileText
} from 'lucide-react';
import { PhotoItem } from '../types/photo';
import { compressImage } from '../utils/compressor';
import { getTodayString } from '../utils/date';
import { PRESET_PROJECTS } from '../services/initialData';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (photos: Partial<PhotoItem>[]) => Promise<void>;
  availableProjects: string[];
  availablePartners: string[];
  onOpenProjectManage?: () => void;
}

interface StagedItem {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  availableProjects,
  availablePartners,
  onOpenProjectManage
}) => {
  const [staged, setStaged] = useState<StagedItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [projectName, setProjectName] = useState(availableProjects[0] || PRESET_PROJECTS[0]);
  const [partnerName, setPartnerName] = useState('');
  const [registrationDate, setRegistrationDate] = useState(getTodayString());
  const [description, setDescription] = useState('');

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newItems: StagedItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        try {
          const res = await compressImage(file, 1920, 1920, 0.85);
          newItems.push({
            dataUrl: res.dataUrl,
            size: res.size,
            width: res.width,
            height: res.height
          });
        } catch (err) {
          console.error(err);
        }
      }
      setStaged((prev) => [...prev, ...newItems]);
    } finally {
      setIsProcessing(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (staged.length === 0) {
      alert('업로드할 사진을 선택하거나 촬영해주세요.');
      return;
    }
    if (!projectName.trim()) {
      alert('PJT명을 입력해주세요.');
      return;
    }
    if (!partnerName.trim()) {
      alert('협력업체명을 직접 입력해주세요.');
      return;
    }
    if (!registrationDate) {
      alert('등록일자를 입력해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const payload: Partial<PhotoItem>[] = staged.map((st) => ({
        url: st.dataUrl,
        projectName: projectName.trim(),
        partnerName: partnerName.trim(),
        registrationDate,
        uploadedAt: new Date().toISOString(),
        uploaderName: '현장 사용자',
        workType: '',
        location: '',
        description: description.trim(),
        fileSize: st.size,
        dimensions: { width: st.width, height: st.height }
      }));

      await onUploadSuccess(payload);
      setStaged([]);
      setPartnerName('');
      setDescription('');
      onClose();
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                현장 사진 신규 등록
              </h3>
              <p className="text-[11px] text-stone-500">
                PJT명, 협력업체명, 등록일자 입력 후 즉시 반영
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFiles} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="py-4 px-3 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-dashed border-[#F37321]/50 text-[#EB6100] font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <Camera className="w-5 h-5" />
              <span>카메라 촬영</span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="py-4 px-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border-2 border-dashed border-stone-300 text-stone-700 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <ImageIcon className="w-5 h-5 text-stone-500" />
              <span>갤러리 사진 선택</span>
            </button>
          </div>

          {/* Staged photos preview */}
          {staged.length > 0 && (
            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-700 block mb-1.5">
                선택된 사진 ({staged.length}장)
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {staged.map((st, i) => (
                  <div key={i} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-stone-300">
                    <img src={st.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setStaged(staged.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form fields: PJT명, 협력업체명(직접 기입), 등록일자, 비고 */}
          <div className="space-y-3.5 text-xs">
            {/* 1. PJT명 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-stone-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#F37321]" />
                  PJT명 (프로젝트) <span className="text-red-500">*</span>
                </label>
                {onOpenProjectManage && (
                  <button
                    type="button"
                    onClick={onOpenProjectManage}
                    className="text-[11px] font-semibold text-[#EB6100] hover:underline flex items-center gap-1"
                  >
                    ⚙️ PJT 목록 관리
                  </button>
                )}
              </div>
              <input
                type="text"
                list="pjt-modal-presets"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="PJT명을 선택하거나 직접 입력하세요"
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
              />
              <datalist id="pjt-modal-presets">
                {availableProjects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {/* 2. 협력업체명 (직접 기입) */}
            <div>
              <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
                협력업체명 (직접 입력) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="협력업체명을 직접 기입하세요 (예: 동아건설, 삼우토건)"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 placeholder:text-stone-400 placeholder:font-normal"
              />
            </div>

            {/* 3. 등록일자 */}
            <div>
              <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
                등록일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
              />
            </div>

            {/* 4. 점검 내용 / 비고 */}
            <div>
              <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#F37321]" />
                점검 내용 / 비고 (선택)
              </label>
              <input
                type="text"
                placeholder="점검 내용 또는 특이사항 입력"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
            >
              취소
            </button>
            <button
              type="button"
              disabled={staged.length === 0 || isUploading}
              onClick={handleUpload}
              className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition ${
                staged.length > 0 && !isUploading
                  ? 'bg-[#F37321] hover:bg-[#EB6100] shadow-[#F37321]/20 cursor-pointer active:scale-[0.98]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isUploading ? '업로드 중...' : `${staged.length}장 등록 완료`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
