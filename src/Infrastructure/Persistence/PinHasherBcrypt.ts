import { PinTextoPlano } from "../../Domain/Value-Objects/Pin";
import { IPinHasher } from "../../Domain/Value-Objects/PinHasher";



export class PinHasherBcrypt implements IPinHasher {
    async hashear(pin: PinTextoPlano): Promise<string> {
        return pin.valorCompleto();
    }

    async verificar(pin: PinTextoPlano, hash: string): Promise<boolean> {
        return hash === pin.valorCompleto();
    }
}
