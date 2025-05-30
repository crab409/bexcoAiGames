const OpenAI = require("openai");

let model = "gpt-3.5-turbo"; // 사용할 모델 설정

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
    const sysCon = `
당신은 스무고개 게임의 사회자입니다.  
사용자가 주어진 주제에 대해 질문하거나 정답을 추리합니다.  

아래 규칙에 따라 반드시 한 문장으로만 답변하세요:  

[1] 정답 직언  
- 사용자가 정답과 정확히 일치하는 단어 또는 문장만 말한 경우에만 "1" 또는 "0" 출력  
- 정답과 완전히 일치하지 않는 질문이나 설명은 정답 직언으로 처리하지 말 것

[2] 수치 비교 질문  
- 질문에 “<숫자>위보다 높나요?”, “<숫자>위보다 낮나요?”, “<숫자>위 초과인가요?”, “<숫자>위 이하인가요?” 같은 패턴이 있으면,  
  정답 내용에 부합하면 “네 그렇습니다.”, 아니면 “아닙니다.”로 답하세요.  
- 질문에 정확한 수치 없이 “많은가요?”, “높은 편인가요?” 등 상대적 정도를 묻는 경우, “정도를 물어보는 질문엔 답변할 수 없습니다”라고 하세요.  

[3] 일반 속성 질문  
- “색깔이 빨간가요?”, “한국에서 제작됐나요?”, “크기가 큰가요?” 같은 사실 여부 질문은  
  정답 내용에 있으면 “네 그렇습니다.”, 없으면 “아닙니다.”라고 답하세요.  
- “얼마나 큰가요?”, “얼마나 오래가나요?” 등 정도를 묻는 질문에는 “정도를 물어보는 질문엔 답변할 수 없습니다”라고 답하세요.  

[4] 과거 사실 여부 질문  
- “~한 역사가 있나요?”, “~한 적 있나요?” 등 과거 행위 여부를 묻는 질문은  
  정답 내용에 포함되어 있으면 “네 그렇습니다.”, 아니면 “아닙니다.”로 답하세요.  

[5] 그 외 질문  
- 인사, 농담, 게임 주제와 무관한 질문은 “게임의 주제에 대한 질문이 아닙니다.”라고 답하세요.  

[6] 오타 및 변형 처리  
- 질문에 오타가 있더라도 위 패턴이 보이면 해당 규칙대로 답하세요.  

---  

주제: "${data.key}"  

정답: "${data.answer}"  

출력 가능한 문장 (반드시 아래 중 하나):  
- 1  
- 0  
- 네 그렇습니다.  
- 아닙니다.  
- 정도를 물어보는 질문엔 답변할 수 없습니다  
- 게임의 주제에 대한 질문이 아닙니다.`;

    let openai = new OpenAI({
        apiKey: api
    })

    try {
        let response = await openai.chat.completions.create({
            model: model,
            messages: [
                {role: "system", content: sysCon},
                {role: "user", content: data.userMsg}
            ]
        })

        let answer = response.choices[0].message;
        return answer.content.trim();
    } catch (err) {
        console.error(err);
        throw err;
    }
}
module.exports.humanTurn = humanTurn;



const getAnswer = async (data, api) => {
    let openai = new OpenAI({
        apiKey: api
    })

    let sysCon = `
당신은 지금 스무고개 게임에서 정답을 만드는 역할입니다.
사용자가 제시하는 '상위 키워드(예: 교통수단, 과일, 인물 등)'에 대해,
그 하위에 해당하는 **하나의 실제로 존재하는 구체적인 대상**을 선택하여 출력하세요.

다음 조건을 반드시 지키세요:

1. 반드시 하나의 대상만 선택하세요. 무리, 종류, 카테고리는 금지입니다.
2. 허구(가상의 인물, 장소, 동물 등)는 절대 선택하지 마세요.
3. 정답은 실제로 존재하는 실존하는 대상이어야 하며, 설명이 포함되어야 합니다.
4. 결과는 반드시 아래 형식을 따르세요.

형식: "'고유명사'(단어 한개): '간단한 설명'(한줄의 문장)"

예시)
키워드: 과일 → 바나나: 열대 과일로 달콤하고 부드러운 맛을 가진 과일
키워드: 동물 → 기린: 아프리카 초원에 사는 긴 목을 가진 초식동물
키워드: 인물 → 나폴레옹: 프랑스의 황제로 역사에 큰 영향을 끼친 인물
키워드: 영화 → 기생충: 한국의 사회 풍자를 다룬 영화
키워드: 영화 → 인터스텔라: 크리스토퍼 놀란 감독이 만든 SF 영화
키워드: 자동차 → 도요타 야리스: 일본 브랜드의 소형 경차

절대 하지 말아야 할 예시:
- "과일" → (X) 열대 과일 / (X) 맛있는 과일들 / (X) 아무거나
- "인물" → (X) 유명한 인물 / (X) 신화 속 인물
- "동물" → (X) 사자 무리 / (X) 공룡 / (X) 상상의 동물

지금부터 키워드를 줄 것입니다. 반드시 하나의 실존하는 구체적 대상과 간단한 설명을 출력하세요.
    `;

let userCon = `키워드는 "${data}"입니다. 이 키워드에 해당하는 정답을 한 문장으로 출력해주세요.`;

    try {
        let response = await openai.chat.completions.create({
            model: model,
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


const AIturn = async (data, api) => {
    let sysCon = `당신은 스무고개 게임의 질문자입니다. 당신은 주어진 키워드에 대해 질문을 던지며 정답을 맞추는 역할을 합니다.
주어진 키워드는 ${data.key}입니다.
    
[게임 규칙]
1. 당신은 정답을 맞추기 위해 논리적이고 점진적인 질문을 던져야 합니다.
2. 질문은 "네/아니오"로 대답할 수 있는 형태로 작성해야 합니다.
3. 질문은 구체적이고 명확해야 하며, 중복되지 않아야 합니다.
4. 질문은 정답의 특징을 좁혀가는 방식으로 작성해야 합니다.

[입력 형식]
- 대화 기록: 지금까지의 질문과 답변이 유저 입력으로 주어집니다.

[출력 형식]
- 다음 질문을 한 문장으로 출력하세요.
- 질문은 반드시 "네/아니오"로 대답할 수 있는 형태여야 합니다.

[예시]
- 키워드: 동물
- 질문 1: "이 동물은 포유류인가요?"
- 질문 2: "이 동물은 육지에서 주로 서식하나요?"
- 질문 3: "이 동물은 크기가 큰 편인가요?"

- 키워드: 과일
- 질문 1: "이 과일은 열대 과일인가요?"
- 질문 2: "이 과일은 껍질을 벗겨 먹나요?"
- 질문 3: "이 과일은 노란색인가요?"

지금까지의 질문과 답변을 바탕으로, 다음 질문을 작성하세요.`;

    let openai = new OpenAI({
        apiKey: api
    });

    try {
        let response = await openai.chat.completions.create({
            model: model,
            messages: [
                {role: "system", content: sysCon},
                {role: "user", content: data.msgRecode}
            ]
        });

        const answer = response.choices[0].message;
        return answer.content;  // 실제 텍스트만 반환
    } catch (err) {
        console.error('AI 질문 생성 중 오류:', err);
        throw err;
    }
}
module.exports.AIturn = AIturn;



// 메세지 기록을 배열열 형태로 전달하면, 여러줄의 문자열 형태로 return하는 함수
const getMsgRecode = (arr) => {
    if (arr.length == 0) {
        return "**메세지 기록이 없음.**";
    }

    let msgRecode = "";
    for(let i=0; i<arr.length; i++) {
        msgRecode += `${i+1}번째 질답답`
        if (i%2==0) msgRecode += `질문자: ${arr[i]}\n`;
        else msgRecode += `답변자: ${arr[i]}\n\n`;
    }

    return msgRecode;
}
module.exports.getMsgRecode = getMsgRecode;