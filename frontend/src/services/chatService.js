// 기본 설정(normalizeHistory 등)은 그대로 유지합니다.
const CHAT_ROLES = new Set(['user', 'assistant', 'system'])

const normalizeHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .filter(
      (item) =>
        CHAT_ROLES.has(item?.role) &&
        typeof item?.content === 'string' &&
        item.content.length > 0
    )
    .slice(-20)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }))

/**
 * @param {string} message - 사용자 입력 메시지
 * @param {Array} history - 이전 대화 기록
 * @param {Object} options - signal 등 옵션
 * @param {Function} onChunk - 💡 텍스트 조각이 도착할 때마다 실행될 콜백 함수 추가
 */
export async function sendChatMessage(message, history = [], options = {}, onChunk) {
  // 💡 스트리밍을 받을 때는 Axios보다 fetch API를 사용하는 것이 훨씬 제어하기 좋습니다.
  // api.defaults.baseURL 등을 썼다면, 백엔드의 풀 주소를 적어주거나 상대경로를 맞춰주세요.
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(baseUrl + '/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 필요하다면 Authorization 토큰 등 기존 api 인스턴스에 있던 헤더를 추가하세요.
    },
    body: JSON.stringify({
      message,
      history: normalizeHistory(history),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  // 💡 응답 바디의 스트림 리더기를 가져옵니다.
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';

  // 💡 스트림 데이터를 계속 읽어들이는 반복문
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break; // 응답이 완전히 끝나면 종료

    // 바이트 데이터를 텍스트로 변환
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // 💡 조각이 도착할 때마다 UI 컴포넌트로 전달! (화면에 즉시 반영됨)
    if (onChunk) {
      onChunk(chunk, fullText); 
    }
  }

  // 최종 완성된 전체 텍스트를 반환
  return fullText;
}