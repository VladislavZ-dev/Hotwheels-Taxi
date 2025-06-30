import {Shift} from './shift';
import {Period} from './period';
import {Taxi} from './taxi'
import {Driver} from './driver';
import {Person} from './person';

export class Trip { 
    constructor(
        public sequence: number, 
        public numPeople: number,
        public period: Period,  
        public route: string, 
        public totalCost: number,
        public shift: Shift,
        public driver: Driver,
        public taxi: Taxi,
        public distance: number,
        public time: number,
        public client?: Person,
    ){}
}