import express from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
import morgan from "morgan";
const storage = multer.memoryStorage();
const upload = multer({ dest: "uploads/" });
const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// app.use(morgan("dev"));
app.use(cors());
app.get("/auth-token", (req, res) => {
  res.status(StatusCodes.OK).send("auth token detected");
});
app.get("/get-endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("GET response");
});
app.get("/", (req, res) => {
  // console.log("abc");
  res.status(StatusCodes.OK).send("hi");
});
app.get("/default-header", (req, res) => {
  // console.log(req.headers);
  res.status(StatusCodes.OK).send(req.headers["x-custom"]);
});
app.get("/endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("get response");
});
app.get("/param", (req, res) => {
  res.status(StatusCodes.OK).send(req.url);
});
app.get("/cache", (req, res) => {
  res.status(StatusCodes.OK).send("Init connection");
});
app.get("/max", (req, res) => {
  res.status(StatusCodes.BAD_REQUEST).send("testing");
});
app.get("/delay", async (req, res) => {
  const delay = async (seconds) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        res.status(StatusCodes.OK).send("timeout working");
        resolve();
      }, seconds);
    });
  };
  await delay(2000);
});

app.patch("/endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("patch response");
});
app.put("/endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("put response");
});
app.delete("/endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("delete response");
});

app.post("/endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("post response");
});

app.post("/form-data", (req, res) => {
  // console.log(req.body);
  res.status(StatusCodes.OK).send(req.headers["content-type"]);
});

app.post("/is-form-data", upload.none(), (req, res) => {
  res.status(StatusCodes.OK).send(req.headers["content-type"]);
});

app.post("/file", upload.single("file"), (req, res) => {
  console.log(req.headers, "---------");
  console.log(req.body);
  console.log(req.data);
  console.log(req.file, "abc");
  res.status(StatusCodes.OK).send("abc");
});

app.listen(3000, () => {
  console.log("server running on port 3000");
});
