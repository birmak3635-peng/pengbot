/**
 * Sesli mesaj handler — indirme → transcription → LLM yanıtı
 * Orchestrator pattern: her adım modüler.
 */

import type { Context, Bot } from "grammy";
import { downloadVoiceFile } from "../telegram/voice.js";
import { transcribeAudio } from "../transcription/index.js";
import { runAgentLoop } from "../agent/loop.js";
import { sendResponse } from "./responder.js";

/**
 * Sesli mesajı işler:
 * 1. Typing göstergesi başlat
 * 2. Ses dosyasını indir
 * 3. Transcription yap
 * 4. Transcription'ı kullanıcıya gönder
 * 5. LLM'e gönder, yanıtı ilet via sendResponse
 */
export async function handleVoiceMessage(
    ctx: Context,
    bot: Bot
): Promise<void> {
    // Voice veya audio mesajını al
    const voice = ctx.message?.voice;
    const audio = ctx.message?.audio;
    const fileId = voice?.file_id ?? audio?.file_id;

    if (!fileId) {
        await ctx.reply("❌ Ses dosyası bulunamadı. Lütfen tekrar deneyin.");
        return;
    }

    // Dosya boyutu kontrolü (20MB Telegram limiti — biz 10MB'la sınırlayalım)
    const fileSize = voice?.file_size ?? audio?.file_size ?? 0;
    if (fileSize > 10 * 1024 * 1024) {
        await ctx.reply(
            "⚠️ Ses dosyası çok büyük (maks 10MB). Lütfen daha kısa bir mesaj gönderin."
        );
        return;
    }

    // Typing göstergesi
    await ctx.replyWithChatAction("typing");

    // ─── Adım 1: Ses dosyasını indir ───
    const download = await downloadVoiceFile(bot, fileId);

    if (!download.success || !download.buffer) {
        await ctx.reply(
            "❌ Ses dosyası indirilemedi. Lütfen tekrar deneyin.\n" +
            `Detay: ${download.error ?? "Bilinmeyen hata"}`
        );
        return;
    }

    // ─── Adım 2: Transcription ───
    await ctx.replyWithChatAction("typing");
    const transcription = await transcribeAudio(download.buffer, download.filename ?? "voice.ogg");

    if (!transcription.success || !transcription.text) {
        await ctx.reply(
            "🎤 Ses dosyasını metne çeviremedim. Lütfen tekrar deneyin.\n" +
            "💡 İpucu: Net ve yüksek sesle konuşmayı deneyin.\n" +
            `Detay: ${transcription.error ?? "Bilinmeyen hata"}`
        );
        return;
    }

    // ─── Adım 3: Transcription'ı kullanıcıya gönder ───
    await ctx.reply(`🎤 *Duyduklarım:*\n_"${transcription.text}"_`, {
        parse_mode: "Markdown",
    });

    // ─── Adım 4: LLM'e gönder ───
    await ctx.replyWithChatAction("typing");

    try {
        const response = await runAgentLoop(transcription.text);

        // Yanıtı gönder (metin veya sesli)
        await sendResponse(ctx, transcription.text, response);
    } catch (err) {
        console.error("❌ Voice agent loop hatası:", err instanceof Error ? err.message : err);
        await ctx.reply("❌ Yanıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
}
