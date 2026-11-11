import React from 'react';
import { 
  Building2, 
  Briefcase, 
  Image as ImageIcon, 
  Clock, 
  Sparkles,
  Wifi,
  Smartphone
} from 'lucide-react';
import { PhotoItem } from '../types/photo';
import { getTodayString } from '../utils/date';

interface StatsSummaryProps {
  photos: PhotoItem[];
  isAdmin: boolean;
  onResetDemo: () => void;
  onOpenMobileUploader: () => void;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  photos,
  isAdmin,
  onResetDemo,
  onOpenMobileUploader
}) => {
  const today = getTodayString();
  const todayCount = photos.filter((p) => p.registrationDate === today).length;

  const uniqueProjects = new Set(photos.map((p) => p.projectName)).size;
  const uniquePartners = new Set(photos.map((p) => p.partnerName)).size;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* 1. Total Photos Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 block">
            전체 등록 사진
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {photos.length}
            </span>
            <span className="text-xs font-bold text-stone-400">장</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#EB6100] border border-orange-200/60 flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Today's Uploads */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 block">
            오늘 현장 등록
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-[#F37321] tracking-tight">
              {todayCount}
            </span>
            <span className="text-xs font-bold text-orange-400">장</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#EB6100] border border-orange-200/60 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Active Projects */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 block">
            관리 대상 PJT
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {uniqueProjects}
            </span>
            <span className="text-xs font-bold text-stone-400">개소</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Active Partners & Fast Mobile Upload Trigger */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-stone-500 block">
            등록 협력업체
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              {uniquePartners}
            </span>
            <span className="text-xs font-bold text-stone-400">개사</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
