import { Request } from './request';
import { Shift } from "./shift";
import { Taxi } from "./taxi";

export interface ExtendedRequest extends Request {
    trip_distance?: number;
    trip_price?: number;
    shift?: Shift;
    taxi?: Taxi;
  }