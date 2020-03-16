import * as express from 'express';
import { get } from 'lodash';
export const calendarRouter: express.Router = express.Router();
import { eventCall, handleError } from '../constants/constants';

const baseApi = 'calendar';

calendarRouter.post('/event', (request: any, result: any) => {
    try {
    const event = get(request, ["body"], {});
    eventCall(event)
    } catch(e) {
        const {status, res} = handleError(e, baseApi, 'postevent');
        result.status(status).send(res);
    }
})