import '@testing-library/jest-dom'

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor() { }
    observe() { return null }
    unobserve() { return null }
    disconnect() { return null }
}
window.IntersectionObserver = MockIntersectionObserver

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock ResizeObserver
class MockResizeObserver {
    constructor() { }
    observe() { return null }
    unobserve() { return null }
    disconnect() { return null }
}
window.ResizeObserver = MockResizeObserver 