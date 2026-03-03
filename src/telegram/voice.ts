/**
 * Telegram ses dosyası indirme modülü.
 * grammY bot API'si üzerinden voice/audio dosyalarını indirir.
 */

import type { Bot } from "grammy";

export interface VoiceDownloadResult {
    success: boolean;
    buffer?: Buffer;
    filename?: string;
    error?: string;
}

/**
 * Telegram'dan ses dosyasını indirir.
 * @param bot - grammY Bot instance
 * @param fileId - Telegram voice/audio file ID
 * @returns İndirilen dosyanın buffer'ı ve dosya adı
 */
export async function downloadVoiceFile(
    bot: Bot,
    fileId: string
): Promise<VoiceDownloadResult> {
    try {
        // Telegram API'den dosya bilgisini al
        const file = await bot.api.getFile(fileId);

        if (!file.file_path) {
            return {
                success: false,
                error: "Telegram dosya yolunu döndürmedi.",
            };
        }

        // Dosyayı indir
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

        console.log(`📥 Ses dosyası indiriliyor: ${file.file_path}`);

        const response = await fetch(fileUrl);

        if (!response.ok) {
            return {
                success: false,
                error: `Dosya indirme hatası: HTTP ${response.status}`,
            };
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dosya adını çıkart
        const filename = file.file_path.split("/").pop() ?? `voice_${Date.now()}.ogg`;

        console.log(`✅ Ses dosyası indirildi: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

        return {
            success: true,
            buffer,
            filename,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Ses dosyası indirme hatası:", message);
        return {
            success: false,
            error: message,
        };
    }
}
