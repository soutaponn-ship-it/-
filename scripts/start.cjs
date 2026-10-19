process.env.NODE_ENV = "production";
import("../dist/index.js").catch((error) => {
  console.error(error);
  process.exit(1);
});
