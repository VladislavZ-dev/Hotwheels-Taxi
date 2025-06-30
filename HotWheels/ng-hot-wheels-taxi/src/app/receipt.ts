export class Receipt { 
    constructor(
        public number: Number,
        public date:  Date,
        public branchOffice:  string,
        public client:  string ,
        public price: number,
        public trip:  string,
        ){}
    }