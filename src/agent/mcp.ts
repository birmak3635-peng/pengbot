import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ToolDefinition } from "./tools.js";

/**
 * MCP Server yapılandırması
 */
export interface McpServerConfig {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
}

/**
 * MCP Sunucularından gelen araçları (tools) sisteme bağlar.
 */
export async function loadMcpTools(configs: McpServerConfig[]): Promise<Map<string, ToolDefinition>> {
    const mcpTools = new Map<string, ToolDefinition>();

    for (const config of configs) {
        try {
            console.log(`🔌 MCP Sunucusuna bağlanılıyor: ${config.name}...`);

            const transport = new StdioClientTransport({
                command: config.command,
                args: config.args,
                env: { ...process.env, ...config.env } as Record<string, string>,
            });

            const client = new Client(
                { name: "Gravity-Claw-Agent", version: "1.0.0" },
                { capabilities: {} }
            );

            await client.connect(transport);

            // Mevcut araçları listele
            const { tools } = await client.listTools();
            console.log(`✅ ${config.name} üzerinde ${tools.length} araç bulundu.`);

            for (const tool of tools) {
                // MCP Tool ismini sunucu ismiyle çakışmaması için prefix'leyebiliriz (opsiyonel)
                const toolName = tool.name;

                mcpTools.set(toolName, {
                    schema: {
                        name: toolName,
                        description: tool.description || "",
                        input_schema: tool.inputSchema as any,
                    },
                    execute: async (input) => {
                        console.log(`🚀 MCP Çağrısı: ${config.name} -> ${toolName}`);
                        const result = await client.callTool({
                            name: toolName,
                            arguments: input,
                        });

                        // Sonucu string'e çevirip Claude'a döndürürüz
                        return JSON.stringify(result.content);
                    },
                });
            }
        } catch (err) {
            console.error(`❌ MCP Sunucusu "${config.name}" bağlanırken hata:`, err instanceof Error ? err.message : err);
        }
    }

    return mcpTools;
}
