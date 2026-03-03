import { Bot } from "grammy";
import { config, validateConfig } from "../config/env.js";
import { runAgentLoop } from "../agent/loop.js";
import { handleVoiceMessage } from "../handlers/voice.js";
import { sendResponse } from "../handlers/responder.js";
import { storeInMemory, recallFromMemory } from "../memory/vector.js";
import { initHeartbeat, sendHeartbeat } from "../services/heartbeat.js";

let botInstance: Bot | null = null;

const bot = new Bot(config.telegramBotToken);

// ─── Güvenlik: Whitelist middleware ───
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;

    // Kullanıcı ID whitelist kontrolü
    if (userId !== config.allowedUserId) {
        // Sessizce yoksay — log'a sadece uyarı
        if (userId) {
            console.warn(`⛔ Yetkisiz erişim denemesi: user_id=${userId}`);
        }
        return; // next() çağırma — mesajı engelle
    }

    await next();
});

// ─── /start komutu ───
bot.command("start", async (ctx) => {
    const voiceStatus = config.mockTranscription
        ? "🟡 (test modu)"
        : config.transcriptionApiKey
            ? "🟢"
            : "🔴 (devre dışı)";

    const ttsStatus = config.ttsApiKey ? "🟢" : "🔴 (devre dışı)";
    const memoryStatus = (config.vectorDbApiKey && config.vectorDbIndex) ? "🟢" : "🟡 (yerel)";

    await ctx.reply(
        "🤖 **Peng aktif!**\n\n" +
        "Ben senin kişisel AI asistanınım. Bana bir şey sor veya bir görev ver.\n\n" +
        `🎤 Sesli mesaj alma: ${voiceStatus}\n` +
        `🗣️ Sesli yanıt üretme: ${ttsStatus}\n` +
        `🧠 Uzun süreli hafıza: ${memoryStatus}\n` +
        `💓 Günlük Heartbeat: ${config.heartbeatEnabled ? "🟢" : "🔴"}\n\n` +
        "**Bellek Komutları:**\n" +
        "📌 `/remember <bilgi>` — Önemli bir şeyi hafızaya al\n" +
        "🔍 `/recall <sorgu>` — Hafızada arama yap\n\n" +
        "İpucu: Sesli yanıt almak için mesajınıza _\"reply with voice\"_ ekleyin.",
        { parse_mode: "Markdown" }
    );
});

// ─── /remember komutu ───
bot.command("remember", async (ctx) => {
    const text = ctx.match;
    if (!text) {
        return ctx.reply("⚠️ Lütfen hatırlamamı istediğin bir bilgi yaz.\nÖrn: `/remember Doğum günüm 15 Mayıs`", { parse_mode: "Markdown" });
    }

    await ctx.replyWithChatAction("typing");
    await storeInMemory(text);
    await ctx.reply(`✅ Hafızama kaydettim: _"${text}"_`, { parse_mode: "Markdown" });
});

// ─── /recall komutu ───
bot.command("recall", async (ctx) => {
    const query = ctx.match;
    if (!query) {
        return ctx.reply("⚠️ Lütfen aramak istediğin bir anahtar kelime yaz.\nÖrn: `/recall doğum günü`", { parse_mode: "Markdown" });
    }

    await ctx.replyWithChatAction("typing");
    const results = await recallFromMemory(query, 5);

    if (results.length === 0 || results[0].includes("eşleşme bulunamadı")) {
        return ctx.reply(`🔍 Hafızamda _"${query}"_ ile ilgili bir şey bulamadım.`, { parse_mode: "Markdown" });
    }

    const response = `🔍 **"${query}" için bulduklarım:**\n\n${results.map(r => `• ${r}`).join("\n")}`;
    await ctx.reply(response, { parse_mode: "Markdown" });
});

// ─── /heartbeat_test komutu ───
bot.command("heartbeat_test", async (ctx) => {
    await sendHeartbeat(bot);
});

// ─── Metin mesajları ───
bot.on("message:text", async (ctx) => {
    const userMessage = ctx.message.text;
    console.log(`📩 Mesaj alındı: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? "..." : ""}"`);

    // Typing göstergesi
    await ctx.replyWithChatAction("typing");

    try {
        const response = await runAgentLoop(userMessage);

        // Yanıtı gönder (metin veya sesli)
        await sendResponse(ctx, userMessage, response);
    } catch (err) {
        console.error("❌ Agent loop hatası:", err instanceof Error ? err.message : err);
        await ctx.reply("❌ Bir hata oluştu. Lütfen tekrar deneyin.");
    }
});

// ─── Sesli mesajlar (voice) ───
bot.on("message:voice", async (ctx) => {
    console.log("🎤 Sesli mesaj alındı");
    await handleVoiceMessage(ctx, bot);
});

// ─── Sesli dosyalar (audio) ───
bot.on("message:audio", async (ctx) => {
    console.log("🎵 Ses dosyası alındı");
    await handleVoiceMessage(ctx, bot);
});

export function startBot(existingBot?: Bot): void {
    const currentBot = existingBot || bot;
    botInstance = currentBot;

    // Uygulama başlamadan önce konfigürasyonu doğrula
    validateConfig();

    // Heartbeat servisini başlat
    initHeartbeat(currentBot);

    // Long-polling ile başlat — web server YOK
    currentBot.start({
        onStart: (botInfo) => {
            console.log("──────────────────────────────────────");
            console.log("🚀 Gravity Claw is alive!");
            console.log(`   Bot: @${botInfo.username}`);
            console.log(`   Whitelist: user_id=${config.allowedUserId}`);
            console.log(`   Mod: long-polling (web server yok)`);
            console.log("──────────────────────────────────────");
        },
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log("\n🛑 Gravity Claw kapatılıyor...");
        bot.stop();
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
