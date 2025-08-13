module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        html: '<!DOCTYPE html><html><head></head><body><div></div></body></html>',
        url: 'http://localhost',
        userAgent: 'node.js',
        resources: 'usable',
        runScripts: 'dangerously',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        '^../config$': '<rootDir>/src/__mocks__/config.ts',
        '^../config.ts$': '<rootDir>/src/__mocks__/config.ts',
        '^../httpClient$': '<rootDir>/src/__mocks__/httpClient.ts',
        '^../httpClient.ts$': '<rootDir>/src/__mocks__/httpClient.ts'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    globals: {
        IS_REACT_ACT_ENVIRONMENT: true,
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },
    transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$))'
    ],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
} 