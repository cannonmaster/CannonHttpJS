// import http from "./main";
// Get a reference to the form element
// const form: any = document.getElementById("uploadForm");

// // Add a submit event listener to the form
// form.addEventListener("submit", (event: any) => {
//   event.preventDefault(); // Prevent the default form submission

//   // Create an instance of the FormData object
//   const formData = new FormData(form);

//   // Create an instance of the CannonHttpJS class
//   const httpClient = new http();
//   httpClient.setBaseUrl("http://localhost:3000");

//   // Make a POST request to the /upload endpoint with the form data
//   httpClient
//     .post("/file", {
//       data: formData,
//       // isFormData: true,
//     })
//     .then((response) => {
//       // Handle the response
//       console.log(response.data);
//     })
//     .catch((error) => {
//       // Handle the error
//       console.error(error);
//     });
// });

// const httpClient = new http();
// httpClient.setBaseUrl("http://localhost:3000");
// const formData = {
//   a: 123,
//   b: 123,
// };
// // Make a POST request to the /upload endpoint with the form data
// httpClient
//   .post("/file", {
//     data: formData,
//     isFormData: true,
//   })
//   .then((response) => {
//     // Handle the response
//     console.log(response.data);
//   })
//   .catch((error) => {
//     // Handle the error
//     console.error(error);
//   });
// const httpClient = new http();
// httpClient.setBaseUrl("http://localhost:3000");
// // const formData = {
// //   a: 123,
// //   b: 123,
// // };
// const formData = '{"a":123,"b":"012"}';
// // Make a POST request to the /upload endpoint with the form data
// httpClient
//   .post("/file", {
//     data: formData,
//     isFormData: false,
//   })
//   .then((response) => {
//     // Handle the response
//     console.log(response.data);
//   })
//   .catch((error) => {
//     // Handle the error
//     console.error(error);
//   });
// const httpClient = new http();
// httpClient.setBaseUrl("http://localhost:3000");
// // const formData = {
// //   a: 123,
// //   b: 123,
// // };
// const formData = {
//   a: 123,
//   file: new File(["Hello, World!"], "myfile.txt", { type: "text/plain" }),
// };
// const response = await httpClient.post("/file", {
//   data: formData,
//   isFormData: true,
// });
