/** todo
 * - method override을 통한 DB구문 수정
 * - 메세지 기능에 ChatGPT API 삽입
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
const url = process.env.DataBase; 
//const url = "mongodb+srv://admin:passwordpassword@alz.2jxno.mongodb.net/?retryWrites=true&w=majority&appName=alz"
new MongoClient(url).connect().then((client)=>{
    console.log("DB연결 성공");
    db = client.db("bexco");
    server.listen(8080, () => {
        console.log(`http://${localIP}:8080 에서 서버 실행중`);
    });
}).catch((err) => {
    console.log(err);
});



// 메인 화면
app.get("/", async (req, res) => {
    res.render("index.ejs");

    let data = {
        answer: "바나나",
        userMsg: "비행기"
    }

    let result = await myfun.humanTurn(
        data,
        process.env.OPENAI_API_KEY
    )
    console.log(result);
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


app.get("/gameEnd/:mode/:time/:isWin", (req, res) => {
    res.render("index.ejs");
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
    console.log("페이지와 서버가 연결됨.\n");

    socket.on("getAns", async (data) => {
        answer = await myfun.getAnswer(data, APIKEY);
        console.log(answer);
    })
    
    socket.on("userMessage", async (data) => {
        console.log(data);
        let dataInp = {
            answer: answer,
            userMsg: data.msg
        }
        let result = await myfun.humanTurn(dataInp, APIKEY); // 여기다가 ChatGPT API 결과값 꽃아넣으면 됨
        console.log(result);
        io.emit("serverMessage", (result));
    })
})