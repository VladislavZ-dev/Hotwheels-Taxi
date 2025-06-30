import { Address } from './address';
import { Person } from './person';

export class Driver {
    public _id?: string;
    constructor(
        public birthYear: number,
        public driversLicense: string,
        public person?: Person,
        public address?: Address,
    ){}    
}
