import { database } from "firebase-admin/lib";
import * as functions from "firebase-functions";
import { get } from "lodash";
import * as fs from "fs";
import { GoogleApis } from "googleapis";
import * as readLine from "readline";

const google = new GoogleApis();
const TOKEN = "../../resources/token.json";/* get(functions.config(), ["config", "token"], "");*/
const EMAIL = get(functions.config(), ["config", "email"], "");
const SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send"
];

export const UNAUTHORIZED = "Authorization for this resource failed.";

export const Grades = {
    PrePrimary: ["PK", "KG"],
    Primary: ["1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade"],
    Secondary: ["7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"]
}

export interface ReConfig {
   re_center: string;
   re_class: string;
   re_shift: string;
   shift_day: string;
   shift_time: string;
}

export const permsAsArray = (perms: ReConfig) => {
  const shift_day = perms.re_shift.split(", ")[0] || null;
  const shift_time = perms.re_shift.split(", ")[1] || null;
  return [perms.re_center, perms.re_class, "Shifts", shift_day, shift_time];
}

export const dbGet = (db: database.Database, path: string[], perms?: ReConfig): Promise<any> => {
  let queryString;
  if(perms) {
    const filteredPath = path.filter(pathItem => pathItem.length > 0);
    queryString = ["REC", ...permsAsArray(perms), ...filteredPath].join("/");
  } else {
    queryString = [...path].join("/");
  }
  return db.ref(queryString).once("value");
};

export const dbPut = (db: database.Database, path: string[], val: any, perms?: ReConfig): Promise<void> => {
    let queryString;
    const filteredPath = path.filter(pathItem => pathItem.length > 0);
    if(perms) {
      queryString = ["REC", ...permsAsArray(perms), ...filteredPath].join("/");
    } else {
      queryString = [...filteredPath].join("/");
    }
    return db.ref(queryString).set(val);
};
  
export const getPermsAndToken = (request: any): any => {
    const perms: ReConfig = get(request, ["headers", "perms"], {});
    const token = get(request, ["headers", "authorization"], "");
    return { perms, token };
}

export const handleError = (error: any, baseApi: string, endpoint:string) => {
  let status = 400;
  let res = "Unknown";
  if(error.code) {
    switch(error.code) {
      case "auth/argument-error":
        status = 403;
        res = UNAUTHORIZED;
        break;
      case "auth/invalid-user-token":
        status = 401;
        res = UNAUTHORIZED;
      default:
        break;
    }
  } else {
    status = 500;
    res = error.message ? error.message : `error running function at endpoint: [${baseApi}-${endpoint}]`;
  }
  return {status, res}
};

export const base64encode = (string: string) => {
  return Buffer.from(string).toString('base64');
}

export const base64Decode = (string: string) => {
  return Buffer.from(string, 'base64').toString();
}

export const sendEmail = (toEmail: string, subject: string, emailMessage: string) => 
fs.readFile("../../credentials.json", (err, content: Buffer) => {
  if (err) throw err;
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content.toString()), toEmail, subject, emailMessage);
});

const authorize = (credentials: any, toEmail: string, subject:string,  message: string) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  fs.readFile(TOKEN, (err, token) => {
    if (err) {getNewToken(oAuth2Client); return;}
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    sendMessage(oAuth2Client, toEmail, subject, message);
  });
}

const getNewToken = (oAuth2Client: any) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) throw err;
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN, JSON.stringify(token), error => {
        if (err) throw err;
        console.log("Token stored");
      });
      return 
    });
  });
}

const sendMessage = (auth: any, toEmail: string, subject: string, message: string) => {
    const raw = makeBody(toEmail, EMAIL, subject, message);
    const gmail = google.gmail({ version: "v1", auth });
    gmail.users.messages.send(
      {
        auth: auth,
        userId: "me",
        requestBody: {
          raw: raw
        }
      },
      (err: any, response: any) => {if(err) throw err; else return;}
        
    );
}

const makeBody = (to: string, from: string, subject: string, message: string) => {
    const str = [
      'Content-Type: text/plain; charset="UTF-8"\n',
      "MIME-Version: 1.0\n",
      "Content-Transfer-Encoding: 7bit\n",
      "to: ",
      to,
      "\n",
      "from: ",
      from,
      "\n",
      "subject: ",
      subject,
      "\n\n",
      message
    ].join("");
  
const encodedMail = Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return encodedMail;
}
  