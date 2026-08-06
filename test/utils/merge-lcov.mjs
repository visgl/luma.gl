// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

/**
 * Merges LCOV reports without letting an incompatible, zero-hit all-files record inflate coverage.
 *
 * Istanbul can describe an unexecuted TypeScript source differently from the transformed source
 * loaded by another Vitest shard. Concatenating both records makes Coveralls count both schemas.
 * Once any schema has hits, every record belonging to an executed schema is merged, preserving
 * same-schema uncovered sites and complementary hits while discarding incompatible zero-only
 * schemas. If no shard executes the source, the majority schema is retained with a deterministic
 * smaller-schema tie-breaker.
 *
 * @param {string[]} reports
 * @returns {string}
 */
export function mergeLcovReports(reports) {
  const recordsBySourceFile = new Map();

  for (const report of reports) {
    for (const record of parseLcovReport(report)) {
      const records = recordsBySourceFile.get(record.sourceFile) || [];
      records.push(record);
      recordsBySourceFile.set(record.sourceFile, records);
    }
  }

  const mergedRecords = [];
  for (const sourceFile of [...recordsBySourceFile.keys()].sort()) {
    const records = recordsBySourceFile.get(sourceFile);
    const selectedRecords = selectLcovRecords(records);
    mergedRecords.push(formatLcovRecord(mergeLcovRecords(sourceFile, selectedRecords)));
  }

  return mergedRecords.length > 0 ? `${mergedRecords.join('\n')}\n` : '';
}

function parseLcovReport(report) {
  const records = [];
  let recordLines = [];

  for (const line of report.split(/\r?\n/)) {
    if (line === 'end_of_record') {
      if (recordLines.length > 0) {
        records.push(parseLcovRecord(recordLines));
      }
      recordLines = [];
    } else if (line || recordLines.length > 0) {
      recordLines.push(line);
    }
  }
  if (recordLines.some(Boolean)) {
    records.push(parseLcovRecord(recordLines));
  }

  return records;
}

function parseLcovRecord(lines) {
  const record = {
    sourceFile: '',
    functionDefinitions: new Map(),
    functionHits: new Map(),
    lineHits: new Map(),
    branchHits: new Map(),
    additionalLines: new Set(),
    hasHits: false
  };
  const functionDefinitionOccurrenceByKey = new Map();
  const functionHitOccurrences = [];

  for (const line of lines) {
    if (!line || line.startsWith('TN:') || /^(FNF|FNH|LF|LH|BRF|BRH):/.test(line)) {
      continue;
    }
    if (line.startsWith('SF:')) {
      record.sourceFile = line.slice(3).trim();
      continue;
    }
    if (line.startsWith('FN:')) {
      const definition = parseFunctionDefinition(line.slice(3));
      const baseKey = definition.key;
      const occurrence = functionDefinitionOccurrenceByKey.get(baseKey) || 0;
      functionDefinitionOccurrenceByKey.set(baseKey, occurrence + 1);
      definition.baseKey = baseKey;
      definition.occurrence = occurrence;
      definition.key = `${baseKey}#${occurrence}`;
      record.functionDefinitions.set(definition.key, definition);
      continue;
    }
    if (line.startsWith('FNDA:')) {
      const functionHits = parseFunctionHits(line.slice(5));
      functionHitOccurrences.push(functionHits);
      record.hasHits ||= functionHits.hits > 0;
      continue;
    }
    if (line.startsWith('DA:')) {
      const lineCoverage = parseLineCoverage(line.slice(3));
      mergeLineCoverage(record.lineHits, lineCoverage);
      record.hasHits ||= lineCoverage.hits > 0;
      continue;
    }
    if (line.startsWith('BRDA:')) {
      const branchCoverage = parseBranchCoverage(line.slice(5));
      mergeBranchCoverage(record.branchHits, branchCoverage);
      record.hasHits ||= (branchCoverage.hits || 0) > 0;
      continue;
    }
    record.additionalLines.add(line);
  }

  if (!record.sourceFile) {
    throw new Error('LCOV record is missing its SF source-file field');
  }
  record.functionHits = matchFunctionHitsToDefinitions(
    record.functionDefinitions,
    functionHitOccurrences
  );
  record.schema = getCoverageSchema(record);
  record.siteCount =
    record.functionDefinitions.size + record.lineHits.size + record.branchHits.size;
  return record;
}

function matchFunctionHitsToDefinitions(functionDefinitions, functionHitOccurrences) {
  const definitionsByName = new Map();
  for (const definition of functionDefinitions.values()) {
    const matchingDefinitions = definitionsByName.get(definition.name) || [];
    matchingDefinitions.push(definition);
    definitionsByName.set(definition.name, matchingDefinitions);
  }

  const occurrenceByName = new Map();
  const functionHitsByDefinition = new Map();
  for (const functionHits of functionHitOccurrences) {
    const occurrence = occurrenceByName.get(functionHits.name) || 0;
    occurrenceByName.set(functionHits.name, occurrence + 1);
    const definition = definitionsByName.get(functionHits.name)?.[occurrence];
    const key = definition?.key || `unmatched:${occurrence},${functionHits.name}`;
    functionHitsByDefinition.set(key, {
      key,
      name: functionHits.name,
      hits: functionHits.hits,
      occurrence,
      definition
    });
  }
  return functionHitsByDefinition;
}

function parseFunctionDefinition(value) {
  const withEndLine = value.match(/^(\d+),(\d+),(.+)$/);
  if (withEndLine) {
    return {
      key: `${withEndLine[1]},${withEndLine[2]},${withEndLine[3]}`,
      startLine: Number(withEndLine[1]),
      endLine: Number(withEndLine[2]),
      name: withEndLine[3]
    };
  }
  const withoutEndLine = value.match(/^(\d+),(.+)$/);
  if (!withoutEndLine) {
    throw new Error(`Invalid LCOV function definition: FN:${value}`);
  }
  return {
    key: `${withoutEndLine[1]},${withoutEndLine[2]}`,
    startLine: Number(withoutEndLine[1]),
    endLine: undefined,
    name: withoutEndLine[2]
  };
}

function parseFunctionHits(value) {
  const separatorIndex = value.indexOf(',');
  if (separatorIndex < 1) {
    throw new Error(`Invalid LCOV function coverage: FNDA:${value}`);
  }
  return {
    hits: parseNonNegativeInteger(value.slice(0, separatorIndex), `FNDA:${value}`),
    name: value.slice(separatorIndex + 1)
  };
}

function parseLineCoverage(value) {
  const [lineNumberText, hitsText, checksum, ...extraFields] = value.split(',');
  if (extraFields.length > 0) {
    throw new Error(`Invalid LCOV line coverage: DA:${value}`);
  }
  return {
    lineNumber: parsePositiveInteger(lineNumberText, `DA:${value}`),
    hits: parseNonNegativeInteger(hitsText, `DA:${value}`),
    checksum
  };
}

function parseBranchCoverage(value) {
  const [lineNumberText, block, branch, hitsText, ...extraFields] = value.split(',');
  if (!block || !branch || hitsText === undefined || extraFields.length > 0) {
    throw new Error(`Invalid LCOV branch coverage: BRDA:${value}`);
  }
  return {
    key: `${lineNumberText},${block},${branch}`,
    lineNumber: parsePositiveInteger(lineNumberText, `BRDA:${value}`),
    block,
    branch,
    hits: hitsText === '-' ? undefined : parseNonNegativeInteger(hitsText, `BRDA:${value}`)
  };
}

function parsePositiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`Invalid positive integer in LCOV field ${field}`);
  }
  return number;
}

function parseNonNegativeInteger(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Invalid non-negative integer in LCOV field ${field}`);
  }
  return number;
}

function getCoverageSchema(record) {
  const functions = [...record.functionDefinitions.keys()].sort();
  const lines = [...record.lineHits.values()]
    .sort((first, second) => first.lineNumber - second.lineNumber)
    .map(lineCoverage => `${lineCoverage.lineNumber},${lineCoverage.checksum || ''}`);
  const branches = [...record.branchHits.keys()].sort();
  return JSON.stringify({functions, lines, branches});
}

function selectLcovRecords(records) {
  const recordsBySchema = new Map();
  for (const record of records) {
    const matchingRecords = recordsBySchema.get(record.schema) || [];
    matchingRecords.push(record);
    recordsBySchema.set(record.schema, matchingRecords);
  }

  const schemaGroups = [...recordsBySchema.values()];
  const executedSchemaGroups = schemaGroups.filter(recordsInSchema =>
    recordsInSchema.some(record => record.hasHits)
  );
  if (executedSchemaGroups.length > 0) {
    return executedSchemaGroups.flat();
  }

  return schemaGroups.sort((first, second) => {
    if (first.length !== second.length) {
      return second.length - first.length;
    }
    if (first[0].siteCount !== second[0].siteCount) {
      return first[0].siteCount - second[0].siteCount;
    }
    return first[0].schema.localeCompare(second[0].schema);
  })[0];
}

function mergeLcovRecords(sourceFile, records) {
  const mergedRecord = {
    sourceFile,
    functionDefinitions: new Map(),
    functionHits: new Map(),
    lineHits: new Map(),
    branchHits: new Map(),
    additionalLines: new Set()
  };

  for (const record of records) {
    for (const [key, definition] of record.functionDefinitions) {
      mergedRecord.functionDefinitions.set(key, definition);
    }
    for (const [key, functionHits] of record.functionHits) {
      const previous = mergedRecord.functionHits.get(key);
      mergedRecord.functionHits.set(key, {
        ...functionHits,
        hits: (previous?.hits || 0) + functionHits.hits
      });
    }
    for (const lineCoverage of record.lineHits.values()) {
      mergeLineCoverage(mergedRecord.lineHits, lineCoverage);
    }
    for (const branchCoverage of record.branchHits.values()) {
      mergeBranchCoverage(mergedRecord.branchHits, branchCoverage);
    }
    for (const line of record.additionalLines) {
      mergedRecord.additionalLines.add(line);
    }
  }

  return mergedRecord;
}

function mergeLineCoverage(lineHits, lineCoverage) {
  const previous = lineHits.get(lineCoverage.lineNumber);
  if (previous?.checksum && lineCoverage.checksum && previous.checksum !== lineCoverage.checksum) {
    throw new Error(`Conflicting LCOV checksums for line ${lineCoverage.lineNumber}`);
  }
  lineHits.set(lineCoverage.lineNumber, {
    lineNumber: lineCoverage.lineNumber,
    hits: (previous?.hits || 0) + lineCoverage.hits,
    checksum: previous?.checksum || lineCoverage.checksum
  });
}

function mergeBranchCoverage(branchHits, branchCoverage) {
  const previous = branchHits.get(branchCoverage.key);
  const hits =
    previous?.hits === undefined && branchCoverage.hits === undefined
      ? undefined
      : (previous?.hits || 0) + (branchCoverage.hits || 0);
  branchHits.set(branchCoverage.key, {...branchCoverage, hits});
}

function formatLcovRecord(record) {
  const lines = ['TN:', `SF:${record.sourceFile}`];
  const functionDefinitions = [...record.functionDefinitions.values()].sort(
    compareFunctionDefinitions
  );
  for (const definition of functionDefinitions) {
    const location =
      definition.endLine === undefined
        ? `${definition.startLine}`
        : `${definition.startLine},${definition.endLine}`;
    lines.push(`FN:${location},${definition.name}`);
  }
  lines.push(`FNF:${functionDefinitions.length}`);
  const functionHits = [...record.functionHits.values()].sort(compareFunctionHits);
  lines.push(
    `FNH:${functionHits.filter(functionCoverage => functionCoverage.hits > 0).length}`
  );
  for (const functionCoverage of functionHits) {
    lines.push(`FNDA:${functionCoverage.hits},${functionCoverage.name}`);
  }

  const lineCoverage = [...record.lineHits.values()].sort(
    (first, second) => first.lineNumber - second.lineNumber
  );
  for (const coverage of lineCoverage) {
    const checksum = coverage.checksum ? `,${coverage.checksum}` : '';
    lines.push(`DA:${coverage.lineNumber},${coverage.hits}${checksum}`);
  }
  lines.push(`LF:${lineCoverage.length}`);
  lines.push(`LH:${lineCoverage.filter(coverage => coverage.hits > 0).length}`);

  const branchCoverage = [...record.branchHits.values()].sort(
    (first, second) =>
      first.lineNumber - second.lineNumber ||
      compareLcovIdentifier(first.block, second.block) ||
      compareLcovIdentifier(first.branch, second.branch)
  );
  for (const coverage of branchCoverage) {
    lines.push(
      `BRDA:${coverage.lineNumber},${coverage.block},${coverage.branch},${coverage.hits ?? '-'}`
    );
  }
  lines.push(`BRF:${branchCoverage.length}`);
  lines.push(`BRH:${branchCoverage.filter(coverage => (coverage.hits || 0) > 0).length}`);
  lines.push(...[...record.additionalLines].sort());
  lines.push('end_of_record');
  return lines.join('\n');
}

function compareFunctionHits(first, second) {
  if (first.definition && second.definition) {
    return compareFunctionDefinitions(first.definition, second.definition);
  }
  if (first.definition) {
    return -1;
  }
  if (second.definition) {
    return 1;
  }
  return first.name.localeCompare(second.name) || first.occurrence - second.occurrence;
}

function compareFunctionDefinitions(first, second) {
  return (
    first.startLine - second.startLine ||
    (first.endLine || first.startLine) - (second.endLine || second.startLine) ||
    first.name.localeCompare(second.name) ||
    first.baseKey.localeCompare(second.baseKey) ||
    first.occurrence - second.occurrence
  );
}

function compareLcovIdentifier(first, second) {
  const firstNumber = Number(first);
  const secondNumber = Number(second);
  return Number.isFinite(firstNumber) && Number.isFinite(secondNumber)
    ? firstNumber - secondNumber
    : first.localeCompare(second);
}

function runCommandLine() {
  const arguments_ = process.argv.slice(2);
  const outputIndex = arguments_.indexOf('--output');
  if (outputIndex < 0 || !arguments_[outputIndex + 1]) {
    throw new Error('Usage: merge-lcov.mjs --output <output.info> <input.info> [...]');
  }
  const outputPath = arguments_[outputIndex + 1];
  const inputPaths = arguments_.filter(
    (_, argumentIndex) => argumentIndex !== outputIndex && argumentIndex !== outputIndex + 1
  );
  if (inputPaths.length === 0) {
    throw new Error('At least one input LCOV report is required');
  }
  const mergedReport = mergeLcovReports(
    inputPaths.map(inputPath => readFileSync(inputPath, 'utf8'))
  );
  writeFileSync(outputPath, mergedReport);
  process.stdout.write(`Merged ${inputPaths.length} LCOV reports into ${outputPath}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCommandLine();
}
