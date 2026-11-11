import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already installed and running as standalone app, hide button
  if (isInstalled) {
    return null;
  }

  // Handle click:
  // If native prompt is ready (isInstallable), trigger install() directly.
  // If not yet fired (e.g. desktop Chrome menu / Android Chrome before timer), show guide modal.
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="홈 화면 또는 바탕화면에 Safety Capture 앱으로 설치"
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F37321] to-[#EB6100] hover:brightness-105 text-white shadow-xs shadow-[#F37321]/30 transition transform active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">앱 설치</span>
        <span className="sm:hidden">설치</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  iPhone / iPad 홈 화면에 추가
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                <div>
                  <span className="font-bold text-stone-900">공유 버튼 터치</span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Safari 브라우저 하단 도구 모음의 <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> (공유) 버튼을 누릅니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                <div>
                  <span className="font-bold text-stone-900">'홈 화면에 추가' 선택</span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    메뉴를 아래로 스크롤하여 <strong>[홈 화면에 추가]</strong>를 탭하면 바탕화면에 <strong>"Safety Capture"</strong> 앱 아이콘이 생성됩니다.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Android / PC Chrome Guide Modal (When beforeinstallprompt hasn't fired yet) */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm">
                  앱으로 설치 안내
                </h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200 text-stone-700">
                <p className="font-bold text-[#EB6100] mb-1">바탕화면 / 홈 화면 앱 설치</p>
                <p className="text-[11px] leading-relaxed">
                  브라우저 상단 주소창 우측의 <strong>[설치(⊕)]</strong> 아이콘을 클릭하거나, 브라우저 메뉴(⋮)에서 <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 선택하시면 <strong>"Safety Capture"</strong> 앱으로 즉시 설치됩니다.
                </p>
              </div>

              <ul className="space-y-1.5 text-[11px] text-stone-500 list-disc list-inside px-1">
                <li>설치 후 바탕화면 아이콘을 통해 단독 앱(Standalone)으로 실행됩니다.</li>
                <li>오프라인 캐싱 및 빠른 로딩이 지원됩니다.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#F37321] hover:bg-[#EB6100] py-2.5 text-xs font-bold text-white transition"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </>
  );
};
