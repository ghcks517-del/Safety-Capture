import { PhotoItem } from '../types/photo';

export const INITIAL_PHOTOS: PhotoItem[] = [
  {
    id: 'hanwha-p1',
    url: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1600&q=80',
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
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
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

export const PRESET_PROJECTS = [
  '한화솔루션 신안 태양광 발전소 PJT',
  '한화건설 포레나 주거복합 현장',
  '한화에어로스페이스 창원 엔진조립동 PJT',
  '한화오션 거제 스마트야드 도크 건조 PJT',
  '한화토탈에너지스 대산 플랜트 증설 PJT',
  '한화시스템 판교 R&D 센터 리모델링 PJT'
];

export const PRESET_PARTNERS = [
  '동아건설산업',
  '삼우토건',
  '세종중공업',
  '한성전기설비',
  '대림인프라',
  '우진플랜트기술',
  '신안개발공영'
];

export const PRESET_WORK_TYPES = [
  '전체 공종',
  '골조공사',
  '태양광 모듈 설치',
  '설비/배관',
  '전기통신',
  '안전시설',
  '토목기초',
  '마감/도장',
  '품질검측'
];
