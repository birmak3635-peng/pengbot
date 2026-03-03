import Anthropic from "@anthropic-ai/sdk";
import { askClaude } from "../llm/claude.js";
import { getAllToolSchemas, executeTool } from "./tools.js";
import { readCoreMemory, readSoul } from "../memory/core.js";
import { recallFromMemory } from "../memory/vector.js";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

const MAX_ITERATIONS = 10;

/**
 * Agentic tool loop — Claude'a mesaj gönderir, tool_use varsa çalıştırır.
 * Artık hafıza (memory) ve kişilik (soul) desteği ile çalışır.
 */
export async function runAgentLoop(userMessage: string): Promise<string> {
    const tools = getAllToolSchemas();

    // 🧠 Bellekleri ve Kişiliği getir
    const coreMemory = await readCoreMemory();
    const soulContext = await readSoul();
    const relevantMemories = await recallFromMemory(userMessage, 3);

    // Sistem promptunu genişlet
    const contextPrompt = `
Kişilik ve İletişim Tarzın (Soul):
---
${soulContext}
---

Kişisel ayarlarım (Core Memory):
---
${coreMemory}
---

Hatırladığım ilgili anılar:
---
${relevantMemories.length > 0 ? relevantMemories.map(m => `- ${m}`).join("\n") : "Bulunamadı."}
---
`;

    const messages: MessageParam[] = [
        { role: "user", content: userMessage },
    ];

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        const response = await askClaude(messages, tools, contextPrompt);

        // Claude'un yanıtını mesaj geçmişine ekle
        messages.push({ role: "assistant", content: response.content });

        // stop_reason = "tool_use" / "tool_calls" değilse text yanıt döndür
        if (response.stopReason !== "tool_use") {
            // Text içeriklerini birleştir
            const textParts: string[] = [];
            for (const block of response.content) {
                if (block.type === "text") {
                    textParts.push(block.text);
                }
            }

            return textParts.join("\n") || "(Boş yanıt)";
        }

        // tool_use blokları var — her birini çalıştır
        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

        for (const block of response.content) {
            if (block.type === "tool_use") {
                console.log(`🔧 Araç çağırma isteği: ${block.name} (Giriş: ${JSON.stringify(block.input)})`);
                try {
                    const result = await executeTool(
                        block.name,
                        block.input as Record<string, unknown>
                    );
                    console.log(`✅ Araç başarıyla tamamlandı: ${block.name}`);
                    toolResults.push({
                        type: "tool_result",
                        tool_use_id: block.id,
                        content: result,
                    });
                } catch (toolErr) {
                    console.error(`❌ Araç çağırma hatası (${block.name}):`, toolErr);
                    toolResults.push({
                        type: "tool_result",
                        tool_use_id: block.id,
                        content: `Hata: Araç çalıştırılamadı. ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`,
                    });
                }
            }
        }

        // Tool sonuçlarını mesaj geçmişine ekle
        messages.push({ role: "user", content: toolResults });
    }

    return "⚠️ Maksimum iterasyon limitine ulaşıldı. Lütfen tekrar deneyin.";
}
