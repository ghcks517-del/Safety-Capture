import React from 'react';
import { 
  Search, 
  RotateCcw, 
  Calendar, 
  Building2, 
  Briefcase, 
  Filter, 
  Grid2X2, 
  Grid3X3, 
  LayoutList,
  CheckSquare,
  Square
} from 'lucide-react';
import { FilterState, GridColumns } from '../types/photo';
import { getTodayString, getDateDaysAgo } from '../utils/date';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  availableProjects: string[];
  availablePartners: string[];
  totalCount: number;
  filteredCount: number;
  gridCols: GridColumns;
  onGridColsChange: (cols: GridColumns) => void;
  isAdmin: boolean;
  batchSelectMode: boolean;
  onToggleBatchSelectMode: () => void;
  selectedBatchCount: number;
  onSelectAllVisible: () => void;
  onDeleteSelectedBatch: () => void;
  onOpenProjectManage?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  availableProjects,
  availablePartners,
  totalCount,
  filteredCount,
  gridCols,
  onGridColsChange,
  isAdmin,
  batchSelectMode,
  onToggleBatchSelectMode,
  selectedBatchCount,
  onSelectAllVisible,
  onDeleteSelectedBatch,
  onOpenProjectManage
}) => {
  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, projectName: e.target.value });
  };

  const handlePartnerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, partnerName: e.target.value });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, endDate: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchQuery: e.target.value });
  };

  // Quick preset handlers
  const setPresetRange = (preset: 'all' | 'today' | '3days' | '1week' | '1month') => {
    const today = getTodayString();
    switch (preset) {
      case 'all':
        onFilterChange({ ...filter, startDate: '', endDate: '' });
        break;
      case 'today':
        onFilterChange({ ...filter, startDate: today, endDate: today });
        break;
      case '3days':
        onFilterChange({ ...filter, startDate: getDateDaysAgo(2), endDate: today });
        break;
      case '1week':
        onFilterChange({ ...filter, startDate: getDateDaysAgo(6), endDate: today });
        break;
      case '1month':
        onFilterChange({ ...filter, startDate: getDateDaysAgo(30), endDate: today });
        break;
    }
  };

  const handleReset = () => {
    onFilterChange({
      projectName: '',
      partnerName: '',
      startDate: '',
      endDate: '',
      searchQuery: '',
      workType: ''
    });
  };

  const hasActiveFilters = Boolean(
    filter.projectName || 
    filter.partnerName || 
    filter.startDate || 
    filter.endDate || 
    filter.searchQuery
  );

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-stone-200 mb-6 transition-all">
      {/* Top Row: Search & Filters Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3.5 border-b border-stone-100">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="PJT명, 협력업체, 공종, 현장 위치, 비고 검색..."
            value={filter.searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 focus:border-[#F37321] transition"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 bg-stone-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* View density & Admin Batch options */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          
          {/* Admin Batch Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-stone-200">
              <button
                onClick={onToggleBatchSelectMode}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition ${
                  batchSelectMode 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {batchSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                일괄 선택 모드
              </button>

              {batchSelectMode && (
                <>
                  <button
                    onClick={onSelectAllVisible}
                    className="px-2 py-1 text-stone-600 hover:text-stone-900 font-medium underline"
                  >
                    전체선택
                  </button>
                  {selectedBatchCount > 0 && (
                    <button
                      onClick={onDeleteSelectedBatch}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-xs"
                    >
                      {selectedBatchCount}건 일괄 삭제
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Grid View Controls (optimized for tablet viewing) */}
          <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              onClick={() => onGridColsChange(2)}
              title="2열 크게 보기 (태블릿 상세 검측용)"
              className={`p-1.5 rounded-md ${gridCols === 2 ? 'bg-white shadow-xs text-[#EB6100]' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => onGridColsChange(3)}
              title="3열 기본 보기"
              className={`p-1.5 rounded-md ${gridCols === 3 ? 'bg-white shadow-xs text-[#EB6100]' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onGridColsChange(4)}
              title="4열 모아보기"
              className={`p-1.5 rounded-md ${gridCols === 4 ? 'bg-white shadow-xs text-[#EB6100]' : 'text-stone-500 hover:text-stone-800'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
              title="필터 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F37321]" />
              <span>초기화</span>
            </button>
          )}

          {/* Result Count Badge */}
          <div className="bg-orange-50 text-[#EB6100] px-3 py-1.5 rounded-lg font-bold border border-orange-200 text-xs">
            {filteredCount}건 / <span className="text-stone-400 font-normal">총 {totalCount}건</span>
          </div>

        </div>
      </div>

      {/* Main Filter Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5">
        
        {/* 1. PJT명 Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F37321]" />
              PJT명 (프로젝트)
            </span>
            {onOpenProjectManage && (
              <button
                type="button"
                onClick={onOpenProjectManage}
                className="text-[11px] font-semibold text-[#EB6100] hover:text-[#c45000] flex items-center gap-1 hover:underline"
                title="PJT 프로젝트 목록 추가 및 관리"
              >
                <span>⚙️ PJT 목록 관리</span>
              </button>
            )}
          </label>
          <div className="relative">
            <select
              value={filter.projectName}
              onChange={handleProjectSelect}
              className={`w-full py-2 pl-3 pr-8 text-xs sm:text-sm rounded-xl border appearance-none transition focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 ${
                filter.projectName
                  ? 'border-[#F37321] bg-orange-50/50 text-stone-900 font-semibold'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            >
              <option value="">전체 PJT ({availableProjects.length}개 프로젝트)</option>
              {availableProjects.map((pjt) => (
                <option key={pjt} value={pjt}>
                  {pjt}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 2. 협력업체명 Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#F37321]" />
            협력업체명
          </label>
          <div className="relative">
            <select
              value={filter.partnerName}
              onChange={handlePartnerSelect}
              className={`w-full py-2 pl-3 pr-8 text-xs sm:text-sm rounded-xl border appearance-none transition focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 ${
                filter.partnerName
                  ? 'border-[#F37321] bg-orange-50/50 text-stone-900 font-semibold'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            >
              <option value="">전체 협력업체 ({availablePartners.length}개사)</option>
              {availablePartners.map((partner) => (
                <option key={partner} value={partner}>
                  {partner}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 3. 등록일자 기간 설정 Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F37321]" />
              등록일자 기간 설정
            </span>
            <span className="text-[11px] text-stone-400 font-normal">
              {filter.startDate || filter.endDate ? '기간 필터링 적용 중' : '전체 기간'}
            </span>
          </label>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filter.startDate}
              onChange={handleStartDateChange}
              title="시작 등록일자"
              className={`flex-1 py-1.5 px-2.5 text-xs sm:text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 ${
                filter.startDate
                  ? 'border-[#F37321] bg-orange-50/50 font-semibold text-stone-900'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            />
            <span className="text-stone-400 font-bold text-xs">~</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={handleEndDateChange}
              title="종료 등록일자"
              className={`flex-1 py-1.5 px-2.5 text-xs sm:text-sm rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 ${
                filter.endDate
                  ? 'border-[#F37321] bg-orange-50/50 font-semibold text-stone-900'
                  : 'border-stone-200 bg-stone-50 text-stone-700'
              }`}
            />
          </div>
        </div>

      </div>

      {/* Date Presets Quick Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 text-xs">
        <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#F37321]" /> 빠른 기간:
        </span>
        <button
          onClick={() => setPresetRange('today')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            filter.startDate === getTodayString() && filter.endDate === getTodayString()
              ? 'bg-[#F37321] text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          오늘 등록
        </button>
        <button
          onClick={() => setPresetRange('3days')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            filter.startDate === getDateDaysAgo(2) && filter.endDate === getTodayString()
              ? 'bg-[#F37321] text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          최근 3일
        </button>
        <button
          onClick={() => setPresetRange('1week')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            filter.startDate === getDateDaysAgo(6) && filter.endDate === getTodayString()
              ? 'bg-[#F37321] text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          최근 1주일
        </button>
        <button
          onClick={() => setPresetRange('1month')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            filter.startDate === getDateDaysAgo(30) && filter.endDate === getTodayString()
              ? 'bg-[#F37321] text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          최근 1개월
        </button>
        <button
          onClick={() => setPresetRange('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
            !filter.startDate && !filter.endDate
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          전체 기간
        </button>
      </div>
    </div>
  );
};
