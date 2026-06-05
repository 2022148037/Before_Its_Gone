// 배경 음악(BGM) — 브라우저 자동재생 정책상 '첫 사용자 입력'에서 재생을 시작한다.
// 한 번 재생에 성공하면 리스너를 제거하고 루프 재생.
export function initBGM(src, { volume = 0.4 } = {}) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = volume;
  audio.preload = 'auto';

  const start = () => {
    audio.play().then(() => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    }).catch(() => { /* 아직 제스처 부족 — 다음 입력에서 재시도 */ });
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);

  return audio;
}
