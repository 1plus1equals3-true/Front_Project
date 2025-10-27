const JSON_FILE_PATH = "assets/json/poke_name.json";

let pokemonNames = {};

// 타입명 한글화
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

// 특수폼 한글화
const formNamesKorean = {
  mega: "메가",
  gmax: "거다이맥스",
  alola: "알로라폼",
  galar: "가라르폼",
  hisui: "히스이폼",
  paldea: "팔데아폼",
  default: "기본",
  // 필요시 추가 가능
};

// 검색데이터 로드
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

// 영어 이름 변환
function getEnglishName(koreanName) {
  const englishName = pokemonNames[koreanName];
  if (englishName) {
    return englishName;
  } else {
    return null;
  }
}

/**
 * 진화 체인 데이터를 재귀적으로 파싱하여 모든 진화체의 유일한 이름을 Set에 담습니다.
 * @param {object} chainData - 현재 진화 단계의 chain 객체
 * @param {Set<string>} evolutionNamesSet - 수집된 포켓몬 이름 Set (중복 제거용)
 */
function parseEvolutionChain(chainData, evolutionNamesSet) {
  // 현재 포켓몬 이름 (영문)을 Set에 추가합니다. (Set은 중복을 자동으로 방지)
  const speciesName = chainData.species.name;
  evolutionNamesSet.add(speciesName); // 👈 수정: Set에 추가 // 다음 진화 단계가 있다면 재귀적으로 호출

  if (chainData.evolves_to && chainData.evolves_to.length > 0) {
    chainData.evolves_to.forEach((nextChain) => {
      // 재귀 호출 시 Set을 전달
      parseEvolutionChain(nextChain, evolutionNamesSet);
    });
  }
}

/**
 * 포켓몬 진화 정보를 받아 DOM 요소를 생성합니다.
 * @param {object} item - 포켓몬 스프라이트 정보 객체 {name, sprite, formTag}
 * @returns {HTMLElement} 생성된 div.evolution-item 요소
 */
function createEvolutionItem(item) {
  const itemDiv = document.createElement("div");
  itemDiv.classList.add("evolution-item"); // 기존 스타일 유지

  const img = document.createElement("img");
  img.src = item.sprite;
  img.alt = `${item.name} (${item.formTag})`;

  const nameDiv = document.createElement("div");
  nameDiv.classList.add("evolution-name");
  nameDiv.textContent = item.name;

  const tagSpan = document.createElement("span");
  tagSpan.classList.add("evolution-form-tag");
  tagSpan.textContent = item.formTag;

  itemDiv.appendChild(img);
  itemDiv.appendChild(nameDiv);
  itemDiv.appendChild(tagSpan);
  return itemDiv;
}

/**
 * 모달을 띄우고 모든 진화 포켓몬을 렌더링합니다.
 * @param {Array<object>} allSprites - 모든 포켓몬 스프라이트 정보 배열
 */
function showEvolutionModal(allSprites) {
  const modal = document.getElementById("evolution-modal");
  const displayContainer = document.getElementById("all-evolution-display");
  const closeButton = modal.querySelector(".close-button"); // 기존 내용 초기화

  displayContainer.innerHTML = ""; // 모든 포켓몬 렌더링

  allSprites.forEach((item) => {
    const itemDiv = createEvolutionItem(item);
    displayContainer.appendChild(itemDiv);
  }); // 모달 보이기

  modal.style.display = "block"; // 닫기 이벤트 리스너: X 버튼

  closeButton.onclick = function () {
    modal.style.display = "none";
  }; // 닫기 이벤트 리스너: 모달 외부 클릭

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}

/**
 * 주어진 진화 계열 포켓몬 이름 배열을 기반으로 이미지와 정보를 렌더링합니다.
 * @param {Array<string>} evolutionSpeciesNames - 진화 계열의 포켓몬 이름 (영문, 중복 없음) 배열
 * @param {string} currentPokemonName - 현재 검색된 포켓몬 이름 (영문)
 * @param {Array<object>} evolutionDetails - { name, conditionTag } 객체 배열 (새로 추가)
 */
async function getAndRenderEvolution(
  evolutionSpeciesNames,
  currentPokemonName,
  evolutionDetails // 👈 인수를 받도록 수정
) {
  const container = document.getElementById("evolution-container");
  container.innerHTML = "";

  // 제목 다시 삽입 (HTML에서 이미 삽입됨, 내용만 초기화)
  // const titleDiv = document.createElement("div");
  // titleDiv.classList.add("card-title");
  // titleDiv.textContent = "진화 계열";
  // container.appendChild(titleDiv);

  // 중복 제거 및 순서 유지를 위한 Set 사용 후 Array 변환
  const uniqueNames = [...new Set(evolutionSpeciesNames)];

  // 각 진화체에 대한 Promise를 만듭니다. (Sprite, Forms 정보를 위해)
  const speciesPromises = uniqueNames.map((name) =>
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}/`).then((res) =>
      res.json()
    )
  );

  const allSpeciesData = await Promise.all(speciesPromises);

  // 모든 폼 정보를 수집 (메가, 거다이맥스, 리전폼 등)
  const allEvolutionSprites = [];
  const processedSpecies = new Set(); // 기본 폼 중복 방지 Set

  for (const speciesData of allSpeciesData) {
    const defaultName = speciesData.name;

    const conditionDetail = evolutionDetails.find(
      (d) => d.name === defaultName
    );
    const stageTag = conditionDetail ? conditionDetail.conditionTag : "";

    // 💡 이미 처리된 기본 폼이면 건너뜁니다. (Species URL로 조회했으므로 고유하지만, 안전을 위해 추가)
    if (processedSpecies.has(defaultName)) continue;
    processedSpecies.add(defaultName);

    const defaultKoreanName =
      Object.keys(pokemonNames).find(
        (key) => pokemonNames[key] === defaultName
      ) || defaultName;

    // 1. 기본 폼 (진화체) 추가
    try {
      const defaultPokemonResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${defaultName}`
      );
      const defaultPokemonData = await defaultPokemonResponse.json();

      let finalTag = "";

      // 진화 트리에서 검색한 포켓몬 "현재 포켓몬"으로 표시 코드
      // if (defaultName === currentPokemonName) {
      //   // 1. 현재 포켓몬일 경우: "현재 포켓몬"을 우선 표시
      //   finalTag = "현재 포켓몬";
      // } else
      if (stageTag === "미진화체") {
        // 2. 진화 체인의 가장 첫 포켓몬일 경우: "미진화체" 표시
        finalTag = "미진화체";
      } else {
        // 3. 그 외 (중간 진화체 및 최종 진화체): 'Lv. XX' 또는 '조건 진화'가 됨
        finalTag = stageTag; // <--- 이 부분이 이제 '진화체' 대신 정확한 조건이 됩니다.
      }

      allEvolutionSprites.push({
        name: defaultKoreanName,
        sprite: defaultPokemonData.sprites.front_default,
        formTag: finalTag,
        sortOrder: 1,
      });

      // 2. 특수 폼 (Forms) 처리
      // species data의 varieties를 확인 (리전폼, 특수폼 포함)
      for (const variety of speciesData.varieties) {
        if (!variety.is_default) {
          const formNameUrl = variety.pokemon.url;
          const formNameResponse = await fetch(formNameUrl);
          const formNameData = await formNameResponse.json();
          const formSprite = formNameData.sprites.front_default;

          if (formSprite) {
            let formTag = "특수폼";
            let sortOrder = 2; // 특수폼은 2순위

            // 폼 이름 분석을 통해 태그 결정
            const variantName = variety.pokemon.name;
            if (variantName.includes("-mega")) {
              formTag = formNamesKorean.mega;
              sortOrder = 3; // 메가진화는 3순위
            } else if (variantName.includes("-gmax")) {
              formTag = formNamesKorean.gmax;
              sortOrder = 4; // 거다이맥스는 4순위
            } else if (variantName.includes("-alola")) {
              formTag = formNamesKorean.alola;
            } else if (variantName.includes("-galar")) {
              formTag = formNamesKorean.galar;
            } else if (variantName.includes("-hisui")) {
              formTag = formNamesKorean.hisui;
            }

            // 특수폼 이름 (예: 리자몽-메가-X)에서 포켓몬 이름 부분을 제외한 나머지를 태그로 사용
            const cleanedFormName = variantName
              .replace(`${defaultName}-`, "")
              .replace(/-/g, " ");

            allEvolutionSprites.push({
              name: defaultKoreanName, // 포켓몬 이름 자체는 같으므로 한글 이름 사용
              sprite: formSprite,
              formTag: `${formTag} (${cleanedFormName})`,
              sortOrder: sortOrder,
            });
          }
        }
      }
    } catch (error) {
      console.error(`포켓몬 ${defaultName}의 폼 정보 호출 실패:`, error);
    }
  }

  // 최종 렌더링을 위해 이름 순(진화 순서) 후 폼 태그 순으로 정렬 (정렬 로직을 추가하는 것이 좋지만, 여기서는 간단히 이름순으로)
  allEvolutionSprites.sort((a, b) => {
    // 1. 기본 이름 순서 (진화 순서)
    const nameIndexA = uniqueNames.indexOf(pokemonNames[a.name] || a.name);
    const nameIndexB = uniqueNames.indexOf(pokemonNames[b.name] || b.name);
    if (nameIndexA !== nameIndexB) return nameIndexA - nameIndexB;

    // 2. 폼 순서 (기본폼 -> 리전폼/특수폼 -> 메가 -> 거다이맥스)
    return a.sortOrder - b.sortOrder;
  });

  // 중복 스프라이트를 제거합니다 (같은 이름, 같은 폼 태그)
  const seen = new Set();
  const finalSprites = allEvolutionSprites.filter((item) => {
    const key = `${item.name}-${item.formTag}-${item.sprite}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // ----------------------------------------------------------------------
  // 6개 이하일 때 모두 표시, 7개 이상일 때 더보기 버튼 사용
  // ----------------------------------------------------------------------
  const totalCount = finalSprites.length; // 1. '더보기' 버튼이 필요한지 여부 (총 7개 이상일 때만 필요)
  const requiresMoreButton = totalCount > 6; // 2. 실제로 화면에 표시할 포켓몬 개수 결정
  let limit = totalCount;
  if (requiresMoreButton) {
    // 7개 이상일 경우, 5개만 표시하고 6번째 칸을 버튼에 양보
    limit = 5;
  } else {
    // 6개 이하일 경우, 모두 표시 (limit = totalCount)
    limit = totalCount;
  }
  const spritesToDisplay = finalSprites.slice(0, limit); // 최종 이미지 DOM 렌더링
  spritesToDisplay.forEach((item) => {
    const itemDiv = createEvolutionItem(item);
    container.appendChild(itemDiv);
  }); // 더보기 버튼 (6번째 칸) 렌더링
  if (requiresMoreButton) {
    const remainingCount = totalCount - limit; // 7 - 5 = 2개부터 시작
    const moreButtonDiv = document.createElement("div"); // 버튼을 6번째 칸에 배치하기 위해 .evolution-item 클래스 유지
    moreButtonDiv.classList.add("evolution-item", "more-button");
    const button = document.createElement("button");
    button.textContent = `더보기 (+${remainingCount})`;
    button.addEventListener("click", () => {
      showEvolutionModal(finalSprites); // 모든 포켓몬 정보를 전달
    });
    moreButtonDiv.appendChild(button);
    container.appendChild(moreButtonDiv);
  }
} // <-- getAndRenderEvolution 함수 종료

/**
 * 진화 체인 데이터를 재귀적으로 파싱하여 포켓몬 이름과 진화 조건을 수집합니다.
 * @param {object} chainData - 현재 진화 단계의 chain 객체
 * @param {Array<object>} evolutionDetails - { name, conditionTag } 객체를 담을 배열
 * @param {string} incomingCondition - 이전 단계에서 다음 단계로의 진화 조건 태그
 */
function parseEvolutionChainDetails(
  chainData,
  evolutionDetails,
  incomingCondition = "미진화체"
) {
  const speciesName = chainData.species.name; // 현재 포켓몬 정보 저장 (중복은 getAndRenderEvolution에서 처리됨)

  evolutionDetails.push({
    name: speciesName,
    conditionTag: incomingCondition,
  });

  // 다음 진화 단계가 있다면 재귀적으로 호출
  if (chainData.evolves_to && chainData.evolves_to.length > 0) {
    chainData.evolves_to.forEach((nextChain) => {
      // 현재 단계에서 다음 단계(재귀 호출될 포켓몬)로의 진화 조건을 파악합니다.
      const evolutionDetailsArray = nextChain.evolution_details;
      let nextCondition = "조건 진화"; // 기본값 (조건이 명확하지 않는 진화체)

      if (evolutionDetailsArray && evolutionDetailsArray.length > 0) {
        const detail = evolutionDetailsArray[0]; // 보통 하나의 조건만 사용

        if (detail.min_level) {
          // 레벨 진화
          nextCondition = `Lv. ${detail.min_level}`;
        } else if (detail.item || detail.trigger.name !== "level-up") {
          // 🚨 'level-up'이 아닌 trigger(trade, happiness 등)는 모두 '조건 진화'로 통일합니다.
          nextCondition = "조건 진화";
        } else if (
          detail.trigger.name === "level-up" &&
          detail.min_level === null
        ) {
          // 🚨 레벨업(level-up) 트리거인데 최소 레벨이 없는 경우
          //    (예: 특정 시간대 레벨업, 특정 아이템 소지 후 레벨업 등 특수조건)
          //    이 경우도 '조건 진화'로 처리하는 것이 좋습니다.
          nextCondition = "조건 진화";
        }
      }
      // 다음 단계로 재귀 호출
      parseEvolutionChainDetails(nextChain, evolutionDetails, nextCondition);
    });
  } else {
    // 💥 중요: chainData.evolves_to가 없으면 (최종 진화체이면)
    // 여기서 자동으로 함수가 종료되므로, 이 포켓몬의 conditionTag는 '최종 진화체'가 아닌
    // 'Lv. 16' 같은 이전 단계의 'nextCondition'이 됩니다.
    // 'getAndRenderEvolution'에서 이 값을 보고 '최종 진화체'로 덮어써야 합니다.
  }
}

// 값 가져오기
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

      // 카드 3 업데이트
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
      // ⭐ 진화 정보 및 타입 상성 준비 ⭐
      // ----------------------------------------------------

      // 1. 포켓몬 Species 정보 호출 (Evolution Chain URL을 얻기 위해)
      const speciesUrl = pokeData.species.url;
      const speciesPromise = fetch(speciesUrl).then((res) => res.json());

      // 2. 타입 상성 API 호출을 위한 준비
      const typePromises = pokeData.types.map((typeInfo) => {
        const typeUrl = typeInfo.type.url; // 각 타입의 상세 정보 URL
        return fetch(typeUrl).then((res) => {
          if (!res.ok)
            throw new Error(`타입 상성 호출 실패: ${typeInfo.type.name}`);
          return res.json();
        });
      });

      // Promise.all을 반환하여 다음 .then()에서 모든 타입 상성 데이터를 받습니다.
      //return Promise.all(typePromises);
      return Promise.all([
        speciesPromise,
        Promise.all(typePromises),
        englishName,
      ]);
    })
    .then(([speciesData, allTypeData, currentPokemonName]) => {
      // Evolution Chain 데이터 가져오기 및 렌더링
      const evolutionChainUrl = speciesData.evolution_chain.url;
      return fetch(evolutionChainUrl)
        .then((res) => res.json())
        .then((evolutionData) => {
          // 1. 모든 진화 데이터를 담을 배열을 준비합니다.
          const evolutionDetails = []; // { name: '...', level: '...' } 형태 저장 // 2. 새로운 파싱 함수를 호출하여 포켓몬 이름과 조건을 함께 수집합니다. //    (이 함수는 아래 B에 새로 정의할 것입니다)

          parseEvolutionChainDetails(evolutionData.chain, evolutionDetails);

          // 3. getAndRenderEvolution 함수에 두 가지 데이터를 전달합니다.
          //    - 고유한 포켓몬 이름 배열 (순서 정렬용)
          const uniqueEvolutionNames = [
            ...new Set(evolutionDetails.map((d) => d.name)),
          ];

          //    - 진화 정보 디테일 배열
          getAndRenderEvolution(
            uniqueEvolutionNames,
            currentPokemonName,
            evolutionDetails
          ); // 👈 변경: evolutionDetails 추가 // 다음 단계(타입 상성)로 데이터를 전달

          return allTypeData;
        });
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

// 리스트에 이름 채우기 함수
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
