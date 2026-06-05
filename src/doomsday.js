import * as THREE from 'three';

// 종말 진행 시스템 — 낮↔밤 순환 대신 한 방향 카운트다운.
// 시간이 흐를수록 하늘/안개/빛이 평범한 낮 → 주황 → 핏빛 → 암흑으로 물들며
// 거대 운석 충돌(D-0, doomFactor=1)로 치닫는다.
// flashlight 호환을 위해 dayFactor(밝기 1→0)도 노출.

// 색 보간 스톱: { t: 진행도, c: 색 }
const SKY_STOPS = [
  { t: 0.00, c: 0x87b9d4 }, // 평범한 낮
  { t: 0.40, c: 0xc8b189 }, // 뿌연 황혼빛
  { t: 0.65, c: 0xcf7330 }, // 주황
  { t: 0.85, c: 0x9c2f17 }, // 핏빛
  { t: 1.00, c: 0x270605 }, // 암흑 진홍
];
const FOG_STOPS = [
  { t: 0.00, c: 0x87b9d4 },
  { t: 0.40, c: 0xab906a },
  { t: 0.65, c: 0xb05a28 },
  { t: 0.85, c: 0x73210f },
  { t: 1.00, c: 0x190504 },
];
const SUN_STOPS = [
  { t: 0.00, c: 0xfff2cc },
  { t: 0.50, c: 0xffcf8f },
  { t: 0.80, c: 0xff7a3a },
  { t: 1.00, c: 0xd2351a },
];

const _a = new THREE.Color(), _b = new THREE.Color();
function lerpStops(stops, t, out) {
  if (t <= stops[0].t) return out.set(stops[0].c);
  if (t >= stops[stops.length - 1].t) return out.set(stops[stops.length - 1].c);
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i], s1 = stops[i + 1];
    if (t >= s0.t && t <= s1.t) {
      const f = (t - s0.t) / (s1.t - s0.t);
      _a.set(s0.c); _b.set(s1.c);
      return out.copy(_a).lerp(_b, f);
    }
  }
  return out.set(stops[stops.length - 1].c);
}

// 진행도(doomFactor) 임계값마다 한 번씩 뜨는 조용한 서사 한 줄
const STAGE_LINES = [
  { t: 0.25, m: '하늘 끝, 붉은 점 하나가 떠올랐다.' },
  { t: 0.45, m: '바람이 멎고, 하늘이 물들기 시작한다.' },
  { t: 0.65, m: '땅이 울린다. 새들이 먼저 떠났다.' },
  { t: 0.82, m: '하늘이 핏빛이다. 얼마 남지 않았다.' },
  { t: 0.95, m: '곧, 모든 것이 끝난다.' },
];

export class Doomsday {
  constructor(scene, sun, hemi, { duration = 600 } = {}) {
    this.scene = scene;
    this.sun = sun;
    this.hemi = hemi;
    this.duration = duration;   // 한 판 실제 시간(초). 기본 300=5분 (서사상 충돌까지 5시간)
    this.elapsed = 0;
    this.doomFactor = 0;        // 0(시작) → 1(충돌)
    this.dayFactor = 1;         // 밝기(손전등 호환): 1→약 0.1
    this.running = false;       // 인트로 종료 후 start()로 시작
    this.onImpact = null;       // D-0 도달 콜백(엔딩용)
    this._impacted = false;
    this.onStage = null;        // 서사 비트 콜백(ui.showToast로 전달)
    this._stage = -1;           // 마지막으로 띄운 서사 단계

    this._sunBasePos = sun.position.clone();
    this._hud = this._buildHud();
    this.update(0); // 초기 하늘 적용
  }

  start() { this.running = true; }

  _buildHud() {
    const el = document.createElement('div');
    el.id = 'doomClock';
    el.style.cssText =
      'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:8;' +
      'font:bold 15px monospace;color:#fff;text-shadow:0 1px 3px #000;letter-spacing:.05em;' +
      'pointer-events:none;text-align:center;white-space:nowrap;';
    document.body.appendChild(el);
    return el;
  }

  _updateHud() {
    // 서사상 충돌까지 5시간을 한 판에 압축 — 남은 '게임 시간'을 시:분으로 표시
    const gsr = Math.max(0, 5 * 3600 * (1 - this.doomFactor)); // 남은 게임 초(5시간 기준)
    const gh = Math.floor(gsr / 3600);
    const gm = Math.floor((gsr % 3600) / 60);
    // 진행도에 따라 색이 붉어짐
    const c = lerpStops([
      { t: 0, c: 0xffffff }, { t: 0.5, c: 0xffd27a }, { t: 0.8, c: 0xff7a3a }, { t: 1, c: 0xff2a1a },
    ], this.doomFactor, _a).getStyle();
    this._hud.style.color = c;
    const warn = this.doomFactor > 0.8 ? ' ⚠' : '';
    this._hud.textContent = `☄️ 충돌까지  ${gh}시간 ${String(gm).padStart(2, '0')}분${warn}`;
  }

  update(dt) {
    if (this.running) this.elapsed += dt;
    this.doomFactor = THREE.MathUtils.clamp(this.elapsed / this.duration, 0, 1);
    const f = this.doomFactor;

    // 서사 비트: 진행도가 임계값을 넘을 때마다 한 줄씩 (게임 진행 중에만)
    if (this.running) {
      while (this._stage + 1 < STAGE_LINES.length && f >= STAGE_LINES[this._stage + 1].t) {
        this._stage++;
        if (this.onStage) this.onStage(STAGE_LINES[this._stage].m);
      }
    }

    // 하늘 / 안개 색
    if (this.scene.background && this.scene.background.isColor)
      lerpStops(SKY_STOPS, f, this.scene.background);
    if (this.scene.fog) {
      lerpStops(FOG_STOPS, f, this.scene.fog.color);
      // 종말이 가까울수록 안개가 더 자욱(시야 제한 강화)
      this.scene.fog.near = THREE.MathUtils.lerp(18, 7, f);
      this.scene.fog.far = THREE.MathUtils.lerp(75, 36, f);
    }

    // 태양: 점점 어두워지고 붉어지며 낮게 깔림
    lerpStops(SUN_STOPS, f, this.sun.color);
    this.sun.intensity = THREE.MathUtils.lerp(2.2, 0.25, f);
    this.sun.position.copy(this._sunBasePos);
    this.sun.position.y = THREE.MathUtils.lerp(this._sunBasePos.y, 6, f); // 지평선 쪽으로

    // 환경광: 어두워지며 붉게
    this.hemi.intensity = THREE.MathUtils.lerp(0.7, 0.12, f);
    this.hemi.color.setHSL(THREE.MathUtils.lerp(0.6, 0.04, f), 0.5, 0.6);

    // 밝기(손전등 호환)
    this.dayFactor = THREE.MathUtils.lerp(1, 0.1, f);

    this._updateHud();

    // D-0 충돌
    if (f >= 1 && !this._impacted) {
      this._impacted = true;
      this.running = false;
      if (this.onImpact) this.onImpact();
    }
  }
}
