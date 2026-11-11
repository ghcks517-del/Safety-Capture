import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Filter, 
  Search, 
  Calendar, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  RotateCcw,
  FileText
} from 'lucide-react';
import { PhotoItem, FilterState } from '../types/photo';
import { compressImage } from '../utils/compressor';
import { getTodayString, getDateDaysAgo } from '../utils/date';
import { PRESET_PROJECTS, PRESET_PARTNERS } from '../services/initialData';
import { PhotoCard } from './PhotoCard';

interface MobileFieldViewProps {
  photos: PhotoItem[];
  filteredPhotos: PhotoItem[];
  filter: FilterState;
  onFilterChange: (f: FilterState) => void;
  availableProjects: string[];
  availablePartners: string[];
  onUploadSuccess: (photos: Partial<PhotoItem>[]) => Promise<void>;
  onOpenDetail: (photo: PhotoItem) => void;
  onEdit: (photo: PhotoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isAdmin: boolean;
  onOpenProjectManage?: () => void;
}

interface StagedFile {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

export const MobileFieldView: React.FC<MobileFieldViewProps> = ({
  photos,
  filteredPhotos,
  filter,
  onFilterChange,
  availableProjects,
  availablePartners,
  onUploadSuccess,
  onOpenDetail,
  onEdit,
  onDelete,
  isAdmin,
  onOpenProjectManage
}) => {
  // Upload form state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // Metadata inputs
  const [projectName, setProjectName] = useState(availableProjects[0] || PRESET_PROJECTS[0]);
  const [partnerName, setPartnerName] = useState('');
  const [registrationDate, setRegistrationDate] = useState(getTodayString());
  const [description, setDescription] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // File selection
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        try {
          const res = await compressImage(file, 1920, 1920, 0.85);
          newStaged.push({
            dataUrl: res.dataUrl,
            size: res.size,
            width: res.width,
            height: res.height
          });
        } catch (err) {
          console.error(err);
        }
      }
      setStagedFiles((prev) => [...prev, ...newStaged]);
    } finally {
      setIsProcessing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeStaged = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async () => {
    if (stagedFiles.length === 0) {
      alert('업로드할 사진을 촬영하거나 갤러리에서 선택해주세요.');
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

    setIsUploading(true);

    try {
      const payload: Partial<PhotoItem>[] = stagedFiles.map((file) => ({
        url: file.dataUrl,
        projectName: projectName.trim(),
        partnerName: partnerName.trim(),
        registrationDate,
        uploadedAt: new Date().toISOString(),
        uploaderName: '현장 모바일 점검자',
        workType: '',
        location: '',
        description: description.trim(),
        fileSize: file.size,
        dimensions: { width: file.width, height: file.height }
      }));

      await onUploadSuccess(payload);

      setUploadSuccessToast(`${payload.length}장의 사진이 갤럭시 탭에 실시간 전송되었습니다!`);
      setTimeout(() => setUploadSuccessToast(null), 4000);

      setStagedFiles([]);
      setPartnerName('');
      setDescription('');
    } catch (err) {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const hasActiveFilters = Boolean(
    filter.projectName || filter.partnerName || filter.startDate || filter.endDate || filter.searchQuery
  );

  return (
    <div className="space-y-4 pb-12">
      
      {/* Hidden Mobile Native Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />

      {/* Success Toast */}
      {uploadSuccessToast && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span>{uploadSuccessToast}</span>
        </div>
      )}

      {/* 1. MOBILE AUTO UPLOAD CARD (Prominent at top for phone users) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F37321]"></div>
            <h3 className="font-extrabold text-stone-900 text-sm">
              현장 사진 즉시 촬영 & 업로드
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#EB6100] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
            갤럭시 탭 실시간 연동
          </span>
        </div>

        {/* Big Touch Action Buttons for Phone */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 border-2 border-[#F37321]/40 text-[#EB6100] font-black text-xs sm:text-sm shadow-xs transition active:scale-[0.98]"
          >
            <Camera className="w-5 h-5" />
            <span>카메라 촬영</span>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border-2 border-stone-200 text-stone-800 font-black text-xs sm:text-sm shadow-xs transition active:scale-[0.98]"
          >
            <ImageIcon className="w-5 h-5 text-stone-600" />
            <span>갤러리 선택</span>
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-xs text-[#EB6100] bg-orange-50 p-2.5 rounded-xl border border-orange-200 mb-3 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#F37321] border-t-transparent rounded-full animate-spin"></div>
            <span>스마트폰 사진 압축 최적화 중...</span>
          </div>
        )}

        {/* Staged Thumbnails Preview */}
        {stagedFiles.length > 0 && (
          <div className="mb-3.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
              <span>선택된 사진 ({stagedFiles.length}장)</span>
              <button
                type="button"
                onClick={() => setStagedFiles([])}
                className="text-[11px] text-stone-400 hover:text-red-600"
              >
                전체 취소
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {stagedFiles.map((st, idx) => (
                <div key={idx} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-stone-300">
                  <img src={st.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeStaged(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Inputs (Compact) */}
        <div className="space-y-2.5 text-xs">
          
          {/* PJT명 */}
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
            <select
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
            >
              {availableProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 협력업체명 (직접 입력) & 등록일자 (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
                협력업체명 (직접 입력) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="협력업체명을 직접 입력하세요"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 placeholder:text-stone-400 placeholder:font-normal"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
                등록일자 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-mono"
              />
            </div>
          </div>

          {/* 점검 내용 / 비고 */}
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

        {/* Upload Submit Button */}
        <button
          type="button"
          disabled={stagedFiles.length === 0 || isUploading}
          onClick={handleUploadSubmit}
          className={`w-full mt-3.5 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition ${
            stagedFiles.length > 0 && !isUploading
              ? 'bg-[#F37321] hover:bg-[#EB6100] text-white shadow-[#F37321]/30 cursor-pointer active:scale-[0.98]'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>갤럭시 탭으로 전송 중...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>
                {stagedFiles.length > 0
                  ? `${stagedFiles.length}장의 사진 갤럭시 탭에 등록`
                  : '사진 촬영 또는 선택 후 등록'}
              </span>
            </>
          )}
        </button>

      </div>

      {/* 2. MOBILE PHOTO LIST & COMPACT FILTER */}
      <div className="space-y-3">
        
        {/* Header & Filter Toggle Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-stone-900 text-sm">
              현장 사진 목록
            </h4>
            <span className="bg-orange-50 text-[#EB6100] text-[11px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
              {filteredPhotos.length} / 총 {photos.length}장
            </span>
          </div>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              hasActiveFilters || showFilterDrawer
                ? 'bg-[#F37321] text-white border-[#F37321]'
                : 'bg-white text-stone-700 border-stone-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>필터</span>
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
          </button>
        </div>

        {/* Collapsible Mobile Filter Drawer */}
        {showFilterDrawer && (
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 animate-in fade-in text-xs">
            
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="검색어 입력..."
                value={filter.searchQuery}
                onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              />
            </div>

            {/* PJT Select */}
            <div>
              <label className="font-bold text-stone-700 block mb-1">PJT명 필터</label>
              <select
                value={filter.projectName}
                onChange={(e) => onFilterChange({ ...filter, projectName: e.target.value })}
                className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              >
                <option value="">전체 PJT ({availableProjects.length}개)</option>
                {availableProjects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Partner Select */}
            <div>
              <label className="font-bold text-stone-700 block mb-1">협력업체 필터</label>
              <select
                value={filter.partnerName}
                onChange={(e) => onFilterChange({ ...filter, partnerName: e.target.value })}
                className="w-full py-1.5 px-2 rounded-xl border border-stone-200 bg-stone-50 text-xs"
              >
                <option value="">전체 협력업체 ({availablePartners.length}개)</option>
                {availablePartners.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="font-bold text-stone-700 block mb-1">등록일자 기간</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filter.startDate}
                  onChange={(e) => onFilterChange({ ...filter, startDate: e.target.value })}
                  className="flex-1 py-1 px-2 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
                <span className="text-stone-400 font-bold">~</span>
                <input
                  type="date"
                  value={filter.endDate}
                  onChange={(e) => onFilterChange({ ...filter, endDate: e.target.value })}
                  className="flex-1 py-1 px-2 rounded-xl border border-stone-200 bg-stone-50 text-xs"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                onClick={() => onFilterChange({ ...filter, startDate: getTodayString(), endDate: getTodayString() })}
                className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold"
              >
                오늘
              </button>
              <button
                onClick={() => onFilterChange({ ...filter, startDate: getDateDaysAgo(6), endDate: getTodayString() })}
                className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold"
              >
                1주일
              </button>
              <button
                onClick={() => onFilterChange({ ...filter, startDate: '', endDate: '' })}
                className="px-2 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-semibold"
              >
                전체 기간
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => onFilterChange({
                    projectName: '',
                    partnerName: '',
                    startDate: '',
                    endDate: '',
                    searchQuery: '',
                    workType: ''
                  })}
                  className="px-2 py-1 rounded-lg bg-orange-50 text-[#EB6100] text-[11px] font-bold ml-auto flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  필터 초기화
                </button>
              )}
            </div>

          </div>
        )}

        {/* Photos Grid (Single/Double Column on Mobile) */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onOpenDetail={onOpenDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                isAdmin={isAdmin}
                batchSelectMode={false}
                isSelected={false}
                onToggleSelect={() => {}}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
            <p className="text-xs text-stone-500 mb-2">조건에 일치하는 사진이 없습니다.</p>
            <button
              onClick={() => onFilterChange({
                projectName: '',
                partnerName: '',
                startDate: '',
                endDate: '',
                searchQuery: '',
                workType: ''
              })}
              className="text-xs text-[#EB6100] font-bold underline"
            >
              필터 초기화
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
