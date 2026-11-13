import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  Megaphone, 
  HardHat,
  ArrowRight,
  Eye,
  EyeOff,
  Crosshair,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { PhotoItem } from '../types/photo';

export interface HazardBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface HazardItem {
  id: number;
  hazard: string;
  cause: string;
  severity: '상' | '중' | '하';
  locationDesc?: string;
  box?: HazardBox;
  safetyMeasure?: {
    action: string;
    standard: string;
  };
}

export interface RiskAnalysisData {
  riskLevel: '위험' | '주의' | '양호';
  riskScore: number; // 1 ~ 10
  summary: string;
  identifiedHazards: HazardItem[];
  safetyMeasures?: { action: string; standard: string }[];
  tbmBriefing: string;
  recommendedNotes: string;
}

interface RiskAnalysisModalProps {
  photo: PhotoItem;
  isOpen: boolean;
  onClose: () => void;
  onApplyToDescription: (recommendedText: string) => Promise<void> | void;
}

const CIRCLE_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function getCircleNumber(id: number): string {
  return CIRCLE_NUMBERS[(id - 1) % CIRCLE_NUMBERS.length] || `(${id})`;
}

function getSeverityColors(severity: '상' | '중' | '하') {
  if (severity === '상') {
    return {
      border: 'border-red-500',
      activeBorder: 'border-red-400 ring-2 ring-red-400/80',
      bg: 'bg-red-500/25',
      text: 'text-red-400',
      badgeBg: 'bg-red-600',
      badgeText: 'text-white',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      chip: 'bg-red-500/20 text-red-300 border-red-500/40'
    };
  }
  if (severity === '중') {
    return {
      border: 'border-amber-400',
      activeBorder: 'border-amber-300 ring-2 ring-amber-300/80',
      bg: 'bg-amber-400/25',
      text: 'text-amber-300',
      badgeBg: 'bg-amber-500',
      badgeText: 'text-stone-950 font-black',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
      chip: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    };
  }
  return {
    border: 'border-emerald-400',
    activeBorder: 'border-emerald-300 ring-2 ring-emerald-300/80',
    bg: 'bg-emerald-400/25',
    text: 'text-emerald-300',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.6)]',
    chip: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  };
}

/**
 * Safely downscales large client-side data:image/ URLs before sending to API,
 * bounded by a strict 1500ms timeout so it can never hang in PWA/iframe views.
 */
async function prepareOptimizedPhotoUrl(url: string): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('data:image/') || url.length < 250000) {
    return url;
  }

  const resizeTask = new Promise<string>((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(url);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.80));
        } catch {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    } catch {
      resolve(url);
    }
  });

  const timeoutFallback = new Promise<string>((resolve) => {
    setTimeout(() => resolve(url), 1500);
  });

  return Promise.race([resizeTask, timeoutFallback]);
}

export const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({
  photo,
  isOpen,
  onClose,
  onApplyToDescription
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [data, setData] = useState<RiskAnalysisData | null>(null);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  
  // Interactive marker focus & single-item display filter
  const [activeHazardId, setActiveHazardId] = useState<number | null>(null);
  const [displayHazardId, setDisplayHazardId] = useState<number | 'all'>('all');
  const [showOverlays, setShowOverlays] = useState(true);

  const photoContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRefreshAuthAndRetry = () => {
    try {
      sessionStorage.setItem('safetycap_reopen_risk_photo_id', photo.id);
      sessionStorage.setItem('safetycap_auto_run_risk', photo.id);
    } catch {
      // Ignore storage errors
    }
    window.location.href = `/?reauth=${Date.now()}`;
  };

  const runAnalysis = async () => {
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setAuthRequired(false);
    setApplied(false);
    setActiveHazardId(null);
    setDisplayHazardId('all');
    setLoadingStep(1);

    // Dynamic progress step timer
    const stepTimer1 = setTimeout(() => setLoadingStep(2), 1500);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 3500);

    // Timeout safety: 25 seconds
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 25000);

    try {
      const optimizedPhotoUrl = await prepareOptimizedPhotoUrl(photo.url);

      const response = await fetch('/api/analyze-risk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        redirect: 'manual',
        signal: controller.signal,
        body: JSON.stringify({
          photoUrl: optimizedPhotoUrl,
          projectName: photo.projectName,
          partnerName: photo.partnerName,
          registrationDate: photo.registrationDate,
          workType: photo.workType,
          location: photo.location,
          description: photo.description
        })
      });

      clearTimeout(timeoutId);

      // Detect Nginx auth-bridge redirect in standalone PWA mode
      if (
        response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status < 400) ||
        response.status === 0
      ) {
        setAuthRequired(true);
        throw new Error(
          '설치된 앱(PWA)의 보안 인증 세션이 만료되었거나 갱신이 필요합니다. 아래 버튼을 눌러 인증을 갱신해주세요.'
        );
      }

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      if (contentType.includes('text/html') || responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
        setAuthRequired(true);
        throw new Error(
          '보안 인증 페이지가 반환되어 분석 응답을 받을 수 없습니다. 아래 버튼을 눌러 인증 세션을 갱신해주세요.'
        );
      }

      let resJson: any = null;
      try {
        resJson = JSON.parse(responseText);
      } catch {
        if (response.status === 405 || response.status === 404) {
          throw new Error(
            `이 배포 환경에서는 AI 분석 API 경로(/api/analyze-risk)가 정적 파일로 처리되어 연결할 수 없습니다 (HTTP ${response.status}). Vercel/서버 재배포 및 GEMINI_API_KEY 환경변수 설정이 필요합니다.`
          );
        }
        throw new Error(
          response.ok 
            ? '서버 응답 형식을 읽을 수 없습니다.' 
            : `서버 연결 오류 (HTTP ${response.status}): 잠시 후 다시 시도해주세요.`
        );
      }

      if (!response.ok || !resJson?.success) {
        throw new Error(resJson?.message || `AI 분석 요청 실패 (HTTP ${response.status})`);
      }

      const safeData = resJson.data;
      if (!safeData) {
        throw new Error('분석 결과 데이터가 올바르지 않습니다.');
      }

      // Defensive hazard array normalization
      safeData.identifiedHazards = Array.isArray(safeData.identifiedHazards) ? safeData.identifiedHazards : [];

      setData(safeData);
      if (safeData.identifiedHazards.length > 0) {
        setActiveHazardId(safeData.identifiedHazards[0].id);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Risk analysis error:', err);
      if (err.name === 'AbortError') {
        setError('분석 시간이 초과되었습니다. 네트워크 연결 상태를 확인 후 [다시 분석하기]를 눌러주세요.');
      } else {
        // Probe /api/health if network error occurred to check if auth redirect is blocking requests
        if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
          try {
            const probe = await fetch('/api/health', { redirect: 'manual', credentials: 'include' });
            if (probe.type === 'opaqueredirect' || probe.status === 0 || (probe.status >= 300 && probe.status < 400)) {
              setAuthRequired(true);
              setError('설치된 앱(PWA)의 보안 인증 세션 갱신이 필요합니다. 아래 버튼을 눌러 인증을 갱신해주세요.');
              return;
            }
          } catch {
            // Network truly offline
          }
          setError('서버에 연결할 수 없습니다. 인터넷(Wi-Fi/LTE) 연결을 확인하거나 앱을 다시 열어주세요.');
        } else {
          setError(err?.message || '위험성 분석 중 오류가 발생했습니다.');
        }
      }
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setData(null);
      runAnalysis();
    }
  }, [isOpen, photo.id]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    const formatted = `[Safety Capture - AI 위험성 평가 보고서]
현장명: ${photo.projectName} (${photo.workType || '일반'} / ${photo.partnerName || '협력업체'})
세부위치: ${photo.location || '미지정'}
등록일: ${photo.registrationDate}
종합 위험도: ${data.riskLevel} (${data.riskScore}/10점)

■ 핵심 요약
${data.summary}

■ 사진 내 식별된 번호별 위험 요인
${(data.identifiedHazards || []).map((h) => `${getCircleNumber(h.id)} [위험도 ${h.severity}] ${h.hazard} (${h.locationDesc || '위치'})
- 원인 및 위험: ${h.cause}
- 안전 조치: ${h.safetyMeasure?.action || '작업 전 안전수칙 준수'} (${h.safetyMeasure?.standard || '산업안전보건기준'})`).join('\n\n')}

■ 작업 전 TBM 1분 구호
"${data.tbmBriefing}"

■ 권장 점검 기록문
${data.recommendedNotes}`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    if (!data?.recommendedNotes) return;
    try {
      await onApplyToDescription(data.recommendedNotes);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Color config based on overall risk level
  const isHighRisk = data?.riskLevel === '위험' || (data?.riskScore || 0) >= 7;
  const isMidRisk = data?.riskLevel === '주의' || ((data?.riskScore || 0) >= 4 && (data?.riskScore || 0) < 7);

  const getOverallBadge = () => {
    if (isHighRisk) {
      return {
        bg: 'bg-red-500/15 border-red-500/40 text-red-400',
        bar: 'bg-red-500',
        text: '위험 (고위험 - 즉시 조치)',
        icon: <AlertTriangle className="w-4 h-4 text-red-400" />
      };
    }
    if (isMidRisk) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
        bar: 'bg-amber-500',
        text: '주의 (중위험 - 개선 가이드)',
        icon: <ShieldAlert className="w-4 h-4 text-amber-400" />
      };
    }
    return {
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      bar: 'bg-emerald-500',
      text: '양호 (저위험 - 수칙 준수)',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    };
  };

  const overallBadge = getOverallBadge();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Expanded Modal Window: max-w-6xl for spacious visual photo inspection + side-by-side analysis */}
      <div 
        className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-[96vw] max-w-6xl h-[92vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EB6100] to-[#F37321] flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  AI 현장 사진 위험 구역 마킹 & 위험성 평가
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F37321]/20 text-[#F37321] border border-[#F37321]/30">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate max-w-xs sm:max-w-xl">
                <span className="text-white font-semibold">{photo.projectName}</span> · {photo.workType || '일반'} · {photo.location || '구역'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Overlays Button */}
            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showOverlays 
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 hover:bg-orange-500/25' 
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title="사진 위 위험 위치 마커 표시 켜기/끄기"
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5 text-[#F37321]" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showOverlays ? '도형 마킹 ON' : '도형 마킹 OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split 2-Column Grid on Tablet/Desktop */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 sm:p-5 flex flex-col lg:grid lg:grid-cols-12 gap-5">
          
          {/* ================= LEFT COLUMN: Visual Photo Inspector (Col 7) ================= */}
          <div className="lg:col-span-7 flex flex-col bg-stone-950/70 rounded-2xl border border-stone-800 overflow-hidden relative shadow-inner">
            
            {/* Photo Inspector Header Bar */}
            <div className="px-4 py-2 bg-stone-900/90 border-b border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-[#F37321]" />
                <span className="font-bold text-stone-200">사진 위험 구역 시각화</span>
                {data && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-medium">
                    총 <strong className="text-orange-400">{data.identifiedHazards.length}</strong>곳
                  </span>
                )}
              </div>

              {/* Quick Selection Filter Pills on Photo Header */}
              {data && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayHazardId('all');
                      setActiveHazardId(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      displayHazardId === 'all'
                        ? 'bg-[#F37321] text-white shadow-sm'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    전체 마커
                  </button>

                  {data.identifiedHazards.map((h) => {
                    const isSelected = displayHazardId === h.id;
                    const colors = getSeverityColors(h.severity);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setDisplayHazardId(h.id);
                          setActiveHazardId(h.id);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? `${colors.badgeBg} ${colors.badgeText} shadow-md scale-105 ring-2 ring-white/60`
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                        title={`${getCircleNumber(h.id)} ${h.hazard} 마킹만 사진에 표시`}
                      >
                        <span>{getCircleNumber(h.id)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Photo & Bounding Box Canvas Container */}
            <div 
              ref={photoContainerRef}
              className="flex-1 min-h-[320px] sm:min-h-[420px] flex items-center justify-center p-3 relative bg-black/40 overflow-hidden select-none"
            >
              {/* Inner wrapper strictly wraps image dimensions so coordinates match 1:1 */}
              <div className="relative inline-block max-w-full max-h-full">
                <img
                  src={photo.url}
                  alt="현장 분석 사진"
                  className="max-h-[420px] sm:max-h-[520px] lg:max-h-[600px] w-auto max-w-full object-contain block mx-auto rounded-xl shadow-lg border border-stone-800"
                />

                {/* Loading Scanner Animation */}
                {loading && (
                  <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl z-20 p-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F37321]/20 border border-[#F37321]/50 flex items-center justify-center animate-spin mb-3 shadow-lg shadow-orange-950/50">
                      <RefreshCw className="w-7 h-7 text-[#F37321]" />
                    </div>
                    <span className="text-sm font-extrabold text-white animate-pulse">
                      {loadingStep === 1 && '사진 내 위험 요소 및 공종 분석 중...'}
                      {loadingStep === 2 && '위험 구역 번호 및 도형 마킹 좌표 지정 중...'}
                      {loadingStep >= 3 && '안전 기준 대책 및 TBM 구호 생성 중...'}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full transition-all ${loadingStep >= 1 ? 'bg-[#F37321] scale-125' : 'bg-stone-700'}`} />
                      <span className={`w-2 h-2 rounded-full transition-all ${loadingStep >= 2 ? 'bg-[#F37321] scale-125' : 'bg-stone-700'}`} />
                      <span className={`w-2 h-2 rounded-full transition-all ${loadingStep >= 3 ? 'bg-[#F37321] scale-125' : 'bg-stone-700'}`} />
                    </div>
                    <span className="text-[11px] text-stone-400 mt-2 font-medium">
                      Gemini Vision 고속 분석 진행 중 (약 3~5초 소요)
                    </span>
                    {/* Animated laser scan line */}
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F37321] to-transparent animate-bounce opacity-80" />
                  </div>
                )}

                {/* Colored Bounding Box & Number Badges Layer */}
                {data && showOverlays && !loading && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {data.identifiedHazards
                      .filter((hazard) => displayHazardId === 'all' || hazard.id === displayHazardId)
                      .map((hazard) => {
                        const colors = getSeverityColors(hazard.severity);
                        const isFocused = activeHazardId === hazard.id;
                        const isSingle = displayHazardId === hazard.id;
                        const box = hazard.box || { ymin: 200, xmin: 200, ymax: 500, xmax: 500 };

                        // Convert 0~1000 normalized to percentages
                        const top = `${box.ymin / 10}%`;
                        const left = `${box.xmin / 10}%`;
                        const width = `${Math.max(6, (box.xmax - box.xmin) / 10)}%`;
                        const height = `${Math.max(6, (box.ymax - box.ymin) / 10)}%`;

                        return (
                          <div
                            key={hazard.id}
                            onClick={() => {
                              setActiveHazardId(hazard.id);
                              setDisplayHazardId(hazard.id);
                            }}
                            style={{ top, left, width, height }}
                            className={`absolute border-2 rounded-lg transition-all duration-300 cursor-pointer group ${
                              isSingle || isFocused 
                                ? `${colors.activeBorder} ${colors.bg} ${colors.glow} z-20 scale-[1.03] ring-4 ring-offset-2 ring-offset-black/60` 
                                : `${colors.border} bg-black/15 hover:${colors.bg} z-10 opacity-90`
                            }`}
                          >
                            {/* Top-Left Number Pin Badge */}
                            <div 
                              className={`absolute -top-3.5 -left-2 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-black text-xs shadow-lg transition-transform duration-200 group-hover:scale-110 ${
                                colors.badgeBg
                              } ${colors.badgeText}`}
                            >
                              <span>{getCircleNumber(hazard.id)}</span>
                              <span className="text-[10px] font-bold">
                                {hazard.severity === '상' ? '위험' : hazard.severity === '중' ? '주의' : '양호'}
                              </span>
                            </div>

                            {/* Hover / Focused Title Label */}
                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded-md bg-stone-900/95 text-white text-[11px] font-bold whitespace-nowrap shadow-xl border border-stone-700 pointer-events-none transition-opacity ${
                              isSingle || isFocused ? 'opacity-100 z-30' : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <span className="text-[#F37321] mr-1">{getCircleNumber(hazard.id)}</span>
                              <span>{hazard.hazard}</span>
                              {hazard.locationDesc && (
                                <span className="text-stone-400 font-normal ml-1">({hazard.locationDesc})</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

              </div>
            </div>

            {/* Bottom active chip in Left Column */}
            {data && (
              <div className="px-4 py-2.5 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-stone-400 flex items-center gap-1 font-medium flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-[#F37321]" />
                    {displayHazardId === 'all' ? '전체 마킹 표시 중:' : '단독 마킹 표시 중:'}
                  </span>
                  {displayHazardId !== 'all' ? (
                    <span className="font-extrabold text-orange-300 truncate flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-[#F37321] border border-orange-500/30 font-mono">
                        {getCircleNumber(displayHazardId)}
                      </span>
                      {data.identifiedHazards.find(h => h.id === displayHazardId)?.hazard || '위험 요인'}
                    </span>
                  ) : (
                    <span className="text-stone-300 font-semibold truncate">
                      모든 위험 구역 ({data.identifiedHazards.length}개) 표시 중 (항목 클릭 시 단독 표시)
                    </span>
                  )}
                </div>

                {displayHazardId !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayHazardId('all');
                      setActiveHazardId(null);
                    }}
                    className="text-[11px] font-bold text-orange-400 hover:text-white px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    전체 보기
                  </button>
                ) : (
                  <div className="text-[11px] text-stone-500 flex-shrink-0 hidden sm:block">
                    우측 항목 클릭 시 해당 마킹만 표시
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ================= RIGHT COLUMN: Detailed Numbered Analysis (Col 5) ================= */}
          <div className="lg:col-span-5 flex flex-col space-y-4 lg:overflow-y-auto pr-1">

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                {/* Score banner skeleton */}
                <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20" />
                    <div className="space-y-1.5">
                      <div className="w-20 h-2 bg-stone-700 rounded" />
                      <div className="w-32 h-4 bg-stone-700 rounded" />
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-stone-800 rounded-xl" />
                </div>

                {/* Summary skeleton */}
                <div className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-800 space-y-2">
                  <div className="w-28 h-3 bg-orange-500/30 rounded" />
                  <div className="w-full h-3 bg-stone-700 rounded" />
                  <div className="w-4/5 h-3 bg-stone-700 rounded" />
                </div>

                {/* Hazard item skeletons */}
                <div className="space-y-2.5">
                  <div className="w-44 h-3 bg-stone-700 rounded" />
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-orange-500/20" />
                          <div className="w-36 h-3.5 bg-stone-700 rounded" />
                        </div>
                        <div className="w-12 h-4 bg-stone-800 rounded" />
                      </div>
                      <div className="w-full h-8 bg-stone-800/80 rounded" />
                      <div className="w-3/4 h-3 bg-emerald-500/20 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !loading && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  분석 중 문제가 발생했습니다
                </div>
                <p className="leading-relaxed">{error}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {authRequired && (
                    <button
                      type="button"
                      onClick={handleRefreshAuthAndRetry}
                      className="px-3.5 py-2 rounded-lg bg-[#F37321] hover:bg-[#EB6100] text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-md cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      인증 세션 갱신 후 다시 분석
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={runAnalysis}
                    className="px-3 py-2 rounded-lg bg-red-800/60 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    다시 분석하기
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Content */}
            {data && !loading && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* 1. Risk Score & Level Banner */}
                <div className={`p-4 rounded-xl border ${overallBadge.bg} flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-stone-900/70 border border-stone-800">
                      {overallBadge.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        종합 현장 위험도
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        {overallBadge.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-stone-900/80 px-3.5 py-1.5 rounded-xl border border-stone-800">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block font-medium">위험도 점수</span>
                      <span className="text-base font-black text-white font-mono">
                        {data.riskScore} <span className="text-xs text-stone-400 font-normal">/ 10</span>
                      </span>
                    </div>
                    <div className="w-16 bg-stone-800 h-2 rounded-full overflow-hidden border border-stone-700/60">
                      <div 
                        className={`h-full ${overallBadge.bar} transition-all duration-700`}
                        style={{ width: `${Math.min(100, Math.max(10, data.riskScore * 10))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Core Summary */}
                <div className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-800 space-y-1">
                  <span className="text-xs font-bold text-[#F37321] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    핵심 현장 브리핑
                  </span>
                  <p className="text-xs text-stone-200 leading-relaxed font-medium">
                    {data.summary}
                  </p>
                </div>

                {/* 3. Numbered Identified Hazards (Matched 1:1 with photo markers!) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      사진 번호별 위험 요인 및 대책 ({data.identifiedHazards.length}건)
                    </span>
                    {displayHazardId !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayHazardId('all');
                          setActiveHazardId(null);
                        }}
                        className="text-[11px] font-bold text-[#F37321] hover:text-orange-300 hover:underline flex items-center gap-1 cursor-pointer bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20"
                      >
                        <Eye className="w-3 h-3" />
                        전체 마커 보기
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400">
                        항목 클릭 시 해당 도형만 사진에 표시
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {data.identifiedHazards.map((item) => {
                      const colors = getSeverityColors(item.severity);
                      const isSelectedOnly = displayHazardId === item.id;
                      const isFocused = activeHazardId === item.id || isSelectedOnly;

                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            // Clicking the item displays ONLY this item's shape marking on the photo!
                            // If clicked again, toggle back to 'all'
                            setDisplayHazardId(prev => prev === item.id ? 'all' : item.id);
                            setActiveHazardId(item.id);
                            setShowOverlays(true);
                          }}
                          className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer space-y-2 relative overflow-hidden ${
                            isSelectedOnly
                              ? `bg-stone-900 ${colors.activeBorder} ${colors.glow} scale-[1.015] ring-2 ring-offset-1 ring-offset-stone-900`
                              : isFocused
                              ? 'bg-stone-900 border-stone-600'
                              : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60 opacity-90'
                          }`}
                        >
                          {/* Card Header: Circle Number + Hazard Name + Severity Tag */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className={`text-lg font-black flex-shrink-0 ${colors.text}`}>
                                {getCircleNumber(item.id)}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">
                                    {item.hazard}
                                  </h5>
                                  {isSelectedOnly && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F37321] text-white flex items-center gap-1 shadow-sm animate-pulse">
                                      <Eye className="w-3 h-3" />
                                      사진에 이 마킹만 표시 중
                                    </span>
                                  )}
                                </div>
                                {item.locationDesc && (
                                  <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-[#F37321]" />
                                    {item.locationDesc}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 border ${colors.chip}`}>
                              위험도 {item.severity}
                            </span>
                          </div>

                          {/* Cause & Risk Description */}
                          <div className="text-xs text-stone-300 pl-6 leading-relaxed bg-stone-900/60 p-2 rounded-lg border border-stone-800/80">
                            <span className="text-stone-400 font-semibold block text-[11px] mb-0.5">
                              ⚠️ 발생 원인 및 예상 재해:
                            </span>
                            {item.cause}
                          </div>

                          {/* Action & Countermeasure for this specific hazard */}
                          {item.safetyMeasure && (
                            <div className="text-xs text-emerald-300 pl-6 space-y-0.5">
                              <div className="flex items-start gap-1 font-medium">
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>{item.safetyMeasure.action}</span>
                              </div>
                              {item.safetyMeasure.standard && (
                                <p className="text-[10px] text-emerald-400/70 pl-4">
                                  수칙: {item.safetyMeasure.standard}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 1-Minute TBM Briefing */}
                {data.tbmBriefing && (
                  <div className="p-3.5 rounded-xl bg-orange-950/25 border border-orange-900/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                      <Megaphone className="w-3.5 h-3.5 text-[#F37321]" />
                      작업 전 1분 TBM 핵심 안전 구호
                    </div>
                    <blockquote className="text-xs text-stone-200 italic pl-2.5 border-l-2 border-[#F37321] py-0.5 font-medium leading-relaxed">
                      "{data.tbmBriefing}"
                    </blockquote>
                  </div>
                )}

                {/* 5. Recommended Inspection Notes */}
                {data.recommendedNotes && (
                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#F37321]" />
                        권장 점검 기록문 (표준 양식)
                      </span>
                      <button
                        type="button"
                        onClick={handleApply}
                        disabled={applied}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F37321] hover:bg-[#EB6100] text-white flex items-center gap-1.5 transition disabled:bg-emerald-600 cursor-pointer shadow-sm"
                      >
                        {applied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            점검내용에 반영됨
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            점검내용에 바로 반영
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-300 font-mono bg-stone-900/90 p-2.5 rounded-lg border border-stone-800 whitespace-pre-wrap leading-relaxed">
                      {data.recommendedNotes}
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* Modal Bottom Action Controls */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-900/95 flex items-center justify-between gap-2 z-10">
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            다시 분석
          </button>

          <div className="flex items-center gap-2">
            {data && (
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    복사 완료
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    보고서 전체 복사
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
