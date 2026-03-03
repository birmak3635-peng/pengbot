export interface Transaction {
    id: string;
    type: 'gelir' | 'gider' | 'satis' | 'alis';
    amount: number;
    description: string;
    date: string;
}

export interface Todo {
    id: string;
    task: string;
    completed: boolean;
    createdAt: string;
}

export interface AppData {
    transactions: Transaction[];
    todos: Todo[];
}
