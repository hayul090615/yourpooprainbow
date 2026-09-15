import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import type { Toilet } from '../types/toilet';
import keyMarkerUrl from '../assets/key-marker.svg';
import { TOILET_MARKER_IMAGE } from './toiletMarkerImage';

const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();
const ACCESS_KEY_MARKER_IMAGE = {
  src: keyMarkerUrl,
  size: { width: 40, height: 48 },
  options: {
    alt: 'Access key required toilet',
    offset: { x: 20, y: 48 },
  },
};

export default function ToiletLocationMap({ toilet }: { toilet: Toilet }) {
  if (!KAKAO_MAP_KEY) {
    return <MapFallback toilet={toilet} message="지도 설정을 확인해 주세요." />;
  }
  return <LoadedToiletLocationMap appKey={KAKAO_MAP_KEY} toilet={toilet} />;
}

function LoadedToiletLocationMap({ appKey, toilet }: { appKey: string; toilet: Toilet }) {
  const [loading, error] = useKakaoLoader({
    appkey: appKey,
    libraries: ['services'],
    url: 'https://dapi.kakao.com/v2/maps/sdk.js',
  });

  if (loading) {
    return <div className="service-location-map-status" role="status">지도를 불러오는 중...</div>;
  }
  if (error) {
    return <MapFallback toilet={toilet} message="지도를 불러오지 못했습니다." />;
  }

  const position = { lat: toilet.latitude, lng: toilet.longitude };
  return (
    <Map center={position} level={3} className="service-location-map">
      <MapMarker
        position={position}
        image={toilet.requiresAccessKey ? ACCESS_KEY_MARKER_IMAGE : TOILET_MARKER_IMAGE}
        title={`${toilet.requiresPassword ? '비밀번호 필요 · ' : toilet.requiresAccessKey ? '출입 확인 필요 · ' : ''}${toilet.name}`}
      />
    </Map>
  );
}

function MapFallback({ toilet, message }: { toilet: Toilet; message: string }) {
  return (
    <div className="service-location-map-status" role="status">
      <strong>{message}</strong>
      <span>아래 ‘지도에서 크게 보기’를 이용해 주세요.</span>
      <span>{toilet.latitude.toFixed(6)}, {toilet.longitude.toFixed(6)}</span>
    </div>
  );
}
