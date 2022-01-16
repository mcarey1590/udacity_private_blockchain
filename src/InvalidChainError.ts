export class InvalidChainError extends Error {
    errors: string[];
    constructor(errors: string[], ...params: any) {
        super(...params);
        this.errors = errors;
    }
}