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

async function loadPokemonData() {
  try {
    const response = await fetch(JSON_FILE_PATH);
    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }
    const data = await response.json();
    pokemonNames = data;
    console.log("포켓몬 데이터 로드 완료:", pokemonNames);
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
    // 오류 시 정보 초기화 로직 (선택 사항)
    document.getElementById("pokedex_id").textContent = "";
    document.querySelector(
      "#poke-info tr:nth-child(3) td:nth-child(1) img:nth-child(1)"
    ).src = "";
    document.querySelector(
      "#poke-info tr:nth-child(3) td:nth-child(1) img:nth-child(2)"
    ).src = ""; // <-- 이미지 초기화
    const statsCells = document.querySelectorAll(
      "#poke-stats tr:nth-child(3) td"
    );
    statsCells.forEach((cell) => (cell.innerHTML = "-"));
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
      console.log("✅ 포켓몬 기본 정보 로드 완료");

      // ----------------------------------------------------
      // ⭐ 기존의 모든 DOM 업데이트 로직 ⭐
      // ----------------------------------------------------
      console.log(`이름: ${pokeData.name}`);
      console.log(`T: ${pokeData.types.map((t) => t.type.name).join(", ")}`);

      document.getElementById(
        "pokedex_id"
      ).textContent = `전국도감 ${pokeData.id}`;

      // 💡 이미지 출력 코드: pokeData에서 바로 가져와서 업데이트됩니다.
      document.querySelector(
        "#poke-info tr:nth-child(3) td:nth-child(1) img:nth-child(1)"
      ).src = pokeData.sprites.front_default;
      document.querySelector(
        "#poke-info tr:nth-child(3) td:nth-child(1) img:nth-child(2)"
      ).src = pokeData.sprites.front_shiny;

      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(1)"
      ).innerHTML = pokeData.stats[0].base_stat;
      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(2)"
      ).innerHTML = pokeData.stats[1].base_stat;
      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(3)"
      ).innerHTML = pokeData.stats[2].base_stat;
      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(4)"
      ).innerHTML = pokeData.stats[3].base_stat;
      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(5)"
      ).innerHTML = pokeData.stats[4].base_stat;
      document.querySelector(
        "#poke-stats tr:nth-child(3) td:nth-child(6)"
      ).innerHTML = pokeData.stats[5].base_stat;

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
      console.log("✅ 모든 타입 상성 정보 로드 완료, 최종 상성 계산 시작");

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

      console.log("\n=============================================");
      console.log(`🛡️ ${name.toUpperCase()} (최종 방어 상성)`);
      console.log("=============================================");

      // 6. 최종 결과 출력
      Object.keys(finalResults).forEach((key) => {
        if (finalResults[key].length > 0) {
          console.log(`[${key}]: ${finalResults[key].join(", ")}`);
        }
      });
      console.log("=============================================\n");
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

  console.log(
    `datalist에 ${koreanNames.length}개의 포켓몬 이름이 추가되었습니다.`
  );
}

// --- 최종 실행 로직 (버튼 클릭 연결을 위해 DOMContentLoaded 사용 권장) ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. HTML 조각 로드
  importPage("header");
  importPage("footer");
  importPage("sidenav");

  // 2. 데이터 로드 후 나머지 기능 실행
  loadPokemonData().then(() => {
    populateDatalist();

    // 3. 버튼 클릭 이벤트 연결 (HTML의 onclick="getValues()" 대신 사용 권장)
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
      searchButton.addEventListener("click", getValues);
    } else {
      // 버튼이 없는 경우를 대비해 초기 검색 실행
      getValues();
    }
  });
});
// 기존 loadPokemonData().then(() => { ... }) 코드는 위 DOMContentLoaded 블록으로 대체되었습니다.
