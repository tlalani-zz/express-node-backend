import * as constants from "../constants/constants";
import * as express from "express";
import { db, auth } from "../config";
import { get } from "lodash";
import { HttpEndpoints, ENDPOINTS } from "../constants/http-constants";
import { parseRoster, parseAttendance, addAbsents } from "./base-app-constants";
export const attendanceApp: express.Application = express();

attendanceApp.get("/", (request: any, response: any) => {
    response.status(404).send("Request Not Found");
});

//get roster
attendanceApp.get("/roster/:schoolYear", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        const schoolYear = get(request, ["params", "schoolYear"], "");
        await auth.verifyIdToken(token)
        const res = await constants.dbGet(db, HttpEndpoints.ROSTER(schoolYear), perms)
        const parsedRoster = parseRoster(res.val());
        response.send(parsedRoster);
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "get-roster");
        response.status(status).send(res);
    }
});

//get roster of all shifts
attendanceApp.get("/roster", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        //only keeps (Center, Level, 'Shifts')
        perms.re_shift = null;
        await auth.verifyIdToken(token);
        const res = await constants.dbGet(db, HttpEndpoints.ALL_SHIFTS_ROSTER(), perms);
        response.send(res.val());
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "get-all-shifts-roster");
        response.status(status).send(res);
    }
})

//get attendance
attendanceApp.get("/attendance/:schoolYear", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        const schoolYear = get(request, ["params", "schoolYear"], '');
        const date = get(request, ["query", "date"], '');
        await auth.verifyIdToken(token);
        const res = await constants.dbGet(db, HttpEndpoints.ATTENDANCE_ON_DAY(schoolYear, date), perms);
        const res2 = await constants.dbGet(db, HttpEndpoints.ROSTER(schoolYear), perms);
        if(res && res2) {
        const attendance = parseAttendance(res.val());
        const roster = parseRoster(res2.val());
        addAbsents(attendance, roster);
        response.send(attendance);
        } else {
        throw new Error("");
        }
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "get-attendance");
        response.status(status).send(res);
    }
});

//add a shift
attendanceApp.post("/shift/add", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        const body = JSON.parse(request.body);
        const schoolYear = get(body, ["schoolYear"], '');
        const day = get(body, ["shift", "day"], '');
        const time = get(body, ["shift", "time"], "");
        await auth.verifyIdToken(token);
        await constants.dbPut(db, HttpEndpoints.ADD_SHIFT(day, time, schoolYear), 1, perms);
        response.status(204).send();
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "add-shift");
        response.status(status).send(res);
    }
})

//update roster
attendanceApp.put("/roster/:schoolYear/:role/:grade?", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        const schoolYear = get(request, ["params", "schoolYear"], "");
        const grade = get(request, ["params", "grade"], "");
        const role = get(request, ["params", "role"], "");
        const body = JSON.parse(request.body);
        const val = get(body, ["people"], "");
        await auth.verifyIdToken(token);
        await constants.dbPut(db, HttpEndpoints.UPDATE_ROSTER(schoolYear, role, grade), val, perms);
        response.status(204).send();
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "update-roster");
        response.status(status).send(res);
    }
});

//update attendance
attendanceApp.post("/attendance/:schoolYear/:date/:role/:grade?", async (request: any, response: any) => {
    try {
        const { perms, token } = constants.getPermsAndToken(request, ENDPOINTS.ATTENDANCE)
        const schoolYear = get(request, ["params", "schoolYear"], "");
        const date = get(request, ["params", "date"], "");
        const grade: string = get(request, ["params", "grade"], "");
        const role = get(request, ["params", "role"], "");
        const body = JSON.parse(request.body);
        const val = get(body, ["person"], '');
        const name = get(body, ["name"], '');
        await auth.verifyIdToken(token);
        await constants.dbPut(db, 
            HttpEndpoints.UPDATE_ATTEDANCE(schoolYear, date, role, name, grade), val, perms)
        response.status(204).send();
    } catch(e) {
        const {status, res} = constants.handleError(e, ENDPOINTS.ATTENDANCE, "update-attendance");
        response.status(status).send(res);
    }
});