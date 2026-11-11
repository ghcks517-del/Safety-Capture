export interface PhotoItem {
  id: string;
  url: string; // base64 or URL
  thumbnailUrl?: string;
  projectName: string; // PJT명
  partnerName: string; // 협력업체명
  registrationDate: string; // 등록일자 (YYYY-MM-DD)
  uploadedAt: string; // ISO string
  uploaderName?: string; // 등록자
  workType?: string; // 공종 (골조, 전기, 배관, 안전, 품질 등)
  location?: string; // 세부 위치
  description?: string; // 설명 / 비고
  fileSize?: number; // bytes
  dimensions?: { width: number; height: number };
}

export interface FilterState {
  projectName: string; // '' for all
  partnerName: string; // '' for all
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  searchQuery: string;
  workType: string;
}

export type ViewMode = 'viewer' | 'uploader' | 'grid';
export type GridColumns = 2 | 3 | 4 | 6;

export interface AdminAuthState {
  isAdmin: boolean;
  adminName: string;
  loginTime: string | null;
}
