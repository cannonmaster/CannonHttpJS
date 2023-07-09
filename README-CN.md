# CannonHttpJS

CannonHttpJS 是一个多功能的 HTTP 客户端库，为 Node.js 和浏览器环境提供了一个简单而灵活的接口，用于发起 HTTP 请求。它提供了请求拦截器、响应拦截器、缓存、超时处理等功能。使用 CannonHttpJS，您可以轻松处理 RESTful API，并与服务器进行数据的获取和发送。

## 功能特点

- **HTTP 方法**: 执行常见的 GET、POST、PUT、PATCH 和 DELETE 等 HTTP 方法。
- **请求拦截器**: 在发送请求之前拦截并修改请求配置。
- **响应拦截器**: 在接收响应之后拦截并修改响应数据。
- **缓存**: 缓存响应以提高性能并减少重复请求。
- **超时处理**: 设置请求超时时间，确保请求不会耗时过长。
- **基础 URL**: 定义基础 URL，简化请求 URL 的设置。
- **默认请求头**: 设置默认请求头，应用于所有请求。
- **重试机制**: 配置请求失败时的重试次数和延迟时间。

## 安装

您可以使用 npm 或 yarn 安装 CannonHttpJS：

```bash
npm install cannon-http-js
```

或

```bash
yarn add cannon-http-js
```

## 使用示例

以下是使用 CannonHttpJS 的基本示例：

```javascript
import http from "cannon-http-js";

// 设置基础 URL
http.setBaseUrl("https://api.example.com");

// 发起 GET 请求
http
  .get("/users")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });

// 发起 POST 请求
const postData = { name: "John Doe", email: "john@example.com" };
http
  .post("/users", { data: postData })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
```

更多详细的使用示例和可用方法、选项的信息，请参考[文档](链接到文档)。

## 贡献

欢迎贡献！如果您有任何建议、错误报告或功能请求，请在[GitHub 仓库](链接到 GitHub 仓库)上创建一个 issue。

## 许可证

CannonHttpJS 使用 [MIT 许可证](链接到许可证)发布。