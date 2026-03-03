/**
 * Yanıt gönderici — metin veya sesli yanıt gönderir.
 */

import { Context, InputFile } from "grammy";
import { generateSpeech as generateOpenAiSpeech } from "../tts/openai.js";
import { generateElevenLabsSpeech } from "../tts/elevenlabs.js";
import { generateEdgeSpeech } from "../tts/edge.js";
import { config } from "../config/env.js";
import { containsVoiceTrigger } from "../utils/voice-trigger.js";

/**
 * Kullanıcıya yanıt gönderir. Eğer tetikleyici varsa sesli yanıt gönderir.
 * @param ctx - grammY context
 * @param userMessage - Kullanıcının gönderdiği orijinal mesaj (tetikleyici kontrolü için)
 * @param aiResponse - AI'nın ürettiği yanıt metni
 */
export async function sendResponse(
    ctx: Context,
    userMessage: string,
    aiResponse: string
): Promise<void> {
    const wantsVoice = containsVoiceTrigger(userMessage);

    if (wantsVoice) {
        await ctx.replyWithChatAction("record_voice");

        let tts;
        let filename = "reply.mp3";

        // Sesli yanıt hiyerarşisi
        if (config.elevenLabsApiKey) {
            // 1. En kaliteli: ElevenLabs
            tts = await generateElevenLabsSpeech(aiResponse);
        } else {
            // 2. Ücretsiz ve Kaliteli: Microsoft Edge TTS
            tts = await generateEdgeSpeech(aiResponse);
        }

        // Eğer bunlar başarısız olursa OpenAI dene (opsiyonel fallback)
        if (!tts?.success && config.ttsApiKey) { // Use optional chaining for tts in case it's undefined
            tts = await generateOpenAiSpeech(aiResponse);
            filename = "reply.ogg";
        }

        if (tts?.success && tts.buffer) { // Use optional chaining here too
            // Sesli mesaj gönder
            await ctx.replyWithVoice(new InputFile(tts.buffer, filename));
            return;
        } else {
            console.error("❌ TTS başarısız, metne dönülüyor:", tts.error);
            // Hata durumunda metne dön ama kullanıcıyı bilgilendir
            await ctx.reply("⚠️ Sesli yanıt oluşturulamadı, metin olarak gönderiyorum:");
        }
    }

    // Varsayılan: Metin mesajı gönder
    // Telegram mesaj limiti 4096 karakter
    if (aiResponse.length <= 4096) {
        await ctx.reply(aiResponse);
    } else {
        const chunks = splitMessage(aiResponse, 4096);
        for (const chunk of chunks) {
            await ctx.reply(chunk);
        }
    }
}

/** Uzun mesajları parçalara böler */
function splitMessage(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        let splitIndex = remaining.lastIndexOf("\n", maxLength);
        if (splitIndex === -1 || splitIndex < maxLength / 2) {
            splitIndex = remaining.lastIndexOf(" ", maxLength);
        }
        if (splitIndex === -1 || splitIndex < maxLength / 2) {
            splitIndex = maxLength;
        }

        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex).trimStart();
    }

    return chunks;
}
