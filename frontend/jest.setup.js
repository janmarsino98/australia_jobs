const { configure } = require('@testing-library/react')
require('@testing-library/jest-dom')

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
})

// Mock import.meta for Vite compatibility
const mockImportMeta = {
    env: {
        DEV: false,
        PROD: true,
        MODE: 'test',
        VITE_API_BASE_URL: 'http://localhost:5000'
    }
}

// Set up import.meta mock globally
global.importMeta = mockImportMeta
Object.defineProperty(global, 'import', {
    value: { meta: mockImportMeta },
    writable: true
})

// For modules that access import.meta directly
global['import.meta'] = mockImportMeta

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

// Mock scrollTo
window.scrollTo = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup DOM environment for testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
})

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}))

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: [] })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}))