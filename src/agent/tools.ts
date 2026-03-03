import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Tool } from "@anthropic-ai/sdk/resources/messages.js";

const execAsync = promisify(exec);
const ROOT_DIR = process.cwd();

export interface ToolDefinition {
    schema: Tool;
    execute: (input: Record<string, unknown>) => Promise<string>;
}

/** get_current_time — Geçerli tarih ve saati döndürür */
export const getCurrentTimeTool: ToolDefinition = {
    schema: {
        name: "get_current_time",
        description:
            "Returns the current date and time in ISO 8601 format. Use this when the user asks about the current time or date.",
        input_schema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },
    execute: async () => {
        return new Date().toISOString();
    },
};

/** list_files — Belirtilen dizindeki dosyaları listeler */
export const listFilesTool: ToolDefinition = {
    schema: {
        name: "list_files",
        description: "Lists files and directories in a given path relative to the project root.",
        input_schema: {
            type: "object",
            properties: {
                directory: { type: "string", description: "Target directory (relative to project root, e.g., 'src')" }
            },
            required: ["directory"]
        }
    },
    execute: async (input) => {
        const targetDir = path.join(ROOT_DIR, String(input.directory || "."));
        const files = await fs.readdir(targetDir, { withFileTypes: true });
        return files.map(f => `${f.isDirectory() ? "[DIR] " : "[FILE] "}${f.name}`).join("\n");
    }
};

/** read_file — Belirtilen dosyanın içeriğini okur */
export const readFileTool: ToolDefinition = {
    schema: {
        name: "read_file",
        description: "Reads the content of a file.",
        input_schema: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Path to the file relative to project root" }
            },
            required: ["filePath"]
        }
    },
    execute: async (input) => {
        const fullPath = path.join(ROOT_DIR, String(input.filePath));
        return await fs.readFile(fullPath, "utf-8");
    }
};

/** write_file — Dosya oluşturur veya üzerine yazar */
export const writeFileTool: ToolDefinition = {
    schema: {
        name: "write_file",
        description: "Creates or overwrites a file with new content.",
        input_schema: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Path to the file relative to project root" },
                content: { type: "string", description: "The content to write" }
            },
            required: ["filePath", "content"]
        }
    },
    execute: async (input) => {
        const fullPath = path.join(ROOT_DIR, String(input.filePath));
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, String(input.content), "utf-8");
        return `✅ Dosya başarıyla yazıldı: ${input.filePath}`;
    }
};

/** execute_command — Terminal komutu çalıştırır */
export const executeCommandTool: ToolDefinition = {
    schema: {
        name: "execute_command",
        description: "Executes a shell command in the project root. Use carefully.",
        input_schema: {
            type: "object",
            properties: {
                command: { type: "string", description: "The shell command to execute (e.g., 'npm test')" }
            },
            required: ["command"]
        }
    },
    execute: async (input) => {
        console.log(`⚠️ Terminal komutu çalıştırılıyor: ${input.command}`);
        const { stdout, stderr } = await execAsync(String(input.command), { cwd: ROOT_DIR });
        return stdout + (stderr ? `\nERR: ${stderr}` : "");
    }
};

/** Tüm kayıtlı araçlar */
export const toolRegistry: Map<string, ToolDefinition> = new Map([
    ["get_current_time", getCurrentTimeTool],
    ["list_files", listFilesTool],
    ["read_file", readFileTool],
    ["write_file", writeFileTool],
    ["execute_command", executeCommandTool],
]);

/** Yeni araçları kaydetmek için yardımcı fonksiyon */
export function registerTools(newTools: Map<string, ToolDefinition>): void {
    for (const [name, tool] of newTools) {
        toolRegistry.set(name, tool);
        console.log(`🛠️ Araç kaydedildi: ${name}`);
    }
}

/** Anthropic API formatında tüm tool şemaları */
export function getAllToolSchemas(): Tool[] {
    return Array.from(toolRegistry.values()).map((t) => t.schema);
}

/** Bir aracı adıyla çalıştır */
export async function executeTool(
    name: string,
    input: Record<string, unknown>
): Promise<string> {
    const tool = toolRegistry.get(name);
    if (!tool) {
        return `Hata: "${name}" adında bir araç bulunamadı.`;
    }
    try {
        return await tool.execute(input);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `Araç çalıştırma hatası: ${message}`;
    }
}
