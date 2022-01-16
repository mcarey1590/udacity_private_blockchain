export class BlockMessage {
    address: string;
    time: number;
    readonly description: string = 'starRegistry';

    constructor(address?: string, time?: number) {
        this.address = address || '';
        this.time = time || 0;
    }

    toString() {
        return `${this.address}:${this.time}:starRegistry`
    }

    parse(message: string) {
        const [ address, time ] = message.split(':');
        this.address = address;
        this.time = +time;
        return this;
    }
}