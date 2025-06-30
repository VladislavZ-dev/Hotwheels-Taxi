import {Period} from "./period";
import {Driver} from "./driver";
import {Taxi} from "./taxi";

export class Shift {
    constructor(
        public period: Period,
        public driver: Driver,
        public taxi: Taxi
    ){}
}