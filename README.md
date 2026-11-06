# 프로야구 선수를 꿈꿨던 AI 연구원

배명중학교 야구부 강연 발표자료 (2026. 11. 7.)

웹 기반 슬라이드입니다. `index.html` 하나로 동작하며 빌드 과정이 없습니다.

## 발표할 때

- 다음: 오른쪽 화살표, 스페이스, Page Down, 마우스 휠 아래, 화면 오른쪽 끝 클릭
- 이전: 왼쪽 화살표, Page Up, 마우스 휠 위, 화면 왼쪽 끝 클릭
- 처음과 마지막: Home, End
- 특정 슬라이드로: 숫자 입력 후 Enter
- 전체 화면: F
- 조작 안내: 물음표 키

주소 뒤에 `#7`처럼 번호를 붙이면 그 슬라이드에서 시작합니다. 새로고침해도 자리를 기억합니다.

## 고치고 싶을 때

- 글: `index.html`의 각 `<section class="slide">` 안 텍스트를 바로 고치면 됩니다.
- 사진: `assets/img/`에 넣고 `<img src>`만 바꾸면 됩니다. 사진 크기는 `figure`의 `style`에 적힌 가로세로 값으로 정해집니다.
- 색과 글꼴: `assets/css/deck.css` 맨 위의 `:root` 변수.
- 하단 타임라인의 구간: `assets/js/deck.js`의 `chapters` 배열 (`start`는 0부터 세는 슬라이드 번호).

## 글꼴

- 본문: Pretendard (SIL Open Font License)
- 제목: 마루 부리, 네이버 (SIL Open Font License)

둘 다 `assets/fonts/`에 함께 들어 있어 외부 서버 없이 동작합니다.
