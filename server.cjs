/** todo
 * - comment(댓글기능) 디자인 수정 : 최지환
 * - humanTurn 승리조건 구체화 : 최지환
 * - 키워드 5개 더 찾아보기 : 공의성
 * - 남의 팀 방해공작 : 이현민 
 * 
 * 
 * 고민중인거: 
 * - 채팅 감시 기능 : 홍유민
 * - dataBase를 mySQL로 전환 : 홍유민
 */


// 환경변수 가져오는 라이브러리
require('dotenv').config();

// 서버 돌리는 npm 라이브러리
const express = require("express");
const app = express();

// mongoDB 연결하는 라이브러리
const { MongoClient, ObjectId } = require('mongodb');

// 수정 문법 변경 코드 
const methodOverride = require('method-override');

// 웹 소켓 기능 라이브러리
const { createServer } = require("http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server);


// 난수를 생성하는 함수 
const getRandInt = (max) => {
    return Math.floor(Math.random()*max);
}


const OpenAI = require('openai');
const myfun  = require("./public/javaScript/func.js");
const APIKEY = process.env.OPENAI_API_KEY;


// 미들웨어 등록 및 설정
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));



let localIP;
var os = require('os');
const { redirect } = require('express/lib/response');
var ifaces = os.networkInterfaces();
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
            return;
        }

        // Remove 'Ethernet' check, so it works for any interface
        if (alias >= 1) {
            // This single interface has multiple IPv4 addresses
            // console.log(ifname + ':' + alias, iface.address);
        } else {
            // This interface has only one IPv4 address
            // console.log(ifname, iface.address);
        }
        ++alias;
        localIP = iface.address;
    });
});



// 데이터 베이스와 서버를 연결하고, 서버를 실행시키는 코드
let db;
//const url = process.env.DataBase; 
const url = "mongodb+srv://admin:passwordpassword@alz.2jxno.mongodb.net/?retryWrites=true&w=majority&appName=alz"
new MongoClient(url).connect().then((client)=>{
    console.log("DB연결 성공");
    db = client.db("bexco");
    server.listen(3030, () => {
        console.log(`http://${localIP}:3030 에서 서버 실행중`);
    });
}).catch((err) => {
    console.log(err);
});



// 메인 화면
app.get("/", async (req, res) => {
    res.render("index.ejs");
})


app.get("/ranking", async (req, res) => { 
    let recodes = await db.collection("recode").find().sort({"cnt":1 ,"time":1}).toArray();
    res.render("ranking.ejs", {recode: recodes});
})

app.get("/comment", async (req, res) => {
    let comments = await db.collection("comment").find().sort({date:-1}).toArray();
    console.log(comments)
    res.render("comment.ejs", {comments: comments});
})


// 키워드 선택 
app.get("/selKey/:mode", async (req, res) => {

    let mode = req.params.mode;
    console.log(`>>링크 접속됨: /selKey/${mode}`);


    if (mode=="human" || mode=="ai") {
        let keys = await db.collection("keys").find().sort({cnt:-1}).toArray();
        let data = {mode: mode, keys: keys};
        res.render("select.ejs", {data:data});

    } else { // 유저가 잘못된 경로로 접근시에 처리하는 예외처리.
        console.log("  잘못된 접근이 감지됨.\n  메인화면으로 전환함.\n");
        res.redirect('/');
    }
})


// 메인 게임
app.get("/game/:mode/:keyword", async (req, res) => {
    let gameData
    try {
        gameData = await db.collection("keys").findOne({_id: new ObjectId(req.params.keyword)});
        if (gameData==null) {
            console.log("  잘못된 _id입력됨.\n  메인화면으로 전환함.");
            res.redirect('/');
            return null;
        }
    } catch(e) {
        console.log("  잘못된 _id입력 감지됨.\n  메인화면으로 전환함.");
        res.redirect('/');
        return null;
    }
    
    // 자주 쓰이는 키워드는 위로 올려서 노출을 늘리는 코드 
    await db.collection("keys").updateOne(
        {_id: gameData._id},
        {$set: {cnt: gameData.cnt+1}}
    );


    res.render("mainGame.ejs", {key: gameData.keyName, mode: req.params.mode});
})


// 게임 종료 화면 
app.get("/gameEnd/:mode/:time/:cnt/:isWin", (req, res) => {
    if (req.params.isWin == 1) {
        console.log("유저 승리");

        let data = {
            time: Number(req.params.time).toFixed(2), // 소수점 둘째자리까지 표현
            cnt: req.params.cnt,
        }

        res.render("win.ejs", (data));
    } else {
        console.log("유저 패배");
        res.render("lose.ejs");
    }
})

app.get("/recode/:userName/:time/:cnt", async (req, res) => {
    let userName = req.params.userName;
    let time = Number(req.params.time); 
    let cnt = Number(req.params.cnt);

    // 유저 이름이 없을 경우 예외처리
    if (userName == "" || userName == undefined) {
        console.log("유저 이름이 입력되지 않았습니다.");
        res.redirect("/");
        return;
    }

    // recode에 유저 기록 저장
    await db.collection("recode").insertOne({
        userName: userName,
        time: time,
        cnt: cnt,
        date: new Date()
    });

    console.log("유저 기록 저장됨");
    res.redirect("/");
})


/** 핵심기술 1 : 웹 소켓
 * - 기존의 웹 통신 규약(HTTP)은 자료를 전송하고, 자료를 받는 등의 정적 통신임
 *    => 실시간 통신이 아니란 뜻
 * 
 * - 이번에 채팅기능을 가져오기 위해서 웹 소켓 기능을 불러옴. 
 * - 웹 소켓 기능은 서버와 유저가 실시간으로 통신할 수 있게 하는 기능임.
 * 
 * - userMessage : 유저가 보낸 메세지
 * - serverMessage : 서버서가 보내는 메세지
 * - getAns : 정답 생성하기
 */
io.on("connection", (socket) => {
    let answer;
    let msgRecode = [];
    console.log("페이지와 서버가 연결됨.\n");

    // AI가 사회자일 경우, 정답을 생성하는 코드
    socket.on("getAns", async (data) => {
        console.log(">>정답 생성 요청됨.");
        answer = await myfun.getAnswer(data, APIKEY);
        console.log(`  정답: ${answer}`);
    });

    // 첫 질문을 생성하는 코드
    socket.on("getQustion", async (data) => {
        console.log(">>질문 생성이 요청됨.");
        console.log(`  keyWord: ${data}`);
        console.log(`  generating...`);
        let dataInp = { key: data, msgRecode: myfun.getMsgRecode(msgRecode) };
        let result = await myfun.AIturn(dataInp, APIKEY);
        console.log(`  result : ${result}`);
        msgRecode.push(result); // 질문 기록에 추가
        io.emit("serverMessage", result); // 클라이언트에 질문 전송
    });

    // 사용자 메시지 처리
    socket.on("userMessage", async (data) => {
        console.log(`>>${data.cnt}번째 유저 채팅 입력됨`);
        console.log(`  keyword  : ${data.key}`);
        console.log(`  userMsg  : ${data.msg}`);

        let dataInp = { answer: answer, userMsg: data.msg };
        let result = await myfun.AIturn(dataInp, APIKEY); // AIturn으로 변경

        if (result == 1) {
            io.emit("answer", 1); // 정답일 경우
        } else if (result.length > 1) {
            io.emit("serverMessage", result); // AI 응답 전송
        } else {
            io.emit("serverMessage", "정답이 아닙니다. 다시 시도해보세요.");
        }

        // 로그에 기록 남기는 코드
        console.log(`  serverMsg: ${result}`);
        console.log();
    });

    // 댓글 작성 이벤트 처리
    socket.on("submitComment", async (data) => {
        console.log(">>새로운 댓글이 작성됨.");
        console.log(`  userName: ${data.userName}`);
        console.log(`  comment: ${data.content}`);

        // DB에 댓글 저장
        const savedComment = {
            userName: data.userName,
            content: data.content,
            date: new Date(),
        };
        await db.collection("comment").insertOne(savedComment);

        // 저장된 댓글을 모든 클라이언트에 실시간으로 전송
        io.emit("commentSaved", savedComment);
    });
});