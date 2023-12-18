import { Request } from "express";
import { HistoryType } from "../models";

export interface UpdateHistoryRequest extends Request {
  body: HistoryType;
}
