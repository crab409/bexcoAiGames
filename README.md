1. 실행방법

   i.    github에 게시된 코드를 받아온다.
   
   ii.   node.js를 웹에서 검색해 설치한다.
   
   iii.  VS CODE로, 서버 폴더를 연다.

   iv-1. 터미널에 'npm'을 입력한다.

   iv-2. 만약 오류가 발생한다면, window powerShell을 관리자 권한으로 열고 아래 명령어를 입력한다.
   
         Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

   v.    터미널에 아래 명령어를 입력한다
         npm install

   vi.   서버폴더 내에 '.env'라는 파일을 만든 후, 조장으로부터 내용물을 받아온다. (선택

   vii.  'server.cjs' 파일안에 'const url'부분을 찾는다.
   
         두개의 'url'변수가 존재하고, 둘중 하나는 주석처리가 되어있을 것이다.
   
         위의 것은 주 DataBase 링크이고, 아래것은 테스트용 DataBase링크이다.
   
         둘중 원하는 것을 선택하고, 나머진 주석처리한다.

   iix.  터미널에 아래 명령어를 입력한다.
   
         node server.cjs
         
