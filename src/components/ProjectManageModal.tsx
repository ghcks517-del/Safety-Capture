import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { PhotoItem } from '../types/photo';

interface ProjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: string[];
  photos: PhotoItem[];
  onAddProject: (name: string) => Promise<void>;
  onUpdateProject: (oldName: string, newName: string) => Promise<void>;
  onDeleteProject: (name: string) => Promise<void>;
}

export const ProjectManageModal: React.FC<ProjectManageModalProps> = ({
  isOpen,
  onClose,
  projects,
  photos,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [newProjectInput, setNewProjectInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Calculate photo count per project
  const getPhotoCount = (pjtName: string) => {
    return photos.filter((p) => p.projectName === pjtName).length;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectInput.trim();
    if (!trimmed) return;

    if (projects.includes(trimmed)) {
      setErrorMsg('이미 존재하는 PJT명입니다.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onAddProject(trimmed);
      setNewProjectInput('');
    } catch {
      setErrorMsg('프로젝트 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (index: number, name: string) => {
    setEditingIndex(index);
    setEditValue(name);
    setErrorMsg('');
  };

  const handleSaveEdit = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;

    if (trimmed !== oldName && projects.includes(trimmed)) {
      setErrorMsg('이미 존재하는 PJT명입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateProject(oldName, trimmed);
      setEditingIndex(null);
      setEditValue('');
    } catch {
      setErrorMsg('수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (name: string) => {
    const count = getPhotoCount(name);
    const confirmMessage = count > 0 
      ? `"${name}" 프로젝트에 등록된 사진이 ${count}장 있습니다.\nPJT 목록에서 삭제하시겠습니까? (기존 사진은 보존됩니다)`
      : `"${name}" 프로젝트를 삭제하시겠습니까?`;

    if (confirm(confirmMessage)) {
      setIsSubmitting(true);
      try {
        await onDeleteProject(name);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                PJT (프로젝트) 목록 관리
              </h3>
              <p className="text-xs text-stone-500">
                사진 등록 팝업 및 필터에 표시되는 프로젝트 목록 설정
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

        {/* Add Project Form */}
        <div className="p-5 border-b border-stone-100 bg-orange-50/40 shrink-0">
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#F37321]" />
              새로운 PJT 추가
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="예: 한화오션 옥포 제2도크 PJT"
                value={newProjectInput}
                onChange={(e) => setNewProjectInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-medium text-stone-900"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newProjectInput.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1 shrink-0 ${
                  newProjectInput.trim() && !isSubmitting
                    ? 'bg-[#F37321] hover:bg-[#EB6100] shadow-xs cursor-pointer'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errorMsg}
              </p>
            )}
          </form>
        </div>

        {/* Existing Projects List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-2">
            <span>등록된 프로젝트 ({projects.length}개)</span>
            <span>연결된 사진 수</span>
          </div>

          {projects.length > 0 ? (
            projects.map((pjt, idx) => {
              const photoCount = getPhotoCount(pjt);
              const isEditing = editingIndex === idx;

              return (
                <div
                  key={pjt}
                  className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-orange-200 transition group"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 mr-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-white border border-[#F37321] rounded-lg focus:outline-none font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(pjt)}
                        className="p-1.5 rounded-lg bg-[#F37321] text-white hover:bg-[#EB6100]"
                        title="저장"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="p-1.5 rounded-lg bg-stone-200 text-stone-600 hover:bg-stone-300"
                        title="취소"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 truncate mr-2">
                      <div className="w-2 h-2 rounded-full bg-[#F37321] shrink-0"></div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                        {pjt}
                      </span>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200/70 text-stone-700 font-mono">
                        {photoCount}장
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(idx, pjt)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-[#EB6100] hover:bg-orange-50 transition"
                        title="이름 수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pjt)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="목록에서 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-stone-400 text-xs">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>등록된 프로젝트가 없습니다. 상단에서 추가해주세요.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-400 text-[11px]">
            * 프로젝트명을 수정하면 연결된 사진들의 PJT명도 함께 변경됩니다.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition"
          >
            완료 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
