// async/await 및 importPage 함수는 그대로 유지됩니다.
async function fetchHtmlAsText(url) {
  return await (await fetch(url)).text();
}

async function importPage(target) {
  document.querySelector("#" + target).innerHTML = await fetchHtmlAsText(
    target + ".html"
  );
}
importPage("header");
importPage("footer");
importPage("sidenav");

const JSON_FILE_PATH = "./poke_name.json";

let pokemonNames = {};

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
  unknown: "???", // 기타 타입 (선택 사항)
  shadow: "다크", // 기타 타입 (선택 사항)
};

async function loadPokemonData() {
  try {
    const response = await fetch(JSON_FILE_PATH);
    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    const data = await response.json();
    pokemonNames = data;
  } catch (error) {
    console.error("데이터를 불러오는 중 오류 발생:", error);
  }
}

function getEnglishName(koreanName) {
  const englishName = pokemonNames[koreanName];
  if (englishName) {
    return englishName;
  } else {
    return null;
  }
}

function getValues() {
  const name = document.getElementById("name-input").value;
  const englishName = getEnglishName(name);

  // 이름 먼저 표시
  document.getElementById("pokename").textContent = `${name}`;
  // null 체크
  if (englishName === null) {
    console.error(`'${name}'은(는) 등록된 포켓몬 이름이 아닙니다.`);
    document.getElementById(
      "pokename"
    ).textContent = `${name}의 정보는 찾을 수 없습니다.`;
    // 오류 시 정보 초기화
    document.getElementById("pokedex_id").textContent = "";
    document.getElementById("sprite-default").src = "";
    document.getElementById("sprite-shiny").src = "";
    document.getElementById("stat-hp").textContent = "-";
    document.getElementById("stat-attack").textContent = "-";
    document.getElementById("stat-defense").textContent = "-";
    document.getElementById("stat-special-attack").textContent = "-";
    document.getElementById("stat-special-defense").textContent = "-";
    document.getElementById("stat-speed").textContent = "-";
    return;
  }

  const apiUrl = "https://pokeapi.co/api/v2/pokemon/" + englishName + "/";

  // 1단계: 포켓몬 기본 정보 호출
  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`요청 실패! 상태 코드: ${response.status}`);
      }
      return response.json();
    })
    // 2단계: DOM 업데이트 및 타입 상성 Promise 배열 생성
    .then((pokeData) => {
      // ----------------------------------------------------
      // ⭐ 기존의 모든 DOM 업데이트 로직 ⭐
      // ----------------------------------------------------
      console.log(`포켓몬 : ${pokeData.name}`);

      // 카드 1 업데이트
      document.getElementById(
        "pokedex_id"
      ).textContent = `전국도감 ${pokeData.id}`;
      document.getElementById("sprite-default").src =
        pokeData.sprites.front_default;
      document.getElementById("sprite-shiny").src =
        pokeData.sprites.front_shiny;

      // 카드 2 업데이트
      // 스탯 배열 순서: 0:HP, 1:Attack, 2:Defense, 3:Sp.Attack, 4:Sp.Defense, 5:Speed
      document.getElementById("stat-hp").textContent =
        pokeData.stats[0].base_stat;
      document.getElementById("stat-attack").textContent =
        pokeData.stats[1].base_stat;
      document.getElementById("stat-defense").textContent =
        pokeData.stats[2].base_stat;
      document.getElementById("stat-special-attack").textContent =
        pokeData.stats[3].base_stat;
      document.getElementById("stat-special-defense").textContent =
        pokeData.stats[4].base_stat;
      document.getElementById("stat-speed").textContent =
        pokeData.stats[5].base_stat;

      // ----------------------------------------------------
      // 3. 타입 상성 API 호출을 위한 준비
      const typePromises = pokeData.types.map((typeInfo) => {
        const typeUrl = typeInfo.type.url; // 각 타입의 상세 정보 URL
        return fetch(typeUrl).then((res) => {
          if (!res.ok)
            throw new Error(`타입 상성 호출 실패: ${typeInfo.type.name}`);
          return res.json();
        });
      });

      // Promise.all을 반환하여 다음 .then()에서 모든 타입 상성 데이터를 받습니다.
      return Promise.all(typePromises);
    })
    // 4단계: 상성 데이터를 통합하여 최종 상성을 계산합니다.
    .then((allTypeData) => {
      const finalDamageMap = new Map();

      allTypeData.forEach((typeData) => {
        const damageRelations = typeData.damage_relations;

        // 2배 데미지 FROM (약점)
        damageRelations.double_damage_from.forEach((rel) => {
          const currentMultiplier = finalDamageMap.get(rel.name) || 1;
          finalDamageMap.set(rel.name, currentMultiplier * 2);
        });

        // 0.5배 데미지 FROM (저항)
        damageRelations.half_damage_from.forEach((rel) => {
          const currentMultiplier = finalDamageMap.get(rel.name) || 1;
          finalDamageMap.set(rel.name, currentMultiplier * 0.5);
        });

        // 0배 데미지 FROM (면역)
        damageRelations.no_damage_from.forEach((rel) => {
          finalDamageMap.set(rel.name, 0);
        });
      });

      // 5. 계산된 최종 상성 결과를 분류하여 출력합니다.
      const finalResults = {
        "4배 (이중 약점)": [],
        "2배 (약점)": [],
        "0.5배 (저항)": [],
        "0.25배 (이중 저항)": [],
        "0배 (면역)": [],
      };

      // 맵을 순회하며 결과 분류
      finalDamageMap.forEach((multiplier, typeName) => {
        if (multiplier === 4) {
          finalResults["4배 (이중 약점)"].push(typeName);
        } else if (multiplier === 2) {
          finalResults["2배 (약점)"].push(typeName);
        } else if (multiplier === 0.5) {
          finalResults["0.5배 (저항)"].push(typeName);
        } else if (multiplier === 0.25) {
          finalResults["0.25배 (이중 저항)"].push(typeName);
        } else if (multiplier === 0) {
          finalResults["0배 (면역)"].push(typeName);
        }
        // 1배 상쇄 타입은 출력에서 제외 (너무 많아지기 때문)
      });

      // 6. 최종 결과 출력
      // 기존의 모든 상성 Div 내부를 비웁니다. (새로운 검색 전에 초기화)
      document.querySelectorAll("#poke-search-card-4 .weak").forEach((div) => {
        div.innerHTML = "";
      });

      // 배율별 DOM 요소를 매핑합니다.
      const multiplierToId = {
        "4배 (이중 약점)": "weak4",
        "2배 (약점)": "weak2",
        "0.5배 (저항)": "weak0.5",
        "0.25배 (이중 저항)": "weak0.25",
        "0배 (면역)": "weak0",
      };

      // finalResults를 순회하며 타입 태그를 생성하고 삽입합니다.
      Object.keys(finalResults).forEach((key) => {
        const targetId = multiplierToId[key];
        const targetDiv = document.getElementById(targetId);

        // 해당 배율에 타입이 하나라도 존재할 때만 제목과 타입을 출력
        if (targetDiv && finalResults[key].length > 0) {
          // 배율 제목 동적 생성
          const titleDiv = document.createElement("div");
          titleDiv.classList.add("multiplier-title");
          titleDiv.textContent = `${key} : `;

          targetDiv.appendChild(titleDiv);

          // 각 타입 이름(영어명)에 대해 div 태그를 생성하고 삽입합니다.
          finalResults[key].forEach((typeName) => {
            const typeDiv = document.createElement("div");

            // div의 id를 타입 이름(예: 'rock', 'electric')으로 설정합니다.
            typeDiv.id = typeName;

            // type-tag 클래스 추가
            typeDiv.classList.add("type-tag");

            // 타입 이름을 텍스트로 표시합니다.
            const koreanName =
              typeNamesKorean[typeName.toLowerCase()] || typeName;
            typeDiv.textContent = koreanName;

            // 해당 배율 Div에 생성된 타입 태그를 추가합니다.
            targetDiv.appendChild(typeDiv);
          });
        }
      });
    })
    .catch((error) => {
      console.error("오류 발생:", error.message);
      document.getElementById("pokename").textContent = `${name} (오류 발생)`;
    });
}

//리스트에 이름 채우기 함수
function populateDatalist() {
  const datalist = document.getElementById("search-list");
  if (!datalist) {
    console.error("ID가 'search-list'인 datalist 요소를 찾을 수 없습니다.");
    return;
  }

  const koreanNames = Object.keys(pokemonNames);

  koreanNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });
}

// --- 최종 실행 로직 ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. HTML 조각 로드
  importPage("header");
  importPage("footer");
  importPage("sidenav");

  // 폼 요소와 입력 버튼을 가져옵니다.
  const searchForm = document.getElementById("poke-search-form");
  const nameInput = document.getElementById("name-input");

  // 2. 데이터 로드 후 나머지 기능 실행
  loadPokemonData().then(() => {
    populateDatalist();

    // 3. 폼 제출 이벤트(Enter 키 포함)를 처리합니다.
    if (searchForm) {
      searchForm.addEventListener("submit", (event) => {
        // ❗ 가장 중요: 폼의 기본 제출 동작(페이지 새로고침)을 막습니다.
        event.preventDefault();

        // 검색 함수를 호출합니다.
        getValues();
      });
    }

    // 초기 검색 실행 (페이지 로드 시 "피카츄" 등으로 초기 검색)
    getValues();
  });
});
