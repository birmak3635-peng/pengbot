import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testDdg() {
    console.log("Testing DDG MCP...");
    const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "duckduckgo-mcp-server"],
    });

    const client = new Client(
        { name: "test", version: "1.0.0" },
        { capabilities: {} }
    );

    try {
        await client.connect(transport);
        console.log("Connected.");
        const tools = await client.listTools();
        console.log("Tools:", tools.tools.map(t => t.name));

        if (tools.tools.length > 0) {
            const toolName = tools.tools[0].name;
            console.log(`Calling ${toolName}...`);
            const result = await client.callTool({
                name: toolName,
                arguments: { query: "İzmir hava durumu" }
            });
            console.log("Result:", JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit();
    }
}

testDdg();
