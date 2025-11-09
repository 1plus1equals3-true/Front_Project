// /assets/js/type.js

// 🚨 main.js와 동일한 타입 데이터가 필요합니다.
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
};

// 상성 분석에 사용할 18개 타입 (영문명)
const officialTypes = Object.keys(typeNamesKorean);

// DOM 요소 캐시는 일단 전역으로 두되, 초기값은 null로 설정
let typeButtonsContainer = null;
let typeResultCard = null;
let selectedTypeDisplay = null;
let initialMessage = null;
let attackGrid = null;
let defenseGrid = null;

/**
 * 주어진 타입 이름으로 상성 정보를 가져오고 화면에 렌더링합니다.
 * @param {string} typeNameEng - 분석할 타입의 영어 이름 (예: 'fire')
 */
async function analyzeAndRenderType(typeNameEng) {
  if (!typeNameEng || !officialTypes.includes(typeNameEng)) return;

  // 로딩 시작 및 DOM 준비
  typeResultCard.style.display = "block";
  initialMessage.style.display = "none";
  selectedTypeDisplay.innerHTML = `<div class="type-tag" id="${typeNameEng}">${typeNamesKorean[typeNameEng]}</div><p>분석 중...</p>`;
  // 기존 결과 초기화
  document
    .querySelectorAll(".analysis-group .type-list")
    .forEach((list) => (list.innerHTML = ""));

  // 버튼 활성화 상태 업데이트
  document
    .querySelectorAll("#type-buttons-container .type-tag")
    .forEach((tag) => tag.classList.remove("active"));
  document.getElementById(typeNameEng)?.classList.add("active");

  const apiUrl = `https://pokeapi.co/api/v2/type/${typeNameEng}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("타입 API 호출 실패");

    const data = await response.json();
    const relations = data.damage_relations;

    // ----------------------------------------------------------------------
    // 1. 공격 상성 분석 (선택한 타입이 공격할 때)
    // ----------------------------------------------------------------------
    const attackResults = {
      "attack-2x": relations.double_damage_to, // 2배 데미지 주는 타입
      "attack-05x": relations.half_damage_to, // 0.5배 데미지 주는 타입
      "attack-0x": relations.no_damage_to, // 0배 데미지 주는 타입
    };

    // ----------------------------------------------------------------------
    // 2. 방어 상성 분석 (선택한 타입이 방어할 때)
    // ----------------------------------------------------------------------
    const defenseResults = {
      "defense-2x": relations.double_damage_from, // 2배 데미지 받는 타입 (약점)
      "defense-05x": relations.half_damage_from, // 0.5배 데미지 받는 타입 (반감)
      "defense-0x": relations.no_damage_from, // 0배 데미지 받는 타입 (무효)
    };

    // 렌더링 함수: 1배 효과를 포함하여 결과를 렌더링합니다.
    const renderResults = (results, isAttack) => {
      const prefix = isAttack ? "attack" : "defense";

      // 1배 타입을 계산 (공식 타입 목록에서 2x, 0.5x, 0x에 속하지 않는 모든 타입)
      // 🚨 1배 타입 계산 로직은 현재 렌더링에 사용되지 않으므로, 2배, 0.5배, 0배만 렌더링합니다.
      //    이 부분은 복잡하므로 UX상 단순하게 갑니다.
      // ...

      // 2배, 0.5배, 0배 렌더링
      [2, 0.5, 0].forEach((multiplier) => {
        const multiplierKey = `${prefix}-${multiplier
          .toString()
          .replace(".", "")}x`;
        const listDiv = document.querySelector(`#${multiplierKey} .type-list`);
        const typesToRender = results[multiplierKey];

        if (!listDiv) return;

        if (typesToRender.length === 0) {
          listDiv.innerHTML = `<p style="color:#999; font-size: 0.9em; margin-top: 5px;">해당 타입이 없습니다.</p>`;
          return;
        }

        typesToRender.forEach((rel) => {
          const typeName = rel.name;
          if (typeName === "unknown" || typeName === "shadow") return;

          const typeTag = document.createElement("div");
          typeTag.classList.add("type-tag");
          typeTag.id = typeName;
          typeTag.textContent = typeNamesKorean[typeName] || typeName;
          listDiv.appendChild(typeTag);
        });
      });
    };

    // DOM 업데이트: 선택된 타입과 제목 재설정
    selectedTypeDisplay.innerHTML = `<div class="type-tag" id="${typeNameEng}">${typeNamesKorean[typeNameEng]}</div>`;

    // 렌더링 실행
    renderResults(attackResults, true); // 공격 상성
    renderResults(defenseResults, false); // 방어 상성
  } catch (error) {
    console.error("타입 분석 중 오류 발생:", error);
    selectedTypeDisplay.innerHTML = `<div class="type-tag" id="${typeNameEng}">분석 오류</div>`;
  }
}

/**
 * 18개 타입 버튼을 생성하고 컨테이너에 렌더링합니다.
 */
function renderTypeButtons() {
  officialTypes.forEach((typeNameEng) => {
    const button = document.createElement("div");
    button.classList.add("type-tag");
    button.id = typeNameEng;
    button.setAttribute("data-type", typeNameEng);
    button.textContent = typeNamesKorean[typeNameEng];

    button.addEventListener("click", () => {
      // 버튼 클릭 시 분석 함수 호출
      analyzeAndRenderType(typeNameEng);
      // URL 쿼리 파라미터를 업데이트하여 페이지 공유 및 새로고침에 대비
      window.history.pushState({}, "", `?type=${typeNameEng}`);
    });

    typeButtonsContainer.appendChild(button);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // 🚨 1. DOM 요소 캐시를 여기서 다시 수행합니다. (가장 중요)
  typeButtonsContainer = document.getElementById("type-buttons-container");
  typeResultCard = document.getElementById("type-result-card");
  selectedTypeDisplay = document.getElementById("selected-type-display");
  initialMessage = document.getElementById("initial-message");
  attackGrid = document.getElementById("attack-grid");
  defenseGrid = document.getElementById("defense-grid");

  // 만약 하나라도 null이라면, HTML 구조 문제이므로 로그를 남깁니다.
  if (!typeButtonsContainer) {
    console.error(
      "오류: 'type-buttons-container' 요소를 찾을 수 없습니다. HTML ID를 확인하세요."
    );
    return;
  }

  // 2. 버튼 렌더링
  renderTypeButtons();

  // 3. 초기 URL 파라미터 확인 및 분석 실행
  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get("type");

  if (initialType && officialTypes.includes(initialType)) {
    // 유효한 타입이 있으면 즉시 분석 시작
    analyzeAndRenderType(initialType);
  } else {
    // 타입이 없으면 초기 메시지 표시
    typeResultCard.style.display = "none";
    initialMessage.style.display = "block";
  }
});
