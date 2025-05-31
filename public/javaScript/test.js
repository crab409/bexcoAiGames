// 승리 페이지: 랭킹 기록 버튼
if (document.querySelector(".recode")) {
    document.querySelector(".recode").addEventListener("click", function() {
        let data = {
            name: document.querySelector(".form-control").value,
            time: window.winTime,
            cnt: window.winCnt,
        }
        if(!data.name) {
            alert("이름을 입력하세요!");
            return;
        }
        location.replace(`/recode/${data.name}/${data.time}/${data.cnt}`);
    });
}

// comment 페이지: 평가 제출
if (document.querySelector(".btn.btn-outline-success")) {
    const socket = io();
    document.querySelector(".btn.btn-outline-success").addEventListener("click", function() {
        let userName = document.querySelector(".form-control").value;
        let content = document.querySelector("textarea").value;
        if (userName && content) {
            let data = {
                userName: userName,
                content: content
            };
            socket.emit("submitComment", data);
            document.querySelector(".list-group").insertAdjacentHTML("afterbegin",
                `<li class="list-box list-group-item">
                    <h4>${userName}</h4>
                    <p>${content}</p>  
                </li>`
            );
            document.querySelector(".form-control").value = '';
            document.querySelector("textarea").value = '';
        } else {
            alert("이름과 내용을 모두 입력해주세요.");
        }
    });
}

// 랭킹 페이지: 이름 검색 필터
if (document.getElementById('ranking-search')) {
    const searchInput = document.getElementById('ranking-search');
    const humanList = document.getElementById('human-ranking-list');
    searchInput.addEventListener('input', function() {
        const keyword = searchInput.value.trim().toLowerCase();
        Array.from(humanList.children).forEach(li => {
            const name = li.querySelector('.name').textContent.toLowerCase();
            li.style.display = name.includes(keyword) ? '' : 'none';
        });
    });
}