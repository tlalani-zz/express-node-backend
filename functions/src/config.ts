import * as fbApp from "firebase-admin";
import * as functions from "firebase-functions";

const serviceAccount = require(functions.config().config.credential);
const admin = fbApp.initializeApp({
  credential: fbApp.credential.cert(serviceAccount),
  databaseURL: functions.config().config.databaseurl
});

export const auth = admin.auth();
export const db = admin.database();