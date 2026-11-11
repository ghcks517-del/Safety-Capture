import { useState, useEffect } from 'react';

export interface DeviceLayout {
  isMobile: boolean; // 휴대폰 접속 (width < 768px)
  isTablet: boolean; // 갤럭시 탭 / 태블릿 접속 (768px <= width <= 1280px)
  isDesktop: boolean; // 대형 모니터 / PC 접속 (width > 1280px)
  isLandscape: boolean;
  aspectRatio: number;
}

export function useDeviceLayout(): DeviceLayout {
  const [layout, setLayout] = useState<DeviceLayout>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLandscape: true,
        aspectRatio: 16 / 10
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      isMobile: w < 768,
      isTablet: w >= 768 && w <= 1280,
      isDesktop: w > 1280,
      isLandscape: w > h,
      aspectRatio: w / (h || 1)
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setLayout({
        isMobile: w < 768,
        isTablet: w >= 768 && w <= 1280,
        isDesktop: w > 1280,
        isLandscape: w > h,
        aspectRatio: w / (h || 1)
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return layout;
}
