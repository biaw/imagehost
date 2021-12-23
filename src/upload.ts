import fileUpload from "express-fileupload";
import { Router as router } from "express";

const upload = router();
upload.use(fileUpload({ createParentPath: true }));

upload.use((req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token || token !== process.env.TOKEN) return res.status(401).send("Unauthorized");
  next();
});

export default upload;
