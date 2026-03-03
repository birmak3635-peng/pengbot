/**
 * Transcription module — ses dosyalarını metne çevirir.
 * OpenAI Whisper API veya mock mod destekler.
 */

import { config } from "../config/env.js";
import { transcribeWithWhisper } from "./whisper.js";
import { transcribeWithGroq } from "./groq.js";
import { transcribeMock } from "./mock.js";

export interface TranscriptionResult {
    success: boolean;
    text?: string;
    error?: string;
}

/**
 * Ses verisini metne çevirir.
 * MOCK_TRANSCRIPTION=true ise gerçek API çağrılmaz.
 * Önce Groq, sonra Whisper denenir.
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    filename: string
): Promise<TranscriptionResult> {
    try {
        if (config.mockTranscription) {
            console.log("🎤 [MOCK] Transcription mock modu aktif");
            return transcribeMock(audioBuffer, filename);
        }

        // Önce Groq'u dene
        if (config.groqApiKey) {
            return await transcribeWithGroq(audioBuffer, filename);
        }

        return await transcribeWithWhisper(audioBuffer, filename);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Transcription hatası:", message);
        return {
            success: false,
            error: message,
        };
    }
}
