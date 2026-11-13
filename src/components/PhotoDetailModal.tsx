import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Download, 
  Pencil, 
  Trash2, 
  Info, 
  Building2, 
  Briefcase, 
  Calendar, 
  MapPin, 
  User, 
  Layers, 
  FileText,
  Sparkles 
} from 'lucide-react';
import { PhotoItem } from '../types/photo';
import { formatDateKorean, formatTimeKorean } from '../utils/date';
import { formatFileSize } from '../utils/compressor';
import { RiskAnalysisModal } from './RiskAnalysisModal';

interface PhotoDetailModalProps {
  photos: PhotoItem[];
  currentPhotoId: string;
  onClose: () => void;
  onSelectPhotoId: (id: string) => void;
  onEdit: (photo: PhotoItem) => void;
  onDelete: (id: string) => void;
  onSaveUpdates?: (id: string, updates: Partial<PhotoItem>) => Promise<void> | void;
  isAdmin: boolean;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photos,
  currentPhotoId,
  onClose,
  onSelectPhotoId,
  onEdit,
  onDelete,
  onSaveUpdates,
  isAdmin
}) => {
  const currentIndex = photos.findIndex((p) => p.id === currentPhotoId);
  const currentPhoto = photos[currentIndex] || photos[0];

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(4); // seconds
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & rotation when photo changes, and auto-open risk modal if returning from PWA re-auth
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    try {
      const autoRiskId = sessionStorage.getItem('safetycap_auto_run_risk');
      if (autoRiskId && autoRiskId === currentPhotoId) {
        sessionStorage.removeItem('safetycap_auto_run_risk');
        setShowRiskModal(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [currentPhotoId]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlayingSlideshow) return;
    const timer = setInterval(() => {
      handleNext();
    }, slideshowInterval * 1000);
    return () => clearInterval(timer);
  }, [isPlayingSlideshow, currentIndex, photos.length, slideshowInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleBrowserFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  if (!currentPhoto) return null;

  const handlePrev = () => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex - 1 + photos.length) % photos.length;
    onSelectPhotoId(photos[nextIdx].id);
  };

  const handleNext = () => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    onSelectPhotoId(photos[nextIdx].id);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.75));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch((err) => console.warn(err));
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => console.warn(err));
      setIsBrowserFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = `${currentPhoto.projectName}_${currentPhoto.partnerName}_${currentPhoto.registrationDate}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col select-none overflow-hidden"
    >
      {/* Top App Bar */}
      <div className="h-14 sm:h-16 px-4 bg-black/70 backdrop-blur-md border-b border-stone-800 flex items-center justify-between z-20 shrink-0">
        
        {/* Left: Project title & Counter */}
        <div className="flex items-center gap-3 truncate max-w-[50%] sm:max-w-[60%]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F37321] shrink-0"></div>
          <div className="truncate">
            <h3 className="text-white font-extrabold text-sm sm:text-base truncate">
              {currentPhoto.projectName}
            </h3>
            <p className="text-stone-400 text-xs truncate flex items-center gap-2">
              <span>{currentPhoto.partnerName}</span>
              <span>•</span>
              <span className="text-orange-400 font-medium">{currentPhoto.registrationDate}</span>
            </p>
          </div>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-xs font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Center: Slideshow & Zoom controls for Tablet touch */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Slideshow button */}
          <button
            onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              isPlayingSlideshow
                ? 'bg-[#F37321] text-white animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
            title="자동 슬라이드쇼 (현장 브리핑용)"
          >
            {isPlayingSlideshow ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">
              {isPlayingSlideshow ? '슬라이드 정지' : '슬라이드 재생'}
            </span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-700 rounded-md transition"
              title="축소"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-stone-300 hover:text-white text-xs font-mono font-bold"
              title="원래 크기 (100%)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-700 rounded-md transition"
              title="확대"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate control */}
          <button
            onClick={handleRotateCw}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            title="90도 시계방향 회전 (스마트폰 가로/세로)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-lg bg-stone-800 hover:bg-[#F37321] text-stone-300 hover:text-white transition"
            title="전체화면 전환 (단축키 F)"
          >
            {isBrowserFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Info toggle */}
          <button
            onClick={() => setShowInfoSidebar(!showInfoSidebar)}
            className={`p-2 rounded-lg transition ${
              showInfoSidebar ? 'bg-[#F37321] text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title="상세 정보 패널 열기/닫기"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-800 hover:bg-red-600 text-stone-300 hover:text-white transition ml-1"
            title="닫기 (ESC)"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Photo Stage */}
        <div className="flex-1 relative flex items-center justify-center overflow-auto p-4 sm:p-8">
          
          {/* Main Image with dynamic zoom and rotation */}
          <div 
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.projectName}
              className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl drop-shadow-2xl"
            />
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#F37321] text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl transition transform active:scale-90"
                title="이전 사진 (←)"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#F37321] text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl transition transform active:scale-90"
                title="다음 사진 (→)"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          {/* Bottom Thumbnails Strip for Quick Switching */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 max-w-[90vw] overflow-x-auto z-20">
            {photos.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => onSelectPhotoId(p.id)}
                className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                  p.id === currentPhoto.id
                    ? 'border-[#F37321] scale-110 shadow-md ring-2 ring-[#F37321]/40'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

        </div>

        {/* Right Info Drawer (Toggleable) */}
        {showInfoSidebar && (
          <div className="w-80 sm:w-96 bg-stone-900/95 border-l border-stone-800 text-stone-200 p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-20 backdrop-blur-md">
            
            <div className="space-y-5">
              
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F37321]"></span>
                  사진 메타데이터 정보
                </h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F37321]/20 text-orange-400 border border-orange-500/30">
                  {currentPhoto.workType || '일반'}
                </span>
              </div>

              {/* 1. PJT명 */}
              <div className="space-y-1">
                <span className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-[#F37321]" />
                  PJT명 (프로젝트)
                </span>
                <p className="text-white font-extrabold text-sm leading-snug">
                  {currentPhoto.projectName}
                </p>
              </div>

              {/* 2. 협력업체명 */}
              <div className="space-y-1">
                <span className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
                  협력업체명
                </span>
                <p className="text-white font-bold text-sm bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60 inline-block">
                  {currentPhoto.partnerName}
                </p>
              </div>

              {/* 3. 등록일자 & 시간 */}
              <div className="grid grid-cols-2 gap-3 bg-stone-800/40 p-3 rounded-xl border border-stone-800">
                <div className="space-y-1">
                  <span className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
                    등록일자
                  </span>
                  <p className="text-orange-300 font-bold text-sm font-mono">
                    {currentPhoto.registrationDate}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-stone-400 font-medium">
                    등록 시각
                  </span>
                  <p className="text-stone-300 text-xs font-mono">
                    {formatTimeKorean(currentPhoto.uploadedAt) || '-'}
                  </p>
                </div>
              </div>

              {/* 4. 세부 위치 */}
              {currentPhoto.location && (
                <div className="space-y-1">
                  <span className="text-xs text-stone-400 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#F37321]" />
                    세부 위치 / 구역
                  </span>
                  <p className="text-stone-200 text-xs font-medium bg-stone-800/60 p-2.5 rounded-lg border border-stone-800">
                    {currentPhoto.location}
                  </p>
                </div>
              )}

              {/* 5. 현장 점검 내용 / 비고 */}
              <div className="space-y-1.5 bg-stone-800/60 p-3 rounded-xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-300 flex items-center gap-1.5 font-bold">
                    <FileText className="w-3.5 h-3.5 text-[#F37321]" />
                    점검 내용 / 비고
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(currentPhoto)}
                    className="text-[11px] font-bold text-[#F37321] hover:text-orange-400 flex items-center gap-1 hover:underline"
                    title="점검 내용 수정하기"
                  >
                    <Pencil className="w-3 h-3" />
                    수정하기
                  </button>
                </div>
                {currentPhoto.description ? (
                  <p className="text-stone-200 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {currentPhoto.description}
                  </p>
                ) : (
                  <p className="text-stone-500 text-xs italic">
                    등록된 점검 내용이 없습니다. [수정하기]를 눌러 내용을 입력하세요.
                  </p>
                )}
              </div>

              {/* 6. 기술 정보 (파일 크기, 업로더) */}
              <div className="text-[11px] text-stone-500 space-y-1 pt-2 border-t border-stone-800">
                {currentPhoto.uploaderName && (
                  <p className="flex items-center gap-1">
                    <User className="w-3 h-3" /> 등록자: {currentPhoto.uploaderName}
                  </p>
                )}
                {currentPhoto.fileSize && (
                  <p>용량: {formatFileSize(currentPhoto.fileSize)}</p>
                )}
              </div>

            </div>

            {/* Bottom Actions inside Sidebar */}
            <div className="pt-4 mt-4 border-t border-stone-800 space-y-2">
              
              {/* AI Risk Analysis Button (Right above edit & delete buttons) */}
              <button
                type="button"
                onClick={() => setShowRiskModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#F37321] via-orange-500 to-[#EB6100] hover:brightness-110 active:scale-[0.99] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md shadow-orange-950/50 cursor-pointer border border-orange-400/40 group"
              >
                <Sparkles className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition-transform" />
                <span>AI 위험성 분석</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/25 text-orange-100 border border-orange-300/20">
                  Gemini
                </span>
              </button>

              {/* Edit & Delete Action Buttons (Always visible) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(currentPhoto)}
                  className="py-2.5 px-3 rounded-xl bg-[#F37321] hover:bg-[#EB6100] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  정보/점검내용 수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(currentPhoto.id)}
                  className="py-2.5 px-3 rounded-xl bg-red-950/70 hover:bg-red-600 text-red-200 hover:text-white border border-red-800/50 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  사진 삭제
                </button>
              </div>

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5 text-stone-400" />
                원본 이미지 다운로드
              </button>

            </div>

          </div>
        )}

      </div>

      {/* AI Risk Analysis Popup Modal */}
      {showRiskModal && (
        <RiskAnalysisModal
          photo={currentPhoto}
          isOpen={showRiskModal}
          onClose={() => setShowRiskModal(false)}
          onApplyToDescription={async (recommendedText) => {
            if (onSaveUpdates) {
              await onSaveUpdates(currentPhoto.id, { description: recommendedText });
            }
          }}
        />
      )}
    </div>
  );
};
