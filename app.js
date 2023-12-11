// Todos os Requirements
const express = require("express");
const app = express();
const cors = require("cors");
const mqtt = require("mqtt");
const sqlite3 = require("sqlite3").verbose();
const protocol = "mqtt";
const hostOracle = "146.235.49.177"; //IP da Oracle (servidor)
const port = "1883"; // Porta que estamos utilizando
const moment = require("moment-timezone");
const bodyParser = require("body-parser");
app.use(express.json());
const db = new sqlite3.Database("databasecorreta.db");

app.use(cors({ origin: "*", methods: ["GET", "POST", "DELETE", "PUT"] }));

// TUDO REFERENTE A CONEXÃO MQTT
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`; // ClientID randomizado (não é relevante para a conexão)
const connectUrl = `${protocol}://${hostOracle}:${port}`; // URL pra conectar com o servidor

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});
const topic = "status"; // Topico / Canal onde serão enviadas as mensagens contendo os dados

function databaseInsert(id, lat, long, date) {
  // Abre a conexão com o banco de dados
  const db = new sqlite3.Database("database.db");
  // Prepara a query de inserção
  const query = `INSERT INTO rastreamento (id, lat, long, date) VALUES (?, ?, ?, ?)`;
  // Executa a query com os valores passados
  db.run(query, [id, lat, long, date], function (err) {
    if (err) {
      console.error(`Erro ao inserir no banco de dados: ${err.message}`);
    } else {
      console.log(`Inserção bem-sucedida. ID inserido: ${this.lastID}`);
    }

    // Fecha a conexão com o banco de dados
    db.close();
  });
}

function publishStatus() {
  // Função que constantemente manda o status do servidor
  setInterval(() => {
    console.log(`Publishing status to ${topic}`);
    client.publish(topic, "NODE:ON");
  }, 60000); // A cada 1 minuto ele envia se o servidor ta on
}
client.on("connect", () => {
  // Função para se "inscrever" no canal
  console.log("Connected");
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${topic}`);
      publishStatus();
    }
  });
});
client.on("message", (topic, message) => {
  try {
    const parsedMessage = JSON.parse(message.toString());

    if (parsedMessage.id === 1) {
      console.log(
        `Received message on topic ${topic}: ${JSON.stringify(parsedMessage)}`
      );

      let timestamp = moment(parsedMessage.timestamp).subtract(3, "hours"); // Ajusta para o fuso horário correto

      if (parsedMessage.message === "No gps signal") {
        // Inserir no banco de dados com lat e long zerados
        databaseInsert(
          parsedMessage.id,
          0,
          0,
          timestamp.format("YYYY-MM-DD HH:mm:ss")
        );
      } else {
        // Inserir no banco de dados com os valores normais
        databaseInsert(
          parsedMessage.id,
          parsedMessage.lat,
          parsedMessage.long,
          timestamp.format("YYYY-MM-DD HH:mm:ss")
        );
      }
    }
  } catch (error) {
    console.log("OK");
  }
});

// TUDO REFERENTE A CONEXÕES DA DATABASE E ENDPOINTS
app.listen(3001, () => {
  console.log("Server running on localhost:3001");
});

app.post("/login", (req, res) => {
  console.log(req.body);
  const num = req.body.registrationNumber;
  // Validate input
  if (!num) {
    res.json({ message: "Número de registro inválido" });
    return;
  }
  // Use a parameterized query for safety and correctness
  const query = `SELECT * FROM registro WHERE registrationNumber = ?`;

  db.all(query, [num], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    console.log(rows, "rows");
    // Check if the user was found
    if (rows && rows.length === 0) {
      res.json({ message: false });
      return; // Prevent further execution after sending response
    }
    res.json({ message: true });
  });
});

app.post("/addEntrega", (req, res) => {
  const { id, assetName, issueDate, destination, deliveryDate, status } =
    req.body;

  // Verificar se a tabela hist{id} existe
  const checkTableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name='hist${id}'`;

  db.get(checkTableQuery, (err, row) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "Erro ao verificar tabela no banco de dados" });
      return;
    }

    // Se a tabela não existir, crie-a
    if (!row) {
      const createTableQuery = `
          CREATE TABLE hist${id} (
            num INTEGER PRIMARY KEY AUTOINCREMENT,
            id TEXT,
            assetName TEXT,
            issueDate TEXT,
            deliveryDate TEXT,
            destination TEXT,
            status TEXT
          )
        `;

      db.run(createTableQuery, (err) => {
        if (err) {
          console.log(err);
          res
            .status(500)
            .json({ message: "Erro ao criar tabela no banco de dados" });
        } else {
          // Inserir dados na tabela
          const insertDataQuery = `
              INSERT INTO hist${id} (id, assetName, issueDate, deliveryDate, destination, status)
              VALUES (?, ?, ?, ?, ?, ?)
            `;

          db.run(
            insertDataQuery,
            [id, assetName, issueDate, deliveryDate, destination, status],
            function (err) {
              if (err) {
                console.log(err);
                res
                  .status(500)
                  .json({ message: "Erro ao inserir dados na tabela" });
              } else {
                res
                  .status(200)
                  .json({ message: "Inserção bem-sucedida", id: id });
              }
            }
          );
        }
      });
    } else {
      // Se a tabela existir, apenas adicione os dados nela
      const insertDataQuery = `
          INSERT INTO hist${id} (id, assetName, issueDate, deliveryDate, destination, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
      db.run(
        insertDataQuery,
        [id, assetName, issueDate, deliveryDate, destination, status],
        function (err) {
          if (err) {
            console.log(err);
            res
              .status(500)
              .json({ message: "Erro ao inserir dados na tabela" });
          } else {
            res.status(200).json({ message: "Inserção bem-sucedida", id: id });
          }
        }
      );
    }
  });
});

app.post("/info", (req, res) => {
  const num = req.body.id;
  const query = `SELECT name,price, warranty, maintenance, expiration FROM info WHERE id = ${num}`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    if (rows && rows.length === 0) {
      res.json({ message: false });
      return;
    }
    res.json(rows);
  });
});

app.post("/ativos", (req, res) => {
  const id = req.body.id;
  // Validate input
  if (!id) {
    res.json({ message: "id inválido" });
    return;
  }
  // Use a parameterized query for safety and correctness
  const query = `SELECT * FROM ativos WHERE id = ?`;

  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    console.log(rows, "rows");
    // Check if the user was found
    if (rows && rows.length === 0) {
      res.json({ message: false });
      return; // Prevent further execution after sending response
    }
    res.json(rows); // Retorna os dados encontrados
  });
});

app.post("/addAtivo", (req, res) => {
  const { id, name, price, warranty, expiration, maintenance } = req.body;

  // Verificar se o ativo já existe na tabela
  const checkAtivoQuery = `SELECT * FROM ativos WHERE id = ?`;

  db.get(checkAtivoQuery, [id], (err, row) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "Erro ao verificar ativo no banco de dados" });
      return;
    }

    // Se o ativo não existir, adicione-o
    if (!row) {
      const addAtivoQuery = `
          INSERT INTO ativos (id, name, price, warranty, expiration, maintenance)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

      db.run(
        addAtivoQuery,
        [id, name, price, warranty, expiration, maintenance],
        function (err) {
          if (err) {
            console.log(err);
            res
              .status(500)
              .json({ message: "Erro ao adicionar ativo no banco de dados" });
          } else {
            res
              .status(200)
              .json({ message: "Ativo adicionado com sucesso", id: id });
          }
        }
      );
    } else {
      // Se o ativo já existe, retorne uma mensagem informando
      res.status(400).json({ message: "Ativo já existe na tabela" });
    }
  });
});

app.get("/listAll", (req, res) => {
  // Obter uma lista de todas as tabelas que começam com "hist"
  const getTablesQuery = `SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'hist%'`;

  db.all(getTablesQuery, [], (err, tables) => {
    if (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "Erro ao obter tabelas no banco de dados" });
      return;
    }

    // Array para armazenar as linhas com o maior valor "num" de cada tabela
    const resultRows = [];

    // Iterar sobre cada tabela
    tables.forEach((table) => {
      const tableName = table.name;
      // Obter a linha com o maior valor "num" em cada tabela
      const getMaxNumRowQuery = `SELECT * FROM ${tableName} ORDER BY num DESC LIMIT 1`;

      db.get(getMaxNumRowQuery, [], (err, row) => {
        if (err) {
          console.log(err);
          res
            .status(500)
            .json({ message: `Erro ao obter linha de ${tableName}` });
          return;
        }

        // Adicionar a linha ao array de resultados
        if (row) {
          resultRows.push(row);
        }

        // Se todas as tabelas foram processadas, retornar o resultado
        if (resultRows.length === tables.length) {
          res.status(200).json(resultRows);
          console.log(resultRows);
        }
      });
    });
  });
});

app.post("/location", (req, res) => {
    const id = req.body.id;
    // Validate input
    if (!id) {
      res.json({ message: "id inválido" });
      return;
    }
    // Use a parameterized query for safety and correctness
    const query = `SELECT lat,long FROM rastreamento WHERE id = ?`;

    db.all(query, [id], (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ message: "Internal server error" });
        return;
      }
      console.log(rows, "rows");
      // Check if the user was found
      if (rows && rows.length === 0) {
        res.json({ message: false });
        return; // Prevent further execution after sending response
      }
      res.json(rows); // Retorna os dados encontrados
    });
  });