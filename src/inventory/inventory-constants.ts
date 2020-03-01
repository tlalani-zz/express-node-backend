import {base64encode} from "../constants/constants";

export const makeIdString = (list: any[]) : string => {
    return base64encode(list.join(":"));
} 