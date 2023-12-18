import { NextFunction, Request, Response } from "express";

export default (asyncFunction: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    asyncFunction(req, res, next).catch(next);
  };
};
