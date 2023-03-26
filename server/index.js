import express from "express";
import cors from "cors";
import { journeys } from "./journeys.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/journeys", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.json(journeys);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
