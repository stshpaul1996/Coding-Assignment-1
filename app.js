const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};
initializeDBAndServer();

//API-1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q, category } = request.query;
  let getTodosQuery = "";
  let getTodos = null;
  switch (true) {
    //scenario-1
    case status !== undefined:
      if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
        getTodosQuery = `
    SELECT id, todo, category, priority, status, due_date AS dueDate FROM todo 
    WHERE status LIKE '${status}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //scenario-2
    case priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        getTodosQuery = `
        SELECT  id, todo, category, priority, status, due_date AS dueDate FROM 
        todo WHERE priority = '${priority}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario-3
    case priority !== undefined && status !== undefined:
      if (
        (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") &&
        (status === "TO DO" || status === "DONE" || status === "IN PROGRESS")
      ) {
        getTodosQuery = `
        SELECT id, todo, category, priority, status, due_date AS dueDate FROM 
        todo WHERE priority = '${priority}' AND
        status = '${status}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status and Priority");
      }

      break;
    //scenario-4
    case search_q !== undefined:
      getTodosQuery = `
        SELECT id, todo, category, priority, status, due_date AS dueDate FROM 
        todo WHERE todo LIKE '${search_q}%'`;
      break;
    //scenario-5
    case category !== undefined && status !== undefined:
      if (
        (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") &&
        (category === "LEARNING" || category === "HOME" || category === "WORK")
      ) {
        getTodosQuery = `
        SELECT id, todo, category, priority, status, due_date AS dueDate FROM
         todo WHERE category LIKE '${category}' 
        AND status = '${status}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category and Status");
      }

      break;
    //Scenario-6
    case category !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        getTodosQuery = `SELECT id, todo, category, priority, status, due_date AS dueDate FROM 
      todo WHERE category='${category}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    //Scenario-7
    case category !== undefined && priority !== undefined:
      if (
        (category === "LEARNING" ||
          category === "HOME" ||
          category === "WORK") &&
        (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM")
      ) {
        getTodosQuery = `SELECT id, todo, category, priority, status, due_date AS dueDate
       FROM todo WHERE 
        category = '${category}' AND priority = '${priority}'`;
      } else {
        response.status(400);
        response.send("Invalid Category and Priority");
      }

      break;
  }
  getTodos = await db.all(getTodosQuery);
  response.send(getTodos);
});

//API-2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificQuery = `SELECT id, todo, category, priority, status, due_date AS dueDate
   FROM todo 
  WHERE id = '${todoId}'`;
  const getTodo = await db.get(getSpecificQuery);
  response.send(getTodo);
});

//API-3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const year = format((new Date(date), "yyyy-MM-dd"));
  const getAgendaQuery = `SELECT id, todo, category, priority, status, due_date 
  AS dueDate FROM todo 
    WHERE due_date = ${year}`;
  const getAgenda = await db.all(getAgendaQuery);
  response.send(getAgenda);
});

//API-4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const insertTodoQuery = `INSERT INTO todo(id, todo, category, 
        priority, status, due_date)
        VALUES ('${id}', '${todo}', '${category}', '${priority}', 
        '${status}', ${dueDate})`;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

//API-5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let updateTodoQuery = null;

  switch (true) {
    //Scenario-1
    case status !== undefined:
      if (status === "TO DO" || status === "DONE" || status === "IN PROGRESS") {
        updateTodoQuery = `UPDATE todo SET status = '${status}' 
      WHERE id = '${todoId}'`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    //Scenario-2
    case priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `UPDATE todo SET priority = '${priority}' 
      WHERE id = '${todoId}'`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    //Scenario-3
    case todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo = '${todo}' 
      WHERE id = '${todoId}'`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    //Scenario-4
    case category !== undefined:
      if (
        category === "LEARNING" ||
        category === "HOME" ||
        category === "WORK"
      ) {
        updateTodoQuery = `UPDATE todo SET category = '${category}'
        WHERE id = '${todoId}'`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    default:
      if (isValid(date)) {
        updateTodoQuery = `UPDATE todo SET due_date = '${dueDate}' 
        WHERE id = '${todoId}'`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }

      break;
  }
});

//API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = '${todoId}'`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
