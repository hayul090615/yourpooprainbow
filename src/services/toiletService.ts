import type { Toilet } from '../types/toilet';
import { hwagokToilets } from '../data/hwagokToiletData';
import auditedNearbyToiletsData from '../data/auditedNearbyToilets.json';
import { compressedSeoulToiletCoordinates } from '../data/seoulToiletData';
import { compressedGyeonggiToilets } from '../data/gyeonggiToiletData';
import { compressedRegionalToilets } from '../data/regionalToiletData';
import { restrictedRegionalToilets } from '../data/restrictedRegionalToiletData';
import { eunpyeongToilets } from '../data/eunpyeongToiletData';
import { seoulDistrictToilets } from '../data/seoulDistrictToiletData';
import { incheonGoyangToilets } from '../data/incheonGoyangToiletData';
import { expandedRegionalToilets } from '../data/expandedRegionalToiletData';
const mockToilets: Toilet[] = [
  {id:'1',name:'시청역 공중화장실',address:'서울 중구 세종대로 110',distance:'120m',openAllDay:true,accessible:true,latitude:37.5663,longitude:126.9779},
  {id:'2',name:'서울광장 화장실',address:'서울 중구 을지로 12',distance:'350m',openAllDay:true,accessible:false,latitude:37.5658,longitude:126.9781},
  {id:'3',name:'덕수궁 돌담길 화장실',address:'서울 중구 세종대로 99',distance:'520m',openAllDay:false,accessible:true,latitude:37.5657,longitude:126.9753},
  {id:'4',name:'을지로입구역 화장실',address:'서울 중구 을지로 42',distance:'680m',openAllDay:true,accessible:true,latitude:37.5660,longitude:126.9822},
  {id:'5',name:'명동입구 공중화장실',address:'서울 중구 남대문로 84',distance:'790m',openAllDay:false,accessible:false,latitude:37.5638,longitude:126.9833},
  {id:'6',name:'청계광장 화장실',address:'서울 중구 태평로1가 1',distance:'860m',openAllDay:true,accessible:true,latitude:37.5691,longitude:126.9785},
  {id:'7',name:'서울도서관 화장실',address:'서울 중구 세종대로 110',distance:'920m',openAllDay:false,accessible:true,latitude:37.5665,longitude:126.9780},
  {id:'8',name:'남대문시장 화장실',address:'서울 중구 남대문시장4길 21',distance:'1.1km',openAllDay:false,accessible:false,latitude:37.5595,longitude:126.9770},
  {id:'9',name:'광화문광장 화장실',address:'서울 종로구 세종대로 175',distance:'1.2km',openAllDay:true,accessible:true,latitude:37.5718,longitude:126.9764},
  {id:'10',name:'종각역 화장실',address:'서울 종로구 종로 33',distance:'1.3km',openAllDay:true,accessible:true,latitude:37.5702,longitude:126.9830},
  {id:'11',name:'회현역 화장실',address:'서울 중구 퇴계로 54',distance:'1.4km',openAllDay:true,accessible:false,latitude:37.5588,longitude:126.9781},
  {id:'12',name:'한국은행 앞 화장실',address:'서울 중구 남대문로 39',distance:'1.5km',openAllDay:false,accessible:true,latitude:37.5628,longitude:126.9807},
  {id:'13',name:'인사동 문화화장실',address:'서울 종로구 인사동길 12',distance:'1.6km',openAllDay:false,accessible:false,latitude:37.5722,longitude:126.9856},
  {id:'14',name:'서소문공원 화장실',address:'서울 중구 칠패로 5',distance:'1.7km',openAllDay:true,accessible:true,latitude:37.5606,longitude:126.9721},
  {id:'15',name:'서울역 광장 화장실',address:'서울 용산구 한강대로 405',distance:'1.8km',openAllDay:true,accessible:true,latitude:37.5559,longitude:126.9707},
  {id:'16',name:'정동길 화장실',address:'서울 중구 정동길 21',distance:'1.9km',openAllDay:false,accessible:true,latitude:37.5651,longitude:126.9730},
  // 서울시 미래한강본부 시설정보에서 운영 중으로 확인한 여의도한강공원 화장실입니다.
  {id:'hangang-9236',name:'여의도 화장실01 (파크골프장, 3월 중순~12월 중순)',address:'서울 영등포구 여의도동 70-1',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5196513088,longitude:126.9419669877},
  {id:'hangang-9237',name:'여의도 화장실02 (파라다이스 앞)',address:'서울 영등포구 여의도동 86-7',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5216969,longitude:126.9415783},
  {id:'hangang-9238',name:'여의도 화장실03 (원효대교 하부)',address:'서울 영등포구 여의도동 86-5',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5233375204,longitude:126.9396874955},
  {id:'hangang-9239',name:'여의도 화장실04 (여성전용, 유람선 선착장1)',address:'서울 영등포구 여의도동 85',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5251384339,longitude:126.9375875298},
  {id:'hangang-9240',name:'여의도 화장실05 (유람선 선착장2)',address:'서울 영등포구 여의도동 85',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5249176496,longitude:126.9375141811},
  {id:'hangang-9241',name:'여의도 화장실06 (남성전용, 계절광장1)',address:'서울 영등포구 여의도동 85-6',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5276100325,longitude:126.9345365829},
  {id:'hangang-9242',name:'여의도 화장실07 (여성전용, 계절광장2)',address:'서울 영등포구 여의도동 84-4',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5274702548,longitude:126.9343160995},
  {id:'hangang-9243',name:'여의도 화장실09 (안내센터)',address:'서울 영등포구 여의도동 85-6',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5262353,longitude:126.9336574},
  {id:'hangang-9244',name:'여의도 화장실11 (매점2호 2)',address:'서울 영등포구 여의도동 8',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.52877,longitude:126.931569},
  {id:'hangang-9245',name:'여의도 화장실10 (매점2호 1)',address:'서울 영등포구 여의도동 84-4',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.528636,longitude:126.931637},
  {id:'hangang-9246',name:'여의도 화장실14 (물빛광장2)',address:'서울 영등포구 여의도동 84',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5305083816,longitude:126.9295391111},
  {id:'hangang-9247',name:'여의도 화장실13 (여성전용, 물빛광장1)',address:'서울 영등포구 여의도동 84-9',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5306481748,longitude:126.9297709081},
  {id:'hangang-9248',name:'여의도 화장실15 (3호매점 앞)',address:'서울 영등포구 여의도동 84-9',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5307188946,longitude:126.9275194361},
  {id:'hangang-9249',name:'여의도 화장실16 (수상무대 부근)',address:'서울 영등포구 여의도동 83-6',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5321146999,longitude:126.926313165},
  {id:'hangang-9250',name:'여의도 화장실17 (서강대교 하부)',address:'서울 영등포구 여의도동 83-6',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.533132955,longitude:126.9229773733},
  {id:'hangang-9251',name:'여의도 화장실18 (축구장, 3월 중순~12월 중순)',address:'서울 영등포구 여의도동 82-10',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5343237652,longitude:126.918484435},
  {id:'hangang-9252',name:'여의도 화장실19 (국회둔치주차장)',address:'서울 영등포구 여의도동 81-8',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5348375508,longitude:126.9155846075},
  {id:'hangang-9253',name:'여의도 화장실20 (샛강 파천주차장)',address:'서울 영등포구 여의도동 82-10',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.525617,longitude:126.913829},
  {id:'hangang-9254',name:'여의도 화장실21 (샛강 서울교 하부)',address:'서울 영등포구 여의도동 19-1',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5215348727,longitude:126.9164423565},
  {id:'hangang-9255',name:'여의도 화장실22 (샛강생태체험관)',address:'서울 영등포구 여의도동 19-1',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.518745,longitude:126.921951},
  {id:'hangang-9256',name:'여의도 화장실9-1 (여성전용, 멀티프라자1)',address:'서울 영등포구 여의도동 85-6',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5283752702,longitude:126.9334385296},
  {id:'hangang-9257',name:'여의도 화장실9-2 (멀티프라자2)',address:'서울 영등포구 여의도동 84-4',distance:'거리 계산 중',openAllDay:true,accessible:true,latitude:37.5282986213,longitude:126.9333254654},
  {id:'osm-1779015901',name:'구기화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6170594,longitude:126.9610795},
  {id:'osm-1954991019',name:'와룡공원입구 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5911262,longitude:126.9901537},
  {id:'osm-2593918208',name:'오목공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5275392,longitude:126.8734884},
  {id:'osm-3052967549',name:'숭례문광장 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.559309,longitude:126.9750143},
  {id:'osm-3521297596',name:'정릉 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6021518,longitude:127.0072204},
  {id:'osm-3612395394',name:'사직공원 화장실',address:'서울특별시 종로구 사직로 89',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5760167,longitude:126.968289},
  {id:'osm-4394633949',name:'간이화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6101418,longitude:127.0933903},
  {id:'osm-4450148448',name:'서대문독립공원 화장실',address:'서울특별시 서대문구 통일로 251',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5760886,longitude:126.9554349},
  {id:'osm-4640185222',name:'개포근린공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.4896485,longitude:127.0666901},
  {id:'osm-4774362839',name:'평화도봉공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6629861,longitude:127.0418776},
  {id:'osm-5415915663',name:'창경궁 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.57781,longitude:126.9940319},
  {id:'osm-5798480901',name:'삼청동공중화장실',address:'서울특별시 종로구 삼청로 117',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.585878,longitude:126.9816601},
  {id:'osm-5803943178',name:'창경궁 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5764943,longitude:126.9963435},
  {id:'osm-5803943187',name:'창경궁 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5810386,longitude:126.9960367},
  {id:'osm-5938858374',name:'장애인용 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:true,latitude:37.5495855,longitude:127.0814967},
  {id:'osm-5938859311',name:'장애인용 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:true,latitude:37.5488071,longitude:127.0806344},
  {id:'osm-6360419743',name:'살곶이진입부 개방화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5539744,longitude:127.0467362},
  {id:'osm-6804787589',name:'놀이터화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5431939,longitude:127.0399569},
  {id:'osm-12587331799',name:'대운동장 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:true,accessible:false,latitude:37.5629646,longitude:126.9341545},
  {id:'osm-12646695036',name:'백련공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5964038,longitude:126.9346895},
  {id:'osm-12816429041',name:'이수교 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.4990929,longitude:126.9843106},
  {id:'osm-13200526412',name:'백양누리 화장실 (지하 1층)',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:true,latitude:37.5627066,longitude:126.9370975},
  {id:'osm-13430302911',name:'공중화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:true,latitude:37.4852572,longitude:126.8484496},
  {id:'osm-13741905728',name:'현대백화점 지하 1층 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5569091,longitude:126.9365409},
  {id:'osm-13741905729',name:'신촌역 화장실 (지하)',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5552944,longitude:126.937588},
  {id:'osm-14074331186',name:'자마장공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5341734,longitude:127.0821605},
  {id:'osm-158623322',name:'화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5481137,longitude:127.0296176},
  {id:'osm-304260843',name:'남산공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:true,accessible:false,latitude:37.5514994,longitude:126.9904111},
  {id:'osm-402089999',name:'여의도공원 제1교육장 화장실',address:'서울특별시 영등포구 여의대로 14',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5232369,longitude:126.9188153},
  {id:'osm-482587779',name:'도봉구 공원 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6438507,longitude:127.0467455},
  {id:'osm-607879741',name:'서대문독립공원 화장실',address:'서울특별시 서대문구 통일로 251',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5751262,longitude:126.9556566},
  {id:'osm-608634449',name:'낙산공원 화장실',address:'서울특별시 종로구 낙산성곽서길 173',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5797222,longitude:127.0082325},
  {id:'osm-868466283',name:'쌍줄기화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.687903,longitude:127.0284449},
  {id:'osm-1184867630',name:'백운대탐방지원센터 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6581809,longitude:126.9913834},
  {id:'osm-1301743327',name:'역삼문화공원화장실',address:'서울특별시 강남구',distance:'거리 계산 중',openAllDay:false,accessible:true,latitude:37.5025,longitude:127.0304134},
  {id:'osm-1368217579',name:'만남의 광장 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.6372281,longitude:126.9191269},
  {id:'osm-1378562867',name:'이수교 인근 주차장 화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5039886,longitude:126.9774833},
  {id:'osm-1494834731',name:'수변화장실',address:'서울특별시',distance:'거리 계산 중',openAllDay:false,accessible:false,latitude:37.5445259,longitude:127.03763},
];
type CompressedSeoulToiletRow = [id: string, latitude: number, longitude: number];
type CompressedDetailedToiletRow = [
  id: string,
  name: string,
  city: string,
  latitude: number,
  longitude: number,
  openAllDay: boolean,
  accessible: boolean,
];

async function decompressRows<Row>(compressedData: string): Promise<Row[]> {
  if (typeof DecompressionStream === 'undefined') return [];

  try {
    const bytes = Uint8Array.from(atob(compressedData), (character) => character.charCodeAt(0));
    const compressedBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const decompressed = new Blob([compressedBuffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(decompressed).text()) as Row[];
  } catch {
    return [];
  }
}

const auditedNearbyToilets: Toilet[] = auditedNearbyToiletsData.toilets.map((toilet) => ({
  id: toilet.id,
  name: toilet.name,
  address: toilet.address,
  distance: toilet.distance,
  openAllDay: toilet.openAllDay,
  accessible: toilet.accessible,
  latitude: toilet.latitude,
  longitude: toilet.longitude,
  phone: toilet.phone,
  facilityType: 'public',
  locationDetail: toilet.locationDetail,
  hours: toilet.hours,
  babyFacility: toilet.babyFacility,
  note: toilet.note,
}));

function mergeToilets(...groups: Toilet[][]): Toilet[] {
  const merged: Toilet[] = [];
  groups.flat().forEach((toilet) => {
    const duplicate = merged.some((existing) => existing.name === toilet.name || (
      Math.abs(existing.latitude - toilet.latitude) < 0.00035 &&
      Math.abs(existing.longitude - toilet.longitude) < 0.00035
    ));
    if (!duplicate) merged.push(toilet);
  });
  return merged;
}

async function loadCompressedSeoulToilets(): Promise<Toilet[]> {
  const rows = await decompressRows<CompressedSeoulToiletRow>(compressedSeoulToiletCoordinates);
  return rows.map(([id, latitude, longitude], index) => ({
    id: `osm-${id}`,
    name: `서울 공중화장실 ${index + 1}`,
    address: '서울특별시',
    distance: '거리 계산 중',
    openAllDay: false,
    accessible: false,
    latitude,
    longitude,
  }));
}

async function loadCompressedGyeonggiToilets(): Promise<Toilet[]> {
  const rows = await decompressRows<CompressedDetailedToiletRow>(compressedGyeonggiToilets);
  return rows.map(([id, name, city, latitude, longitude, openAllDay, accessible], index) => ({
    id: `osm-gyeonggi-${id}`,
    name: name || `경기도 공중화장실 ${index + 1}`,
    address: city ? `경기도 ${city}` : '경기도',
    distance: '거리 계산 중',
    openAllDay,
    accessible,
    latitude,
    longitude,
  }));
}

async function loadCompressedRegionalToilets(): Promise<Toilet[]> {
  const rows = await decompressRows<CompressedDetailedToiletRow>(compressedRegionalToilets);
  return rows.map(([id, name, area, latitude, longitude, openAllDay, accessible], index) => ({
    id: `osm-regional-${id}`,
    name: name || `지역 공중화장실 ${index + 1}`,
    address: area && area !== '비수도권' ? area : '대한민국 비수도권',
    distance: '거리 계산 중',
    openAllDay,
    accessible,
    latitude,
    longitude,
  }));
}

function loadRestrictedRegionalToilets(): Toilet[] {
  return restrictedRegionalToilets.map(([id, area, latitude, longitude, accessible, access], index) => ({
    id: `osm-restricted-${id}`,
    name: access === 'private' ? `비밀번호 필요 화장실 ${index + 1}` : `고객 전용 화장실 ${index + 1}`,
    address: area,
    distance: '거리 계산 중',
    openAllDay: false,
    accessible,
    latitude,
    longitude,
    requiresAccessKey: true,
    requiresPassword: access === 'private',
    accessNote: access === 'private' ? '비공개 화장실: 비밀번호 필요' : '고객 전용: 직원 확인 등 출입 방법 확인 필요',
  }));
}

function loadEunpyeongToilets(): Toilet[] {
  return eunpyeongToilets.map(([id, name, address, latitude, longitude, openAllDay, accessible]) => ({
    id: `seoul-eunpyeong-${id}`,
    name,
    address,
    distance: '',
    openAllDay,
    accessible,
    latitude,
    longitude,
  }));
}

function loadSeoulDistrictToilets(): Toilet[] {
  return seoulDistrictToilets.map(([id, name, address, latitude, longitude]) => ({
    id,
    name,
    address,
    distance: '거리 계산 중',
    openAllDay: false,
    hours: '평일 구청 운영시간',
    accessible: false,
    latitude,
    longitude,
  }));
}

function loadIncheonGoyangToilets(): Toilet[] {
  return incheonGoyangToilets.map(([id, name, address, latitude, longitude]) => ({
    id,
    name,
    address,
    distance: '거리 계산 중',
    openAllDay: false,
    hours: '평일 청사 운영시간',
    accessible: false,
    latitude,
    longitude,
  }));
}

function loadExpandedRegionalToilets(): Toilet[] {
  return expandedRegionalToilets.map(([id, name, address, latitude, longitude]) => ({
    id,
    name,
    address,
    distance: '',
    openAllDay: false,
    hours: '현장 운영시간 확인',
    accessible: false,
    latitude,
    longitude,
  }));
}

export function getImmediateToilets(): Toilet[] {
  return [
    ...mergeToilets(mockToilets, hwagokToilets, auditedNearbyToilets),
    ...loadEunpyeongToilets(),
    ...loadSeoulDistrictToilets(),
    ...loadIncheonGoyangToilets(),
    ...loadExpandedRegionalToilets(),
    ...loadRestrictedRegionalToilets(),
  ];
}

// 추후 백엔드 API 호출로 교체할 수 있도록 데이터 접근을 별도 서비스로 분리합니다.
export async function getNearbyToilets(): Promise<Toilet[]> {
  const [seoulToilets, gyeonggiToilets, regionalToilets] = await Promise.all([
    loadCompressedSeoulToilets(),
    loadCompressedGyeonggiToilets(),
    loadCompressedRegionalToilets(),
  ]);
  return [
    ...getImmediateToilets(),
    // 담소터의 기존 익명 OSM 좌표는 위의 이름·주소가 있는 시설 정보로 표시합니다.
    ...seoulToilets.filter((toilet) => toilet.id !== 'osm-1141847937'),
    ...gyeonggiToilets,
    ...regionalToilets,
  ];
}
