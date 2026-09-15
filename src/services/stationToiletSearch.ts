// 카카오 지하철역(SW8)을 먼저 조회하고 역 이름으로 등록된 화장실을 검색합니다.
// 역의 중심 좌표를 화장실 위치로 대체하지 않습니다.
export async function searchStationToilets(
  bounds: kakao.maps.LatLngBounds,
  publish: (places: kakao.maps.services.PlacesSearchResult) => void,
  isCurrent: () => boolean,
): Promise<void> {
  const places = new kakao.maps.services.Places();
  type Result = { rows: kakao.maps.services.PlacesSearchResult; hasNext: boolean };
  const request = (stationName?: string, page = 1) => new Promise<Result>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('지하철 화장실 검색 시간 초과')), 5000);
    const callback = (rows: kakao.maps.services.PlacesSearchResult, status: kakao.maps.services.Status, pagination: kakao.maps.Pagination) => {
      window.clearTimeout(timer);
      if (status === kakao.maps.services.Status.ZERO_RESULT) resolve({ rows: [], hasNext: false });
      else if (status === kakao.maps.services.Status.OK) resolve({ rows, hasNext: pagination.hasNextPage });
      else reject(new Error('지하철 화장실 검색 실패'));
    };
    const options = { bounds, size: 15, page };
    if (stationName) places.keywordSearch(`${stationName} 화장실`, callback, options);
    else places.categorySearch('SW8', callback, options);
  });

  const stations = new Set<string>();
  for (let page = 1; page <= 1 && isCurrent(); page += 1) {
    const result = await request(undefined, page);
    if (!isCurrent()) return;
    result.rows.forEach((station) => {
      const name = station.place_name.match(/^.*?역(?=\s|\(|$)/)?.[0];
      if (name) stations.add(name);
    });
    if (!result.hasNext) break;
  }
  const names = [...stations];
  let failed = false;
  for (let index = 0; index < names.length && isCurrent(); index += 4) {
    const results = await Promise.allSettled(names.slice(index, index + 4).map(async (name) => {
      for (let page = 1; page <= 1 && isCurrent(); page += 1) {
        const result = await request(name, page);
        if (!isCurrent()) return;
        publish(result.rows.filter((place) => /화장실/.test(`${place.place_name} ${place.category_name}`)));
        if (!result.hasNext) break;
      }
    }));
    if (results.some((result) => result.status === 'rejected')) failed = true;
  }
  if (failed) throw new Error('일부 지하철 화장실 검색을 완료하지 못했습니다.');
}
