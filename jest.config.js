module.exports = {
    projects: [
        {
            preset: 'ts-jest',
            displayName: 'frontend',
            rootDir: './frontend',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/Tests/**/*.tests.ts'],
            collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
            moduleDirectories: ['node_modules', 'src'],
            testPathIgnorePatterns: ['<rootDir>/node_modules/'],
        },
        {
            preset: 'ts-jest',
            displayName: 'backend',
            rootDir: './backend',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/Tests/**/*.tests.ts'],
            collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
            coveragePathIgnorePatterns: ['<rootDir>/src/controllers/FakeController.ts'], // ignore coverage for this file
            moduleDirectories: ['node_modules', 'src'],
            testPathIgnorePatterns: ['<rootDir>/node_modules/'],
        }
    ],
}