import * as functions from "firebase-functions";
import * as cors from "cors";
import * as express from "express";
import { attendanceApp } from "./base-app/index";
import { inventoryApp } from "./inventory/index";
import { get } from "lodash";
import { db } from "./config";
import { HttpEndpoints, ENDPOINTS } from "./constants/http-constants";
import { auth } from "./config";
import { dbGet, handleError, base64encode, dbPut, sendEmail, userParseString } from "./constants/constants";
import { calendarRouter } from "./calendar";

const app: express.Application = express();

app.use(cors());
app.use(attendanceApp);
app.use("/inventory", inventoryApp);
app.use("/calendar", calendarRouter);

//get permissions
app.get("/permissions", async (request: any, response: any) => {
    try {
        const token = get(request, ["headers", "authorization"], "");
        const userInfo = await auth.verifyIdToken(token);
        const res = await dbGet(db, HttpEndpoints.PERMISSIONS(userInfo));
        response.send(res.val());
    } catch(e) {
        const {status, res} = handleError(e, ENDPOINTS.BASE, "get-permissions");
        response.status(status).send(res);
    }
});

//add user
app.post("/user/add", async (request: any, response: any) => {
    try {
        const user = get(request, ["body"], null);
        if(!user) throw Error("User not Added as body");
        const email = base64encode(user.email);
        await dbPut(db, HttpEndpoints.ADD_USER(email), user)
        sendEmail("automationrec@gmail.com",
          "Request For Registration",
          `A User:\n${userParseString(user)}\nhas requested a registration`
        );
        response.status(204).send();
    } catch(e) {
        const {status, res} = handleError(e, ENDPOINTS.BASE, "add-user");
        response.status(status).send(res);
    }
});

exports.app = functions.https.onRequest(app);