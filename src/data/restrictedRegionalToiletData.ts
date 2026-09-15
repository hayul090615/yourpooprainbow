// OpenStreetMap non-capital toilets with an explicit customer/private access tag (retrieved 2026-08-31).
export type RestrictedRegionalToiletRow = [
  id: string,
  area: string,
  latitude: number,
  longitude: number,
  accessible: boolean,
  access: 'customers' | 'private' | 'permit',
];

export const restrictedRegionalToilets: RestrictedRegionalToiletRow[] = [
  ['way-546013119', '광주광역시', 35.1273626, 126.8840795, false, 'private'],
  ['way-554207051', '울산광역시', 35.4918347, 129.4202927, false, 'customers'],
  ['node-1804082826', '강원특별자치도', 38.1246615, 128.6295851, true, 'customers'],
  ['node-13416365198', '강원특별자치도', 37.7865826, 128.8850388, false, 'customers'],
  ['node-13843799450', '강원특별자치도', 38.2019155, 128.5893828, false, 'customers'],
  ['node-13971647661', '강원특별자치도', 38.4787484, 128.422157, false, 'customers'],
  ['node-13971767464', '강원특별자치도', 38.5866799, 128.3748806, false, 'customers'],
  ['node-9649667532', '전북특별자치도', 35.3929342, 127.1953554, false, 'customers'],
  ['node-11303728746', '전북특별자치도', 36.0335755, 127.1303547, false, 'customers'],
  ['way-234953548', '전라남도', 34.738135, 126.4070869, false, 'customers'],
  ['way-234953609', '전라남도', 34.741058, 126.4125649, false, 'customers'],
  ['node-3759585344', '경상북도', 35.8335233, 129.2264754, false, 'customers'],
  ['node-9835403157', '제주특별자치도', 33.3893924, 126.3770051, false, 'customers'],
  ['node-13813346537', '제주특별자치도', 33.4838233, 126.3781939, false, 'customers'],
  ['node-13816850705', '제주특별자치도', 33.2315468, 126.5059252, false, 'customers'],
  ['node-13817524167', '제주특별자치도', 33.2342815, 126.5135938, false, 'customers'],
];
