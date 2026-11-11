import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Building2, 
  Briefcase, 
  Calendar, 
  FileText,
  Trash2 
} from 'lucide-react';
import { PhotoItem } from '../types/photo';

interface EditPhotoModalProps {
  photo: PhotoItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PhotoItem>) => Promise<void>;
  onDelete?: (id: string) => void;
  availableProjects: string[];
  availablePartners: string[];
}

export const EditPhotoModal: React.FC<EditPhotoModalProps> = ({
  photo,
  onClose,
  onSave,
  onDelete,
  availableProjects,
  availablePartners
}) => {
  const [projectName, setProjectName] = useState(photo.projectName);
  const [partnerName, setPartnerName] = useState(photo.partnerName);
  const [registrationDate, setRegistrationDate] = useState(photo.registrationDate);
  const [description, setDescription] = useState(photo.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('PJT명을 입력해주세요.');
      return;
    }
    if (!partnerName.trim()) {
      alert('협력업체명을 입력해주세요.');
      return;
    }
    if (!registrationDate) {
      alert('등록일자를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(photo.id, {
        projectName: projectName.trim(),
        partnerName: partnerName.trim(),
        registrationDate,
        description: description.trim()
      });
      onClose();
    } catch (err) {
      console.error('수정 실패:', err);
      alert('사진 정보를 수정하는 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                사진 정보 및 점검 내용 수정
              </h3>
              <p className="text-xs text-stone-500">
                PJT명, 협력업체명, 등록일자 및 점검 내용/비고 변경
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Preview Banner */}
        <div className="px-6 pt-4 flex items-center gap-3">
          <img
            src={photo.url}
            alt=""
            className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0 shadow-xs"
          />
          <div className="text-xs text-stone-500 space-y-0.5">
            <p className="font-bold text-stone-800 truncate text-sm">
              {photo.projectName}
            </p>
            <p className="truncate">협력업체: {photo.partnerName}</p>
            <p className="text-orange-600 font-semibold font-mono">
              기존 등록일자: {photo.registrationDate}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. PJT명 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F37321]" />
              PJT명 (프로젝트명) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="project-presets"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트명을 입력하거나 선택하세요"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-semibold text-stone-900"
              required
            />
            <datalist id="project-presets">
              {availableProjects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* 2. 협력업체명 (직접 입력) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
              협력업체명 (직접 입력) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="협력업체명을 직접 입력하세요"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-semibold text-stone-900"
              required
            />
          </div>

          {/* 3. 등록일자 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
              등록일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-mono font-bold"
              required
            />
          </div>

          {/* 4. 점검 내용 / 비고 (주요 입력 항목) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#F37321]" />
                점검 내용 / 비고
              </label>
              <span className="text-[11px] text-stone-400">
                {description.length}자
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="현장 검측 소견, 작업 상태, 하자 또는 특이사항을 상세히 기재하세요."
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 hover:bg-stone-100/60 focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 resize-none font-medium text-stone-900 transition"
            />
          </div>

          {/* Footer Actions: Delete button on left, Cancel & Save on right */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-stone-100">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(photo.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1 transition"
                title="이 사진 영구 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>사진 삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#F37321] hover:bg-[#EB6100] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#F37321]/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '수정 저장 중...' : '수정 내용 저장'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
