const OpenAI = require("openai");
let model = "gpt-3.5-turbo"; // 사용할 모델 설정


// 주어지는 데이터
// keyword: 주제 키워드
// answer: 정답
// msg: 사용자가 입력한 질문
// metaData: 정답에 대한 메타데이터
async function mainFunc(data, api) {
    const sysCon = `
당신은 스무고개 게임의 사회자입니다.
사용자는 주어진 주제(keyword)에 대해 질문하거나 정답(answer)을 추리합니다.

당신에게 주어지는 데이터는 다음 4가지입니다:
- keyword: 주제 키워드
- answer: 정답
- metaData: 정답에 대한 부가 정보

다음 규칙에 따라 반드시 한 문장으로만 답변하세요:

[1] 수치 비교 질문
- 예: “10위보다 높나요?”, “5위 초과인가요?”
  → 정답 내용과 부합하면: "네 그렇습니다."
  → 그렇지 않으면: "아닙니다."
- 수치 없이 "많은가요?", "높은 편인가요?" 같은 상대적 표현
  → "정도를 물어보는 질문엔 답변할 수 없습니다"

[2] 일반 속성 질문
- 예: "한국에서 제작됐나요?", "색깔이 빨간가요?"
  → 정답 내용에 해당 정보가 있으면: "네 그렇습니다."
  → 없으면: "아닙니다."
- 정도 표현 포함 시: "정도를 물어보는 질문엔 답변할 수 없습니다"

[3] 과거 사실 여부 질문
- 예: "~한 적 있나요?", "~한 역사가 있나요?"
  → 정답 내용에 해당 사실이 있으면: "네 그렇습니다."
  → 없으면: "아닙니다."

[4] 그 외 질문
- 인사말, 잡담, 주제와 무관한 질문
  → "게임의 주제에 대한 질문이 아닙니다."

[5] 오타 및 변형 처리
- 질문에 오탈자나 변형이 존재한다면 인정하지 않습니다.


---

주제: ${data.keyword}
정답: ${data.answer}
메타데이터: ${data.metaData}

출력 가능한 문장 (다음 중 반드시 하나로만 응답):
- 네 그렇습니다.
- 아닙니다.
- 정도를 물어보는 질문엔 답변할 수 없습니다
- 게임의 주제에 대한 질문이 아닙니다.
`;

    let openai = new OpenAI({
        apiKey: api
    })

    try {
        let response = await openai.chat.completions.create({
            model: model,
            messages: [
                {role: "system", content: sysCon},
                {role: "user", content: data.msg}
            ]
        })

        let answer = response.choices[0].message;
        return answer.content.trim();
    } catch (err) {
        console.error(err);
        throw err;
    }
}
module.exports.mainFunc = mainFunc;



const getAnswer = async (data, api) => {
  // OpenAI 객체 초기화
  const openai = new OpenAI({
    apiKey: api,
  });

  // 시스템 메시지: 정답 생성 역할 정의
  const sysCon = `
당신은 지금 스무고개 게임에서 정답을 만드는 역할입니다.
사용자가 제시하는 '상위 키워드(예: 교통수단, 과일, 인물 등)'에 대해,
그 하위에 해당하는 **하나의 실제로 존재하는 구체적인 단어**를 선택하여 출력하세요.

다음 조건을 반드시 지키세요:

1. 반드시 하나의 단어만 선택하세요. 문장, 설명, 카테고리는 금지입니다.
2. 허구(가상의 인물, 장소, 동물 등)는 절대 선택하지 마세요.
3. 정답은 실제로 존재하는 실존하는 단어여야 합니다.

예시)
키워드: 과일 → 바나나
키워드: 동물 → 기린
키워드: 인물 → 나폴레옹
키워드: 영화 → 기생충
키워드: 자동차 → 야리스

절대 하지 말아야 할 예시:
- "과일" → (X) 열대 과일 / (X) 맛있는 과일들 / (X) 아무거나
- "인물" → (X) 유명한 인물 / (X) 신화 속 인물
- "동물" → (X) 사자 무리 / (X) 공룡 / (X) 상상의 동물

지금부터 키워드를 줄 것입니다. 반드시 하나의 실존하는 단어를 출력하세요.
`;

  // 사용자 메시지 생성
  const userCon = `키워드: ${data}`;

  try {
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: model, // 사용할 모델 (예: gpt-3.5-turbo)
      messages: [
        { role: "system", content: sysCon },
        { role: "user", content: userCon },
      ],
    });

    // 응답에서 메시지 추출 및 반환
    const answer = response.choices[0].message;
    return answer.content.trim();
  } catch (err) {
    // 에러 처리: 에러 메시지 출력 및 재전달
    console.error("OpenAI API 호출 중 에러 발생:", err.message);
    throw new Error("정답 생성에 실패했습니다. 다시 시도해주세요.");
  }
};

module.exports.getAnswer = getAnswer;



const getMetaData = async (data, api) => {
  // OpenAI 객체 초기화
  const openai = new OpenAI({
    apiKey: api,
  });

  // 시스템 메시지: AI의 역할과 출력 형식을 명확히 정의
  const sysCon = `
당신은 스무고개 게임에서 정답을 구체화하는 역할을 맡고 있습니다.
정답 단어에 대해 추가적인 정보를 제공하며, 다음과 같은 형식을 따릅니다:

예시 입력:
기생충, 영화

예시 출력:
기생충: 한국의 사회 풍자를 다룬 영화, 2019년 칸 영화제 황금종려상 수상작, 봉준호 감독 작품

예시 입력:
도요타 야리스, 자동차

예시 출력:
도요타 야리스: 일본 브랜드의 소형 경차, 연비가 좋고 실용적인 디자인, 2020년형 모델 출시

예시 입력:
나폴레옹, 인물

예시 출력:
나폴레옹: 프랑스의 황제로 역사에 큰 영향을 끼친 인물, 1769년 출생, 1821년 사망, 나폴레옹 전쟁 주도

입력은 유저의 입력을 통해 이루어지며, 다음과 같은 형태를 취합니다:
정답, 게임 주제

출력 형식:
- "정답: 추가 정보"
`;

  try {
    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: model, // 사용할 모델 (예: gpt-3.5-turbo)
      messages: [
        { role: "system", content: sysCon },
        { role: "user", content: `${data.answer}, ${data.keyword}` },
      ],
    });

    // 응답에서 메시지 추출 및 반환
    const answer = response.choices[0].message;
    return answer.content.trim();
  } catch (err) {
    // 에러 처리: 에러 메시지 출력 및 재전달
    console.error("OpenAI API 호출 중 에러 발생:", err.message);
    throw new Error("메타데이터 생성에 실패했습니다. 다시 시도해주세요.");
  }
};

module.exports.getMetaData = getMetaData;