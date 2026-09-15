// Usage: node scripts/import-nearby-toilet-audit.cjs <directory containing *-official-toilets.json>
// Input: Seoul OA-22586 public sheet responses, downloaded separately. No code from the response is executed.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const directory = process.argv[2];
assert(directory, 'Provide the downloaded source directory');
function literal(node) {
  if (ts.isParenthesizedExpression(node)) return literal(node.expression);
  if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return ts.isStringLiteral(node) ? node.text : Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(property => {
    assert(ts.isPropertyAssignment(property), 'Only literal properties are allowed');
    return [property.name.text, literal(property.initializer)];
  }));
  throw new Error('Unexpected non-literal source value');
}
const center = { latitude: 37.5412366, longitude: 126.8407816 };
function distance(a, b) {
  const rad = Math.PI / 180;
  const v = Math.sin((b.latitude-a.latitude)*rad/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin((b.longitude-a.longitude)*rad/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));
}
const counts = {};
const rows = [];
for (const district of ['gangseo', 'yangcheon', 'mapo', 'guro']) {
  const raw = fs.readFileSync(path.join(directory, district+'-official-toilets.json'), 'utf8');
  const ast = ts.createSourceFile('source.ts', '('+raw+')', ts.ScriptTarget.Latest, true);
  assert.equal(ast.parseDiagnostics.length, 0, 'Invalid source syntax');
  const data = literal(ast.statements[0].expression);
  assert.equal(data.result, 'ok');
  assert.equal(data.list.length, data.page.totalCount, 'Incomplete district download');
  counts[district] = data.list.length;
  rows.push(...data.list);
}
const stableIds = {
  '서울화곡우체국 화장실': 'hwagok-post-office',
  '꿈돌이어린이공원 화장실': 'hwagok-kkumdori-park',
  '5호선 화곡역 화장실': 'hwagok-station-line-5',
  '5호선 까치산역 화장실': 'kkachisan-station-line-5',
  '화곡2동주민센터 화장실': 'hwagok-community-center-2',
  '화곡4동주민센터 화장실': 'hwagok-community-center-4',
  '봉제산 담소터 화장실': 'hwagok-bongjesan-damsoteo',
};
const excluded = [];
const toilets = [];
for (const r of rows) {
  const point = { latitude: Number(r.COORD_Y), longitude: Number(r.COORD_X) };
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || point.latitude < 37 || point.latitude > 38 || point.longitude < 126 || point.longitude > 128) {
    excluded.push({ id:r.OBJECTID, name:r.CONTS_NAME, reason:'Invalid coordinates' }); continue;
  }
  if (distance(center, point) > 5000) continue;
  if (/삭제|폐쇄|철거|폐지/.test(r.CONTS_NAME+' '+r.VALUE_09) || !(r.ADDR_NEW || r.ADDR_OLD) || !r.CONTS_NAME) {
    excluded.push({ id:r.OBJECTID, name:r.CONTS_NAME, reason:'Closed/deleted or missing name/address' }); continue;
  }
  const hours = r.VALUE_02.split('|').filter(Boolean).join(' · ') || '개방시간 미등록';
  toilets.push({
    id:stableIds[r.CONTS_NAME] || 'seoul-audit-'+r.OBJECTID,
    name:r.CONTS_NAME, address:r.ADDR_NEW || r.ADDR_OLD, ...point,
    distance:'', openAllDay:/24시간/.test(hours), accessible:/남자|여자/.test(r.VALUE_05),
    babyFacility:/기저귀교환대/.test(r.VALUE_06),
    hours:hours+' · 자료상 운영시간',
    phone:r.TEL_NO || undefined,
    locationDetail:'시설 등록 좌표 기준 · 정확한 출입구는 현장 안내 확인',
    sourceUrl:'https://data.seoul.go.kr/dataList/OA-22586/S/1/datasetView.do',
    sourceCheckedAt:'2026-09-15',
    note:'서울시 OA-22586 / OBJECTID '+r.OBJECTID+' / 관리: '+r.VALUE_09,
  });
}
assert.equal(new Set(toilets.map(t=>t.id)).size,toilets.length,'Duplicate IDs');
const output = 'src/data/auditedNearbyToilets.json';
fs.writeFileSync(output, JSON.stringify({ center, radiusMeters:5000, checkedAt:'2026-09-15', districtCounts:counts, excluded, toilets },null,2)+'\n');
console.log(JSON.stringify({ counts, included:toilets.length, excluded, selected:toilets.filter(t=>Object.values(stableIds).includes(t.id)) },null,2));
