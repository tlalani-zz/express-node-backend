import {base64encode, base64Decode} from "../constants/constants";

export interface Item {
    name: string,
    date: Date,
    grade: string,
    link?: string,
    quantity?: number
    currentQuantity?: number,
}

export const makeIdString = (item: Item) : string => {
    //name, date, for//
    return base64encode(`${item.name}:${item.date}:${item.grade}`);
} 

export const getObjectFromIdString = (idString: string): Item => {
    //name, date, from//
    let s = base64Decode(idString).split(":");
    return {name: s[0], date: new Date(s[1]), grade: s[2]};
}

///getTIme returns millis if (earliest millis - this millis) > 0 then (this millis) is less than (earliest millis).
///So (this date is before earliest date)
export const findCheckoutForCheckin = (res: any, id: string): Item => {
    let checkouts: Item[] = [];
    res.forEach((child: any) => {
        const checkout = getObjectFromIdString(child.key);
        const checkin = getObjectFromIdString(id);
        if(checkin.name === checkout.name 
        && checkin.grade === checkout.grade
        && checkin.date.getTime() - checkout.date.getTime() > 0) {
            checkouts.push(checkout);
        }
    });
    let earliestCheckout: Item = {name: '', grade: '', date: new Date()};
    checkouts.forEach(checkout => {
        if(earliestCheckout.date.getTime() - checkout.date.getTime() > 0) {
            earliestCheckout = checkout;
        }
    });

    return earliestCheckout;
}