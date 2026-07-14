export async function getDashboardData() {
  // TODO: 백엔드 연결 후 GET /api/dashboard 호출
  return {
    region: '서울',
    total_locations: 6518,
    category_counts: [
      { category: '관광지', count: 1725 },
      { category: '레포츠', count: 1168 },
      { category: '문화시설', count: 1012 },
      { category: '쇼핑', count: 864 },
      { category: '숙박', count: 702 },
      { category: '여행코스', count: 589 },
      { category: '축제/공연행사', count: 458 },
    ],
  }
}
