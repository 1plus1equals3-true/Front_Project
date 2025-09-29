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

function getValues() {
  const name = document.getElementById("name-input").value;
  const apiUrl = "https://pokeapi.co/api/v2/pokemon/" + name + "/";

  fetch(apiUrl)
    // 첫 번째 .then()에서 응답 객체를 받아서 JSON 형태로 변환
    .then((response) => {
      if (!response.ok) {
        throw new Error(`요청 실패! 상태 코드: ${response.status}`);
      }
      return response.json(); // 응답 본문을 JSON으로 파싱
    })
    // 두 번째 .then()에서 변환된 JSON 데이터를 받아서 사용
    .then((pokeData) => {
      console.log(pokeData);
      console.log(`이름: ${pokeData.name}`);
      console.log(`키: ${pokeData.height}`);
      console.log(`무게: ${pokeData.weight}`);
      console.log(`T: ${pokeData.types[0].type.name}`);
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
    })
    // 요청이나 처리 과정 중 발생한 오류를 캐치
    .catch((error) => {
      console.error("오류 발생:", error.message);
    });
}
//getValues();
