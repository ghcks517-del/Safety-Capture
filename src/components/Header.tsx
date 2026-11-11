import React from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  QrCode, 
  RefreshCw,
  Smartphone,
  Tablet,
  Upload
} from 'lucide-react';
import { DeviceLayout } from '../utils/useDeviceLayout';

interface HeaderProps {
  deviceLayout: DeviceLayout;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onLogoutAdmin: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenQrModal: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  photoCount: number;
  onOpenUploadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceLayout,
  isAdmin,
  onOpenAdminModal,
  onLogoutAdmin,
  isFullscreen,
  onToggleFullscreen,
  onOpenQrModal,
  onRefresh,
  isSyncing,
  photoCount,
  onOpenUploadModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16">
          
          {/* Logo & Auto Device Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Hanwha Flame Icon */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#EB6100] via-[#F37321] to-[#FFA048] flex items-center justify-center shadow-md shadow-[#F37321]/20 ring-2 ring-[#F37321]/30 shrink-0">
              <span className="text-white font-black text-lg sm:text-xl tracking-tighter">H</span>
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg text-stone-900 tracking-tight">
                  <span className="text-[#F37321]">HANWHA</span> 현장 사진 Viewer
                </span>
                
                {/* Auto Device Indicator Pill */}
                {deviceLayout.isMobile ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-[#EB6100] border border-orange-200">
                    <Smartphone className="w-3 h-3" />
                    모바일
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-[#EB6100] border border-orange-200">
                    <Tablet className="w-3 h-3" />
                    갤럭시 탭 최적화
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-[11px] text-stone-500 font-medium">
                화면 비율에 따라 뷰어 및 업로더가 자동 조정됩니다.
              </p>
            </div>
          </div>

          {/* Right Action Controls (Clean, minimal, no mode switch clutter) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Live Sync Status Pill */}
            <button
              onClick={onRefresh}
              title="실시간 서버 동기화 상태 (클릭시 즉시 새로고침)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 hover:bg-stone-100 text-xs text-stone-600 transition"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <RefreshCw className={`w-3 h-3 text-stone-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-stone-700 hidden sm:inline">실시간 연동</span>
            </button>

            {/* Tablet View: Quick Upload Button if opened on Galaxy Tab */}
            {!deviceLayout.isMobile && onOpenUploadModal && (
              <button
                onClick={onOpenUploadModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5 text-[#F37321]" />
                <span>사진 등록</span>
              </button>
            )}

            {/* Smartphone Pairing QR Code Button (Especially useful on Galaxy Tab) */}
            {!deviceLayout.isMobile && (
              <button
                onClick={onOpenQrModal}
                title="휴대폰 카메라로 스캔하여 스마트폰에서 바로 접속"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-orange-50 text-stone-700 hover:text-[#EB6100] border border-stone-200 hover:border-orange-200 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-[#F37321]" />
                <span className="hidden md:inline">휴대폰 연결</span>
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면 보기'}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition flex items-center gap-1.5"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-stone-700" />
                  <span className="hidden sm:inline">창모드</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-[#F37321]" />
                  <span className="hidden sm:inline">전체화면</span>
                </>
              )}
            </button>

            {/* Admin Login Button */}
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">관리자</span>
                </div>
                <button
                  onClick={onLogoutAdmin}
                  className="text-xs text-stone-400 hover:text-stone-700 px-1 py-1 underline"
                  title="관리자 로그아웃"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F37321] hover:bg-[#EB6100] text-white shadow-xs transition shadow-[#F37321]/20"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>관리자</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
