import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store with realistic initial data
interface ServerPhoto {
  id: string;
  url: string;
  projectName: string;
  partnerName: string;
  registrationDate: string;
  uploadedAt: string;
  uploaderName?: string;
  workType?: string;
  location?: string;
  description?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

let photosStore: ServerPhoto[] = [
  {
    id: 'hanwha-p1',
    url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화솔루션 신안 태양광 발전소 PJT',
    partnerName: '동아건설산업',
    registrationDate: '2026-11-10',
    uploadedAt: '2026-11-10T09:30:00Z',
    uploaderName: '김현장 소장 (모바일)',
    workType: '태양광 모듈 설치',
    location: '1공구 A-4 구역',
    description: '1공구 태양광 지지대 볼트 체결 및 모듈 120장 설치 완료 확인',
    fileSize: 1840200,
    dimensions: { width: 1920, height: 1080 }
  },
  {
    id: 'hanwha-p2',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화건설 포레나 주거복합 현장',
    partnerName: '삼우토건',
    registrationDate: '2026-11-10',
    uploadedAt: '2026-11-10T08:15:00Z',
    uploaderName: '박안전 대리 (모바일)',
    workType: '골조공사',
    location: '102동 14층 슬래브',
    description: '14층 슬래브 철근 배근 및 거푸집 조립 상태 안전검측 합격',
    fileSize: 2120400,
    dimensions: { width: 1920, height: 1280 }
  },
  {
    id: 'hanwha-p3',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화에어로스페이스 창원 엔진조립동 PJT',
    partnerName: '세종중공업',
    registrationDate: '2026-11-09',
    uploadedAt: '2026-11-09T14:40:00Z',
    uploaderName: '이품질 과장 (모바일)',
    workType: '설비/배관',
    location: '동측 기계실 2번 라인',
    description: '고압 유압배관 압력테스트 150bar 유지 24시간 검증 이상무',
    fileSize: 1650800,
    dimensions: { width: 1600, height: 1067 }
  },
  {
    id: 'hanwha-p4',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화오션 거제 스마트야드 도크 건조 PJT',
    partnerName: '한성전기설비',
    registrationDate: '2026-11-08',
    uploadedAt: '2026-11-08T11:20:00Z',
    uploaderName: '최전기 반장 (모바일)',
    workType: '전기통신',
    location: '제2도크 LNG운반선 카고탱크',
    description: '주전원 케이블 트레이 포설 및 접지저항치(0.8옴) 기준 충족',
    fileSize: 1980300,
    dimensions: { width: 1920, height: 1280 }
  },
  {
    id: 'hanwha-p5',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화건설 포레나 주거복합 현장',
    partnerName: '대림인프라',
    registrationDate: '2026-11-07',
    uploadedAt: '2026-11-07T16:05:00Z',
    uploaderName: '정공무 주임 (모바일)',
    workType: '안전시설',
    location: '지하주차장 램프 구간',
    description: '지하주차장 진입로 안전난간대 및 낙하물 방지망 추가 설치',
    fileSize: 1420100,
    dimensions: { width: 1600, height: 1067 }
  },
  {
    id: 'hanwha-p6',
    url: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1600&q=80',
    projectName: '한화솔루션 신안 태양광 발전소 PJT',
    partnerName: '동아건설산업',
    registrationDate: '2026-11-05',
    uploadedAt: '2026-11-05T10:10:00Z',
    uploaderName: '김현장 소장 (모바일)',
    workType: '토목기초',
    location: '변전소 부지 터파기',
    description: '옥외 변전소 기초 콘크리트 타설 전 레벨 측량 및 쇄석 다짐 완료',
    fileSize: 2310500,
    dimensions: { width: 1920, height: 1280 }
  }
];

let lastModified = Date.now();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Increase payload limit for mobile high-res photo uploads (base64)
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // --- REST API ROUTES ---
  
  // Health check & version
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), count: photosStore.length });
  });

  // Admin login check
  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    // Default admin passwords accepted
    if (password === 'admin1234' || password === 'hanwha' || password === '1234' || password === 'admin') {
      res.json({ success: true, message: '관리자로 로그인되었습니다.', role: 'admin' });
    } else {
      res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
  });

  // Get all photos & lastModified timestamp
  app.get('/api/photos', (req, res) => {
    res.json({
      photos: photosStore,
      lastModified,
      total: photosStore.length
    });
  });

  // Upload single photo or multiple photos
  app.post('/api/photos', (req, res) => {
    const body = req.body;
    const incoming: ServerPhoto[] = Array.isArray(body) ? body : [body];

    const added: ServerPhoto[] = [];
    for (const item of incoming) {
      if (!item.url || !item.projectName) {
        continue;
      }
      const newPhoto: ServerPhoto = {
        id: item.id || `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        url: item.url,
        projectName: item.projectName,
        partnerName: item.partnerName || '미지정',
        registrationDate: item.registrationDate || new Date().toISOString().split('T')[0],
        uploadedAt: item.uploadedAt || new Date().toISOString(),
        uploaderName: item.uploaderName || '현장 모바일 사용자',
        workType: item.workType || '일반',
        location: item.location || '',
        description: item.description || '',
        fileSize: item.fileSize || 0,
        dimensions: item.dimensions
      };
      photosStore.unshift(newPhoto);
      added.push(newPhoto);
    }

    lastModified = Date.now();
    res.status(201).json({ success: true, count: added.length, added, total: photosStore.length });
  });

  // Update existing photo details (PJT명, 협력업체명, 등록일자, 비고 등)
  app.put('/api/photos/:id', (req, res) => {
    const { id } = req.params;
    const index = photosStore.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: '해당 사진을 찾을 수 없습니다.' });
      return;
    }

    const { projectName, partnerName, registrationDate, workType, location, description } = req.body;
    photosStore[index] = {
      ...photosStore[index],
      projectName: projectName !== undefined ? projectName : photosStore[index].projectName,
      partnerName: partnerName !== undefined ? partnerName : photosStore[index].partnerName,
      registrationDate: registrationDate !== undefined ? registrationDate : photosStore[index].registrationDate,
      workType: workType !== undefined ? workType : photosStore[index].workType,
      location: location !== undefined ? location : photosStore[index].location,
      description: description !== undefined ? description : photosStore[index].description,
    };

    lastModified = Date.now();
    res.json({ success: true, updated: photosStore[index] });
  });

  // Delete photo
  app.delete('/api/photos/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = photosStore.length;
    photosStore = photosStore.filter(p => p.id !== id);

    if (photosStore.length === initialLen) {
      res.status(404).json({ success: false, message: '해당 사진을 찾을 수 없습니다.' });
      return;
    }

    lastModified = Date.now();
    res.json({ success: true, deletedId: id, total: photosStore.length });
  });

  // Batch delete
  app.post('/api/photos/delete-batch', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ success: false, message: 'ids 배열이 필요합니다.' });
      return;
    }

    const targetSet = new Set(ids);
    photosStore = photosStore.filter(p => !targetSet.has(p.id));
    lastModified = Date.now();
    res.json({ success: true, deletedCount: ids.length, total: photosStore.length });
  });

  // Reset to initial demo data
  app.post('/api/photos/reset-demo', (req, res) => {
    // Re-seed
    photosStore = [
      {
        id: 'hanwha-p1',
        url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화솔루션 신안 태양광 발전소 PJT',
        partnerName: '동아건설산업',
        registrationDate: '2026-11-10',
        uploadedAt: '2026-11-10T09:30:00Z',
        uploaderName: '김현장 소장 (모바일)',
        workType: '태양광 모듈 설치',
        location: '1공구 A-4 구역',
        description: '1공구 태양광 지지대 볼트 체결 및 모듈 120장 설치 완료 확인',
        fileSize: 1840200,
        dimensions: { width: 1920, height: 1080 }
      },
      {
        id: 'hanwha-p2',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화건설 포레나 주거복합 현장',
        partnerName: '삼우토건',
        registrationDate: '2026-11-10',
        uploadedAt: '2026-11-10T08:15:00Z',
        uploaderName: '박안전 대리 (모바일)',
        workType: '골조공사',
        location: '102동 14층 슬래브',
        description: '14층 슬래브 철근 배근 및 거푸집 조립 상태 안전검측 합격',
        fileSize: 2120400,
        dimensions: { width: 1920, height: 1280 }
      },
      {
        id: 'hanwha-p3',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화에어로스페이스 창원 엔진조립동 PJT',
        partnerName: '세종중공업',
        registrationDate: '2026-11-09',
        uploadedAt: '2026-11-09T14:40:00Z',
        uploaderName: '이품질 과장 (모바일)',
        workType: '설비/배관',
        location: '동측 기계실 2번 라인',
        description: '고압 유압배관 압력테스트 150bar 유지 24시간 검증 이상무',
        fileSize: 1650800,
        dimensions: { width: 1600, height: 1067 }
      },
      {
        id: 'hanwha-p4',
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화오션 거제 스마트야드 도크 건조 PJT',
        partnerName: '한성전기설비',
        registrationDate: '2026-11-08',
        uploadedAt: '2026-11-08T11:20:00Z',
        uploaderName: '최전기 반장 (모바일)',
        workType: '전기통신',
        location: '제2도크 LNG운반선 카고탱크',
        description: '주전원 케이블 트레이 포설 및 접지저항치(0.8옴) 기준 충족',
        fileSize: 1980300,
        dimensions: { width: 1920, height: 1280 }
      },
      {
        id: 'hanwha-p5',
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화건설 포레나 주거복합 현장',
        partnerName: '대림인프라',
        registrationDate: '2026-11-07',
        uploadedAt: '2026-11-07T16:05:00Z',
        uploaderName: '정공무 주임 (모바일)',
        workType: '안전시설',
        location: '지하주차장 램프 구간',
        description: '지하주차장 진입로 안전난간대 및 낙하물 방지망 추가 설치',
        fileSize: 1420100,
        dimensions: { width: 1600, height: 1067 }
      },
      {
        id: 'hanwha-p6',
        url: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=1600&q=80',
        projectName: '한화솔루션 신안 태양광 발전소 PJT',
        partnerName: '동아건설산업',
        registrationDate: '2026-11-05',
        uploadedAt: '2026-11-05T10:10:00Z',
        uploaderName: '김현장 소장 (모바일)',
        workType: '토목기초',
        location: '변전소 부지 터파기',
        description: '옥외 변전소 기초 콘크리트 타설 전 레벨 측량 및 쇄석 다짐 완료',
        fileSize: 2310500,
        dimensions: { width: 1920, height: 1280 }
      }
    ];
    lastModified = Date.now();
    res.json({ success: true, count: photosStore.length });
  });

  // Frontend integration: Vite middleware in development, static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hanwha Field Viewer] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
