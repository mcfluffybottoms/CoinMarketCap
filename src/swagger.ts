import swaggerJsdoc from 'swagger-jsdoc';

export const options = (url: string): swaggerJsdoc.Options => ({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CryptocurrencyGet API',
            version: '1.0.0',
            description: 'API documentation',
        },
        servers: [
            {
                url,
            },
        ],
        components: {
            securitySchemes: {
                CMCApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-CMC_PRO_API_KEY',
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    description: 'Enter your API key or bearer token',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
});
