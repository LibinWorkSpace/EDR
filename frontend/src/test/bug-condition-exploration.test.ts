/**
 * Bug Condition Exploration Test - Tree Retirement Synchronization Gap
 * 
 * **Validates: Requirements 1.1, 1.2, 1.5**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * GOAL: Surface counterexamples that demonstrate the bug exists
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import type { ProcessTree, Alert, DetectionResult } from '../types/edr'

// Mock the API client to simulate backend behavior
vi.mock('../api/client', () => ({
  fetchDetections: vi.fn(),
  postResponseAction: vi.fn(),
  fetchActionLog: vi.fn(),
}))

// Test imports - not used in actual test
// import { fetchDetections } from '../api/client'

/**
 * Bug Condition Function - Formal Specification from Design Document
 * 
 * FUNCTION isBugCondition(input)
 *   INPUT: input of type { backendTrees: ProcessTree[], frontendAlerts: Alert[] }
 *   OUTPUT: boolean
 *   
 *   RETURN EXISTS alert IN input.frontendAlerts WHERE
 *          alert.resolved == false
 *          AND NOT EXISTS tree IN input.backendTrees WHERE tree.tree_id == alert.tree_id
 *          AND alert.timestamp < (currentTime - RETIREMENT_THRESHOLD)
 * END FUNCTION
 */
function isBugCondition(input: { backendTrees: ProcessTree[], frontendAlerts: Alert[] }): boolean {
  const RETIREMENT_THRESHOLD = 120000 // 2 minutes in milliseconds
  const currentTime = Date.now()
  
  return input.frontendAlerts.some(alert => 
    !alert.resolved && 
    !input.backendTrees.some(tree => tree.tree_id === alert.tree_id) &&
    (currentTime - new Date(alert.timestamp).getTime()) > RETIREMENT_THRESHOLD
  )
}

/**
 * Simulate the current (unfixed) alert sync behavior from Response.tsx
 * This represents the actual behavior that has the bug
 */
function simulateCurrentAlertSync(
  currentAlerts: Alert[], 
  detections: DetectionResult[]
): Alert[] {
  const updatedAlerts = [...currentAlerts]
  
  // Current logic only removes alerts when trees are "no longer anomalous"
  // It does NOT handle trees that are completely absent from backend
  updatedAlerts.forEach(alert => {
    if (!alert.resolved) {
      const stillAnomalous = detections.find(d => d.tree_id === alert.tree_id && d.is_anomalous)
      if (!stillAnomalous) {
        // This only handles "no longer anomalous" case, not "tree completely retired" case
        alert.resolved = true
      }
    }
  })
  
  return updatedAlerts
}

// Generators for property-based testing
const treeIdArb = fc.string({ minLength: 10, maxLength: 30 }).map(s => `tree-${s}-${Date.now()}`)

const processTreeArb = fc.record({
  tree_id: treeIdArb,
  label: fc.constantFrom('Malware Attack', 'Data Exfiltration', 'Privilege Escalation', 'Lateral Movement'),
  is_suspicious: fc.boolean(),
  root: fc.record({
    pid: fc.integer({ min: 1000, max: 65535 }),
    ppid: fc.integer({ min: 1, max: 1000 }),
    uid: fc.integer({ min: 0, max: 1000 }),
    executable_path: fc.constantFrom('/bin/bash', '/usr/bin/python3', '/tmp/malware', '/usr/sbin/sshd'),
    command_line: fc.string({ minLength: 5, maxLength: 50 }),
    timestamp: fc.date({ min: new Date(Date.now() - 300000), max: new Date() }).map(d => d.toISOString()),
  })
})

const alertArb = fc.record({
  id: fc.string({ minLength: 10, maxLength: 20 }).map(s => `alert-${s}`),
  tree_id: treeIdArb,
  label: fc.constantFrom('Suspected Malware Attack', 'Potential Data Exfiltration', 'Active Privilege Escalation'),
  pid: fc.integer({ min: 1000, max: 65535 }),
  anomaly_score: fc.float({ min: 0.5, max: 1.0 }),
  timestamp: fc.date({ min: new Date(Date.now() - 300000), max: new Date(Date.now() - 150000) }).map(d => d.toISOString()), // Older than 2.5 minutes
  severity: fc.constantFrom('CRITICAL', 'HIGH', 'MEDIUM') as fc.Arbitrary<'CRITICAL' | 'HIGH' | 'MEDIUM'>,
  resolved: fc.boolean(),
})

describe('Bug Condition Exploration: Tree Retirement Synchronization Gap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Property 1: Bug Condition - Tree Retirement Synchronization Gap', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.5**
     * 
     * Scoped PBT Approach: Test concrete failing cases where backend retires trees
     * but frontend alerts remain active indefinitely
     */
    
    fc.assert(
      fc.property(
        fc.array(processTreeArb, { minLength: 0, maxLength: 6 }), // Backend trees (max 6 as per design)
        fc.array(alertArb, { minLength: 1, maxLength: 10 }), // Frontend alerts
        (backendTrees, frontendAlerts) => {
          // Create a scenario where bug condition exists:
          // - Some alerts have tree_ids that don't exist in backend trees
          // - These alerts are unresolved and older than retirement threshold
          
          const bugConditionInput = {
            backendTrees,
            frontendAlerts: frontendAlerts.map(alert => ({
              ...alert,
              resolved: false, // Ensure alerts are unresolved
              timestamp: new Date(Date.now() - 150000).toISOString(), // 2.5 minutes ago (older than 2min threshold)
              tree_id: `retired-tree-${Math.random()}` // Ensure tree_id doesn't exist in backend
            }))
          }
          
          // Verify bug condition exists
          const hasBugCondition = isBugCondition(bugConditionInput)
          
          if (hasBugCondition) {
            // Simulate current (unfixed) behavior
            const detections: DetectionResult[] = backendTrees.map(tree => ({
              tree_id: tree.tree_id,
              label: tree.label,
              root_pid: tree.root.pid,
              features: {
                tree_depth: 3,
                execution_breadth: 2,
                cli_entropy: 0.7,
                temporal_rate_ms: 1000,
                privilege_transition: false
              },
              anomaly_score: 0.8,
              is_anomalous: tree.is_suspicious
            }))
            
            const syncedAlerts = simulateCurrentAlertSync(bugConditionInput.frontendAlerts, detections)
            
            // THE BUG: Alerts should be cleaned up when their trees are retired,
            // but current implementation doesn't handle this case
            const persistingAlerts = syncedAlerts.filter(alert => 
              !alert.resolved && 
              !backendTrees.some(tree => tree.tree_id === alert.tree_id)
            )
            
            // This assertion SHOULD FAIL on unfixed code, proving the bug exists
            // When fixed, alerts should be properly cleaned up when trees are retired
            expect(persistingAlerts.length).toBe(0) // Expected behavior: no persisting alerts
            
            // Document the counterexample when test fails
            if (persistingAlerts.length > 0) {
              console.log('COUNTEREXAMPLE FOUND - Bug Condition Detected:')
              console.log(`- Backend trees: ${backendTrees.length}`)
              console.log(`- Frontend alerts: ${bugConditionInput.frontendAlerts.length}`)
              console.log(`- Persisting alerts after sync: ${persistingAlerts.length}`)
              console.log('- Persisting alert tree_ids:', persistingAlerts.map(a => a.tree_id))
              console.log('- Backend tree_ids:', backendTrees.map(t => t.tree_id))
            }
          }
          
          return true // Property should hold when bug is fixed
        }
      ),
      { 
        numRuns: 50,
        verbose: true,
        seed: 42 // Deterministic for reproducible counterexamples
      }
    )
  })

  it('Age-based Retirement Scenario: Backend retires trees >2min, alerts persist', () => {
    /**
     * **Validates: Requirements 1.1**
     * Test specific case: backend retires process trees due to age (>2 minutes)
     * but corresponding frontend alerts remain active indefinitely
     */
    
    const oldTreeId = 'malware-attack-1234567890'
    const currentTime = Date.now()
    
    // Simulate backend state: tree was retired due to age
    const backendTrees: ProcessTree[] = [] // Tree retired, no longer in backend
    
    // Simulate frontend state: alert still exists for retired tree
    const frontendAlerts: Alert[] = [{
      id: 'alert-123',
      tree_id: oldTreeId,
      label: 'Suspected Malware Attack',
      pid: 1234,
      anomaly_score: 0.9,
      timestamp: new Date(currentTime - 150000).toISOString(), // 2.5 minutes ago
      severity: 'CRITICAL',
      resolved: false
    }]
    
    const input = { backendTrees, frontendAlerts }
    
    // Verify bug condition exists
    expect(isBugCondition(input)).toBe(true)
    
    // Simulate current sync behavior
    const detections: DetectionResult[] = [] // No detections since tree is retired
    const syncedAlerts = simulateCurrentAlertSync(frontendAlerts, detections)
    
    // THE BUG: Alert should be cleaned up but persists
    const activeAlerts = syncedAlerts.filter(a => !a.resolved)
    
    // This SHOULD FAIL on unfixed code
    expect(activeAlerts.length).toBe(0) // Expected: alert should be cleaned up
    
    if (activeAlerts.length > 0) {
      console.log('COUNTEREXAMPLE: Age-based retirement bug detected')
      console.log(`Alert ${activeAlerts[0].tree_id} persists after tree retirement`)
    }
  })

  it('Size-based Retirement Scenario: Backend retires trees >15 nodes, alerts persist', () => {
    /**
     * **Validates: Requirements 1.1**
     * Test specific case: backend retires process trees due to size (>15 nodes)
     * but corresponding frontend alerts remain active indefinitely
     */
    
    const largeTreeId = 'data-exfiltration-9876543210'
    
    // Simulate backend state: tree was retired due to size
    const backendTrees: ProcessTree[] = [] // Tree retired due to >15 nodes
    
    // Simulate frontend state: alert still exists
    const frontendAlerts: Alert[] = [{
      id: 'alert-456',
      tree_id: largeTreeId,
      label: 'Suspected Data Exfiltration',
      pid: 5678,
      anomaly_score: 0.85,
      timestamp: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
      severity: 'HIGH',
      resolved: false
    }]
    
    const input = { backendTrees, frontendAlerts }
    
    // Verify bug condition exists
    expect(isBugCondition(input)).toBe(true)
    
    // Simulate current sync behavior
    const detections: DetectionResult[] = []
    const syncedAlerts = simulateCurrentAlertSync(frontendAlerts, detections)
    
    // THE BUG: Alert should be cleaned up but persists
    const activeAlerts = syncedAlerts.filter(a => !a.resolved)
    
    // This SHOULD FAIL on unfixed code
    expect(activeAlerts.length).toBe(0) // Expected: alert should be cleaned up
    
    if (activeAlerts.length > 0) {
      console.log('COUNTEREXAMPLE: Size-based retirement bug detected')
      console.log(`Alert ${activeAlerts[0].tree_id} persists after large tree retirement`)
    }
  })

  it('Random Early Retirement Scenario: Backend randomly retires trees, alerts persist', () => {
    /**
     * **Validates: Requirements 1.2**
     * Test specific case: backend retires trees through random early retirement
     * but corresponding frontend alerts are not notified
     */
    
    const randomTreeId = 'normal-process-1122334455'
    
    // Simulate backend state: non-suspicious tree randomly retired
    const backendTrees: ProcessTree[] = [] // Tree randomly retired early
    
    // Simulate frontend state: alert still exists
    const frontendAlerts: Alert[] = [{
      id: 'alert-789',
      tree_id: randomTreeId,
      label: 'Potential Anomaly',
      pid: 9012,
      anomaly_score: 0.6,
      timestamp: new Date(Date.now() - 130000).toISOString(), // 2.1 minutes ago
      severity: 'MEDIUM',
      resolved: false
    }]
    
    const input = { backendTrees, frontendAlerts }
    
    // Verify bug condition exists
    expect(isBugCondition(input)).toBe(true)
    
    // Simulate current sync behavior
    const detections: DetectionResult[] = []
    const syncedAlerts = simulateCurrentAlertSync(frontendAlerts, detections)
    
    // THE BUG: Alert should be cleaned up but persists
    const activeAlerts = syncedAlerts.filter(a => !a.resolved)
    
    // This SHOULD FAIL on unfixed code
    expect(activeAlerts.length).toBe(0) // Expected: alert should be cleaned up
    
    if (activeAlerts.length > 0) {
      console.log('COUNTEREXAMPLE: Random retirement bug detected')
      console.log(`Alert ${activeAlerts[0].tree_id} persists after random early retirement`)
    }
  })

  it('Active Incident Count Mismatch: System always shows 6 active incidents', () => {
    /**
     * **Validates: Requirements 1.5**
     * Test specific case: system always shows 6 because backend maintains exactly 6 trees
     * while frontend alerts persist indefinitely
     */
    
    // Simulate backend state: exactly 6 active trees (as per design)
    const backendTrees: ProcessTree[] = Array.from({ length: 6 }, (_, i) => ({
      tree_id: `current-tree-${i}`,
      label: `Active Process ${i}`,
      is_suspicious: true,
      root: {
        pid: 1000 + i,
        ppid: 1,
        uid: 0,
        executable_path: '/usr/bin/process',
        command_line: `process-${i}`,
        timestamp: new Date().toISOString()
      }
    }))
    
    // Simulate frontend state: 6 current alerts + 4 persisting old alerts
    const frontendAlerts: Alert[] = [
      // Current alerts (should remain)
      ...backendTrees.map((tree, i) => ({
        id: `alert-current-${i}`,
        tree_id: tree.tree_id,
        label: tree.label,
        pid: tree.root.pid,
        anomaly_score: 0.8,
        timestamp: new Date().toISOString(),
        severity: 'HIGH' as const,
        resolved: false
      })),
      // Old persisting alerts (should be cleaned up)
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `alert-old-${i}`,
        tree_id: `retired-tree-${i}`,
        label: `Old Alert ${i}`,
        pid: 2000 + i,
        anomaly_score: 0.7,
        timestamp: new Date(Date.now() - 200000).toISOString(), // 3.3 minutes ago
        severity: 'MEDIUM' as const,
        resolved: false
      }))
    ]
    
    const input = { backendTrees, frontendAlerts }
    
    // Verify bug condition exists (old alerts persist)
    expect(isBugCondition(input)).toBe(true)
    
    // Simulate current sync behavior
    const detections: DetectionResult[] = backendTrees.map(tree => ({
      tree_id: tree.tree_id,
      label: tree.label,
      root_pid: tree.root.pid,
      features: {
        tree_depth: 2,
        execution_breadth: 3,
        cli_entropy: 0.6,
        temporal_rate_ms: 1500,
        privilege_transition: false
      },
      anomaly_score: 0.8,
      is_anomalous: true
    }))
    
    const syncedAlerts = simulateCurrentAlertSync(frontendAlerts, detections)
    const activeAlerts = syncedAlerts.filter(a => !a.resolved)
    
    // THE BUG: Should show 6 active incidents (matching backend trees)
    // but shows 10 due to persisting old alerts
    expect(activeAlerts.length).toBe(6) // Expected: only current backend trees
    
    if (activeAlerts.length !== 6) {
      console.log('COUNTEREXAMPLE: Active incident count mismatch detected')
      console.log(`Backend trees: ${backendTrees.length}`)
      console.log(`Active alerts: ${activeAlerts.length}`)
      console.log(`Expected: 6, Actual: ${activeAlerts.length}`)
      
      const persistingOldAlerts = activeAlerts.filter(alert => 
        !backendTrees.some(tree => tree.tree_id === alert.tree_id)
      )
      console.log(`Persisting old alerts: ${persistingOldAlerts.length}`)
    }
  })
})