// example.mjs
import OpenAI from "openai";
const client = new OpenAI();

export async function generateStory(userPrompt) {
    const response = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "user", content: userPrompt }
        ],
    });

    return response.choices[0].message.content;
}
