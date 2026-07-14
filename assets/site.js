// 공통 헤더/푸터 — 모든 페이지에서 #site-header, #site-footer 자리에 삽입
(function(){
  function currentPage(){
    var p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  function renderHeader(){
    var page = currentPage();
    var links = [
      { href:'index.html', label:'홈' },
      { href:'diagnosis.html', label:'무료 진단 키트' },
      { href:'pricing.html', label:'상품 소개' },
    ];
    var navHtml = links.map(function(l){
      var active = (l.href === page) ? ' active' : '';
      return '<a class="' + active.trim() + '" href="' + l.href + '">' + l.label + '</a>';
    }).join('');

    var html =
      '<div class="notice-strip">무료 진단하고 나에게 맞는 마케팅 키트 추천받기 · 소요시간 약 5분</div>' +
      '<header class="site-header"><div class="wrap">' +
        '<a class="brand" href="index.html"><span class="stamp">홍보</span>사장님 홍보 진단 키트</a>' +
        '<nav class="main-nav">' + navHtml + '</nav>' +
        '<a class="nav-cta" href="diagnosis.html">무료 진단 시작</a>' +
      '</div></header>';
    document.querySelectorAll('#site-header').forEach(function(el){ el.innerHTML = html; });
  }

  function renderFooter(){
    var html =
      '<footer class="footer"><div class="wrap">' +
        '<div>' +
          '<div class="f-brand">사장님 홍보 진단 키트</div>' +
          '<small>대행사 없이, 사장님 스스로 만드는 온라인 마케팅 시스템</small>' +
          '<div class="f-legal">' +
            '본 사이트는 프로토타입 데모입니다. 실제 결제·회원가입·파일 다운로드는 동작하지 않으며, 모든 흐름은 화면 목업(UI Mock)입니다.<br/>' +
            '모든 콘텐츠(전자책·템플릿·프롬프트 등)는 저작권법으로 보호되며 구매자 1인(또는 1사업자) 사용을 전제로 합니다. 무단 공유·재배포·재판매를 금지합니다.' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<nav style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;">' +
            '<a href="diagnosis.html">무료 진단 키트</a>' +
            '<a href="pricing.html">상품 소개</a>' +
            '<a href="download.html">다운로드 안내(예시)</a>' +
          '</nav>' +
        '</div>' +
      '</div></footer>';
    document.querySelectorAll('#site-footer').forEach(function(el){ el.innerHTML = html; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderHeader();
    renderFooter();
  });
})();
