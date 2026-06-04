import jwt from "jsonwebtoken";

export const AuthApi = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED DATA:", decoded);
    req.userid = decoded.id;
    next();
    // AuthApi.js catch block update karein
  } catch (error) {
    console.error("JWT VERIFY ERROR:", error.message); // Yeh line aapko asal wajah batayegi
    return res
      .status(401)
      .json({ message: "Invalid or expired token", error: error.message });
  }
};
