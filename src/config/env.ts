import "dotenv/config";

interface Config {
    telegramBotToken: string;
    modelApiKey: string;
    allowedUserId: number;
    transcriptionApiKey: string | null;
    ttsApiKey: string | null;
    mockTranscription: boolean;
    vectorDbApiKey: string | null;
    vectorDbIndex: string | null;
    notionApiKey: string | null;
    googleClientId: string | null;
    googleClientSecret: string | null;
    googleRefreshToken: string | null;
    heartbeatEnabled: boolean;
    openRouterApiKey: string | null;
    modelName: string;
    elevenLabsApiKey: string | null;
    groqApiKey: string | null;
}

function loadConfig(): Config {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || "PLACEHOLDER";
    const modelApiKey = process.env.MODEL_API_KEY || "PLACEHOLDER";
    const allowedUserIdRaw = process.env.TELEGRAM_ALLOWLIST_USER_ID || "0";
    const transcriptionApiKey = process.env.TRANSCRIPTION_API_KEY || null;
    const ttsApiKey = process.env.TTS_API_KEY || null;
    const mockTranscription = process.env.MOCK_TRANSCRIPTION === "true";
    const vectorDbApiKey = process.env.VECTOR_DB_API_KEY || null;
    const vectorDbIndex = process.env.VECTOR_DB_INDEX || null;
    const notionApiKey = process.env.NOTION_API_KEY || null;
    const googleClientId = process.env.GOOGLE_CLIENT_ID || null;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || null;
    const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;
    const heartbeatEnabled = process.env.HEARTBEAT_ENABLED === "true";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || null;
    const modelName = process.env.MODEL_NAME || "google/gemini-2.0-flash-001";
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || null;
    const groqApiKey = process.env.GROQ_API_KEY || null;

    const allowedUserId = Number(allowedUserIdRaw);

    return {
        telegramBotToken,
        modelApiKey,
        allowedUserId: Number.isNaN(allowedUserId) ? 0 : allowedUserId,
        transcriptionApiKey,
        ttsApiKey,
        mockTranscription,
        vectorDbApiKey,
        vectorDbIndex,
        notionApiKey,
        googleClientId,
        googleClientSecret,
        googleRefreshToken,
        heartbeatEnabled,
        openRouterApiKey,
        modelName,
        elevenLabsApiKey,
        groqApiKey,
    };
}

export const config = loadConfig();

/**
 * Uygulama başlamadan önce kritik değişkenleri doğrular.
 */
export function validateConfig(): void {
    const missing: string[] = [];
    if (config.telegramBotToken === "PLACEHOLDER") missing.push("TELEGRAM_BOT_TOKEN");
    if (config.modelApiKey === "PLACEHOLDER" && !config.openRouterApiKey) missing.push("MODEL_API_KEY or OPENROUTER_API_KEY");
    if (process.env.TELEGRAM_ALLOWLIST_USER_ID === undefined) missing.push("TELEGRAM_ALLOWLIST_USER_ID");

    if (missing.length > 0) {
        console.error(`❌ Eksik ortam değişkenleri: ${missing.join(", ")}`);
        console.error("   .env.template dosyasını .env olarak kopyalayıp değerleri doldurun.");
        process.exit(1);
    }

    if (Number.isNaN(Number(process.env.TELEGRAM_ALLOWLIST_USER_ID))) {
        console.error("❌ TELEGRAM_ALLOWLIST_USER_ID sayısal bir değer olmalıdır.");
        process.exit(1);
    }

    console.log("✅ Ortam değişkenleri doğrulandı.");

    // Status logs
    if (config.mockTranscription) {
        console.log("🎤 Voice In: MOCK modu aktif");
    } else if (config.groqApiKey) {
        console.log("🎤 Voice In: aktif (Groq Whisper API)");
    } else if (config.transcriptionApiKey) {
        console.log("🎤 Voice In: aktif (Whisper API)");
    } else {
        console.log("🎤 Voice In: devre dışı");
    }

    if (config.elevenLabsApiKey) {
        console.log("🗣️ Voice Out: aktif (ElevenLabs)");
    } else if (config.ttsApiKey) {
        console.log("🗣️ Voice Out: aktif (OpenAI TTS-1)");
    } else {
        console.log("🗣️ Voice Out: devre dışı");
    }

    if (config.vectorDbApiKey && config.vectorDbIndex) {
        console.log("🧠 Bellek: aktif (VDB)");
    } else {
        console.log("🧠 Bellek: aktif (yerel fallback)");
    }

    if (config.notionApiKey) {
        console.log("📓 Notion: aktif (MCP)");
    }

    if (config.googleClientId && config.googleClientSecret) {
        console.log("📅 Google: aktif (MCP — Calendar/Drive)");
    }

    if (config.heartbeatEnabled) {
        console.log("💓 Heartbeat: aktif (08:00)");
    } else {
        console.log("💓 Heartbeat: devre dışı");
    }
}
