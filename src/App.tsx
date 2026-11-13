/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Camera, 
  Filter, 
  BellRing,
  Upload
} from 'lucide-react';
import { PhotoItem, FilterState, GridColumns } from './types/photo';
import { api } from './services/api';
import { isDateInRange } from './utils/date';
import { useDeviceLayout } from './utils/useDeviceLayout';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { PhotoCard } from './components/PhotoCard';
import { PhotoDetailModal } from './components/PhotoDetailModal';
import { EditPhotoModal } from './components/EditPhotoModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { QrCodeModal } from './components/QrCodeModal';
import { StatsSummary } from './components/StatsSummary';
import { MobileFieldView } from './components/MobileFieldView';
import { UploadModal } from './components/UploadModal';
import { ProjectManageModal } from './components/ProjectManageModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [managedProjects, setManagedProjects] = useState<string[]>([]);
  const deviceLayout = useDeviceLayout();
  const [gridCols, setGridCols] = useState<GridColumns>(3);
  
  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => api.getStoredAdminStatus());
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);

  // Modals
  const [detailPhotoId, setDetailPhotoId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    photo?: PhotoItem;
    id?: string;
  } | null>(null);

  // Batch delete state (for Galaxy Tab Admin mode)
  const [batchSelectMode, setBatchSelectMode] = useState<boolean>(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [newPhotoAlert, setNewPhotoAlert] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    projectName: '',
    partnerName: '',
    startDate: '',
    endDate: '',
    searchQuery: '',
    workType: ''
  });

  // Load photos from server/local
  const loadPhotos = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    try {
      const res = await api.getPhotos();
      setPhotos(res.photos);
    } catch (err) {
      console.warn('사진 로드 에러:', err);
    } finally {
      if (!isSilent) setIsSyncing(false);
    }
  }, []);

  // Real-time Firestore WebSocket listener: instant mobile-to-tablet sync
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = api.subscribePhotos((updatedPhotos) => {
      setPhotos((prev) => {
        if (prev.length > 0 && updatedPhotos.length > prev.length) {
          const diffCount = updatedPhotos.length - prev.length;
          setNewPhotoAlert(`📱 모바일에서 새로운 현장 사진 ${diffCount}건이 등록되었습니다!`);
          setTimeout(() => setNewPhotoAlert(null), 5000);
        }
        return updatedPhotos;
      });
      setIsSyncing(false);
      try {
        const reopenId = sessionStorage.getItem('safetycap_reopen_risk_photo_id');
        if (reopenId && updatedPhotos.some((p) => p.id === reopenId)) {
          sessionStorage.removeItem('safetycap_reopen_risk_photo_id');
          setDetailPhotoId(reopenId);
        }
      } catch {
        // Ignore storage errors
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore projects subscription
  useEffect(() => {
    const unsubProjects = api.subscribeProjects((list) => {
      setManagedProjects(list);
    });
    return () => unsubProjects();
  }, []);

  // Browser fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen?.().catch((e) => console.warn(e));
    }
  };

  // Project management handlers
  const handleAddProject = async (name: string) => {
    await api.addProject(name);
  };

  const handleUpdateProject = async (oldName: string, newName: string) => {
    await api.updateProject(oldName, newName);
  };

  const handleDeleteProject = async (name: string) => {
    await api.deleteProject(name);
  };

  // Extract unique projects (combining managed projects + any active photo projects)
  const availableProjects = useMemo(() => {
    const set = new Set<string>(managedProjects);
    photos.forEach((p) => {
      if (p.projectName) set.add(p.projectName);
    });
    return Array.from(set);
  }, [managedProjects, photos]);

  const availablePartners = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.partnerName) set.add(p.partnerName);
    });
    return Array.from(set);
  }, [photos]);

  // Filter photos based on PJT, partner, date range, search query
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // 1. PJT filter
      if (filter.projectName && photo.projectName !== filter.projectName) {
        return false;
      }

      // 2. Partner filter
      if (filter.partnerName && photo.partnerName !== filter.partnerName) {
        return false;
      }

      // 3. Date range filter
      if (!isDateInRange(photo.registrationDate, filter.startDate, filter.endDate)) {
        return false;
      }

      // 4. Keyword search (case-insensitive)
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        const matchesProject = photo.projectName.toLowerCase().includes(q);
        const matchesPartner = photo.partnerName.toLowerCase().includes(q);
        const matchesWorkType = (photo.workType || '').toLowerCase().includes(q);
        const matchesLocation = (photo.location || '').toLowerCase().includes(q);
        const matchesDesc = (photo.description || '').toLowerCase().includes(q);
        const matchesDate = photo.registrationDate.includes(q);

        if (!matchesProject && !matchesPartner && !matchesWorkType && !matchesLocation && !matchesDesc && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [photos, filter]);

  // Upload handler
  const handleUploadSuccess = async (newPhotos: Partial<PhotoItem>[]) => {
    const created = await api.uploadPhotos(newPhotos);
    setPhotos((prev) => [...created, ...prev]);
  };

  // Edit photo handler
  const handleSavePhotoUpdates = async (id: string, updates: Partial<PhotoItem>) => {
    const updated = await api.updatePhoto(id, updates);
    setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  // Open edit modal with admin check
  const handleEditClick = (photo: PhotoItem) => {
    if (!isAdmin) {
      setPendingAction({ type: 'edit', photo });
      setShowAdminModal(true);
      return;
    }
    setEditingPhoto(photo);
  };

  // Delete single photo with admin check
  const handleDeletePhoto = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAdmin) {
      setPendingAction({ type: 'delete', id });
      setShowAdminModal(true);
      return;
    }

    if (confirm('선택한 현장 사진을 삭제하시겠습니까?')) {
      await api.deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (detailPhotoId === id) {
        setDetailPhotoId(null);
      }
      if (editingPhoto?.id === id) {
        setEditingPhoto(null);
      }
    }
  };

  // Batch delete handler
  const handleDeleteSelectedBatch = async () => {
    if (!isAdmin) {
      alert('관리자 로그인이 필요합니다. (비밀번호: 0000)');
      setShowAdminModal(true);
      return;
    }
    if (selectedBatchIds.size === 0) return;

    if (confirm(`선택한 ${selectedBatchIds.size}장의 사진을 일괄 삭제하시겠습니까?`)) {
      const ids = Array.from(selectedBatchIds);
      await api.deleteBatch(ids);
      setPhotos((prev) => prev.filter((p) => !selectedBatchIds.has(p.id)));
      setSelectedBatchIds(new Set());
      setBatchSelectMode(false);
    }
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const allIds = filteredPhotos.map((p) => p.id);
    setSelectedBatchIds(new Set(allIds));
  };

  // Admin login handler
  const handleAdminLogin = async (password: string) => {
    const res = await api.loginAdmin(password);
    if (res.success) {
      setIsAdmin(true);
      // Execute any pending edit or delete action
      if (pendingAction?.type === 'edit' && pendingAction.photo) {
        setEditingPhoto(pendingAction.photo);
      } else if (pendingAction?.type === 'delete' && pendingAction.id) {
        const idToDelete = pendingAction.id;
        if (confirm('관리자 로그인되었습니다. 선택한 사진을 삭제하시겠습니까?')) {
          await api.deletePhoto(idToDelete);
          setPhotos((prev) => prev.filter((p) => p.id !== idToDelete));
          if (detailPhotoId === idToDelete) {
            setDetailPhotoId(null);
          }
          if (editingPhoto?.id === idToDelete) {
            setEditingPhoto(null);
          }
        }
      }
      setPendingAction(null);
    }
    return res;
  };

  const handleAdminLogout = () => {
    api.logoutAdmin();
    setIsAdmin(false);
    setBatchSelectMode(false);
    setSelectedBatchIds(new Set());
  };

  // Reset to demo data
  const handleResetDemo = async () => {
    if (confirm('샘플 현장 사진 데이터로 초기화하시겠습니까?')) {
      const reset = await api.resetToDemo();
      setPhotos(reset);
    }
  };

  // Determine grid column CSS classes for Galaxy Tab / Desktop
  const gridClass = useMemo(() => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 4:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 3:
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    }
  }, [gridCols]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      
      {/* Top Application Header - Clean & Minimal without manual mode switcher */}
      <Header
        deviceLayout={deviceLayout}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setShowAdminModal(true)}
        onLogoutAdmin={handleAdminLogout}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenQrModal={() => setShowQrModal(true)}
        onRefresh={() => loadPhotos(false)}
        isSyncing={isSyncing}
        photoCount={photos.length}
        onOpenUploadModal={() => setShowUploadModal(true)}
      />

      {/* Floating Live Sync Toast Notification */}
      {newPhotoAlert && (
        <div className="fixed top-18 right-4 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-orange-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#F37321] text-white flex items-center justify-center shrink-0 animate-bounce">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-[#F37321] block">실시간 연동 감지</span>
            <span className="font-medium">{newPhotoAlert}</span>
          </div>
          <button
            onClick={() => setNewPhotoAlert(null)}
            className="text-stone-400 hover:text-white text-xs px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Container - Automatically adapts layout to Mobile vs. Galaxy Tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {deviceLayout.isMobile ? (
          /* =========================================================================
             1. MOBILE PHONE AUTO LAYOUT:
             - Prominent camera/gallery quick capture card at top
             - Instant compression & upload to Galaxy Tab
             - Mobile-tailored photo stream with compact collapsible filters below
             ========================================================================= */
          <MobileFieldView
            photos={photos}
            filteredPhotos={filteredPhotos}
            filter={filter}
            onFilterChange={setFilter}
            availableProjects={availableProjects}
            availablePartners={availablePartners}
            onUploadSuccess={handleUploadSuccess}
            onOpenDetail={(p) => setDetailPhotoId(p.id)}
            onEdit={handleEditClick}
            onDelete={handleDeletePhoto}
            isAdmin={isAdmin}
            onOpenProjectManage={() => setShowProjectModal(true)}
          />
        ) : (
          /* =========================================================================
             2. GALAXY TAB & LARGE SCREEN AUTO LAYOUT:
             - Optimized for 16:10 / 16:9 / 4:3 tablet screens
             - Compact stats summary strip
             - Comprehensive Filter Bar (PJT, Partner, Date Range Picker & Quick Presets)
             - 2/3/4 Column Inspection Grid
             - Fullscreen Lightbox Viewer with Zoom & Slideshow
             ========================================================================= */
          <>
            {/* Top Stats Summary */}
            <StatsSummary
              photos={photos}
              isAdmin={isAdmin}
              onResetDemo={handleResetDemo}
              onOpenMobileUploader={() => setShowUploadModal(true)}
            />

            {/* Filter Bar (PJT, Partner, Date Range, Presets, Search) */}
            <FilterBar
              filter={filter}
              onFilterChange={setFilter}
              availableProjects={availableProjects}
              availablePartners={availablePartners}
              totalCount={photos.length}
              filteredCount={filteredPhotos.length}
              gridCols={gridCols}
              onGridColsChange={setGridCols}
              isAdmin={isAdmin}
              batchSelectMode={batchSelectMode}
              onToggleBatchSelectMode={() => setBatchSelectMode(!batchSelectMode)}
              selectedBatchCount={selectedBatchIds.size}
              onSelectAllVisible={handleSelectAllVisible}
              onDeleteSelectedBatch={handleDeleteSelectedBatch}
              onOpenProjectManage={() => setShowProjectModal(true)}
            />

            {/* Photo Cards Grid for Galaxy Tab */}
            {filteredPhotos.length > 0 ? (
              <div className={`grid ${gridClass} gap-4 sm:gap-6`}>
                {filteredPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onOpenDetail={(p) => setDetailPhotoId(p.id)}
                    onEdit={handleEditClick}
                    onDelete={handleDeletePhoto}
                    isAdmin={isAdmin}
                    batchSelectMode={batchSelectMode}
                    isSelected={selectedBatchIds.has(photo.id)}
                    onToggleSelect={handleToggleSelectId}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs max-w-lg mx-auto my-8">
                <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#EB6100] border border-orange-200 flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-lg mb-1">
                  조건에 일치하는 현장 사진이 없습니다
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mb-6">
                  선택하신 PJT명, 협력업체명, 또는 등록일자 기간에 해당하는 사진이 없습니다.<br />
                  필터 조건을 변경하거나 모바일에서 새 사진을 업로드해보세요.
                </p>
                <button
                  onClick={() => setFilter({
                    projectName: '',
                    partnerName: '',
                    startDate: '',
                    endDate: '',
                    searchQuery: '',
                    workType: ''
                  })}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition"
                >
                  필터 전체 초기화
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* Floating Upload Action Button for Tablet */}
      {!deviceLayout.isMobile && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="fixed bottom-6 right-6 z-30 p-4 rounded-2xl bg-gradient-to-r from-[#F37321] to-[#EB6100] text-white shadow-xl hover:shadow-[#F37321]/40 hover:scale-105 active:scale-95 transition flex items-center gap-2.5 font-black text-sm"
          title="현장 사진 직접 등록"
        >
          <Camera className="w-5 h-5" />
          <span>현장 사진 등록</span>
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-5 mt-10 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F37321]">HANWHA</span>
            <span>현장 사진 Viewer (디바이스 비율 자동 감지)</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span>실시간 클라우드 연동 중</span>
            <span>•</span>
            <button
              onClick={() => setShowProjectModal(true)}
              className="text-stone-400 hover:text-stone-700 underline"
            >
              PJT 목록 관리
            </button>
            <span>•</span>
            <button
              onClick={handleResetDemo}
              className="text-stone-400 hover:text-stone-700 underline"
            >
              샘플 데이터 복원
            </button>
          </div>
        </div>
      </footer>

      {/* --- MODALS --- */}

      {/* 1. Fullscreen Detail Inspection Modal (Available on both mobile and tablet) */}
      {detailPhotoId && (
        <PhotoDetailModal
          photos={filteredPhotos.length > 0 ? filteredPhotos : photos}
          currentPhotoId={detailPhotoId}
          onClose={() => setDetailPhotoId(null)}
          onSelectPhotoId={(id) => setDetailPhotoId(id)}
          onEdit={(photo) => {
            setDetailPhotoId(null);
            handleEditClick(photo);
          }}
          onDelete={(id) => {
            handleDeletePhoto(id);
          }}
          onSaveUpdates={handleSavePhotoUpdates}
          isAdmin={isAdmin}
        />
      )}

      {/* 2. Edit Photo Information Modal */}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={handleSavePhotoUpdates}
          onDelete={handleDeletePhoto}
          availableProjects={availableProjects}
          availablePartners={availablePartners}
        />
      )}

      {/* 3. Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onLogin={handleAdminLogin}
      />

      {/* 4. Smartphone Connect QR Code Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      {/* 5. Tablet Photo Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        availableProjects={availableProjects}
        availablePartners={availablePartners}
        onOpenProjectManage={() => setShowProjectModal(true)}
      />

      {/* 6. PJT Projects Management Modal */}
      <ProjectManageModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        projects={availableProjects}
        photos={photos}
        onAddProject={handleAddProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* 7. Offline PWA Connectivity Indicator */}
      <OfflineIndicator />

    </div>
  );
}
