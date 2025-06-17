import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token; // Use optional chaining to avoid errors

  if (token) return res.status(401).json({ message: "Not Authenticated!!!" });
  console.log("Token:", token); // Log the token for debugging

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
    if (err) return res.status(403).json({ message: "Token is not Valid!", token: token });
    req.userId = payload.id;

    next();
  });
};