import * as express from "express";
import { get } from "lodash";
import { auth, db } from "../config";
import { getPermsAndToken, dbPut, handleError, dbGet } from "../constants/constants";
import { makeIdString, findCheckoutForCheckin, Item } from "./inventory-constants";
import { HttpEndpoints, ENDPOINTS } from "../constants/http-constants";
import { uuid } from 'uuidv4';
export const inventoryApp: express.Application = express();


inventoryApp.post("/checkout", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request, ENDPOINTS.INVENTORY);
        await auth.verifyIdToken(token);
        const item: Item = get(request, ["body", "checkout"], {});
        if(item) {
            const id = makeIdString(item);

            let total: Item = await dbGet(db, ["inventory", "total", item.name], perms);

            //checkout item
            await dbPut(db, HttpEndpoints.INVENTORY_TOTAL([item.name, "quantity"]), 
                total.currentQuantity - item.quantity, perms);
            
            //update totals
            await dbPut(db, HttpEndpoints.INVENTORY_CHECKOUT([id]), item, perms);

            response.status(204).send();
        } else {
            throw new Error("Error checking out item");
        }
    } catch(e) {
        const {status, res} = handleError(e, ENDPOINTS.INVENTORY, "checkout");
        response.status(status).send(res);
    }
});

inventoryApp.post("/checkin", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request, ENDPOINTS.INVENTORY);
        await auth.verifyIdToken(token);
        const checkin: Item = get(request, ["body", "checkin"], {});
        if(checkin) {
            const uid = uuid();
            const checkinId = makeIdString(checkin);
            const res = await dbGet(db, ["inventory", "checkout"], perms);

            const checkout = findCheckoutForCheckin(res, checkinId);
            checkout.link = checkin.link = uid;

            const checkoutId = makeIdString(checkout);

            let total: Item = await dbGet(db, ["inventory", "total", checkin.name], perms);
            //checkin item
            await dbPut(db, HttpEndpoints.INVENTORY_CHECKIN([checkinId]), checkin, perms);
            //update totals
            await dbPut(db, HttpEndpoints.INVENTORY_TOTAL([name, "quantity"]), (total.quantity - checkin.quantity), perms)
            //update checkout
            await dbPut(db, HttpEndpoints.INVENTORY_CHECKOUT([checkoutId]), checkout, perms);

            response.status(204).send();
        } else {
            throw new Error("No Item Found")
        }
    } catch(e) {
        const {status, res} = handleError(e, ENDPOINTS.INVENTORY, "checkin");
        response.status(status).send(res);
    }
})

inventoryApp.get("/get-items", async (request: any, response: any) => {
    try {
        const { perms, token } = getPermsAndToken(request, ENDPOINTS.INVENTORY);
        await auth.verifyIdToken(token);
        const res = await dbGet(db, HttpEndpoints.INVENTORY_TOTAL([]), perms);
        response.status(200).send(res);
    } catch(e) {
        const {status, res} = handleError(e, ENDPOINTS.INVENTORY, "getItems");
        response.status(status).send(res);
    }
})