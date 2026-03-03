/**
 * OpenAI TTS API integration.
 * TTS_API_KEY gerektirir.
 */

import { config } from "../config/env.js";

const TTS_API_URL = "https://api.openai.com/v1/audio/speech";

export interface TTSResult {
    success: boolean;
    buffer?: Buffer;
    error?: string;
}

/**
 * Metni sese çevirir.
 * @param text - Seslendirilecek metin
 * @returns Ses verisinin buffer'ı
 */
export async function generateSpeech(text: string): Promise<TTSResult> {
    if (!config.ttsApiKey) {
        return {
            success: false,
            error: "TTS_API_KEY ayarlanmamış.",
        };
    }

    console.log(`🗣️ TTS üretiliyor... (${text.length} karakter)`);

    try {
        const response = await fetch(TTS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.ttsApiKey}`,
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text,
                voice: "alloy", // "alloy", "echo", "fable", "onyx", "nova", "shimmer" arasından seçilebilir
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`❌ TTS API hatası (${response.status}):`, errorBody);
            return {
                success: false,
                error: `TTS API hatası: ${response.status}`,
            };
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`✅ TTS başarıyla üretildi (${(buffer.length / 1024).toFixed(1)} KB)`);

        return {
            success: true,
            buffer,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ TTS hatası:", message);
        return {
            success: false,
            error: message,
        };
    }
}
