const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("x-auth-token");

    if (token == "") {
      return res.status(401).json({
        message: "No authentication token, access denied",
        success: false,
      });
    }

    console.log("JWT_SECRET", process.env.JWT_SECRET);

    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return res.status(401).json({
        message: "Token verification failed, authorization denied",
        success: false,
      });
    }

    req.user = {
      id: verified.id,
      role: verified.role,
    };

    next();
  } catch (err) {
    console.log("Error message: ", err);
    res.status(500).json({ message: err.message, success: false });
  }
};

module.exports = auth;
