import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Building2, 
  Briefcase, 
  Calendar, 
  User, 
  FileText, 
  Tablet, 
  Plus,
  Sparkles,
  Layers
} from 'lucide-react';
import { PhotoItem } from '../types/photo';
import { compressImage, formatFileSize } from '../utils/compressor';
import { getTodayString } from '../utils/date';
import { PRESET_PROJECTS, PRESET_PARTNERS, PRESET_WORK_TYPES } from '../services/initialData';

interface StagedPhoto {
  file: File;
  previewUrl: string;
  dataUrl: string;
  width: number;
  height: number;
  size: number;
}

interface MobileUploaderProps {
  onUploadSuccess: (newPhotos: Partial<PhotoItem>[]) => void;
  onGoToViewer: () => void;
  availableProjects: string[];
  availablePartners: string[];
}

export const MobileUploader: React.FC<MobileUploaderProps> = ({
  onUploadSuccess,
  onGoToViewer,
  availableProjects,
  availablePartners
}) => {
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastUploadedCount, setLastUploadedCount] = useState(0);

  // Form inputs
  const [selectedProject, setSelectedProject] = useState(availableProjects[0] || PRESET_PROJECTS[0]);
  const [customProject, setCustomProject] = useState('');
  const [isCustomProject, setIsCustomProject] = useState(false);

  const [selectedPartner, setSelectedPartner] = useState(availablePartners[0] || PRESET_PARTNERS[0]);
  const [customPartner, setCustomPartner] = useState('');
  const [isCustomPartner, setIsCustomPartner] = useState(false);

  const [registrationDate, setRegistrationDate] = useState(getTodayString());
  const [workType, setWorkType] = useState('골조공사');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [uploaderName, setUploaderName] = useState('현장 모바일 점검자');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Process incoming files from gallery or camera
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedPhoto[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        try {
          // Compress high resolution phone camera photos (max 1920px)
          const result = await compressImage(file, 1920, 1920, 0.85);
          newStaged.push({
            file,
            previewUrl: result.dataUrl,
            dataUrl: result.dataUrl,
            width: result.width,
            height: result.height,
            size: result.size
          });
        } catch (err) {
          console.error('이미지 압축 실패:', err);
        }
      }

      setStagedPhotos((prev) => [...prev, ...newStaged]);
    } finally {
      setIsProcessing(false);
      // reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removeStagedPhoto = (index: number) => {
    setStagedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (stagedPhotos.length === 0) return;

    const finalProject = isCustomProject ? customProject.trim() : selectedProject;
    const finalPartner = isCustomPartner ? customPartner.trim() : selectedPartner;

    if (!finalProject) {
      alert('PJT명(프로젝트명)을 입력해주세요.');
      return;
    }
    if (!finalPartner) {
      alert('협력업체명을 입력해주세요.');
      return;
    }
    if (!registrationDate) {
      alert('등록일자를 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const photosToUpload: Partial<PhotoItem>[] = stagedPhotos.map((p, idx) => ({
        url: p.dataUrl,
        projectName: finalProject,
        partnerName: finalPartner,
        registrationDate: registrationDate,
        uploadedAt: new Date().toISOString(),
        uploaderName: uploaderName || '현장 모바일 점검자',
        workType: workType || '일반공종',
        location: location || '',
        description: description || '',
        fileSize: p.size,
        dimensions: { width: p.width, height: p.height }
      }));

      setUploadProgress(70);
      await onUploadSuccess(photosToUpload);
      setUploadProgress(100);

      setLastUploadedCount(photosToUpload.length);
      setShowSuccessModal(true);
      setStagedPhotos([]);
      setDescription('');
      setLocation('');
    } catch (err) {
      console.error('업로드 실패:', err);
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      
      {/* Mobile Top Header Banner */}
      <div className="bg-gradient-to-r from-[#F37321] to-[#EB6100] text-white p-5 sm:p-6 rounded-2xl shadow-md mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-2">
            <Camera className="w-3.5 h-3.5 text-orange-100" />
            <span>현장 모바일 다이렉트 업로더</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            휴대폰 사진 촬영 및 갤러리 업로드
          </h2>
          <p className="text-orange-100 text-xs sm:text-sm mt-1 max-w-xl">
            촬영하거나 선택한 사진은 연결된 <span className="font-bold underline decoration-white/60">갤럭시 탭 뷰어 화면에 즉시 실시간 반영</span>됩니다.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
          <Camera className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Hidden File Inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Upload Action Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        
        {/* Camera Capture Card */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-white hover:bg-orange-50/50 border-2 border-dashed border-[#F37321]/60 hover:border-[#F37321] rounded-2xl shadow-xs group transition cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-100 group-hover:bg-[#F37321] text-[#EB6100] group-hover:text-white flex items-center justify-center transition mb-3 shadow-xs">
            <Camera className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-base text-stone-900 group-hover:text-[#EB6100] transition">
            현장 즉시 촬영하기
          </span>
          <span className="text-xs text-stone-500 mt-1">
            휴대폰 카메라로 지금 바로 검측 촬영
          </span>
        </button>

        {/* Gallery Pick Card */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-white hover:bg-orange-50/50 border-2 border-dashed border-stone-300 hover:border-[#F37321] rounded-2xl shadow-xs group transition cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-stone-100 group-hover:bg-[#F37321] text-stone-700 group-hover:text-white flex items-center justify-center transition mb-3 shadow-xs">
            <ImageIcon className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-base text-stone-900 group-hover:text-[#EB6100] transition">
            휴대폰 갤러리에서 선택
          </span>
          <span className="text-xs text-stone-500 mt-1">
            갤러리 내 여러 장의 사진 동시 선택 가능
          </span>
        </button>

      </div>

      {/* Loading Compression Indicator */}
      {isProcessing && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-sm text-[#EB6100]">
          <div className="w-5 h-5 border-2 border-[#F37321] border-t-transparent rounded-full animate-spin"></div>
          <span>모바일 사진 최적화 및 압축 중입니다... 잠시만 기다려주세요.</span>
        </div>
      )}

      {/* Staged Photo Thumbnails Preview */}
      {stagedPhotos.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-sm">
                업로드 대기 사진
              </span>
              <span className="bg-[#F37321] text-white px-2 py-0.5 rounded-full text-xs font-black">
                {stagedPhotos.length}장
              </span>
            </div>
            <button
              onClick={() => setStagedPhotos([])}
              className="text-xs text-stone-400 hover:text-red-600 transition"
            >
              전체 비우기
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {stagedPhotos.map((p, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-stone-200 bg-stone-100">
                <img
                  src={p.previewUrl}
                  alt={`대기 사진 ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeStagedPhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition"
                  title="사진 제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5 truncate px-1">
                  {formatFileSize(p.size)}
                </div>
              </div>
            ))}
            
            {/* Add more button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-stone-300 hover:border-[#F37321] flex flex-col items-center justify-center text-stone-400 hover:text-[#EB6100] aspect-square transition"
              title="사진 추가하기"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-[11px] font-bold">추가</span>
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Photo Information Form */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs mb-6 space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F37321]"></span>
            사진 메타정보 입력 (필수)
          </h3>
          <span className="text-xs text-[#EB6100] font-semibold bg-orange-50 px-2 py-0.5 rounded">
            갤럭시 탭 필터링 기준
          </span>
        </div>

        {/* 1. PJT명 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F37321]" />
              PJT명 (프로젝트명) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomProject(!isCustomProject)}
              className="text-xs text-[#EB6100] hover:underline"
            >
              {isCustomProject ? '목록에서 선택' : '+ 직접 새 PJT 입력'}
            </button>
          </div>

          {isCustomProject ? (
            <input
              type="text"
              placeholder="예: 한화오션 제3도크 해양플랜트 PJT"
              value={customProject}
              onChange={(e) => setCustomProject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-[#F37321] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
            />
          ) : (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-medium"
            >
              {availableProjects.map((pjt) => (
                <option key={pjt} value={pjt}>
                  {pjt}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. 협력업체명 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
              협력업체명 <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsCustomPartner(!isCustomPartner)}
              className="text-xs text-[#EB6100] hover:underline"
            >
              {isCustomPartner ? '목록에서 선택' : '+ 직접 새 업체 입력'}
            </button>
          </div>

          {isCustomPartner ? (
            <input
              type="text"
              placeholder="예: 현대철강이엔씨"
              value={customPartner}
              onChange={(e) => setCustomPartner(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-[#F37321] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
            />
          ) : (
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-medium"
            >
              {availablePartners.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 3. 등록일자 & 공종 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
              등록일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F37321]" />
              공종 구분
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-medium"
            >
              {PRESET_WORK_TYPES.filter(w => w !== '전체 공종').map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. 세부 위치 & 등록자 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              세부 위치 / 구역
            </label>
            <input
              type="text"
              placeholder="예: 104동 3층 피트층, B구역 옥외변전소"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#F37321]" />
              등록자 / 점검자 성명
            </label>
            <input
              type="text"
              placeholder="예: 홍길동 책임 (품질팀)"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40"
            />
          </div>
        </div>

        {/* 5. 비고 / 점검 내용 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#F37321]" />
            현장 점검 내용 / 비고
          </label>
          <textarea
            rows={2}
            placeholder="예: 타설 전 철근 결속선 상태 및 피복두께 기준치 충족 여부 확인"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 resize-none"
          />
        </div>

      </div>

      {/* Main Submit Button */}
      <button
        type="button"
        disabled={stagedPhotos.length === 0 || isUploading}
        onClick={handleUpload}
        className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-lg transition transform active:scale-[0.99] ${
          stagedPhotos.length > 0 && !isUploading
            ? 'bg-gradient-to-r from-[#F37321] to-[#EB6100] text-white hover:brightness-105 shadow-[#F37321]/30 cursor-pointer'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
        }`}
      >
        {isUploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>갤럭시 탭으로 전송 중 ({uploadProgress}%)...</span>
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            <span>
              {stagedPhotos.length > 0
                ? `${stagedPhotos.length}장의 사진 갤럭시 탭으로 즉시 등록`
                : '촬영하거나 갤러리에서 사진을 선택해주세요'}
            </span>
          </>
        )}
      </button>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-stone-900 mb-1">
              업로드 완료!
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              <span className="font-bold text-[#EB6100]">{lastUploadedCount}장</span>의 사진이 성공적으로 등록되었습니다.<br />
              앱이 설치된 갤럭시 탭에 사진이 즉시 나타납니다.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onGoToViewer();
                }}
                className="w-full py-3 rounded-xl bg-[#F37321] hover:bg-[#EB6100] text-white font-bold text-sm shadow-md shadow-[#F37321]/20 flex items-center justify-center gap-2"
              >
                <Tablet className="w-4 h-4" />
                갤럭시 탭 뷰어에서 확인하기
              </button>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs"
              >
                추가 사진 계속 업로드
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
