import * as functions from "firebase-functions";
import * as cors from "cors";
import * as express from "express";
import { baseApp } from "./base-app/index";
import { invApp } from "./inventory/index";

const app: express.Application = express();

app.use(cors());
app.use(baseApp);
app.use("/inventory", invApp);


exports.app = functions.https.onRequest(app);