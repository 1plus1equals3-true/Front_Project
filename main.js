function getValues() {
  const name = document.getElementById("name-input").value;

  const apiUrl = "https://pokeapi.co/api/v2/pokemon/" + name + "/";

  // 1. fetch 함수를 이용해 GET 요청 보내기
  fetch(apiUrl)
    // 2. 첫 번째 .then()에서 응답 객체를 받아서 JSON 형태로 변환
    .then((response) => {
      // 응답 상태 코드가 200-299 사이에 있는지 확인
      if (!response.ok) {
        throw new Error(`요청 실패! 상태 코드: ${response.status}`);
      }
      return response.json(); // 응답 본문을 JSON으로 파싱
    })
    // 3. 두 번째 .then()에서 변환된 JSON 데이터를 받아서 사용
    .then((pokeData) => {
      console.log("요청 성공!");
      console.log(`이름: ${pokeData.name}`);
      console.log(`키: ${pokeData.height}`);
      console.log(`무게: ${pokeData.weight}`);
      console.log(`H: ${pokeData.stats[0].base_stat}`);
      console.log(`A: ${pokeData.stats[1].base_stat}`);
      console.log(`B: ${pokeData.stats[2].base_stat}`);
      console.log(`C: ${pokeData.stats[3].base_stat}`);
      console.log(`D: ${pokeData.stats[4].base_stat}`);
      console.log(`S: ${pokeData.stats[5].base_stat}`);
      console.log(`T: ${pokeData.types[0].type}`);
      document.getElementById(
        "form-result"
      ).innerHTML = `검색 : ${pokeData.name} </br> H`;
    })
    // 4. 요청이나 처리 과정 중 발생한 오류를 캐치
    .catch((error) => {
      console.error("오류 발생:", error.message);
    });
}
