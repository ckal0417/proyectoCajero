import * as bcrypt from 'bcrypt';
import { PinTextoPlano } from "../../Domain/Value-Objects/Pin";
import { IPinHasher } from "../../Domain/Value-Objects/PinHasher";

export class PinHasherBcrypt implements IPinHasher {
    private readonly rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);

    async hashear(pin: PinTextoPlano): Promise<string> {
        return pin.valorCompleto();
    }

    async verificar(pin: PinTextoPlano, hash: string): Promise<boolean> {
        return pin.valorCompleto() === hash;
    }
}
