// Route handlers pass errors here so the API always returns a readable JSON message.
function handleErrors(error, request, response, next) {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(function (item) {
      return item.message;
    });
    return response.status(400).json({ message: messages.join(" ") });
  }

  if (error.code === 11000) {
    return response.status(409).json({ message: "That email or reference is already in use." });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error(error);

  response.status(statusCode).json({
    message: statusCode === 500 ? "Something went wrong on the server." : error.message
  });
}

module.exports = { handleErrors };
