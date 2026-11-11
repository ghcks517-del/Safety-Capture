import React from 'react';
import { 
  Building2, 
  Briefcase, 
  Calendar, 
  Maximize2, 
  Pencil, 
  Trash2, 
  Check, 
  MapPin, 
  User 
} from 'lucide-react';
import { PhotoItem } from '../types/photo';
import { formatDateKorean, formatTimeKorean } from '../utils/date';
import { formatFileSize } from '../utils/compressor';

interface PhotoCardProps {
  photo: PhotoItem;
  onOpenDetail: (photo: PhotoItem) => void;
  onEdit: (photo: PhotoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isAdmin: boolean;
  batchSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onOpenDetail,
  onEdit,
  onDelete,
  isAdmin,
  batchSelectMode,
  isSelected,
  onToggleSelect
}) => {
  return (
    <div 
      onClick={() => {
        if (batchSelectMode) {
          onToggleSelect(photo.id);
        } else {
          onOpenDetail(photo);
        }
      }}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col hover:shadow-lg ${
        isSelected
          ? 'border-[#F37321] ring-2 ring-[#F37321]/50 shadow-md'
          : 'border-stone-200/80 hover:border-orange-300'
      }`}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-4/3 w-full bg-stone-900 overflow-hidden">
        <img
          src={photo.url}
          alt={photo.projectName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1.5 z-10">
          
          {/* Work Type Badge */}
          {photo.workType && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/60 backdrop-blur-md text-orange-200 border border-orange-500/30">
              {photo.workType}
            </span>
          )}

          {/* Batch Select Checkbox OR Fullscreen Button */}
          {batchSelectMode ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(photo.id);
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
                isSelected 
                  ? 'bg-[#F37321] border-[#F37321] text-white' 
                  : 'bg-white/80 border-stone-400 text-transparent'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(photo);
              }}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-[#F37321] text-white backdrop-blur-xs transition"
              title="전체화면 확대 보기"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

        {/* Bottom overlay in thumbnail: Location & Time */}
        <div className="absolute bottom-2 left-2.5 right-2.5 text-white z-10 flex items-center justify-between text-[11px]">
          {photo.location ? (
            <span className="flex items-center gap-1 font-medium truncate drop-shadow-xs max-w-[70%]">
              <MapPin className="w-3 h-3 text-orange-300 shrink-0" />
              {photo.location}
            </span>
          ) : (
            <span className="text-stone-300 font-mono text-[10px]">
              {formatFileSize(photo.fileSize)}
            </span>
          )}
          <span className="text-orange-200 font-medium shrink-0 drop-shadow-xs">
            {formatTimeKorean(photo.uploadedAt)}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Project Name (PJT명) */}
          <div className="flex items-start gap-1.5 mb-1.5">
            <Building2 className="w-4 h-4 text-[#F37321] shrink-0 mt-0.5" />
            <h4 className="font-extrabold text-stone-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-[#EB6100] transition">
              {photo.projectName}
            </h4>
          </div>

          {/* Subcontractor / Partner (협력업체명) */}
          <div className="flex items-center gap-1.5 text-stone-600 text-xs mb-2">
            <Briefcase className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="font-medium bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md border border-stone-200">
              {photo.partnerName}
            </span>
            {photo.uploaderName && (
              <span className="text-stone-400 text-[11px] truncate flex items-center gap-0.5">
                • {photo.uploaderName}
              </span>
            )}
          </div>

          {/* Description snippet if any */}
          {photo.description && (
            <p className="text-stone-500 text-xs line-clamp-2 mb-3 bg-stone-50 p-2 rounded-lg border border-stone-100 font-normal">
              {photo.description}
            </p>
          )}
        </div>

        {/* Footer: Registration Date & Action Buttons */}
        <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
          
          {/* 등록일자 */}
          <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
            <span>{photo.registrationDate}</span>
          </div>

          {/* Action buttons (Always visible for quick access) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(photo);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-stone-600 hover:text-[#EB6100] hover:bg-orange-50 border border-stone-200 hover:border-orange-200 transition"
              title="점검내용 및 정보 수정"
            >
              <Pencil className="w-3 h-3 text-[#F37321]" />
              <span>수정</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id, e);
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              title="사진 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
