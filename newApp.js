const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

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

//Middleware For Checking requests
const requestQueries = async (request, response, next) => {
  const { status, priority, category, date, search_q } = request.query;
  const { todoId } = request.params;

  if (status !== undefined) {
    const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    const isStatus = statusArray.includes(status);
    if (isStatus === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityArray = ["HIGH", "LOW", "MEDIUM"];
    const isPriority = priorityArray.includes(priority);
    if (isPriority === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    const categoryArray = ["HOME", "WORK", "LEARNING"];
    const isCategory = categoryArray.includes(category);
    if (isCategory === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  if (date !== undefined) {
    try {
      const myDate = new Date(date);
      const formatDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formatDate, "f");

      const result = toDate(
        new Date(`${myDate.getFullYear()}-
      ${myDate.getMonth() + 1}-${myDate.getDate()}`)
      );
      console.log(result, "r");
      console.log(new Date(), "new");

      const isValidDate = await isValid(result);
      console.log(isValidDate, "V");

      if (isValidDate === true) {
        request.date = formatDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

//MiddleWare for body
const requestQueriesBody = (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsInArray = categoryArray.includes(category);

    if (categoryIsInArray === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "MEDIUM", "LOW"];
    priorityIsInArray = priorityArray.includes(priority);
    if (priorityIsInArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusIsInArray = statusArray.includes(status);
    if (statusIsInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
      const result = toDate(new Date(formatedDate));
      const isValidDate = isValid(result);
      console.log(isValidDate);
      console.log(isValidDate);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todo = todo;
  request.id = id;

  request.todoId = todoId;

  next();
};

//API-1
app.get("/todos/", requestQueries, async (request, response) => {
  const { status = "", priority = "", search_q = "", category = "" } = request;
  let getTodosQuery = `SELECT id, todo, category, priority, status, 
  due_date AS dueDate FROM todo 
  WHERE todo LIKE '%${search_q}%' AND 
  priority LIKE '%${priority}%' AND 
  status LIKE '%${status}%' AND 
  category LIKE '%${category}%'`;
  const getTodo = await db.all(getTodosQuery);
  response.send(getTodo);
});

//API-2
app.get("/todos/:todoId", requestQueries, async (request, response) => {
  const { todoId } = request;
  const getSpecificQuery = `SELECT id, todo, category, priority, status, due_date AS dueDate
   FROM todo 
  WHERE id = '${todoId}'`;
  const getTodo = await db.get(getSpecificQuery);
  response.send(getTodo);
});

//API-3
app.get("/agenda/", requestQueries, async (request, response) => {
  const { date } = request;

  const getAgendaQuery = `SELECT id, todo, category, priority, status, due_date 
  AS dueDate FROM todo 
    WHERE due_date = ${date}`;
  const getAgenda = await db.all(getAgendaQuery);
  if (getAgenda === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    response.send(getAgenda);
  }
});

//API-4
app.post("/todos/", requestQueriesBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const insertTodoQuery = `INSERT INTO todo(id, todo, category, 
        priority, status, due_date)
        VALUES ('${id}', '${todo}', '${category}', '${priority}', 
        '${status}', ${dueDate})`;
  await db.run(insertTodoQuery);
  response.send("Todo Successfully Added");
});

//API-5
app.put("/todos/:todoId/", requestQueriesBody, async (request, response) => {
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
