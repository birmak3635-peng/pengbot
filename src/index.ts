import { startBot } from "./bot/telegram.js";
import { loadMcpTools } from "./agent/mcp.js";
import { registerTools } from "./agent/tools.js";
import { config } from "./config/env.js";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/', (req: any, res: any) => {
    res.send('🐾 Peng Bot is alive and running!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`📡 Health check server listening on port ${port}`);
});

async function bootstrap() {
    console.log("🐾 Peng başlatılıyor...\n");

    // 🔌 MCP Sunucularını Yapılandır
    const mcpConfigs = [];

    // Notion
    if (config.notionApiKey) {
        mcpConfigs.push({
            name: "Notion",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-notion"],
            env: { NOTION_API_KEY: config.notionApiKey }
        } as any);
    }

    // Google (Calendar & Drive)
    if (config.googleClientId && config.googleClientSecret && config.googleRefreshToken) {
        mcpConfigs.push({
            name: "Google Tasks & Calendar",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-google-calendar"],
            env: {
                GOOGLE_CLIENT_ID: config.googleClientId,
                GOOGLE_CLIENT_SECRET: config.googleClientSecret,
                GOOGLE_REFRESH_TOKEN: config.googleRefreshToken
            }
        });

        mcpConfigs.push({
            name: "Google Drive",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-google-drive"],
            env: {
                GOOGLE_CLIENT_ID: config.googleClientId,
                GOOGLE_CLIENT_SECRET: config.googleClientSecret,
                GOOGLE_REFRESH_TOKEN: config.googleRefreshToken
            }
        });
    }

    // DuckDuckGo Search
    mcpConfigs.push({
        name: "DuckDuckGo Search",
        command: "node",
        args: ["./node_modules/duckduckgo-mcp-server/build/index.js"]
    } as any);

    // Araçları yükle ve sisteme ekle
    if (mcpConfigs.length > 0) {
        try {
            const mcpToolsMap = await loadMcpTools(mcpConfigs);
            registerTools(mcpToolsMap);
        } catch (err) {
            console.error("⚠️ MCP Araçları yüklenirken hata oluştu, bot araçsız devam ediyor.");
        }
    }

    // Botu başlat
    startBot();
}

bootstrap().catch(err => {
    console.error("❌ Kritik başlatma hatası:", err);
    process.exit(1);
});
