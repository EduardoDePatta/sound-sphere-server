import { Router } from "express";
import { isVerified, mustAuth } from "../middleware";
import { toggleFavorite, getFavorites, getIsFavorite } from "../controllers";

const router = Router();

router.post("/", mustAuth, isVerified, toggleFavorite);
router.get("/", mustAuth, getFavorites);
router.get("/is-favorite", mustAuth, getIsFavorite);

export { router as favoriteRouter };
