import { EdgeTTS } from "edge-tts-universal";

/**
 * Microsoft Edge TTS (Ücretsiz) üzerinden ses üretir.
 */
export async function generateEdgeSpeech(text: string): Promise<{
    success: boolean;
    buffer?: Buffer;
    error?: string;
}> {
    try {
        // Metni temizleyelim (Markdown ve Emojileri temizle ki TTS hata yapmasın)
        const cleanText = text
            .replace(/[*_`#]/g, "") // Markdown'dan arındır
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F200}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "") // Emojileri temizle
            .trim();

        if (!cleanText) {
            return { success: false, error: "Seslendirilecek metin kalmadı." };
        }

        console.log(`🗣️ Edge TTS ile ses üretiliyor... (${cleanText.substring(0, 30)}...)`);

        const tts = new EdgeTTS(cleanText, "tr-TR-AhmetNeural");

        const audioRes: any = await tts.synthesize();

        if (!audioRes || !audioRes.audio) {
            throw new Error("TTS sonucu boş döndü.");
        }

        const arrayBuffer = await audioRes.audio.arrayBuffer();

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error("Üretilen ses verisi boş.");
        }

        console.log(`✅ Edge TTS başarılı. Boyut: ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`);

        return {
            success: true,
            buffer: Buffer.from(arrayBuffer)
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Edge TTS hatası:", message);
        return { success: false, error: message };
    }
}
