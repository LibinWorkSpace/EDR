// Test setup file for Vitest
import { vi } from 'vitest'

// Mock fetch globally for tests
// @ts-ignore
global.fetch = vi.fn()

// Setup any global test utilities here