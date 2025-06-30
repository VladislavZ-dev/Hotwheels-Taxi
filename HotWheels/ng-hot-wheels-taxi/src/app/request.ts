import { Address } from "./address";
import { Driver } from "./driver";
import { Person } from "./person";

export interface Request {
    _id?: string; 
    customer: Person;
    pickup: {
      address: Address;
      coordinates?: { lat: number; lng: number }; 
    };
    destination: {
      address: Address;
      coordinates?: { lat: number; lng: number };
    };
    passengers: number;
    status: 'pending' | 'driver_accepted' | 'client_confirmed' | 'completed' | 'cancelled';
    distance?: number; 
    priceEstimate?: number;
    driver?: {
      info: Driver;
      estimatedArrival?: number; 
    };
    comfort: string;
    timestamps: {
      requested: Date;
      driverAccepted?: Date;
      clientConfirmed?: Date;
      completed?: Date;
    };
  }
