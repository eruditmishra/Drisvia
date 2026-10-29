import app from "./app";
import { logger } from "./shared/logger";
import { registerProcessErrorHandlers } from "./shared/middleware/processErrorHandler";
import { startScheduler } from "./modules/scheduler/scheduler.service";

registerProcessErrorHandlers();

const PORT = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "drisvia-api",
  });
});

app.listen(PORT, () => {
  logger.info(`Drisvia listening on port ${PORT}`);
  startScheduler();
});
