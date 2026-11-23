import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen(env.port, "0.0.0.0", () => {
  console.log(`backend_store listening on 0.0.0.0:${env.port}`);
});
