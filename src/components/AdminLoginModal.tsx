import React, { useState } from 'react';
import { Shield, ShieldAlert, KeyRound, X, CheckCircle, Info } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<{ success: boolean; message: string }>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await onLogin(password);
      if (result.success) {
        onClose();
        setPassword('');
      } else {
        setErrorMsg(result.message || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setErrorMsg('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setPassword('0000');
    setErrorMsg('');
    setIsLoading(true);
    try {
      const result = await onLogin('0000');
      if (result.success) {
        onClose();
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F37321] to-[#EB6100] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-xl font-black">
            관리자 모드 로그인
          </h3>
          <p className="text-xs text-orange-100 mt-1">
            사진 정보·점검내용 수정 및 삭제 권한을 활성화합니다. (비밀번호: 0000)
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#F37321]" />
              관리자 비밀번호
            </label>
            <input
              type="password"
              autoFocus
              placeholder="비밀번호 입력 (0000)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F37321]/40 font-mono tracking-widest text-center"
              maxLength={10}
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="bg-orange-50 border border-orange-200/60 rounded-xl p-3 text-xs text-stone-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#EB6100]">
              <Info className="w-3.5 h-3.5" />
              관리자 모드 기능 안내
            </div>
            <ul className="list-disc list-inside text-[11px] text-stone-600 space-y-0.5">
              <li>PJT명, 협력업체명, 등록일자 수정 권한</li>
              <li>현장 사진 단건 및 다건 일괄 삭제</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#F37321] hover:bg-[#EB6100] text-white font-black text-sm shadow-md shadow-[#F37321]/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? '확인 중...' : '관리자로 접속하기'}
            </button>

            {/* Quick Demo Login button for reviewer */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition cursor-pointer"
            >
              원클릭 관리자 로그인 (0000)
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
