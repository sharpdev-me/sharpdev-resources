import express from "express";
import elite from "./elite/router";
import auth from "./auth/router";
import { userMiddleware, User, AuthToken, ScopesRaw } from "./auth/auth_middleware";
import eliteInterval from "./intervals/elite";
import bodyParser from "body-parser";
import { purgeEliteData, usersCollection, dumpEliteData } from "./database";
import cors from "cors";
import { createHmac, randomBytes } from "crypto";
import { updateData } from "./elite/data";

eliteInterval();

const port = process.env.PORT || 5050;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(userMiddleware);

app.use("/elite", elite);
app.use("/auth", auth);

app.get("/", async (req, res) => {
    await updateData();
    res.status(200).send(await dumpEliteData());
});

app.listen(port, async () => {
    console.log("server listening");
    const hmac = createHmac("sha256", process.env.PASSWORD_SALT || "");
    const collection = await usersCollection();

    const sharpdev: User = await collection.findOne({username: "sharpdev"}) as any;
    sharpdev.scopes = ScopesRaw;

    collection.replaceOne({username: "sharpdev"}, sharpdev);
});

export interface ERequest extends express.Request {
    user?: User;
    token?: AuthToken;
}