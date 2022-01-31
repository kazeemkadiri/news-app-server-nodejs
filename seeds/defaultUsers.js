require("dotenv").config();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
});

const { NODE_ENV } = process.env;
const MONGODB_URL =
  NODE_ENV === "development"
    ? process.env.MONGODB_LOCAL_URL
    : process.env.MONGODB_SERVER_URL;

console.log(process.env);

// Mongodb connection
mongoose
  .connect(MONGODB_URL, { useNewUrlParser: true })
  .then((db) => {
    console.log("Connected to Mongodb database");
    let hashedAdminPassword = bcrypt.hashSync("admin1", 11);

    User.create({
      name: "admin1",
      email: "admin1@admin.com",
      password: hashedAdminPassword,
      role: "admin",
    }).then(
      (onCreateAdmin) => console.log("Admin account seeded"),
      (OnFailed) => console.log("Failed to seed to database")
    );

    hashedAdminPassword = bcrypt.hashSync("admin2", 11);

    User.create({
      name: "admin2",
      email: "admin2@admin.com",
      password: hashedAdminPassword,
      role: "admin",
    }).then(
      (onCreateAdmin) => console.log("Admin account seeded"),
      (OnFailed) => console.log("Failed to seed to database")
    );
    // End of admin account seed

    // Begin user seed
    hashedUserPassword = bcrypt.hashSync("user1", 11);

    User.create({
      name: "user1",
      email: "user1@user.com",
      password: hashedUserPassword,
      role: "user",
    }).then(
      (onCreateAdmin) => console.log("User account seeded"),
      (OnFailed) => console.log("Failed to seed to database")
    );

    hashedUserPassword = bcrypt.hashSync("user2", 11);

    User.create({
      name: "user2",
      email: "user2@user.com",
      password: hashedUserPassword,
      role: "user",
    }).then(
      (onCreateAdmin) => console.log("User account seeded"),
      (OnFailed) => console.log("Failed to seed to database")
    );
    // End user seed
  })
  .catch((err) => console.log("Error connecting to MongoDB", err));

const User = mongoose.model("user", UserSchema);
