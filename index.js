const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, Collection, ObjectId } = require("mongodb");
const { ObjectID } = require("bson");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorize access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
    if (err) {
      return req.status(403).send({ message: "forbidden access" });
    }
    // console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ovkd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db("geniusCar").collection("order");

    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    //jwt token
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, { expiresIn: "1d" });
      res.send({ accessToken });
    });

    // order post
    app.post("/order", async (req, res) => {
      const info = req.body;
      const result = await orderCollection.insertOne(info);
      res.send(result);
    });

    app.get("/orders", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectID(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running genius service");
});

app.listen(port, () => {
  console.log("Listen to port", port);
});
