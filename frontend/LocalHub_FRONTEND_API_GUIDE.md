# LocalHub 프론트엔드 API 연동 가이드

> 기준 백엔드: `https://backend-kd05.onrender.com`  
> Swagger: `https://backend-kd05.onrender.com/docs#/`  
> 프론트엔드: Vue 3 + Vite + TypeScript + Axios + Leaflet  
> 기준 브랜치: GitHub `develop`

---

## 1. 가장 먼저 알아야 할 핵심

현재 백엔드에는 **서로 다른 두 종류의 장소 데이터 경로**가 존재한다.

### A. 지도용 장소 데이터

```text
GET /api/map/pois
GET /api/map/pois/{poi_id}
GET /api/map/filters
```

- `data/locations.json` 파일을 직접 읽는다.
- 지도 핀, 지도 상세 패널, 지도 필터에 사용한다.
- 응답의 `id`는 원본 TourAPI의 `source_contentid`를 숫자로 변환한 값이다.
- 예: `2611482`

### B. 게시글 연결용 장소 데이터

```text
GET /api/locations/suggestions
```

- SQLite의 `locations` 테이블을 조회한다.
- 게시글 작성 시 보내는 `location_id`를 얻는 용도다.
- 응답의 `id`는 SQLite 내부 자동 증가 PK다.
- 원본 TourAPI ID는 `source_id`에 별도로 저장된다.

## 매우 중요한 ID 규칙

```text
지도 API의 poi.id
≠
게시글 작성 API의 location_id
```

따라서 지도에서 받은 `poi.id`를 그대로 게시글의 `location_id`로 보내면 안 된다.

### 프론트엔드 권장 규칙

```text
지도 화면:
MapPoi.id 사용

게시글 작성·수정:
LocationSuggestion.id 사용
```

TypeScript에서도 두 ID를 같은 의미로 취급하지 않는다.

```ts
type MapPoiId = number;
type DatabaseLocationId = number;
```

---

## 2. 환경변수

프로젝트 루트의 `.env`:

```env
VITE_API_BASE_URL=https://backend-kd05.onrender.com
```

로컬 개발용 `.env.development`를 따로 두어도 된다.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

환경변수를 변경한 뒤에는 Vite 개발 서버를 다시 실행한다.

```bash
npm run dev
```

`.gitignore`:

```gitignore
.env
.env.local
```

---

## 3. Axios 공통 설정

설치:

```bash
npm install axios
```

`src/api/client.ts`:

```ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    console.error("API 요청 실패", {
      status,
      detail,
      message: error.message,
    });

    return Promise.reject(error);
  },
);

export default apiClient;
```

Render 무료 인스턴스가 잠들었다가 깨어날 때 첫 요청이 오래 걸릴 수 있으므로 timeout은 30초 정도로 둔다.

---

# 4. 지도 API

## 4.1 지도 필터 목록

```http
GET /api/map/filters
```

### 요청 예시

```ts
import apiClient from "@/api/client";

const response = await apiClient.get("/api/map/filters");
console.log(response.data);
```

### 응답 형태

```json
{
  "place_types": [
    { "value": "all", "label": "전체" },
    { "value": "tourist", "label": "관광지" },
    { "value": "restaurant", "label": "맛집" }
  ],
  "regions": ["서울"],
  "categories": [
    "관광지",
    "레포츠",
    "문화시설",
    "쇼핑",
    "숙박",
    "여행코스",
    "축제공연행사"
  ]
}
```

### 사용 규칙

- 필터 UI를 하드코딩하지 않고 가능하면 이 API의 응답으로 구성한다.
- `place_type` 값은 반드시 아래 셋 중 하나만 보낸다.

```text
all
tourist
restaurant
```

- 현재 서울 데이터에는 음식점이 없을 수 있으므로 `restaurant` 결과가 0건일 수 있다.

---

## 4.2 지도 핀 목록

```http
GET /api/map/pois
```

### Query Parameter

| 이름 | 타입 | 기본값 | 사용 규칙 |
|---|---|---:|---|
| `place_type` | string | `all` | `all`, `tourist`, `restaurant`만 사용 |
| `category` | string | 없음 | 서버의 카테고리명과 완전히 동일해야 함 |
| `keyword` | string | 없음 | 장소명, 주소, 요약, 설명, 검색 태그에서 부분 일치 |
| `region` | string | 없음 | 현재는 보통 `서울` |
| `bbox` | string | 없음 | `minLng,minLat,maxLng,maxLat` 순서 |
| `page` | integer | `1` | 프론트에서 1 이상 보장 |
| `size` | integer | `20` | 프론트에서 1 이상 보장, 권장 20~100 |

### 필터 조합 규칙

여러 필터를 함께 보내면 **AND 조건**으로 동작한다.

```text
place_type=tourist
AND category=관광지
AND region=서울
AND keyword=한강
AND bbox 내부
```

### 요청 예시

```http
GET /api/map/pois?place_type=tourist&category=관광지&region=서울&page=1&size=50
```

Axios:

```ts
const response = await apiClient.get("/api/map/pois", {
  params: {
    place_type: "tourist",
    category: "관광지",
    region: "서울",
    page: 1,
    size: 50,
  },
});
```

### BBOX 규칙

서버가 요구하는 순서:

```text
서쪽 경도, 남쪽 위도, 동쪽 경도, 북쪽 위도
minLng,minLat,maxLng,maxLat
```

서울 예시:

```text
126.85,37.45,127.10,37.60
```

Leaflet 변환:

```ts
function boundsToBbox(bounds: L.LatLngBounds): string {
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();

  return `${west},${south},${east},${north}`;
}
```

잘못된 예:

```text
minLat,minLng,maxLat,maxLng
```

### 응답 형태

```json
{
  "items": [
    {
      "id": 2611482,
      "name": "150년 수령 느티나무",
      "category": "관광지",
      "address": "서울특별시 양천구 ...",
      "summary": "관광지에 속하는 서울 지역정보입니다.",
      "description": "장소 설명",
      "telephone": null,
      "homepage": null,
      "latitude": 37.5376778592,
      "longitude": 126.8687762819,
      "region": "서울",
      "place_type": "tourist",
      "firstimage2": "http://..."
    }
  ],
  "total": 6518,
  "page": 1,
  "size": 20,
  "total_pages": 326
}
```

### 좌표 처리 규칙

응답 스키마상 좌표가 `null`일 수 있다.

마커를 만들기 전에 반드시 검사한다.

```ts
function hasCoordinates(
  poi: MapPoi,
): poi is MapPoi & { latitude: number; longitude: number } {
  return (
    typeof poi.latitude === "number" &&
    Number.isFinite(poi.latitude) &&
    typeof poi.longitude === "number" &&
    Number.isFinite(poi.longitude)
  );
}
```

```ts
const markerPois = response.items.filter(hasCoordinates);
```

### 이미지 처리 규칙

원본 이미지 URL이 `http://`로 올 수 있다. HTTPS 프론트에서는 브라우저가 Mixed Content로 차단할 수 있다.

```ts
export function normalizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}
```

이미지 로딩 실패 시 기본 이미지를 표시한다.

```vue
<img
  :src="normalizeImageUrl(poi.firstimage2) ?? '/images/place-fallback.png'"
  @error="($event.target as HTMLImageElement).src = '/images/place-fallback.png'"
/>
```

---

## 4.3 지도 핀 상세

```http
GET /api/map/pois/{poi_id}
```

여기서 `poi_id`는 지도 목록 응답의 `item.id`다.

```ts
const poi = await apiClient.get(`/api/map/pois/${poiId}`);
```

### 성공 응답 주요 필드

```ts
export interface MapPoiDetail extends MapPoi {
  source: string | null;
  source_region: string | null;
  source_contentid: string | null;
  source_contenttypeid: string | null;
  source_contenttype: string | null;
  firstimage: string | null;
  zipcode: string | null;
  createdtime: string | null;
  modifiedtime: string | null;
  mlevel: string | null;
  homepage: string | null;
  telephone: string | null;
}
```

### 404 응답

```json
{
  "detail": {
    "code": "LOCATION_NOT_FOUND",
    "message": "지역정보를 찾을 수 없습니다."
  }
}
```

에러 메시지는 다음처럼 읽는다.

```ts
const message =
  error.response?.data?.detail?.message ??
  "장소 정보를 불러오지 못했습니다.";
```

---

## 4.4 지도 API TypeScript 타입

`src/types/map.ts`:

```ts
export type PlaceType = "all" | "tourist" | "restaurant";

export interface MapPoi {
  id: number;
  name: string;
  category: string;
  address: string | null;
  summary: string | null;
  description: string | null;
  telephone: string | null;
  homepage: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  place_type: PlaceType;
  firstimage2: string | null;
}

export interface MapPoiListResponse {
  items: MapPoi[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface MapPoiDetail extends MapPoi {
  source: string | null;
  source_region: string | null;
  source_contentid: string | null;
  source_contenttypeid: string | null;
  source_contenttype: string | null;
  firstimage: string | null;
  zipcode: string | null;
  createdtime: string | null;
  modifiedtime: string | null;
  mlevel: string | null;
  cpyrhtDivCd: string | null;
  areacode: string | null;
  sigungucode: string | null;
  lDongRegnCd: string | null;
  lDongSignguCd: string | null;
  cat1: string | null;
  cat2: string | null;
  cat3: string | null;
  lclsSystm1: string | null;
  lclsSystm2: string | null;
  lclsSystm3: string | null;
}

export interface MapFilterOption {
  value: PlaceType;
  label: string;
}

export interface MapFiltersResponse {
  place_types: MapFilterOption[];
  regions: string[];
  categories: string[];
}
```

---

## 4.5 지도 API 모듈

`src/api/map.ts`:

```ts
import apiClient from "./client";

import type {
  MapFiltersResponse,
  MapPoiDetail,
  MapPoiListResponse,
  PlaceType,
} from "@/types/map";

export interface GetMapPoisParams {
  place_type?: PlaceType;
  category?: string;
  keyword?: string;
  region?: string;
  bbox?: string;
  page?: number;
  size?: number;
}

export async function getMapFilters(): Promise<MapFiltersResponse> {
  const response =
    await apiClient.get<MapFiltersResponse>("/api/map/filters");

  return response.data;
}

export async function getMapPois(
  params: GetMapPoisParams,
  signal?: AbortSignal,
): Promise<MapPoiListResponse> {
  const response = await apiClient.get<MapPoiListResponse>(
    "/api/map/pois",
    {
      params,
      signal,
    },
  );

  return response.data;
}

export async function getMapPoi(
  poiId: number,
): Promise<MapPoiDetail> {
  const response = await apiClient.get<MapPoiDetail>(
    `/api/map/pois/${poiId}`,
  );

  return response.data;
}
```

---

# 5. Leaflet 연동 예시

설치:

```bash
npm install leaflet
npm install -D @types/leaflet
```

`src/main.ts` 또는 지도 컴포넌트에서 CSS import:

```ts
import "leaflet/dist/leaflet.css";
```

## 요청 타이밍 규칙

지도 이동 중인 `move` 이벤트마다 API를 호출하지 않는다.

```text
권장:
moveend
zoomend

비권장:
move
zoom
```

이벤트 발생 후 250~400ms debounce를 적용한다.

이전 요청이 끝나기 전에 새 요청이 시작되면 AbortController로 취소한다.

## Vue 컴포넌트 예시

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { getMapPois } from "@/api/map";
import type { MapPoi } from "@/types/map";

const mapElement = ref<HTMLElement | null>(null);

let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;
let controller: AbortController | null = null;
let debounceTimer: number | null = null;

function hasCoordinates(
  poi: MapPoi,
): poi is MapPoi & { latitude: number; longitude: number } {
  return (
    typeof poi.latitude === "number" &&
    Number.isFinite(poi.latitude) &&
    typeof poi.longitude === "number" &&
    Number.isFinite(poi.longitude)
  );
}

async function loadVisiblePois() {
  if (!map || !markerLayer) return;

  controller?.abort();
  controller = new AbortController();

  const bounds = map.getBounds();
  const bbox = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ].join(",");

  try {
    const data = await getMapPois(
      {
        place_type: "tourist",
        region: "서울",
        bbox,
        page: 1,
        size: 100,
      },
      controller.signal,
    );

    markerLayer.clearLayers();

    for (const poi of data.items.filter(hasCoordinates)) {
      const marker = L.marker([poi.latitude, poi.longitude]);

      marker.bindPopup(`
        <strong>${poi.name}</strong><br />
        ${poi.address ?? "주소 정보 없음"}
      `);

      marker.addTo(markerLayer);
    }
  } catch (error: any) {
    if (error.code !== "ERR_CANCELED") {
      console.error("지도 데이터 조회 실패", error);
    }
  }
}

function scheduleLoad() {
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(loadVisiblePois, 300);
}

onMounted(() => {
  if (!mapElement.value) return;

  map = L.map(mapElement.value).setView(
    [37.5665, 126.9780],
    12,
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors",
    },
  ).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  map.on("moveend", scheduleLoad);
  map.on("zoomend", scheduleLoad);

  loadVisiblePois();
});

onBeforeUnmount(() => {
  controller?.abort();

  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }

  map?.off();
  map?.remove();

  map = null;
  markerLayer = null;
});
</script>

<template>
  <div
    ref="mapElement"
    class="map"
  />
</template>

<style scoped>
.map {
  width: 100%;
  min-height: 560px;
}
</style>
```

---

# 6. 장소 자동완성과 게시글 연결

## 6.1 장소 자동완성

```http
GET /api/locations/suggestions?keyword=ㄱㅂㄱ&limit=10
```

### 응답 형태

```json
{
  "items": [
    {
      "id": 37,
      "source_id": "126508",
      "name": "경복궁",
      "category": "관광지",
      "address": "서울특별시 종로구 ...",
      "latitude": 37.57,
      "longitude": 126.97,
      "image_url": "https://...",
      "thumbnail_url": "https://..."
    }
  ]
}
```

### 사용 목적

- 게시글 작성·수정 페이지의 장소 검색창
- 선택 장소를 기본 태그처럼 표시
- 선택된 `item.id`를 게시글 `location_id`로 전송

```ts
selectedLocationId.value = suggestion.id;
```

### 초성 검색

```text
입력: ㄱㅂㄱ
결과: 경복궁
```

검색 규칙:

- 장소명 부분 일치
- 저장된 한글 초성 prefix 일치
- 최대 `limit=20`

## 현재 라우팅 충돌 주의

현재 백엔드는 아래 경로를 동시에 등록한다.

```text
GET /api/locations/{location_id}
GET /api/locations/suggestions
```

그리고 동적 경로가 먼저 등록되어 있다. 배포 버전에 따라 `/suggestions` 요청이 정수형 `location_id` 검증으로 들어가 `422`가 발생할 가능성이 있다.

### 프론트엔드 대응

1. Swagger에서 `/api/locations/suggestions`가 실제 200인지 먼저 테스트한다.
2. 422가 발생하면 프론트 문제로 처리하지 말고 백엔드에 라우터 순서 수정을 요청한다.
3. 백엔드는 정적 경로를 동적 경로보다 먼저 등록해야 한다.

권장 백엔드 순서:

```python
@router.get("/suggestions")
def suggestions():
    ...

@router.get("/{location_id}")
def detail(location_id: int):
    ...
```

---

# 7. 게시글 API

## 7.1 게시글 목록

```http
GET /api/posts
```

Query Parameter:

| 이름 | 타입 | 기본값 | 설명 |
|---|---|---:|---|
| `category` | string | 없음 | 정확한 카테고리 필터 |
| `keyword` | string | 없음 | 제목·본문 부분 검색 |
| `location_id` | integer | 없음 | SQLite 내부 장소 ID |
| `page` | integer | 1 | 1 이상 |
| `size` | integer | 10 | 1~100 |

```ts
const posts = await apiClient.get("/api/posts", {
  params: {
    category: "관광지",
    keyword: "한강",
    page: 1,
    size: 10,
  },
});
```

---

## 7.2 게시글 작성

```http
POST /api/posts
```

```json
{
  "title": "경복궁 방문 후기",
  "content": "주말에 다녀왔습니다.",
  "password": "1234",
  "category": "관광지",
  "location_id": 37,
  "custom_tags": ["데이트", "산책"],
  "image_url": null
}
```

### 검증 규칙

- `title`: 1~200자
- `content`: 1자 이상
- `password`: 4~20자
- `category`: 지정된 7개 값만 허용
- `custom_tags`: 최대 5개
- 태그 하나: 최대 20자
- 태그 앞의 `#`는 서버가 제거
- 빈 태그는 제거
- 중복 태그는 제거
- `image_url`: URL 형식 또는 `null`
- `location_id`: SQLite `locations.id` 또는 `null`

### 유효한 카테고리

```ts
export const POST_CATEGORIES = [
  "관광지",
  "레포츠",
  "문화시설",
  "쇼핑",
  "숙박",
  "여행코스",
  "축제공연행사",
] as const;
```

---

## 7.3 게시글 상세

```http
GET /api/posts/{post_id}
```

### 주의

이 API를 호출할 때마다 `view_count`가 1 증가한다.

따라서 다음 동작을 피한다.

- 상세 화면 진입 전 prefetch
- 동일 컴포넌트에서 중복 `onMounted`
- watch와 onMounted에서 동시에 호출
- 자동 재시도 여러 번
- 목록 hover 시 상세 호출

상세 화면에서 실제로 한 번만 호출한다.

---

## 7.4 게시글 수정

```http
PUT /api/posts/{post_id}
```

작성과 동일한 전체 필드를 보낸다.

```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "password": "1234",
  "category": "관광지",
  "location_id": 37,
  "custom_tags": ["야간관람"],
  "image_url": null
}
```

비밀번호가 다르면 `403`이다.

---

## 7.5 게시글 삭제

```http
DELETE /api/posts/{post_id}
```

DELETE 요청의 비밀번호는 Query가 아니라 **JSON Body**다.

Axios에서는 `data` 안에 넣는다.

```ts
await apiClient.delete(`/api/posts/${postId}`, {
  data: {
    password,
  },
});
```

잘못된 예:

```ts
await apiClient.delete(`/api/posts/${postId}`, {
  params: { password },
});
```

---

# 8. 대시보드 API

```http
GET /api/dashboard
```

현재 코드에는 동일 경로의 대시보드 API가 두 개 등록되어 있다.

- JSON 파일 기반 지역정보 통계
- SQLite 기반 게시글·장소 통계

FastAPI는 등록 순서의 영향을 받기 때문에, Swagger에 보이는 응답 스키마와 실제 응답 구조가 다르게 느껴질 수 있다.

### 프론트엔드 규칙

API를 호출한 뒤 응답 형태를 확인하고 타입을 확정한다.

현재 가능한 응답 형태 A:

```json
{
  "region": "서울",
  "total_locations": 6518,
  "category_counts": [
    { "category": "관광지", "count": 783 }
  ]
}
```

현재 가능한 응답 형태 B:

```json
{
  "region": "서울",
  "summary": {
    "total_posts": 10,
    "total_locations": 8150
  },
  "post_category_counts": [],
  "location_category_counts": [],
  "popular_posts": [],
  "popular_locations": []
}
```

### 권장 조치

FE 구현 전에 백엔드 팀과 `/api/dashboard` 응답을 하나로 통일한다.

급한 MVP에서는 런타임 응답을 기준으로 방어적으로 처리한다.

```ts
const totalLocations =
  data.summary?.total_locations ??
  data.total_locations ??
  0;
```

---

# 9. 공통 에러 처리

## 404

```json
{
  "detail": {
    "code": "LOCATION_NOT_FOUND",
    "message": "지역정보를 찾을 수 없습니다."
  }
}
```

## 403

```json
{
  "detail": {
    "code": "INVALID_PASSWORD",
    "message": "비밀번호가 일치하지 않습니다."
  }
}
```

## 422

Pydantic 요청 검증 실패다.

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "password"],
      "msg": "String should have at least 4 characters"
    }
  ]
}
```

공통 메시지 함수:

```ts
import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "요청 처리 중 오류가 발생했습니다.",
): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (detail && !Array.isArray(detail)) {
    return detail.message ?? fallback;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg ?? fallback;
  }

  return fallback;
}
```

---

# 10. CORS 규칙

현재 백엔드 CORS 허용 주소:

```text
http://localhost:5173
http://127.0.0.1:5173
```

따라서 로컬 Vue 개발 서버는 접근할 수 있다.

Netlify나 Vercel에 FE를 배포하면 백엔드 `allow_origins`에 실제 FE 주소를 추가해야 한다.

예:

```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhub-seoul.netlify.app",
]
```

CORS 에러가 발생하면 브라우저 콘솔에만 집중하지 말고 백엔드 허용 도메인을 확인한다.

---

# 11. API 호출 성능 규칙

## 지도

- `moveend`, `zoomend`에서만 요청
- 250~400ms debounce
- 이전 요청 AbortController로 취소
- 화면 범위는 `bbox`로 전달
- 한 번에 `size=100` 이하 권장
- 좌표 없는 항목은 마커에서 제외
- 마커는 매 요청마다 전체 초기화하거나 ID 기준 diff 처리

## 검색

- 사용자가 글자를 입력할 때마다 즉시 호출하지 않는다.
- 250~400ms debounce
- 빈 문자열이면 요청하지 않는다.
- 이전 요청 취소
- 검색 결과가 없으면 빈 목록으로 표시

## 게시글

- 상세 API는 조회수를 올리므로 한 번만 호출
- 작성·수정 버튼 연속 클릭 방지
- 요청 중 버튼 disabled
- 삭제 확인 모달에서 비밀번호를 받은 뒤 한 번만 전송

---

# 12. 현재 백엔드 구조상 확인된 주의점

## 12.1 Map API 구현 파일

`app/routers/map.py`는 현재 비어 있다.

실제 Map API는 다음 파일에 구현되어 있다.

```text
app/routers/items.py
```

`main.py`에서 `items_router`를 등록하므로 Swagger에 Map API가 노출된다.

## 12.2 장소 데이터가 두 군데에 존재

```text
지도:
data/locations.json

게시글 장소 연결:
SQLite locations 테이블
```

두 데이터의 ID 체계가 다르므로 혼용하지 않는다.

## 12.3 중복 경로

현재 아래 경로가 여러 라우터에서 중복 등록되어 있다.

```text
GET /api/locations/{location_id}
GET /api/dashboard
```

FE는 Swagger 표시만 믿지 말고 실제 네트워크 응답을 한 번 확인한다.

## 12.4 초성 추천 경로 충돌 가능성

```text
/api/locations/suggestions
```

가 동적 상세 경로에 먼저 잡힐 가능성이 있으므로 Swagger에서 200 응답 여부를 확인한다.

---

# 13. 프론트엔드 작업 순서

## 1단계: 연결 확인

```ts
await apiClient.get("/api/health");
```

## 2단계: 지도 필터

```ts
await getMapFilters();
```

## 3단계: 서울 전체 핀

```ts
await getMapPois({
  place_type: "all",
  region: "서울",
  page: 1,
  size: 100,
});
```

## 4단계: Leaflet BBOX 연결

```ts
await getMapPois({
  place_type: "tourist",
  region: "서울",
  bbox,
  page: 1,
  size: 100,
});
```

## 5단계: 핀 클릭 상세

```ts
await getMapPoi(poi.id);
```

## 6단계: 게시글 목록과 CRUD

```text
GET    /api/posts
POST   /api/posts
GET    /api/posts/{id}
PUT    /api/posts/{id}
DELETE /api/posts/{id}
```

## 7단계: 게시글 장소 태그

```text
GET /api/locations/suggestions
→ 내부 Location.id 선택
→ POST /api/posts의 location_id
```

## 8단계: 대시보드

실제 응답 구조를 확인한 뒤 차트 타입을 확정한다.

---

# 14. FE 팀 전달용 요약

```text
Base URL
https://backend-kd05.onrender.com

Swagger
https://backend-kd05.onrender.com/docs#/

지도
GET /api/map/filters
GET /api/map/pois
GET /api/map/pois/{poi_id}

게시판
GET    /api/posts
POST   /api/posts
GET    /api/posts/{post_id}
PUT    /api/posts/{post_id}
DELETE /api/posts/{post_id}

장소 자동완성
GET /api/locations/suggestions?keyword=ㄱㅂㄱ&limit=10

대시보드
GET /api/dashboard

중요
- 지도 poi.id와 게시글 location_id는 서로 다른 ID 체계
- DELETE 비밀번호는 JSON Body
- 게시글 상세 GET은 조회수를 증가시킴
- 지도 bbox 순서는 minLng,minLat,maxLng,maxLat
- 지도 마커는 latitude/longitude null 검사
- 배포 FE 주소는 백엔드 CORS에 추가 필요
```

---

# 15. 참고 소스

- Swagger: `https://backend-kd05.onrender.com/docs#/`
- GitHub 저장소: `https://github.com/class12LocalHub/backend/tree/develop`
- Map 및 지역정보 라우터: `app/routers/items.py`
- 지도 필터·검색 로직: `app/crud.py`
- 지도 응답 스키마: `app/schemas/location.py`
- 게시글 라우터: `app/routers/posts.py`
- 게시글 스키마: `app/schemas/post.py`
- SQLite Location 모델: `app/models/location.py`
- 앱 라우터 등록 및 CORS: `app/main.py`
