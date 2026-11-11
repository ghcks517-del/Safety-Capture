import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, ExternalLink, QrCode as QrIcon } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (!isOpen) return;

    // Generate QR code for mobile connection
    QRCode.toDataURL(currentUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#EB6100] flex items-center justify-center font-bold">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">
                휴대폰 실시간 연결 QR코드
              </h3>
              <p className="text-[11px] text-stone-500">
                갤럭시 탭 &larr;&rarr; 스마트폰 무선 연동
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          
          <div className="p-3 bg-stone-50 rounded-2xl inline-block border border-stone-200 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="휴대폰 접속용 QR코드"
                className="w-52 h-52 mx-auto rounded-xl"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-stone-400">
                QR코드 생성 중...
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs text-stone-600">
            <p className="font-bold text-stone-800 flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#F37321]" />
              스마트폰 기본 카메라로 비추세요
            </p>
            <p className="text-stone-500 text-[11px]">
              별도 앱 설치 없이 링크를 열면 바로 현장 촬영 및 업로드가 가능하며,
              업로드한 사진은 이 갤럭시 탭 화면에 즉시 나타납니다.
            </p>
          </div>

          {/* Copy URL Box */}
          <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
            <span className="font-mono text-stone-500 text-[10px] truncate flex-1 px-2 select-all text-left">
              {currentUrl}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-semibold text-[11px] flex items-center gap-1 shadow-2xs shrink-0 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-stone-400" />
                  <span>주소 복사</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
