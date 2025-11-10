const typeNamesKorean = {
  normal: "노말",
  fighting: "격투",
  flying: "비행",
  poison: "독",
  ground: "땅",
  rock: "바위",
  bug: "벌레",
  ghost: "고스트",
  steel: "강철",
  fire: "불꽃",
  water: "물",
  grass: "풀",
  electric: "전기",
  psychic: "에스퍼",
  ice: "얼음",
  dragon: "드래곤",
  dark: "악",
  fairy: "페어리",
  unknown: "???",
  shadow: "다크",
};

const MAX_POKEMON_ID = 1025;
const POTD_STORAGE_KEY = "pokemon_of_the_day_id";

/**
 * 오늘의 포켓몬 ID를 결정합니다 (하루에 한 번만 갱신).
 * @returns {number} 오늘의 포켓몬 도감 ID
 */
function getDailyPokemonId() {
  const today = new Date().toDateString(); // 날짜 문자열 사용
  const storedData = localStorage.getItem(POTD_STORAGE_KEY);

  let potdId;
  let potdDate;

  if (storedData) {
    const data = JSON.parse(storedData);
    potdId = data.id;
    potdDate = data.date;
  }

  if (potdId && potdDate === today) {
    // 이미 오늘 결정된 ID가 있으면 그것을 사용
    return potdId;
  } else {
    // 오늘 새로 결정 (1부터 MAX_POKEMON_ID 사이의 랜덤 ID)
    const newId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;

    // 로컬 스토리지에 저장
    localStorage.setItem(
      POTD_STORAGE_KEY,
      JSON.stringify({
        id: newId,
        date: today,
      })
    );

    return newId;
  }
}

/**
 * 오늘의 포켓몬 정보를 가져와서 DOM을 업데이트합니다.
 */
async function setPokemonOfTheDay() {
  const potdId = getDailyPokemonId();
  const apiUrl = `https://pokeapi.co/api/v2/pokemon/${potdId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }
    const data = await response.json();

    // 1. 포켓몬 이름 (한글) 가져오기
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();

    // 종족명(species name)의 한글명 찾기
    const koreanNameEntry = speciesData.names.find(
      (name) => name.language.name === "ko"
    );
    const koreanName = koreanNameEntry ? koreanNameEntry.name : data.name; // 한글명이 없으면 영문명 사용

    // 2. DOM 업데이트
    const potdSprite = document.getElementById("potd-sprite");
    const potdIdElem = document.querySelector(".potd-id");
    const potdNameElem = document.querySelector(".potd-name");
    const potdTypeElem = document.querySelector(".potd-type");
    const potdLink = document.getElementById("potd-link");

    // 이미지, ID, 이름 업데이트
    potdSprite.src = data.sprites.front_default || "/assets/img/Poke Ball.webp";
    potdIdElem.textContent = `No. ${String(data.id).padStart(3, "0")}`;
    potdNameElem.textContent = koreanName;

    // 타입 업데이트
    const typeNames = data.types.map(
      (typeInfo) => typeNamesKorean[typeInfo.type.name] || typeInfo.type.name
    );
    const typeText = `타입: ${typeNames.join(" / ")}`;
    potdTypeElem.textContent = typeText;

    // 링크 업데이트
    const encodedDisplayName = encodeURIComponent(koreanName);
    const encodedApiName = encodeURIComponent(data.id);
    potdLink.href = `/main.html?apiName=${encodedApiName}&displayName=${encodedDisplayName}`;
  } catch (error) {
    console.error("오늘의 포켓몬 설정 중 오류 발생:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const mainSearchForm = document.getElementById("main-search-form");
  const searchInput = mainSearchForm.querySelector('input[type="text"]');

  // 최근 검색 관련 DOM 요소
  const recentSearchList = document.getElementById("recent-search-list");
  const noRecentSearchesMsg = document.getElementById("no-recent-searches");

  // ----------------------------------------------------
  // [A] 최근 검색 기록 렌더링 함수
  // ----------------------------------------------------
  const RECENT_SEARCHES_KEY = "recent_pokemon_searches"; // main.js와 동일해야

  function getRecentSearches() {
    const searches = localStorage.getItem(RECENT_SEARCHES_KEY);

    return searches ? JSON.parse(searches) : [];
  }

  function renderRecentSearches() {
    const recentSearches = getRecentSearches();
    recentSearchList.innerHTML = ""; // 목록 초기화

    if (recentSearches.length === 0) {
      noRecentSearchesMsg.style.display = "block";
      return;
    }

    noRecentSearchesMsg.style.display = "none";

    // item (객체: {koreanName, englishName})으로 순회
    recentSearches.forEach((item) => {
      const listItem = document.createElement("li");
      const link = document.createElement("a");

      // API 호출에 사용할 영문 이름 (특수폼 포함)을 인코딩
      const encodedApiName = encodeURIComponent(item.englishName);
      // 검색창에 표시할 한글 이름도 인코딩
      const encodedDisplayName = encodeURIComponent(item.koreanName);

      // 수정: main.html로 이동 시, 검색에 사용할 apiName과 표시할 displayName을 모두 전달
      link.href = `/Front_Project/main.html?apiName=${encodedApiName}&displayName=${encodedDisplayName}`;

      // 사용자에게는 한글 이름만 표시
      link.textContent = item.koreanName;

      listItem.appendChild(link);
      recentSearchList.appendChild(listItem);
    });
  }

  // ----------------------------------------------------
  // [B] 메인 검색 폼 이벤트 리스너
  // ----------------------------------------------------
  mainSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim(); // 검색어 (한글 이름으로 간주)

    if (query) {
      const encodedQuery = encodeURIComponent(query);
      // 검색창에서 입력한 이름은 표시용(displayName)과 API 호출용(apiName)을 일단 동일하게 전달
      window.location.href = `/Front_Project/main.html?apiName=${encodedQuery}&displayName=${encodedQuery}`;
    } else {
      alert("검색어를 입력해 주세요.");
    }
  });

  // ----------------------------------------------------
  // [C] 최종 실행: 페이지 로드 시 최근 검색 기록 표시
  // ----------------------------------------------------
  renderRecentSearches();
  setPokemonOfTheDay();
});
