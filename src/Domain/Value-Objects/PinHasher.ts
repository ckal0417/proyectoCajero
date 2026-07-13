import { PinTextoPlano } from "./Pin";

export interface IPinHasher {
    hashear(pin: PinTextoPlano): Promise<string>;
    verificar(pin: PinTextoPlano, hash: string): Promise<boolean>;
}