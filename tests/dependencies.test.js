import test from 'node:test'
import assert from 'node:assert/strict'
import { filterAndSortDependencies } from '../src/utils/dependencies.js'

test('Needs attention includes unresolved vulnerability checks but excludes clean packages', () => {
  const dependencies = [
    { name: 'clean', vulnerabilities: [], deprecated: null, maintenanceStatus: 'active', updateType: 'none' },
    { name: 'unavailable-check', vulnerabilities: null, updateType: 'none' },
    { name: 'unknown-severity', vulnerabilities: [{ severity: 'unknown' }], updateType: 'none' },
    { name: 'unavailable-details', vulnerabilities: [{ severity: 'unknown', detailsUnavailable: true }], updateType: 'none' },
    { name: 'known-vulnerability', vulnerabilities: [{ severity: 'high' }], updateType: 'none' },
  ]

  const result = filterAndSortDependencies(dependencies, {
    filter: 'attention',
    search: '',
    sortBy: 'name',
    sortDirection: 'asc',
  })

  assert.deepEqual(result.map(({ name }) => name), [
    'known-vulnerability',
    'unavailable-check',
    'unavailable-details',
    'unknown-severity',
  ])
})