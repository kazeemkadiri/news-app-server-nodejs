require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const auth = require("./middleware/auth");
const mongoose = require("mongoose");
const NewsPost = require("./models/NewsPost");
const User = require("./models/User");

const {
  registerUser,
  loginUser,
  createPost,
  deleteNewsPost,
  userLoggedIn,
  publishNewsPost,
  isAdmin,
} = require("./lib/helpers");

const { NODE_ENV } = process.env;
const PORT = process.env.PORT || 5000;

const MONGODB_URL =
  NODE_ENV === "development"
    ? process.env.MONGODB_LOCAL_URL
    : process.env.MONGODB_SERVER_URL;

const app = express();

// Mongodb connection
mongoose
  .connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((db) => console.log("Connected to Mongodb database"))
  .catch((err) => console.log("Error connecting to MongoDB", err));

// app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.use((req,res,next)=>{
  console.log('Requested url', req.url);
  next();
});

// This line of code returns the index.html in build folder
app.get('/', (req, res) => {
  console.log('In here');
  res.sendFile(path.join(__dirname, 'public','index.html'));
  res.end();
});

app.post("/login", async (req, res) => {
  let loginObj = {};

  // The user is not logged in
  if (!(await userLoggedIn(req))) {
    // This generates a token for the user
    loginObj = await loginUser(req);
  } else {
    loginObj = {
      status: 200,
      success: true,
      message: "Login successful",
    };
  }

  res.status(loginObj.status).json(loginObj);
});

app.post("/register", auth, async (req, res) => {
  // Register user
  const userRegistered = await registerUser(req);

  if (userRegistered.success === true) {
    // Login user after registration
    const userLoggedIn = await loginUser(req);

    if (userLoggedIn.success) {
      res.status(200).json({
        success: true,
        message: "Your account has been created successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  } else {
    res.status(userRegistered.status).json({
      success: userRegistered.success,
      message: userRegistered.message,
    });
  }
});

app.post("/users/token-is-valid", async (req, res) => {
  const result = await userLoggedIn(req);

  res.status(result.success ? 200 : 400).json({
    user: result !== false ? result.user : null,
    success: result,
  });
});

app.post("/create-news-post", auth, async (req, res) => {
  const postCreated = await createPost(req);

  //console.log("Post created server: ", postCreated);

  res.status(postCreated.status).json(postCreated);
});

// This route fetches all news posts stored in the database
app.post("/news-posts", auth, async (req, res) => {
  if (req.user.role === "user") {
    // if user, fetch posts created by user
    const allNewsPosts = await NewsPost.find({ userId: req.user.id });

    res.status(200).json({
      success: true,
      posts: allNewsPosts ? allNewsPosts : [],
      message: allNewsPosts ? null : "No posts found",
    });
  } else if (req.user.role === "admin") {
    // if admin just fetch all news posts
    const allNewsPosts = await NewsPost.find();

    res.status(200).json({
      success: true,
      posts: allNewsPosts ? allNewsPosts : [],
      message: allNewsPosts ? null : "No posts found",
    });
  }
});

app.post("/delete-post", auth, async (req, res) => {
  const deletionResult = await deleteNewsPost(req.body._id);

  res.status(deletionResult.status).json({
    success: deletionResult.success,
    message: deletionResult.message,
  });
});

app.post("/publish-post", auth, async (req, res) => {
  // This checks if the user that requested for this operation is not an admin
  if (!isAdmin(req.user.id)) {
    res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
    return;
  }

  // Makes a server-side request to set the post's published status to true or false
  const publishResult = await publishNewsPost(req.body.postId);

  res.status(publishResult.status).json({
    success: publishResult.success,
    message: publishResult.message,
    published: publishResult.published,
  });
});

app.post("/fetch-post/:id", async (req, res) => {
  const singlePost = await NewsPost.findById(req.params.id);

  if (singlePost !== null) {
    res.status(200).json({
      success: true,
      message: singlePost,
      post: singlePost,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "An error was encountered while fetching the post",
  });
});

app.put("/update-news-post", auth, async (req, res) => {
  const updateResult = await NewsPost.findOneAndUpdate(
    { _id: req.body._id },
    { ...req.body, userId: req.user.id, published: false }
  );

  console.log(updateResult);

  res.status(updateResult ? 200 : 500).json({
    success: Boolean(updateResult),
    message: updateResult
      ? "Successfully updated post"
      : "Failed to update post",
  });
});

// Fetches all published posts
app.get("/all-news-posts", async (req, res) => {
  const result = await NewsPost.find({ published: true });

  if (result) {
    res.json({
      status: 200,
      success: true,
      posts: result,
    });

    return;
  }

  res.json({
    status: 500,
    success: false,
    message: "Server Error",
  });
});

// Fetches all the records of all users
app.get("/fetch-users", auth, async (req, res) => {
  const result = await User.find({});

  if (result) {
    res.json({
      status: 200,
      success: true,
      users: result,
    });

    return;
  }

  res.json({
    status: 400,
    success: false,
    message: "Failed to fetch records",
  });
});

// Fetches the record of the authenticated user
app.get("/fetch-user", auth, async (req, res) => {
  const result = await User.findOne({ _id: req.user.id });

  console.log(result);

  if (result) {
    res.json({
      status: 200,
      success: true,
      users: result,
    });

    return;
  }

  res.json({
    status: 400,
    success: false,
    message: "Failed to fetch record",
  });
});

// Deletes user record
app.delete("/delete-user/:userId", auth, async (req, res) => {
  const result = await User.findByIdAndDelete({ _id: req.params.userId });

  if (result) {
    res.json({
      status: 200,
      success: true,
      message: "User's record deleted",
    });

    return;
  }

  res.json({
    status: 400,
    success: false,
    message: "Failed to delete user",
  });
});

// Fetches a user record with a given id
app.get("/fetch-user/:userId", auth, async (req, res) => {
  const result = await User.findOne({ _id: req.params.userId });

  console.log(result);

  if (result) {
    res.json({
      status: 200,
      success: true,
      user: result,
    });

    return;
  }

  res.json({
    status: 400,
    success: false,
    message: "Failed to fetch record",
  });
});

// updates a user record with a given id
app.post("/update-user-record", auth, async (req, res) => {
  const user = await User.findOne({ _id: req.body.userId });

  if (req.user.role === "user" && req.user.id !== req.body.userId) {
    res.json({
      status: 400,
      success: false,
      message: "Failed to update record",
    });
    return;
  }

  const { name, email, role, password } = req.body;

  let hashedPassword = "";

  if (password !== "") {
    hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  }

  const result = await User.findByIdAndUpdate(req.body.userId, {
    name: name !== "" ? name : user.name,
    email: email !== "" ? email : user.email,
    role:
      role.toLowerCase() !== "admin" && role.toLowerCase() !== "user"
        ? user.role
        : role,
    password: password !== "" ? hashedPassword : user.password,
  });

  if (result) {
    res.json({
      status: 200,
      success: true,
      message: "The user's profile has been updated",
    });

    return;
  }

  res.json({
    status: 400,
    success: false,
    message: "Failed to update record",
  });
});

app.listen(PORT || 5000, () => console.log(`Server is running on port ${PORT}`));
