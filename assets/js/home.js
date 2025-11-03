// /assets/js/home.js 예시 (기존 코드에 추가/통합)

document.addEventListener("DOMContentLoaded", () => {
  const mainSearchForm = document.getElementById("main-search-form");
  const searchInput = mainSearchForm.querySelector('input[type="text"]');

  // 최근 검색 관련 DOM 요소
  const recentSearchList = document.getElementById("recent-search-list");
  const noRecentSearchesMsg = document.getElementById("no-recent-searches");

  // ----------------------------------------------------
  // [A] 최근 검색 기록 렌더링 함수
  // ----------------------------------------------------
  const RECENT_SEARCHES_KEY = "recent_pokemon_searches"; // main.js와 동일해야 합니다.

  function getRecentSearches() {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
    return searches ? JSON.parse(searches) : [];
  }

  function renderRecentSearches() {
    const recentSearches = getRecentSearches();
    recentSearchList.innerHTML = ""; // 목록 초기화

    if (recentSearches.length === 0) {
      noRecentSearchesMsg.style.display = "block"; // 기록 없음 메시지 표시
      return;
    }

    noRecentSearchesMsg.style.display = "none"; // 기록 있으면 메시지 숨김

    recentSearches.forEach((name) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");

      // 클릭 시 해당 포켓몬으로 검색 페이지 이동 및 검색 실행
      // window.location.href = /main.html?name=한글포켓몬이름
      const encodedName = encodeURIComponent(name);
      link.href = `/main.html?name=${encodedName}`;
      link.textContent = name;

      listItem.appendChild(link);
      recentSearchList.appendChild(listItem);
    });
  }

  // ----------------------------------------------------
  // [B] 메인 검색 폼 이벤트 리스너 (기존 코드)
  // ----------------------------------------------------
  mainSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (query) {
      const encodedQuery = encodeURIComponent(query);
      window.location.href = `/main.html?name=${encodedQuery}`;
    } else {
      alert("검색어를 입력해 주세요.");
    }
  });

  // ----------------------------------------------------
  // [C] 최종 실행: 페이지 로드 시 최근 검색 기록 표시
  // ----------------------------------------------------
  renderRecentSearches();

  // ... (오늘의 포켓몬 로직 등 다른 home.js 내용)
});
