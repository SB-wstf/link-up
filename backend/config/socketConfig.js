// const {
//   setupHandler,
//   joinChatHandler,
//   disconnectHandler,
// } = require("./eventHandlers");

// module.exports.socketConfig = function (server) {
//   // Socket.IO setup
//   const io = require("socket.io")(server, {
//     pingTimeout: 60000,
//     cors: {
//       origin: "*",
//     },
//   });

//   // Socket.IO event handlers
//   io.on("connection", (socket) => {
//     console.log("A user connected");

//     // Setup event handler
//     socket.on("setup", setupHandler(socket));

//     // Join chat event handler
//     socket.on("join chat", joinChatHandler(socket));

//     // Handle user disconnection
//     socket.on("disconnect", () => disconnectHandler(socket));
//   });
// };
