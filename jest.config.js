const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    setupFiles: ['<rootDir>/tests/setup.ts'],
    transform: {
        ...tsJestTransformCfg,
    },
};
