// sockets/socket.js
const { Server } = require("socket.io");

let io; // shared instance

function initSocket(server, app, options = {}) {
  io = new Server(server, options);

  // Make io available in controllers: req.app.get("io")
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    /**
     * Client should emit:
     * socket.emit("join", { role: "admin" | "vendor" | "customer", userId })
     */
    socket.on("join", ({ role, userId }) => {
      if (role === "admin") {
        socket.join("admin");
        console.log("Admin joined admin room");
      }

      if (role === "vendor" && userId) {
        socket.join(`vendor:${userId}`);
        console.log(`Vendor joined room vendor:${userId}`);
      }

      if (role === "customer" && userId) {
        socket.join(`user:${userId}`);
        console.log(`Customer joined room user:${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};