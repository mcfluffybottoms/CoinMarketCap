export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ClientError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ClientError';
    }
}

export class SyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SyncError';
    }
}
