import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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

function getPort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  // In development, AI Studio dev server runs behind Nginx on 8080 and proxies to 3000
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return parseInt(process.env.PORT || '3000', 10);
}

async function startServer() {
  const app = express();
  const PORT = getPort();

  // Increase payload limit for mobile high-res photo uploads (base64)
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // --- REST API ROUTES ---
  
  // Helper to extract image part from base64 data URL or external URL
  async function getImagePart(photoUrl?: string): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
    if (!photoUrl) return null;
    
    if (photoUrl.startsWith('data:')) {
      const matches = photoUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (matches && matches[1] && matches[2]) {
        return {
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        };
      }
    }

    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      try {
        const response = await fetch(photoUrl);
        if (!response.ok) return null;
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return {
          inlineData: {
            mimeType: contentType.split(';')[0],
            data: base64
          }
        };
      } catch (e) {
        console.warn('Failed to fetch image from URL for AI analysis:', e);
        return null;
      }
    }

    return null;
  }

  // Health check & version
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), count: photosStore.length });
  });

  // Gemini AI Risk Analysis
  app.post('/api/analyze-risk', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          success: false, 
          message: 'GEMINI_API_KEY가 서버 환경에 설정되지 않았습니다. AI Studio 환경 설정을 확인해주세요.' 
        });
        return;
      }

      const { photoUrl, projectName, partnerName, registrationDate, workType, location, description } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts: any[] = [];
      const imagePart = await getImagePart(photoUrl);
      if (imagePart) {
        parts.push(imagePart);
      }

      const promptText = `
당신은 한화 현장 안전보건 총괄책임자이자 KOSHA-MS(안전보건경영시스템) 심사관입니다.
첨부된 현장 사진과 아래의 현장 점검 정보를 정밀 분석하여, 사진 상에서 실제로 위험한 위치(구역)를 식별하고 번호(1, 2, 3...)와 0~1000 범위의 2D 바운딩 박스(box: { ymin, xmin, ymax, xmax })로 정확히 지정하여 번호별 위험성 평가 보고서를 작성해주세요.

[현장 정보]
- 프로젝트(PJT): ${projectName || '미지정'}
- 협력업체: ${partnerName || '미지정'}
- 공종/작업분류: ${workType || '일반'}
- 세부 위치: ${location || '위치 미지정'}
- 등록일자: ${registrationDate || ''}
- 현장 등록 점검내용/비고: ${description || '(등록된 점검 내용 없음)'}

[시각적 마킹 및 좌표 지정 지침 - 필수]
1. 사진 상에서 위험 요소나 안전 미비점(예: 개구부 단부 추락 위험, 안전난간 미설치, 비계 연결부 불안정, 전기 배선 노출, 근로자 보호구 미착용, 자재 낙하 위험 위치 등)이 위치한 영역을 정확히 찾아 1부터 시작하는 순차 번호(id)를 부여하세요.
2. 각 위험 요인마다 사진 상의 0~1000 정규화 좌표계로 bounding box를 지정하세요:
   - ymin: 상단 Y좌표 (0~1000)
   - xmin: 좌측 X좌표 (0~1000)
   - ymax: 하단 Y좌표 (0~1000)
   - xmax: 우측 X좌표 (0~1000)
   (사진 좌측상단이 0, 0이고 우측하단이 1000, 1000)
3. 각 번호에 맞춰서 어떤 위험이 있는지 원인과 즉시 조치 대책을 1:1로 매칭해 분석하세요.

반드시 아래 JSON 형식으로만 응답해야 합니다. 마크다운 기호 없이 순수 JSON 객체만 반환하세요:
{
  "riskLevel": "위험" 또는 "주의" 또는 "양호",
  "riskScore": 1부터 10까지의 정수 (1: 매우 안전, 5: 보통 주의 필요, 8~10: 즉시 작업중지 요망 고위험),
  "summary": "현장 상황과 주요 위험 포인트를 요약한 2문장 이내 설명",
  "identifiedHazards": [
    {
      "id": 1,
      "hazard": "식별된 위험 요인 명칭 (예: 14층 슬래브 단부 추락 방호 미비)",
      "cause": "발생 원인 및 예상 재해 유형 (예: 안전난간대 미결속으로 인한 작업자 추락 위험)",
      "severity": "상" 또는 "중" 또는 "하",
      "locationDesc": "사진 속 구체적 위치 (예: 화면 우측 상단 슬래브 단부)",
      "box": {
        "ymin": 120,
        "xmin": 450,
        "ymax": 380,
        "xmax": 850
      },
      "safetyMeasure": {
        "action": "해당 위치에 대한 즉시 안전 조치 사항",
        "standard": "관련 산업안전보건기준 또는 현장 표준 수칙"
      }
    }
  ],
  "safetyMeasures": [
    {
      "action": "전체 현장 즉시 조치 사항 및 개선 대책",
      "standard": "관련 산업안전보건기준 또는 표준 안전 수칙"
    }
  ],
  "tbmBriefing": "당일 작업 전 TBM(Tool Box Meeting) 시 작업자들에게 전달할 1분 핵심 안전 구호 및 전달 사항",
  "recommendedNotes": "현장 점검내용(비고)에 바로 등록할 수 있는 표준 안전 점검 기록문 (예: [위험도: 주의] ① 단부 안전난간 결속 보강 요망, ② 작업 통로 내 자재 정리정돈 및 안전대 체결 철저)"
}
`;
      parts.push({ text: promptText });

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            systemInstruction: '당신은 한화 현장의 최고 안전관리 전문가입니다. 반드시 요청된 JSON 스키마로만 명확하고 신뢰성 있는 위험성 평가와 사진 상의 위험 구역 바운딩 박스를 한국어로 제공합니다.'
          }
        });
        responseText = response.text || '';
      } catch (geminiErr: any) {
        console.warn('Primary model error, attempting fallback:', geminiErr?.message);
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: { parts },
          config: {
            responseMimeType: 'application/json'
          }
        });
        responseText = response.text || '';
      }

      let parsedData;
      try {
        let clean = responseText.trim();
        if (clean.startsWith('```')) {
          clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        parsedData = JSON.parse(clean);

        // Normalize hazards and box coordinates
        if (Array.isArray(parsedData.identifiedHazards)) {
          parsedData.identifiedHazards = parsedData.identifiedHazards.map((h: any, i: number) => {
            const id = h.id || (i + 1);
            let box = h.box;
            if (!box || typeof box.ymin !== 'number') {
              // Default representative box if missing
              const defaultBoxes = [
                { ymin: 150, xmin: 250, ymax: 500, xmax: 750 },
                { ymin: 450, xmin: 150, ymax: 750, xmax: 600 },
                { ymin: 200, xmin: 600, ymax: 550, xmax: 900 }
              ];
              box = defaultBoxes[i % defaultBoxes.length];
            }
            return {
              id,
              hazard: h.hazard || `위험 요인 #${id}`,
              cause: h.cause || '현장 점검 및 안전 수칙 확인 요망',
              severity: h.severity === '상' || h.severity === '중' || h.severity === '하' ? h.severity : '중',
              locationDesc: h.locationDesc || `구역 #${id}`,
              box: {
                ymin: Math.max(0, Math.min(950, Number(box.ymin) || 0)),
                xmin: Math.max(0, Math.min(950, Number(box.xmin) || 0)),
                ymax: Math.max(50, Math.min(1000, Number(box.ymax) || 500)),
                xmax: Math.max(50, Math.min(1000, Number(box.xmax) || 500))
              },
              safetyMeasure: h.safetyMeasure || {
                action: '작업 전 보호구 착용 및 안전 통로 확보',
                standard: '산업안전보건기준에 관한 규칙'
              }
            };
          });
        }
      } catch (parseErr) {
        console.error('Failed to parse Gemini response as JSON:', responseText);
        parsedData = {
          riskLevel: '주의',
          riskScore: 5,
          summary: responseText.slice(0, 200),
          identifiedHazards: [
            {
              id: 1,
              hazard: '현장 안전 관리 요망 구역',
              cause: '작업자 안전대 체결 및 단부 방호 상태 점검 필요',
              severity: '중',
              locationDesc: '사진 중앙 작업 구역',
              box: { ymin: 250, xmin: 300, ymax: 650, xmax: 700 },
              safetyMeasure: { action: '작업 전 보호구 착용 및 안전 통로 확보 점검', standard: '산업안전보건기준' }
            }
          ],
          safetyMeasures: [
            { action: '작업 전 보호구 착용 및 안전 통로 확보 점검', standard: '산업안전보건기준' }
          ],
          tbmBriefing: '오늘도 안전제일! 개인 보호구를 철저히 착용합시다.',
          recommendedNotes: `[AI 위험성 점검] ① 현장 위험 구역 안전 조치 및 개인보호구 착용 철저`
        };
      }

      res.json({
        success: true,
        data: parsedData
      });
    } catch (err: any) {
      console.error('AI Risk Analysis Error:', err);
      res.status(500).json({
        success: false,
        message: err?.message || 'AI 위험성 분석 중 오류가 발생했습니다.'
      });
    }
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
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = http.createServer(app);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Safety Capture] Port ${PORT} temporarily in use, will retry...`);
    } else {
      console.error('[Safety Capture] Server error:', err);
    }
  });

  const startListening = (attempt = 1) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Safety Capture] Server running on http://0.0.0.0:${PORT}`);
    });

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE' && attempt <= 5) {
        console.warn(`[Safety Capture] Port ${PORT} in use, retrying in 1s (attempt ${attempt}/5)...`);
        setTimeout(() => {
          server.close();
          startListening(attempt + 1);
        }, 1000);
      } else {
        console.error('[Safety Capture] Fatal server listen error:', err);
        process.exit(1);
      }
    });
  };

  startListening();

  // Handle graceful exit on restart/termination
  const shutdown = () => {
    console.log('[Safety Capture] Shutting down server...');
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
