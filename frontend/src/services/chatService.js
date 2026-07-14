export async function sendChatMessage(message, conversation = []) {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const normalized = String(message || '').toLowerCase()

  let answer = '현재는 챗봇 API 연결 전입니다. 서울 지역 정보에 대해 질문해주세요.'

  if (normalized.includes('피크닉')) {
    answer = '서울숲과 한강공원은 피크닉 장소로 추천합니다. 서울숲은 도심 속 숲길과 잔디밭이 있고, 한강공원은 강변 전망과 자전거도로가 매력적입니다.'
  } else if (normalized.includes('문화시설') || normalized.includes('박물관')) {
    answer = '서울역사박물관은 서울의 역사와 문화를 알기 쉽게 소개하는 대표적인 문화시설입니다. 가족 단위 방문객도 편하게 관람할 수 있습니다.'
  } else if (normalized.includes('숙박') || normalized.includes('호텔')) {
    answer = '서울 숙박은 위치와 예산을 고려해서 선택하는 것이 좋습니다. 주요 관광지와 접근이 쉬운 호텔이나 게스트하우스를 중심으로 검색해보세요.'
  }

  return {
    answer,
  }
}
