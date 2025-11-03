document.addEventListener("DOMContentLoaded", () => {
  const memoForm = document.getElementById("memo-form");
  const memoInput = document.getElementById("memo-input");
  const memoList = document.getElementById("memo-list");
  const STORAGE_KEY = "simple_memos";

  // 1. 로컬 스토리지에서 메모 불러오기
  function getMemos() {
    const memos = localStorage.getItem(STORAGE_KEY);
    // 메모는 문자열 배열로 저장됩니다.
    return memos ? JSON.parse(memos) : [];
  }

  // 2. 메모를 로컬 스토리지에 저장
  function saveMemos(memos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
  }

  // 3. 메모를 화면에 렌더링 (수정 가능하도록 구조 변경)
  function renderMemos() {
    const memos = getMemos();
    memoList.innerHTML = ""; // 기존 목록 초기화

    memos.forEach((memo, index) => {
      const listItem = document.createElement("li");
      listItem.dataset.index = index; // 데이터 인덱스 설정

      // 메모 내용 표시 (클릭하면 수정 모드로 전환)
      const contentDiv = document.createElement("div");
      contentDiv.className = "memo-content";
      contentDiv.textContent = memo;
      contentDiv.addEventListener("click", () =>
        enableEditMode(listItem, index, memo)
      );

      // 삭제 버튼
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-btn";
      deleteButton.textContent = "X";
      deleteButton.dataset.index = index; // 삭제 시 사용할 인덱스

      listItem.appendChild(contentDiv);
      listItem.appendChild(deleteButton);
      memoList.appendChild(listItem);
    });
  }

  // 4. 수정 모드 활성화 함수
  function enableEditMode(listItem, index, currentText) {
    // 이미 수정 모드이면 중복 실행 방지
    if (listItem.querySelector("textarea.edit-input")) return;

    const contentDiv = listItem.querySelector(".memo-content");
    const deleteBtn = listItem.querySelector(".delete-btn");

    // 텍스트 영역 생성
    const editInput = document.createElement("textarea");
    editInput.className = "edit-input";
    editInput.value = currentText;
    editInput.rows = 4;

    // 기존 내용 숨기고 입력 필드 삽입
    listItem.replaceChild(editInput, contentDiv);
    listItem.removeChild(deleteBtn);

    editInput.focus();

    // 수정 완료 처리 함수 (포커스를 잃었을 때만 저장되도록)
    const saveEdit = () => {
      const newText = editInput.value.trim();
      const memos = getMemos();

      if (newText && newText !== currentText) {
        // 내용이 있고, 기존 내용과 다를 때만 저장
        memos[index] = newText;
        saveMemos(memos);
      }
      // 수정 후 목록 전체 갱신
      renderMemos();
    };

    // 포커스를 잃었을 때 (다른 곳 클릭 시) 저장
    editInput.addEventListener("blur", saveEdit);
  }

  // 5. 메모 추가 처리 (기존과 동일)
  memoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newMemoText = memoInput.value.trim();

    if (newMemoText) {
      const memos = getMemos();
      memos.push(newMemoText);
      saveMemos(memos);
      renderMemos();
      memoInput.value = "";
    }
  });

  // 6. 메모 삭제 처리 (이벤트 위임 사용 - 버튼이 다시 렌더링되므로 리스너는 부모에)
  memoList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const indexToDelete = parseInt(e.target.dataset.index);
      let memos = getMemos();

      // 해당 인덱스의 메모 삭제
      memos.splice(indexToDelete, 1);

      saveMemos(memos);
      renderMemos();
    }
  });

  // 페이지 로드 시 기존 메모 렌더링
  renderMemos();
});
