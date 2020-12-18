const express = require("express");
const mysql = require("mysql");
const port = process.env.port || 3000;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const cors = require("cors");

app.use(bodyParser.json());
app.use(cors());

var pool = mysql.createPool({
  host: "db4free.net",
  user: "saif031197",
  password: "ivory602",
  database: "saif031197nbad",
});

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

app.get("/api/budget/fetch/:user_id", async (req, res) => {
  try {
    pool.getConnection(function (err, connection) {
      connection.query(
        "SELECT * FROM budget_list WHERE user_id='" + req.params.user_id + "'",
        function (error, results, fields) {
          connection.release();
          if (error) throw error;
          res.json(results);
        }
      );
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/api/budget/add", async (req, res) => {
  try {
    pool.getConnection(function (err, connection) {
      connection.query(
        "INSERT INTO budget_list (title, expense, user_id, add_date, budget_date, category) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.body.title,
          req.body.expense,
          req.body.user_id,
          new Date().toISOString().slice(0, 19).replace("T", " "),
          new Date(req.body.budget_date).toISOString().split("T")[0],
          req.body.category,
        ],
        function (error, results, fields) {
          connection.release();
          if (error) throw error;
          res.status(200).json(results);
        }
      );
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.put("/api/budget/edit", async (req, res) => {
  try {
    var values = [
      req.body.title,
      req.body.expense,
      req.body.category,
      req.body.user_id,
      new Date().toISOString().slice(0, 19).replace("T", " "),
      new Date(req.body.budget_date).toISOString().split("T")[0],
      req.body.budget_id,
    ];
    var sql =
      "UPDATE budget_list SET title=?, expense=?, category=?, user_id=?, add_date=?, budget_date=?" +
      " WHERE budget_id =?";
    pool.getConnection(function (err, connection) {
      connection.query(sql, values, function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.status(200).json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.delete("/api/budget/delete/:budget_id", async (req, res) => {
  var sql = "DELETE FROM budget_list WHERE budget_id =" + req.params.budget_id;
  pool.getConnection(function (err, connection) {
    connection.query(sql, function (error, results, fields) {
      connection.release();
      if (error) throw error;
      res.status(200).json(results);
    });
  });
});

app.post("/api/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt); //password encryption using bcrypt
    const date = new Date().toISOString().slice(0, 19).replace("T", " "); //mysql Date format
    pool.getConnection(function (err, connection) {
      connection.connect();
      connection.query(
        "INSERT INTO user_list (username, email, password, user_created) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, date],
        function (error, results, fields) {
          connection.release();
          if (error) throw error;
          res.status(200).json(results);
        }
      );
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/user/:email", async (req, res) => {
  try {
    pool.getConnection(function (err, connection) {
      connection.query(
        "SELECT * FROM user_list WHERE email = '" + req.params.email + "'",
        function (error, results, fields) {
          connection.release();
          if (error) throw error;
          res.status(200).json(results);
        }
      );
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/user_id/:user_id", async (req, res) => {
  try {
    var sql =
      "SELECT user_id FROM user_list WHERE user_id =" + req.params.user_id;
    pool.getConnection(function (err, connection) {
      connection.query(sql, function (error, results, fields) {
        connection.end();
        if (error) throw error;
        res.json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/category_id/:category_id", async (req, res) => {
  try {
    var sql =
      "SELECT category_id FROM category_list WHERE user_id =" +
      req.params.category_id;
    pool.getConnection(function (err, connection) {
      connection.query(sql, function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.status(200).json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/category/:user_id", async (req, res) => {
  try {
    var sql =
      "SELECT DISTINCT category, SUM(expense) as expense FROM budget_list WHERE user_id = " +
      req.params.user_id +
      " GROUP BY category";
    pool.getConnection(function (err, connection) {
      connection.query(sql, function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.status(200).json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/month/budget/:user_id", async (req, res) => {
  try {
    var sql =
      "SELECT DISTINCT month(budget_date) as month, SUM(expense) as expense, Year(curdate()) as year FROM budget_list WHERE user_id='" +
      req.params.user_id +
      "' GROUP  BY Month(budget_date) ORDER BY Month(budget_date) ASC";
    pool.getConnection(function (err, connection) {
      connection.query(sql, function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.status(200).json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.get("/api/month/expense/:user_id", async (req, res) => {
  try {
    var sql =
      "SELECT category, SUM(expense) as expense, Month(budget_date) as month FROM budget_list  WHERE user_id='" +
      req.params.user_id +
      "' GROUP BY category, Month(budget_date) ORDER BY Month(budget_date) ASC";
    pool.getConnection(function (err, connection) {
      connection.query(sql, function (error, results, fields) {
        connection.release();
        if (error) throw error;
        res.status(200).json(results);
      });
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

app.listen(port, () => {
  console.log(`Server on port ${port}`);
});
