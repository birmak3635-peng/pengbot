import cron from "node-cron";
import { config } from "../config/env.js";
import { Bot } from "grammy";

/**
 * Günlük heartbeat mesajlarını gönderen servis.
 */
export function initHeartbeat(bot: Bot) {
    if (!config.heartbeatEnabled) return;

    // Her gün sabah 08:00'de
    // '0 8 * * *'
    cron.schedule('0 8 * * *', async () => {
        await sendHeartbeat(bot);
    });

    console.log("📅 Heartbeat servisi başlatıldı (08:00 her gün).");
}

/**
 * Heartbeat mesajını manuel veya zamanlanmış olarak gönderir.
 */
export async function sendHeartbeat(bot: Bot) {
    const message =
        "💓 **Günaydın! Heartbeat Kontrolü**\n\n" +
        "1) Bugün için en büyük önceliğin nedir? (#1 priority)\n" +
        "2) Kaldırmama yardım edebileceğim bir engel (blocker) var mı?";

    try {
        await bot.api.sendMessage(config.allowedUserId, message, { parse_mode: "Markdown" });
        console.log(`✅ Heartbeat mesajı gönderildi: user_id=${config.allowedUserId}`);
    } catch (err) {
        console.error("❌ Heartbeat mesajı gönderilemedi:", err instanceof Error ? err.message : err);
    }
}
