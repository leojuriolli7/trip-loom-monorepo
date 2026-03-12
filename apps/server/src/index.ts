import { createApp } from "@trip-loom/api";

const app = createApp();

app.listen(3001, () => {
  console.log("TripLoom API running on http://localhost:3001");
});
