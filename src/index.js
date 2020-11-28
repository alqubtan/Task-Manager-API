const express = require("express");
const cors = require('cors')

require("./db/mongoose");
const userRouter = require("./routes/user");
const taskRouter = require("./routes/task");

const app = express();
const port = process.env.PORT;
app.use(cors())
app.use("/tasks", require("./middleware/auth"));
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
