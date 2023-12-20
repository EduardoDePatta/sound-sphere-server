import { Router } from "express";
import { mustAuth, validate } from "../middleware";
import { updateHistory, removeHistory, getHistories } from "../controllers";
import { UpdateHistorySchema } from "../utils";

const router = Router();

router.post("/", mustAuth, validate(UpdateHistorySchema), updateHistory);
router.delete("/", mustAuth, removeHistory);
router.get("/", mustAuth, getHistories);

export { router as historyRouter };
