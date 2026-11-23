import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`backend_store listening on http://localhost:${env.port}`);
});
