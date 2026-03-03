import { ElevenLabsClient } from "elevenlabs";
import { config } from "../config/env.js";

/**
 * ElevenLabs üzerinden ses üretir.
 */
export async function generateElevenLabsSpeech(text: string): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
}> {
    if (!config.elevenLabsApiKey) {
        return { success: false, error: "ElevenLabs API Key eksik." };
    }

    try {
        console.log("🗣️ ElevenLabs ile ses üretiliyor...");

        const client = new ElevenLabsClient({
            apiKey: config.elevenLabsApiKey,
        });

        const audio = await client.generate({
            voice: "Rachel", // Varsayılan doğal bir ses, istersen "Antoni" veya Türkçe uyumlu başkasını seçebiliriz
            text: text,
            model_id: "eleven_multilingual_v2", // Türkçe desteği için en iyisi
        });

        // ElevenLabs stream döndürür, bunu Buffer'a çevirelim
        const chunks: Buffer[] = [];
        for await (const chunk of audio) {
            chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        return { success: true, buffer };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ ElevenLabs hatası:", message);
        return { success: false, error: message };
    }
}
