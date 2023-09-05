import express from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import multer from "multer";
// import httpjs from "@cannonui/httpjs";
import morgan from "morgan";
const storage = multer.memoryStorage();
const upload = multer({ dest: "uploads/" });
const app = express();
let cache = false;
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// app.get("/server", async (req, res) => {
//   const ok = await httpjs.get("http://localhost:3000");
//   console.log(ok);

//   res.status(StatusCodes.OK).send("ok");
// });
// app.use(morgan("dev"));
app.use(cors());
app.use(express.static("images"));
app.get("/", (req, res) => {
  console.log("321");
  res.status(StatusCodes.OK).send("OK");
});
app.get("/auth-token", (req, res) => {
  res.status(StatusCodes.OK).send("auth token detected");
});
// Sample data
const searchData = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
  { id: 3, name: "Item 3" },
  // Add more data here as needed
];

// Endpoint for fetching JSON data
app.get("/search", (req, res) => {
  const { q } = req.query;
  // Simulate API delay
  setTimeout(() => {
    if (!q) {
      console.log(123);
      // If query is empty, return all data
      res.json(searchData);
    } else {
      // If query is provided, filter data based on the query
      const filteredData = searchData.filter((item) =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
      res.json(filteredData);
    }
  }, 1000); // Simulate a 1-second delay for demonstration purposes
});
app.get("/sse", (req, res) => {
  console.log(123);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  let counter = 0;
  const interverId = setInterval(() => {
    counter++;
    res.write(`data: ${counter}\n\n`);
    if (counter === 10) {
      clearInterval(interverId);
      res.end();
    }
  }, 2000);
});
app.get("/cacheapi", (req, res) => {
  console.log(123);
  res.json({ hi: 123 });
});
app.get("/get-endpoint", (req, res) => {
  res.status(StatusCodes.OK).send("GET response");
});
app.get("/streaming", (req, res) => {
  // Send response as a stream of data
  const data = "ABCDEFGHIJKLMNOPQRSTUVWXYZ666666";
  const chunkSize = 16;
  const interval = 500; // 500ms delay between each chunk

  // Set response headers
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Length", data.length);

  // Send chunks of data at regular intervals
  let currentIndex = 0;
  const sendChunk = () => {
    const chunk = data.slice(currentIndex, currentIndex + chunkSize);
    currentIndex += chunkSize;
    console.log(currentIndex, data.length);

    // If there's still data to send
    if (currentIndex <= data.length) {
      res.write(chunk);
      setTimeout(sendChunk, interval);
    } else {
      console.log("end");
      // End the response when all data has been sent
      return res.end();
    }
  };

  // Start sending data
  sendChunk();
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
app.get("/json", (req, res) => {
  res.status(StatusCodes.OK).json({ a: 123 });
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
  console.log(req.body);
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
  // console.log(req.headers, "---------");
  // console.log(req.body);
  // console.log(req.data);
  // console.log(req.file, "abc");
  res.status(StatusCodes.OK).send("abc");
});

app.listen(3001, () => {
  console.log("server running on port 3001");
});
