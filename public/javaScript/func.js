require("dotenv").config();
const OpenAI = require("openai");

async function testChat(message, api) {
    let openai = new OpenAI({
        apiKey: api
    })
    try {
        let response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: "다음 내용에서 HTML 태그를 제외한 내용을 한글 존대말로 100자 이내로 요약해주세요." },
                { role: 'user', content: message },
            ],
        });

        const answer = response.choices[0].message;
        return answer.content;  // 실제 텍스트만 반환
    } catch (error) {
        console.error('ChatGPT 요청 중 오류:', error);
        throw error;
    }
}
module.exports.testChat = testChat;


async function humanTurn(data, api) {
    let sysCon = `지금 우리는 스무고개 게임을 하고 있습니다.
당신은 사회자의 역할로, 질문자의 질문에 "네 그렇습니다", "아닙니다", 또는 "정도를 물어보는 질문은 답변할 수 없습니다" 중 하나로만 대답하세요.

[대답 규칙]
1. 질문자가 정답의 특징이나 속성을 묻는 질문이면, 해당 여부에 따라 아래 중 하나로만 대답합니다:
   - "네 그렇습니다."
   - "아닙니다."
   - "정도를 물어보는 질문은 답변할 수 없습니다."
2. 질문자가 정답을 직접적으로 지목한 경우에만 아래의 단답형 숫자로 대답합니다:
   - 정답을 맞췄을 경우: "1"
   - 정답이 틀렸을 경우: "0"

[정답을 맞췄다고 판단하는 기준]
- 질문자가 정답을 정확히 언급한 경우 ("정답은 아인슈타인인가요?", "아인슈타인인가요?", "아인슈타인")
- 띄어쓰기나 맞춤법이 약간 틀려도 정답임이 명확하면 인정
- 유사하거나 전혀 다른 단어를 말한 경우 반드시 "0" 출력
- 단어만 말하거나 서술형("바나나입니다")으로 말했을 경우에도 정답이면 1, 틀리면 0

정답은 "${data.answer}"입니다.

입출력 예시는 다음과 같습니다. (정답이 비행기일 때)

입력: 하늘을 나는 물건인가요?
출력: 네 그렇습니다.

입력: 먹을 수 있나요?
출력: 아닙니다.

입력: 빠른가요?
출력: 정도를 물어보는 질문은 답변할 수 없습니다.

입력: 정답은 비행기인가요?
출력: 1

입력: 비행기인가요?
출력: 1

입력: 비행기
출력: 1

입력: 바나나인가요?
출력: 0

입력: 바나나
출력: 0

입력: 바나나입니다
출력: 0`;

    let openai = new OpenAI({
        apiKey: api
    })

    try {
        let response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {role: "system", content: sysCon},
                {role: "user", content: data.userMsg}
            ]
        })

        let answer = response.choices[0].message;
        return answer.content;
    } catch (err) {
        console.error(err);
        throw error; 
    }
}
module.exports.humanTurn = humanTurn;



const getAnswer = async (data, api) => {
    let openai = new OpenAI({
        apiKey: api
    })

    let sysCon = `당신은 지금 스무고개 게임에서 정답을 만드는 역할입니다.
사용자가 제시하는 하나의 '상위 키워드(예: 교통수단, 과일, 인물 등)'에 대해,
그 하위에 해당하는 **구체적이고 실제로 존재하는 대상 하나만** 출력하세요.

다음 규칙을 반드시 지키세요:

1. 절대 상위 개념(예: '유명인', '신화 속 인물', '교통수단')을 답으로 출력하지 마세요.
2. 인물이나 영화등, 키워드에 대한 답이 다양하고 특정하기 힘든 경우, 추가적인 설명을 덧붙여야 합니다.
4. 실제로 존재하거나, 잘 알려진 고유한 대상이어야 합니다.
5. 너무 희귀하거나 생소한 단어는 피하고, 한국의 국민들이 일반적으로 사람들이 알고 있는 것을 선택하세요.

예시:
- 키워드: 과일 → 출력: 바나나나
- 키워드: 동물 → 출력: 호랑이
- 키워드: 교통수단 → 출력: 자전거
- 키워드: 인물 → 출력: 프랑스의 남성 나폴레옹
- 키워드: 인물 → 출력: 독일의 과학자 남성 나폴레옹
- 키워드: 신화 속 인물 → 출력: 제우스
- 키워드: 영화 → 출력: 한국영화 기생충

지금부터 사용자가 키워드를 제시할 것입니다. 반드시 단어 하나로만 정답을 출력하세요.`;

let userCon = `키워드는 "${data}"입니다. 이 키워드에 해당하는 정답을 한 단어로 출력해주세요.`;

    try {
        let response = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {role: "system", content: sysCon},
                {role: "user", content: userCon}
            ]
        });

        const answer = response.choices[0].message;
        return answer.content 
    } catch (err) {
        console.error(err);
        throw err;
    }
}
module.exports.getAnswer = getAnswer;