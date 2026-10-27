"use client";

import { FormEvent, useEffect, useState } from "react";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTodos() {
    const response = await fetch("/api/todos");
    if (!response.ok) {
      throw new Error("Unable to fetch todos");
    }

    const data = (await response.json()) as Todo[];
    setTodos(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadTodos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load todos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();

    if (!trimmed) {
      setError("Please enter a todo title");
      return;
    }

    setError(null);

    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed, completed: false }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Unable to create todo");
      return;
    }

    const nextTodo = (await response.json()) as Todo;
    setTodos((current) => [nextTodo, ...current]);
    setTitle("");
  }

  async function handleToggle(todo: Todo) {
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });

    if (!response.ok) {
      setError("Unable to update todo");
      return;
    }

    const updatedTodo = (await response.json()) as Todo;
    setTodos((current) =>
      current.map((item) => (item.id === updatedTodo.id ? updatedTodo : item)),
    );
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/todos/${id}`, { method: "DELETE" });

    if (!response.ok) {
      setError("Unable to delete todo");
      return;
    }

    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  return (
    <div
      style={{
        maxWidth: 640,
        marginTop: "1.5rem",
        padding: "1.25rem",
        border: "1px solid #d0d7de",
        borderRadius: 12,
        background: "#fff",
      }}
    >
      <h2>Todo list</h2>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a todo"
          style={{
            flex: 1,
            padding: "0.65rem 0.75rem",
            border: "1px solid #d0d7de",
            borderRadius: 8,
          }}
        />
        <button type="submit" style={{ padding: "0.65rem 1rem", cursor: "pointer" }}>
          Add
        </button>
      </form>

      {error ? (
        <p style={{ color: "#b8281a", marginBottom: 12 }}>{error}</p>
      ) : null}

      {loading ? (
        <p>Loading todos...</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.length === 0 ? (
            <li style={{ color: "#57606a" }}>No todos yet.</li>
          ) : (
            todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #f0f1f3",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => void handleToggle(todo)}
                  />
                  <span
                    style={{
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "#57606a" : "#1f2328",
                    }}
                  >
                    {todo.title}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => void handleDelete(todo.id)}
                  style={{ cursor: "pointer" }}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
