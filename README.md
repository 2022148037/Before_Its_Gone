# 사라지기 전에 (Before It's Gone)

거대 운석 충돌까지 다섯 시간. 과학자가 된 당신이 **사라지기 전에 이 세계의 살아있는 모든 것을 카메라로 기록**하는 3인칭 탐험 게임입니다. Three.js 기반 웹 게임 (Computer Graphics Term Project).

> 시간이 흐를수록 하늘이 붉게 타오르고 운석이 쏟아진다. 미처 찍지 못한 종은 영영 사라진다 — 당신의 기록만이 그들이 존재했음을 증명한다.

## 실행

로컬에서 가장 쉬운 방법은 **`start.bat` 더블클릭** (Node.js LTS 필요). 처음 한 번은 의존성을 설치한 뒤 개발 서버가 뜨고 브라우저가 자동으로 열립니다.

수동 실행:

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 정적 빌드 (dist/)
npm run preview  # 빌드 미리보기
```

## 조작

| 키 | 동작 |
|---|---|
| `W A S D` | 이동 |
| `Shift` | 달리기 |
| `Space` | 점프 |
| `Mouse` | 시점 (화면 클릭하여 잠금) |
| `C` | 카메라(촬영) 모드 |
| 좌클릭 | 촬영 |
| `Tab` | 도감 |
| `V` | 1·3인칭 전환 |
| `Esc` | 일시정지 |

## 주요 기능 / CG 기법

- 절차적 지형 — 커스텀 GLSL 셰이더로 잔디/흙/낙엽 블렌딩, 풀 InstancedMesh, 연못과 물고기
- 24종 동물 — 스켈레탈 애니메이션, 도주 AI, 나무·바위·연못 충돌
- 카메라 촬영 — 줌·뷰파인더·시야 차단 판정, 사진 도감(추모 도감)
- 종말 진행 — 하늘/안개/빛 보간, 운석 예고·낙하·영구 소멸, 화면 흔들림·섬광
- 미니맵, 3D 시네마틱 인트로, 결과 엔딩, 배경 음악

자세한 설계는 [GAME_DESIGN.md](GAME_DESIGN.md) 참고.

## 배포

`main`(또는 `master`)에 push하면 GitHub Actions가 자동으로 빌드·배포합니다. 저장소 **Settings → Pages → Build and deployment → Source = "GitHub Actions"** 로 한 번 설정하세요.

## 크레딧

- 음악: **Arthur Vyncke** — "A Few Jumps Away"
- 3D 에셋: **[Quaternius](https://quaternius.com)** — CC0 1.0 Universal
- 엔진: **Three.js** · 빌드: **Vite**
