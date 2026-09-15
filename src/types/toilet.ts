export type Toilet = {
  id: string;
  name: string;
  address: string;
  distance: string;
  openAllDay: boolean;
  accessible: boolean;
  latitude: number;
  longitude: number;
  phone?: string;
  facilityType?: 'public' | 'building' | 'station' | 'park' | 'other';
  locationDetail?: string;
  hours?: string;
  genderType?: 'separated' | 'unisex' | 'unknown';
  babyFacility?: boolean;
  requiresAccessKey?: boolean;
  requiresPassword?: boolean;
  accessNote?: string;
  verifiedAt?: string;
  note?: string;
  status?: 'pending' | 'approved';
  /** 사용자가 직접 추가한 개인 전용 화장실 데이터 */
  isUserAdded?: boolean;
};
