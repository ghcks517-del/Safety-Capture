import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function readJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

async function getImagePart(
  photoUrl?: string
): Promise<{ inlineData: { mimeType: string; data: string } } | null> {
  if (!photoUrl) return null;

  if (photoUrl.startsWith('data:')) {
    const commaIndex = photoUrl.indexOf(',');
    if (commaIndex !== -1) {
      const meta = photoUrl.slice(5, commaIndex);
      const mimeType = meta.split(';')[0] || 'image/jpeg';
      const rawBase64 = photoUrl.slice(commaIndex + 1).replace(/\s+/g, '');
      if (rawBase64.length > 0) {
        return {
          inlineData: {
            mimeType,
            data: rawBase64,
          },
        };
      }
    }
    return null;
  }

  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    try {
      let fetchUrl = photoUrl;
      if (fetchUrl.includes('images.unsplash.com')) {
        fetchUrl = fetchUrl.replace(/w=\d+/, 'w=600').replace(/q=\d+/, 'q=70');
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch image URL (${response.status}):`, photoUrl);
        return null;
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return {
        inlineData: {
          mimeType: contentType.split(';')[0],
          data: base64,
        },
      };
    } catch (e) {
      console.warn('Failed to fetch image from URL for AI analysis:', e);
      return null;
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: '허용되지 않은 요청 방식입니다. POST 요청만 지원합니다.',
    });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        success: false,
        message:
          'GEMINI_API_KEY가 서버 환경변수에 설정되지 않았습니다. 배포(Vercel Environment Variables 또는 AI Studio) 설정을 확인해주세요.',
      });
      return;
    }

    const body = await readJsonBody(req);
    const {
      photoUrl,
      projectName,
      partnerName,
      registrationDate,
      workType,
      location,
      description,
    } = body || {};

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];
    const imagePart = await getImagePart(photoUrl);
    if (imagePart) {
      parts.push(imagePart);
    }

    const promptText = `
당신은 한화 현장 안전보건 총괄책임자이자 KOSHA-MS(안전보건경영시스템) 심사관입니다.
현장 사진과 아래의 현장 점검 정보를 정밀 분석하여, 사진 상에서 실제로 위험한 위치(구역)를 식별하고 번호(1, 2, 3...)와 0~1000 범위의 2D 바운딩 박스(box: { ymin, xmin, ymax, xmax })로 정확히 지정하여 번호별 위험성 평가 보고서를 작성해주세요.

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
    const systemInstruction =
      '당신은 한화 현장의 최고 안전관리 전문가입니다. 반드시 요청된 JSON 스키마로만 명확하고 신뢰성 있는 위험성 평가와 사진 상의 위험 구역 바운딩 박스를 한국어로 신속하게 제공합니다.';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          systemInstruction,
        },
      });
      responseText = response.text || '';
    } catch (err1: any) {
      console.warn('Attempt 1 (gemini-3.1-flash-lite multimodal) failed:', err1?.message);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            systemInstruction,
          },
        });
        responseText = response.text || '';
      } catch (err2: any) {
        console.warn('Attempt 2 (gemini-flash-lite-latest multimodal) failed:', err2?.message);
        try {
          const textResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: { parts: [{ text: promptText }] },
            config: {
              responseMimeType: 'application/json',
              systemInstruction,
            },
          });
          responseText = textResponse.text || '';
        } catch (err3: any) {
          console.warn('Attempt 3 (text-only) failed, trying gemini-flash-lite-latest:', err3?.message);
          const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: { parts: [{ text: promptText }] },
            config: {
              responseMimeType: 'application/json',
            },
          });
          responseText = response.text || '';
        }
      }
    }

    let parsedData;
    try {
      let clean = responseText.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      parsedData = JSON.parse(clean);

      if (Array.isArray(parsedData.identifiedHazards) && parsedData.identifiedHazards.length > 0) {
        parsedData.identifiedHazards = parsedData.identifiedHazards.map((h: any, i: number) => {
          const id = h.id || i + 1;
          let box = h.box;
          if (!box || typeof box.ymin !== 'number') {
            const defaultBoxes = [
              { ymin: 150, xmin: 250, ymax: 500, xmax: 750 },
              { ymin: 450, xmin: 150, ymax: 750, xmax: 600 },
              { ymin: 200, xmin: 600, ymax: 550, xmax: 900 },
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
              xmax: Math.max(50, Math.min(1000, Number(box.xmax) || 500)),
            },
            safetyMeasure: h.safetyMeasure || {
              action: '작업 전 보호구 착용 및 안전 통로 확보',
              standard: '산업안전보건기준에 관한 규칙',
            },
          };
        });
      } else {
        parsedData.identifiedHazards = [
          {
            id: 1,
            hazard: `${workType || '작업'} 구역 안전 점검 요망`,
            cause: description || '현장 작업 상태 및 기본 안전 수칙(보호구, 통로 확보) 점검 필요',
            severity: parsedData.riskLevel === '위험' ? '상' : '중',
            locationDesc: location || '현장 작업 구역',
            box: { ymin: 200, xmin: 250, ymax: 600, xmax: 750 },
            safetyMeasure: {
              action: '작업 전 보호구 착용 확인 및 현장 안전통로 확보',
              standard: '산업안전보건기준에 관한 규칙',
            },
          },
        ];
      }
    } catch {
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
            safetyMeasure: {
              action: '작업 전 보호구 착용 및 안전 통로 확보 점검',
              standard: '산업안전보건기준',
            },
          },
        ],
        safetyMeasures: [
          {
            action: '작업 전 보호구 착용 및 안전 통로 확보 점검',
            standard: '산업안전보건기준',
          },
        ],
        tbmBriefing: '오늘도 안전제일! 개인 보호구를 철저히 착용합시다.',
        recommendedNotes: `[AI 위험성 점검] ① 현장 위험 구역 안전 조치 및 개인보호구 착용 철저`,
      };
    }

    res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('AI Risk Analysis Error:', err);
    res.status(500).json({
      success: false,
      message: err?.message || 'AI 위험성 분석 중 오류가 발생했습니다.',
    });
  }
}
