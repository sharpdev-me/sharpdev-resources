import { Router } from "express";
import { ERequest } from "..";
import { dumpEliteData, eliteCollection, getEliteData } from "../database";
import { maxTime, updateData } from "./data";
import * as Errors from "../errors";

const router = Router();

router.get("/", async (req: ERequest, res) => {
    if(!req.user) return res.status(401).send();
    if(!req.user.scopes.includes("elite.view")) return res.status(401).send(Errors.MISSING_PERMISSIONS);

    const record_count = await (await eliteCollection()).countDocuments();

    res.status(200).send({
        record_count: record_count,
        expire_after: maxTime
    });
});

router.get("/data", async (req: ERequest, res) => {
    if(!req.user) return res.status(401).send();
    if(!req.user.scopes.includes("elite.view")) return res.status(401).send(Errors.MISSING_PERMISSIONS);

    const data = await dumpEliteData();

    res.status(200).send(data);
});

router.get("/update", async (req: ERequest, res) => {
    if(!req.user) return res.status(401).send();
    if(!req.user.scopes.includes("elite.update")) return res.status(401).send(Errors.MISSING_PERMISSIONS);

    await updateData();

    res.status(200).send();
});

export default router;