import winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

const logger = winston.createLogger({
    transports: [
        new Loggly({
            token: "f9d4a3d0-691f-4ca2-9b58-6ad9c120cd43",
            subdomain: "ndnghia24",
            tags: ["vercel-api"],
            json: true,
            isBulk: true
        })
    ]
});

export default logger;

// Mark this file as a module
export { };
