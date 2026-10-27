export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export const todos: Todo[] = [
  {
    id: "seed-1",
    title: "Review inventory dashboard",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    title: "Ship the first todo release",
    completed: true,
    createdAt: new Date().toISOString(),
  },
];
