// ============================================================
// 진단 키트 앱 로직 — 리드수집 → 4영역 진단 → 채점 중 → 결과
// ============================================================
(function(){

  const STAGES = ['lead', ...DIAG_AREAS.map(a => 'area:' + a.id), 'loading', 'result'];
  let stageIdx = 0;
  let lead = { email:'', business:'', industry:'' };
  // responses[areaId] = array of values (null | 0/1 for yn | 0..4 for scale)
  let responses = {};
  DIAG_AREAS.forEach(a => { responses[a.id] = new Array(a.questions.length).fill(null); });

  const root = document.getElementById('diag-root');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  function updateProgress(){
    // 리드폼 + 4영역만 진행률에 반영 (로딩/결과 제외)
    const trackable = 1 + DIAG_AREAS.length; // 5
    const idx = Math.min(stageIdx, trackable);
    const pct = Math.round((idx / trackable) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText){
      if (stageIdx === 0) progressText.textContent = '시작 전';
      else if (stageIdx <= DIAG_AREAS.length) progressText.textContent = `${stageIdx} / ${DIAG_AREAS.length} 영역 진행 중`;
      else progressText.textContent = '완료';
    }
  }

  function go(delta){
    stageIdx = Math.max(0, Math.min(STAGES.length - 1, stageIdx + delta));
    render();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  // ---------- 렌더 ----------
  function render(){
    updateProgress();
    const stage = STAGES[stageIdx];
    if (stage === 'lead') return renderLead();
    if (stage.startsWith('area:')) return renderArea(stage.split(':')[1]);
    if (stage === 'loading') return renderLoading();
    if (stage === 'result') return renderResult();
  }

  function renderLead(){
    root.innerHTML = `
      <div class="diag-panel">
        <div class="lead-form">
          <span class="badge" style="display:block;width:fit-content;margin:0 auto 18px;">FREE DIAGNOSIS</span>
          <h1>사장님 홍보 진단서<br/>3분이면 끝나요</h1>
          <p class="sub">이메일만 남기면 바로 시작돼요. 진단 결과 링크를 보내드립니다.</p>

          <div class="field">
            <label>이메일 <span style="color:var(--red);">*</span></label>
            <input type="email" id="in-email" placeholder="owner@example.com" value="${lead.email}" />
          </div>
          <div class="field">
            <label>매장/브랜드명 <span class="opt">(선택)</span></label>
            <input type="text" id="in-business" placeholder="예: 우리동네 카페" value="${lead.business}" />
          </div>
          <div class="field">
            <label>업종 <span class="opt">(선택 · 확장팩 추천에 활용돼요)</span></label>
            <select id="in-industry">
              <option value="">선택 안 함</option>
              ${INDUSTRY_PACKS.map(p => `<option value="${p.id}" ${lead.industry===p.id?'selected':''}>${p.emoji} ${p.name}</option>`).join('')}
            </select>
          </div>

          <label class="consent">
            <input type="checkbox" id="in-consent" checked />
            <span>진단 결과 링크 발송 및 서비스 소식/업데이트 안내를 위해 이메일을 수집합니다. 수신 거부는 언제든 가능합니다. 파일 첨부 없이 링크로만 안내합니다.</span>
          </label>

          <button class="btn btn-primary btn-block" id="btn-start">무료로 진단 시작하기 →</button>

          <div class="assure-row">
            <span class="assure">✓ 신용카드 불필요</span>
            <span class="assure">✓ 약 3분 소요</span>
            <span class="assure">✓ 100점 만점 점수 제공</span>
          </div>
        </div>
      </div>
    `;
    document.getElementById('btn-start').addEventListener('click', () => {
      const email = document.getElementById('in-email').value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk){
        document.getElementById('in-email').style.borderColor = 'var(--red)';
        document.getElementById('in-email').focus();
        return;
      }
      lead.email = email;
      lead.business = document.getElementById('in-business').value.trim();
      lead.industry = document.getElementById('in-industry').value;
      go(1);
    });
  }

  function renderArea(areaId){
    const areaOrderIdx = DIAG_AREAS.findIndex(a => a.id === areaId);
    const area = DIAG_AREAS[areaOrderIdx];
    const answers = responses[area.id];

    const qHtml = area.questions.map((q, i) => {
      let control;
      if (q.type === 'yn'){
        const v = answers[i];
        control = `
          <div class="yn-toggle" data-qi="${i}">
            <button type="button" class="sel-yes ${v===1?'active':''}" data-val="1">예</button>
            <button type="button" class="sel-no ${v===0?'active':''}" data-val="0">아니오</button>
          </div>`;
      } else {
        const v = answers[i];
        const labels = ['전혀','거의','보통','자주','항상'];
        control = `
          <div class="scale-toggle" data-qi="${i}">
            ${[0,1,2,3,4].map(n => `<button type="button" class="${v===n?'active':''}" data-val="${n}" title="${labels[n]}">${n+1}</button>`).join('')}
          </div>`;
      }
      return `
        <div class="q-item">
          <div class="q-text"><span class="q-num">Q${i+1}</span>${q.t}</div>
          ${control}
        </div>`;
    }).join('');

    root.innerHTML = `
      <div class="diag-panel">
        <div class="step-label">STEP ${areaOrderIdx+2} / ${DIAG_AREAS.length+1} <span class="count">· 영역당 약 1분</span></div>
        <div class="area-header">
          <div class="area-icon" style="background:${area.color};">${area.icon}</div>
          <div>
            <h2 class="area-title">${area.name} 점검</h2>
          </div>
        </div>
        <p class="area-desc">${area.desc}</p>
        <div class="q-list">${qHtml}</div>
        <div class="diag-nav-row">
          <button class="btn btn-ghost" id="btn-prev">← 이전</button>
          <button class="btn btn-primary" id="btn-next">다음 →</button>
        </div>
      </div>
    `;

    root.querySelectorAll('.yn-toggle button, .scale-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.parentElement;
        const qi = parseInt(group.dataset.qi, 10);
        const val = parseInt(btn.dataset.val, 10);
        answers[qi] = val;
        group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('btn-prev').addEventListener('click', () => go(-1));
    document.getElementById('btn-next').addEventListener('click', () => {
      const unanswered = answers.findIndex(v => v === null);
      if (unanswered !== -1){
        const items = root.querySelectorAll('.q-item');
        items[unanswered].scrollIntoView({behavior:'smooth', block:'center'});
        items[unanswered].style.borderColor = 'var(--red)';
        return;
      }
      go(1);
    });
  }

  function renderLoading(){
    root.innerHTML = `
      <div class="diag-panel loading-stage">
        <div class="spinner"></div>
        <h2 style="font-size:22px;">진단서를 채점하고 있어요…</h2>
        <p style="color:var(--ink-soft);margin-top:10px;">4개 영역 점수를 계산하고, 가장 먼저 고치면 좋은 항목을 정리하는 중입니다.</p>
      </div>
    `;
    setTimeout(() => go(1), 1200);
  }

  // ---------- 채점 로직 ----------
  function computeAreaScore(area){
    const answers = responses[area.id];
    let raw = 0, maxRaw = 0;
    const items = area.questions.map((q, i) => {
      const v = answers[i];
      const norm = q.type === 'yn' ? v : v / 4;
      const deficiency = q.w * (1 - norm);
      raw += q.w * norm;
      maxRaw += q.w;
      return { areaId:area.id, areaName:area.name, text:q.t, weight:q.w, norm, deficiency };
    });
    const score25 = (raw / maxRaw) * 25;
    return { score25, items };
  }

  function buildFixList(allItems){
    const sorted = [...allItems].sort((a,b) => b.deficiency - a.deficiency).filter(it => it.deficiency > 0.05);
    const picked = [];
    const areaCount = {};
    for (const it of sorted){
      areaCount[it.areaId] = areaCount[it.areaId] || 0;
      if (areaCount[it.areaId] >= 2) continue;
      picked.push(it);
      areaCount[it.areaId]++;
      if (picked.length === 3) break;
    }
    return picked;
  }

  function recommendation(total, aiArea){
    // AI 영역 마지막 두 문항(자동화 관심/의지)로 자동화 니즈 판단
    const autoNeed = (aiArea.items[13].norm + aiArea.items[14].norm) / 2; // 0~1
    let primary = 'starter';
    if (total < 50){
      primary = 'starter';
    } else if (total < 70){
      primary = autoNeed >= 0.5 ? 'pro' : 'starter';
    } else {
      primary = lead.industry ? 'pack' : 'pro';
    }
    return { primary, autoNeed };
  }

  function scoreBand(v25){
    if (v25 >= 20) return { label:'좋음', color:'var(--teal)' };
    if (v25 >= 12) return { label:'보통', color:'var(--amber)' };
    return { label:'개선 필요', color:'var(--red)' };
  }

  function renderResult(){
    const areaResults = DIAG_AREAS.map(a => ({ area:a, ...computeAreaScore(a) }));
    const total = areaResults.reduce((s, r) => s + r.score25, 0);
    const totalRounded = Math.round(total);
    const allItems = areaResults.flatMap(r => r.items);
    const fix3 = buildFixList(allItems);
    const aiAreaResult = areaResults.find(r => r.area.id === 'ai');
    const { primary, autoNeed } = recommendation(totalRounded, aiAreaResult);

    const circumference = 2 * Math.PI * 88;
    const dash = (totalRounded/100) * circumference;

    let tag, tagColor;
    if (totalRounded >= 70){ tag='탄탄해요, 이제 업종 맞춤으로'; tagColor='var(--teal)'; }
    else if (totalRounded >= 50){ tag='기초는 됐어요, 반복 업무를 줄여봐요'; tagColor='var(--amber-dark)'; }
    else { tag='지금은 기초 세팅이 먼저예요'; tagColor='var(--red)'; }

    const industryPack = INDUSTRY_PACKS.find(p => p.id === lead.industry);

    root.innerHTML = `
      <div class="diag-panel">
        <div class="result-hero">
          <span class="badge">${lead.business ? lead.business + ' 사장님 진단서' : '사장님 진단서'}</span>
          <div class="gauge-wrap">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="88" fill="none" stroke="var(--line)" stroke-width="16"/>
              <circle cx="110" cy="110" r="88" fill="none" stroke="${tagColor}" stroke-width="16"
                stroke-dasharray="${dash} ${circumference}" stroke-linecap="round"
                transform="rotate(-90 110 110)"/>
            </svg>
            <div class="gauge-center">
              <span class="num">${totalRounded}</span>
              <span class="den">/ 100점</span>
            </div>
          </div>
          <h2 class="result-tag" style="color:${tagColor};">${tag}</h2>
          <p class="result-sub">스마트플레이스·블로그·AI 활용도·SNS 4개 영역을 각 25점 만점으로 채점했어요. 아래에서 영역별 점수와 가장 먼저 고칠 3가지를 확인하세요.</p>
        </div>

        <div class="area-score-grid">
          ${areaResults.map(r => {
            const band = scoreBand(r.score25);
            const pct = Math.round((r.score25/25)*100);
            return `
              <div class="area-score-card">
                <div class="a-name">${r.area.icon} ${r.area.name}</div>
                <div class="a-num" style="color:${band.color};">${r.score25.toFixed(1)} <span style="color:var(--ink-faint);font-size:14px;">/ 25</span></div>
                <div class="a-bar"><div class="a-fill" style="width:${pct}%;background:${band.color};"></div></div>
                <div class="a-feedback">${band.label} · ${areaFeedback(r.area.id, band.label)}</div>
              </div>`;
          }).join('')}
        </div>

        <h3 style="font-size:22px;margin-bottom:4px;">먼저 고치면 효과 큰 항목 3가지</h3>
        <p style="color:var(--ink-soft);font-size:14px;margin-bottom:8px;">비난이 아니라 우선순위예요. 오늘 30분 안에 시작할 수 있는 것부터 골랐어요.</p>
        <div class="fix3-list">
          ${fix3.map((it, i) => `
            <div class="fix3-item">
              <span class="fx-rank">${i+1}</span>
              <div>
                <div class="fx-title">${it.text}</div>
                <div class="fx-why">${it.areaName} 영역에서 우선순위가 높은 항목이에요.</div>
                <div class="fx-do">→ 오늘 10~20분 안에 바로 점검해보세요.</div>
              </div>
            </div>
          `).join('') || '<p style="color:var(--ink-soft);">이미 대부분 잘 갖춰져 있어요! 지금 상태를 유지해보세요.</p>'}
        </div>

        <h3 style="font-size:22px;margin-bottom:16px;">지금 단계엔, 이 키트를 추천해요</h3>
        <div class="reco-cards">
          <div class="reco-card ${primary==='starter'?'primary':''}">
            <span class="rc-head-line">STARTER</span>
            <h4>오늘부터 루틴 만들기</h4>
            <p class="reason">${totalRounded < 50 ? '기초 세팅과 콘텐츠 루틴부터 만드는 게 가장 빠른 길이에요.' : '기초 체크리스트로 빠진 부분부터 채워보세요.'}</p>
            <span class="price-line">19,900원</span>
            <a class="btn ${primary==='starter'?'btn-primary':'btn-ghost'} btn-block" href="checkout.html?plan=starter">Starter로 시작하기</a>
          </div>
          <div class="reco-card ${primary==='pro'?'primary':''}">
            <span class="rc-head-line">PRO</span>
            <h4>반복 업무까지 줄이기</h4>
            <p class="reason">${autoNeed >= 0.5 ? '자동화에 관심이 많으신 만큼, 반복 업무를 확실히 줄일 수 있어요.' : '시간이 부족하고 자동화가 필요할 때 선택하세요.'}</p>
            <span class="price-line">49,000원</span>
            <a class="btn ${primary==='pro'?'btn-primary':'btn-ghost'} btn-block" href="checkout.html?plan=pro">Pro로 업그레이드</a>
          </div>
          <div class="reco-card ${primary==='pack'?'primary':''}">
            <span class="rc-head-line">업종 확장팩</span>
            <h4>${industryPack ? industryPack.emoji + ' ' + industryPack.name + ' 맞춤 세트' : '내 업종에 맞춘 세트'}</h4>
            <p class="reason">${industryPack ? `${industryPack.name} 업종에 맞춘 문구·템플릿을 바로 쓸 수 있어요.` : '업종을 선택하면 딱 맞는 확장팩을 추천해드려요.'}</p>
            <span class="price-line">39,000원</span>
            <a class="btn ${primary==='pack'?'btn-primary':'btn-ghost'} btn-block" href="pricing.html#packs">업종 확장팩 보기</a>
          </div>
        </div>

        <div class="mock-banner" style="margin-top:40px;">이 결과는 데모입니다 · 실제 이메일 발송은 이루어지지 않습니다</div>
        <div style="text-align:center;margin-top:8px;">
          <button class="btn btn-ghost" id="btn-restart">처음부터 다시 진단하기</button>
        </div>
      </div>
    `;

    document.getElementById('btn-restart').addEventListener('click', () => {
      stageIdx = 0;
      lead = { email:'', business:'', industry:'' };
      DIAG_AREAS.forEach(a => { responses[a.id] = new Array(a.questions.length).fill(null); });
      render();
      window.scrollTo({top:0});
    });
  }

  function areaFeedback(areaId, label){
    const map = {
      place: { '좋음':'기본 정보와 리뷰 관리가 잘 갖춰져 있어요.', '보통':'예약 동선과 리뷰 답변 규칙을 다듬어보세요.', '개선 필요':'필수 정보와 대표 이미지부터 채워보세요.' },
      blog:  { '좋음':'발행 루틴과 키워드 활용이 안정적이에요.', '보통':'발행 빈도와 CTA 문구를 조금 더 다듬어보세요.', '개선 필요':'주 1회 발행 루틴부터 만들어보세요.' },
      ai:    { '좋음':'AI를 콘텐츠 제작에 잘 활용하고 계세요.', '보통':'자동화 도구까지 시도해보면 효과가 커요.', '개선 필요':'글감 아이디어 뽑기부터 가볍게 시작해보세요.' },
      sns:   { '좋음':'프로필과 업로드 루틴이 탄탄해요.', '보통':'하이라이트 구성과 CTA를 정리해보세요.', '개선 필요':'프로필 소개와 예약 링크부터 정리해보세요.' },
    };
    return map[areaId][label];
  }

  render();
})();
