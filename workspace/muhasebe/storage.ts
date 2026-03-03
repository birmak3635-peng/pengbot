import fs from "fs/promises";
import path from "path";
import { AppData, Transaction, Todo } from "./types.js";

const DATA_FILE = path.join(process.cwd(), "workspace", "muhasebe", "data.json");

export async function loadData(): Promise<AppData> {
    try {
        const content = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(content);
    } catch {
        return { transactions: [], todos: [] };
    }
}

export async function saveData(data: AppData): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function addTransaction(t: Omit<Transaction, 'id' | 'date'>): Promise<void> {
    const data = await loadData();
    const newTransaction: Transaction = {
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString()
    };
    data.transactions.push(newTransaction);
    await saveData(data);
}

export async function addTodo(task: string): Promise<void> {
    const data = await loadData();
    const newTodo: Todo = {
        id: Math.random().toString(36).substr(2, 9),
        task,
        completed: false,
        createdAt: new Date().toISOString()
    };
    data.todos.push(newTodo);
    await saveData(data);
}
