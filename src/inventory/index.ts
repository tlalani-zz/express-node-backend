import * as express from "express";
import { get } from "lodash";
import { auth, db } from "../config";
import { getPermsAndToken, dbPut, handleError, dbGet } from "../constants/constants";
import { makeIdString } from "./inventory-constants";
import { HttpEndpoints } from "../constants/http-constants";
export const invApp: express.Application = express();

const apiName = "inventory";

invApp.post("/checkout", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request);
        await auth.verifyIdToken(token);
        const item = get(request, ["body", "item"], {});
        if(item) {
            const name = item.name;
            const date = item.date;
            const time = item.time;
            const id = makeIdString([name, date, time]);
            await dbPut(db, ["inventory", "total", item.name, item.currentQuantity], item.currentQuantity - item.quantity);
            await dbPut(db, ["inventory", "checkout", id], {quantity: item.quantity, for: item.grade}, perms);
            response.status(204).send();
        } else {
            throw new Error("No Item Found")
        }
    } catch(e) {
        const {status, res} = handleError(e, apiName, "checkout");
        response.status(status).send(res);
    }
});

invApp.post("/checkin", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request);
        await auth.verifyIdToken(token);
        const item = get(request, ["body", "item"], {});
        if(item) {
            const name = item.name;
            const date = item.date;
            const time = item.time;
            const id = makeIdString([name, date, time]);
            await dbPut(db, ["inventory", "total", item.name, item.currentQuantity], item.currentQuantity + item.quantity);
            await dbPut(db, ["inventory", "checkin", id], {quantity: item.quantity, from: item.grade}, perms);
            response.status(204).send();
        } else {
            throw new Error("No Item Found")
        }
    } catch(e) {
        const {status, res} = handleError(e, apiName, "checkin");
        response.status(status).send(res);
    }
})

invApp.get("/get-items", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request);
        await auth.verifyIdToken(token);
        const res = await dbGet(db, HttpEndpoints.GET_INVENTORY_ITEMS(), perms);
        response.status(200).send(res);
    } catch(e) {
        const {status, res} = handleError(e, apiName, "getItems");
        response.status(status).send(res);
    }
})