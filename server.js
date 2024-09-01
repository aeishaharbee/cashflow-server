const express = require("express");
const connectDB = require("./database/db");
const PORT = 5000;
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/users", require("./routes/users"));
app.use("/categories", require("./routes/categories"));
app.use("/expenses", require("./routes/expenses"));
app.use("/budgets", require("./routes/budgets"));
app.use("/totals", require("./routes/totals"));
app.use("/reports", require("./routes/reports"));

connectDB();
app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));
