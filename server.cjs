/** 역할표 
 *  - 백엔드: 홍유민
 *  - 프론트앤드: 최지환
 *  - 잡역: 공의성
 *  - 깍두기: 이현민
 */

/** todo
 * - 정답 검사를 ChatGPT가 아닌 JS내부 구문으로 검사 : 홍유민
 * - 웹 소켓 room기능 구현 및 정답 데이터를 유저가 가지게 함으로 다수의 기기에서 접근 가능하게 구현 : 홍유민
 * - 남의 팀 방해공작 : 이현민 
 * - 채팅 감시 기능 : 홍유민
 * 
 * 
 * 고민중인거: 
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
        if ('IPv4' !== iface.family || iface.internal !== false) return;
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
    server.listen(3030, "localhost", () => {
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
    res.render("comment.ejs", {comments: comments});
})


// 키워드 선택 
app.get("/selKey", async (req, res) => {
    console.log(`>>링크 접속됨: /selKey`);

    let keys = await db.collection("keys").find().sort({cnt:-1}).toArray();
    let data = {keys: keys};
    res.render("select.ejs", {data:data});
})


// 메인 게임
app.get("/game/:keyword", async (req, res) => {
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


    res.render("mainGame.ejs", {key: gameData.keyName});
})


// 게임 종료 화면 
app.get("/gameEnd/:time/:cnt/:isWin", (req, res) => {
    if (req.params.isWin == 1) {
        console.log("  user win!\n");

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
 */
io.on("connection", (socket) => {


    // 하나의 서버로 각각의 클라이언트를 연결하기 위해 room기능 사용.
    // data.keyword: 유저가 선택한 키워드
    socket.on("joinRoom", async (data) => {
        console.log(`>>유저가 채팅에 입장함.`);
        // room번호는 채팅방 갯수 로 설정정
        let roomNumber = await db.collection("chat").find().toArray()
        roomNumber = roomNumber.length;
        console.log(`  roomNumber: ${roomNumber}`);
        console.log(`  keyword: ${data.keyword}`);

        // 정답 생성성
        let answer = await myfun.getAnswer(data.keyword, APIKEY);
        console.log(`  answer: ${answer}`);

        await db.collection("chat").insertOne({
            roomNumber: roomNumber.toString(),
            metaData: 1234, // 추후에 사용될 메타데이터
            keyword: data.keyword,
            answer: answer,
            msgRecode: [],
        })

        let metaData = await myfun.getMetaData({
            keyword: data.keyword,
            answer: answer,
        }, APIKEY);

        console.log(`  metaData: ${metaData}\n`);

        socket.join(roomNumber.toString()); // 유저를 해당 room에 추가
        io.to(roomNumber.toString()).emit("gameSetUp", {
            keyword: data.keyword,
            answer: answer,
            metaData: metaData,
            room: roomNumber.toString(),
        })
    })
    


    socket.on("userMsg", async (data) => {
        let roomNumber = data.room;
        let answer = data.answer;
        let keyword = data.keyword;
        let cnt = data.cnt;
        let metaData = data.metaData;
        let msg = data.msg;
        let dataInp = {
            answer: answer,
            keyword: keyword,
            metaData: metaData,
            msg: msg
        }
        let result;
        let msgRecode = await db.collection("chat").findOne({roomNumber: roomNumber.toString()})
        msgRecode= msgRecode.msgRecode;


        console.log(`>>room ${roomNumber}으로부터 ${cnt}번째 메세지 수신됨.`);
        console.log(`  answer: ${answer}`);
        console.log(`  keyword: ${keyword}`);
        console.log(`  msg: ${msg}`);

        if (msg.includes(answer)) {
            io.to(roomNumber).emit("answer", 1);
            return;
        }

        result = await myfun.mainFunc(dataInp, APIKEY);
        console.log(`  result: ${result}\n`);

        io.to(roomNumber).emit("serverMsg", result);


        msgRecode.push({
            msg: msg
        })
        msgRecode.push({
            msg: result
        })
        await db.collection("chat").updateOne(
            {roomNumber: roomNumber},
            {$set: {msgRecode: msgRecode}}
        );
    })

    socket.on("submitComment", async (data) => {
        console.log(">>새로운 댓글이 작성됨.");
        console.log(`  userName: ${data.userName}`);
        console.log(`  comment: ${data.content}`);

        // DB에 댓글 저장
        await db.collection("comment").insertOne({
            userName: data.userName,
            content: data.content,
            date: new Date()
        });
    })
})