const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const NewsPost = require("../models/NewsPost");

const saltRounds = 11;

const userLoggedIn = async (req) => {
  try {
    const token = req.header("x-auth-token");

    if (token == undefined) return false;

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) return false;

    const user = await User.findById(verified.id);

    if (!user) return false;

    return user;
  } catch (err) {
    return false;
  }
};

const registerUser = async (req) => {
  const { name, email, password, role } = req.body;

  // Check if all fields have values
  if (
    name.trim() === "" ||
    email.trim() === "" ||
    password.trim() === "" ||
    role.trim() === ""
  ) {
    return {
      status: 400,
      success: false,
      message: "One or more of the fields is not present",
    };
  }

  //Check if user exists and return if true(i.e Account cannot be created)
  if ((await User.findOne({ email })) !== null) {
    return {
      status: 400,
      success: false,
      message: "An account with the email specified exists",
    };
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document in database
    const result = await User.create({
      name,
      role,
      email,
      password: hashedPassword,
    });

    if (result === null) {
      return {
        status: 500,
        success: false,
        message: "Server Error",
      };
    }

    // Response after user account has been created
    return {
      status: 200,
      success: true,
      message: "Account created successfully",
    };
  } catch (err) {
    console.log("Errors encountered: ", err.message);
    return {
      status: 500,
      success: false,
      message: "Server Error",
    };
  }
};

const loginUser = async (req) => {
  const { email, password } = req.body;

  // Get document using email, from database if it exists
  let userFound = await User.findOne({ email });

  if (userFound === null) {
    return {
      status: 404,
      success: false,
      message: "Invalid email",
    };
  }

  // if user is found compare password
  const passwordsMatch = await bcrypt.compare(password, userFound.password);

  if (passwordsMatch) {
    delete userFound._doc.password;

    // This line generates the jwt token
    const token = jwt.sign(
      { id: userFound._doc._id, role: userFound._doc.role },
      process.env.JWT_SECRET
    );

    return {
      token,
      status: 200,
      success: true,
      message: "Login successful",
      user: userFound._doc,
    };
  } else {
    return {
      status: 500,
      success: false,
      message: "Login failed",
    };
  }
};

const createPost = async (req) => {
  const { postTitle, category, newsContent } = req.body;
  const userId = req.user.id;

  // Check if a post with same title exists, if yes return error message
  if ((await NewsPost.findOne({ postTitle })) !== null) {
    return {
      success: false,
      status: 400,
      message:
        "A post with that title already exists, Please choose another title",
    };
  }

  // If any of the fields is not present, return error message
  if (postTitle == "" || category == "" || newsContent == "" || userId == "") {
    return {
      success: false,
      status: 400,
      message: "One or more required fields has no value",
    };
  }

  const postCreated = await NewsPost.create({
    postTitle,
    category,
    newsContent,
    userId,
    published: false,
  });

  if (postCreated === null) {
    return {
      success: false,
      status: 400,
      message: "Errors encountered while trying to save post, Pls try again",
    };
  }

  return {
    success: true,
    status: 200,
    message: "Post created successfully",
  };
};

const deleteNewsPost = async (postId) => {
  const result = await NewsPost.deleteOne({ _id: postId });

  console.log("Deletion result", result);

  if (result.deletedCount === 1) {
    return {
      success: true,
      status: 200,
      message: "The news post was deleted successfully",
    };
  } else {
    return {
      success: false,
      status: 500,
      message: "Deletion failed",
    };
  }
};

const publishNewsPost = async (postId) => {
  const newsPost = (await NewsPost.find({ _id: postId }))[0];

  newsPost.published = !newsPost.published;

  const publishResponse = await newsPost.save();

  if (publishResponse) {
    return {
      status: 200,
      success: true,
      message: "News post succesfully updated",
      published: publishResponse.published,
    };
  }

  return {
    status: 500,
    success: false,
    message: "Couldn't publish post",
  };
};

const isAdmin = async (userId) => {
  const result = await User.findOne({ _id: userId });

  return result._doc.role === "admin";
};

module.exports = {
  loginUser,
  registerUser,
  createPost,
  deleteNewsPost,
  userLoggedIn,
  publishNewsPost,
  isAdmin,
};
