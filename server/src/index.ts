import { app, connectDatabase } from "./app.js";
import { config } from "./config.js";

async function bootstrap() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Praxis Form API listening on port ${config.port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
