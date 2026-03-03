import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { config } from "../config/env.js";

import type {
    MessageParam,
    ContentBlockParam,
    Tool,
} from "@anthropic-ai/sdk/resources/messages.js";

const anthropicClient = new Anthropic({
    apiKey: config.modelApiKey,
});

const openRouterClient = config.openRouterApiKey
    ? new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: config.openRouterApiKey,
        defaultHeaders: {
            "HTTP-Referer": "https://github.com/steipete/openclaw", // Örnek referer
            "X-Title": "Gravity Claw",
        }
    })
    : null;

const SYSTEM_PROMPT = `Sen "Peng" adında kişisel bir AI asistanısın. 
Telegram üzerinden çalışıyorsun. Kısa, net ve yardımcı yanıtlar ver.
Sana verilen araçları gerektiğinde kullan. 
Türkçe ve İngilizce konuşabilirsin, kullanıcının dilinde yanıt ver.`;

export interface ClaudeResponse {
    content: Anthropic.Messages.ContentBlock[];
    stopReason: string | null;
}

export async function askClaude(
    messages: MessageParam[],
    tools?: Tool[],
    extraContext?: string
): Promise<ClaudeResponse> {
    const finalSystemPrompt = `${SYSTEM_PROMPT}${extraContext ? `\n\n${extraContext}` : ""}`;

    if (openRouterClient) {
        try {
            console.log(`🤖 OpenRouter'a istek gönderiliyor: ${config.modelName}`);

            // OpenAI için mesaj formatını dönüştür
            const openAiMessages: any[] = [
                { role: "system", content: finalSystemPrompt },
            ];

            for (const m of messages) {
                if (typeof m.content === "string") {
                    openAiMessages.push({ role: m.role, content: m.content });
                } else if (Array.isArray(m.content)) {
                    // Blok dizisini dönüştür
                    const assistantText = m.role === "assistant"
                        ? m.content.find(b => b.type === "text") as any
                        : null;
                    const toolCalls = m.role === "assistant"
                        ? m.content.filter(b => b.type === "tool_use") as any[]
                        : [];

                    if (m.role === "assistant") {
                        openAiMessages.push({
                            role: "assistant",
                            content: assistantText?.text || null,
                            tool_calls: toolCalls.length > 0 ? toolCalls.map(tc => ({
                                id: tc.id,
                                type: "function",
                                function: {
                                    name: tc.name,
                                    arguments: JSON.stringify(tc.input)
                                }
                            })) : undefined
                        });
                    } else if (m.role === "user") {
                        // Anthropic formatında user mesajı tool_result içerebilir
                        const toolResults = m.content.filter(b => (b as any).type === "tool_result") as any[];
                        if (toolResults.length > 0) {
                            for (const res of toolResults) {
                                openAiMessages.push({
                                    role: "tool",
                                    tool_call_id: res.tool_use_id,
                                    content: typeof res.content === "string" ? res.content : JSON.stringify(res.content)
                                });
                            }
                        } else {
                            // Normal user content blocks
                            openAiMessages.push({
                                role: "user",
                                content: m.content.map(b => (b as any).text).join("\n")
                            });
                        }
                    }
                }
            }

            const openAiTools = tools?.map(t => ({
                type: "function" as const,
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.input_schema
                }
            }));

            const response = await openRouterClient.chat.completions.create({
                model: config.modelName,
                messages: openAiMessages,
                tools: openAiTools as any,
                max_tokens: 4096,
            });

            const choice = response.choices[0];
            const content: Anthropic.Messages.ContentBlock[] = [];

            if (choice.message.content) {
                content.push({ type: "text", text: choice.message.content } as any);
            }

            if (choice.message.tool_calls) {
                for (const toolCall of choice.message.tool_calls as any[]) {
                    content.push({
                        type: "tool_use",
                        id: toolCall.id,
                        name: toolCall.function.name,
                        input: JSON.parse(toolCall.function.arguments)
                    } as any);
                }
            }

            console.log(`✅ OpenRouter yanıt verdi (stop_reason: ${choice.finish_reason})`);

            return {
                content,
                stopReason: choice.finish_reason === "tool_calls" ? "tool_use" : choice.finish_reason as string,
            };
        } catch (err) {
            console.error("❌ OpenRouter Hatası:", err);
            throw err;
        }
    } else {
        // Klasik Anthropic kullanımı
        const response = await anthropicClient.messages.create({
            model: config.modelName || "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            system: finalSystemPrompt,
            messages,
            ...(tools && tools.length > 0 ? { tools } : {}),
        });

        return {
            content: response.content,
            stopReason: response.stop_reason,
        };
    }
}

export type { MessageParam, ContentBlockParam, Tool };
