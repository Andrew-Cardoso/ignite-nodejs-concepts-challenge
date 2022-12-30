const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const getUser = (username) => users.find((x) => x.username === username);

function checksExistsUserAccount(request, response, next) {
  const username = request.headers.username;
  const user = getUser(username);
  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const { todos } = request.user;
  const taskExists = todos.some((x) => x.id === id);
  return taskExists
    ? next()
    : response.status(404).json({ error: "TODO not found" });
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (!name || !username) {
    return response
      .status(400)
      .json({ error: "You need to inform a name and a username" });
  }

  if (getUser(username)) {
    return response.status(400).json({ error: "User already exists" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) =>
  response.json(request.user.todos)
);

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const task = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  request.user.todos.push(task);

  return response.status(201).json(task);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { id } = request.params;
    const { title, deadline } = request.body;

    const task = request.user.todos.find((x) => x.id === id);

    task.title = title;
    task.deadline = new Date(deadline);

    return response.json(task);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { id } = request.params;

    const task = request.user.todos.find((x) => x.id === id);
    task.done = true;

    return response.json(task);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { id } = request.params;
    const { todos } = request.user;
    const i = todos.findIndex((x) => x.id === id);
    todos.splice(i, 1);
    return response.status(204).send();
  }
);

module.exports = app;
