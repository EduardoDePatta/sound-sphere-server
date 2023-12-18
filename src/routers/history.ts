import { Router } from "express";
import { mustAuth, validate } from "../middleware";
import { updateHistory, removeHistory } from "../controllers";
import { UpdateHistorySchema } from "../utils";

const router = Router();

router.post("/", mustAuth, validate(UpdateHistorySchema), updateHistory);
router.delete("/", mustAuth, removeHistory);

export { router as historyRouter };
