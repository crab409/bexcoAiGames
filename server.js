require('dotenv').config();
// 서버 돌리는 npm 라이브러리
const express = require("express");
const app = express();
// mongoDB 연결하는 라이브러리
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');

// 난수를 생성하는 함수 
const getRandInt = (max) => {
    return Math.floor(Math.random()*max);
}



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
new MongoClient(url).connect().then((client)=>{
    console.log("DB연결 성공");
    db = client.db("bexco");
    app.listen(8080, () => {
        console.log(`http://${localIP}:8080 에서 서버 실행중`);
    });
}).catch((err) => {
    console.log(err);
});



app.get("/", async (req, res) => {
    res.render("index.ejs");
})


app.get("/selKey/:mode", async (req, res) => {

    let mode = req.params.mode;
    console.log(`>>링크 접속됨: /selKey/${mode}`);


    if (mode=="human" || mode=="ai") {
        let keys = await db.collection("keys").find().sort({cnt:1}).toArray();
        let data = {mode: mode, keys: keys};
        res.render("select.ejs", {data:data});

    } else { // 유저가 잘못된 경로로 접근시에 처리하는 예외처리.
        console.log("  잘못된 접근이 감지됨.\n  메인화면으로 전환함.\n");
        res.redirect('/');
    }
})

app.get("game/:keyword", async (req, res) => {

    // 자주 쓰이는 키워드는 위로 올려서 노출을 늘리는 코드 
    let gameData = await db.collection("keys").findOne({_id: new ObjectId(req.params.keyword)});
    let cnt = gameData.cnt + 1;
    console.log(cnt);
    await db.collection("keys").updateOne(
        {_id: gameData._id},
        {$set: {cnt: cnt}}
    )
})
