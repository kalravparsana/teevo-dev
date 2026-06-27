#!/usr/bin/env node
/**
 * Automated batch analyzer — runs extract-structure and emits graph nodes/edges.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const [, , projectRoot, batchIndexStr, skillDir] = process.argv;
const batchIndex = Number(batchIndexStr);
const batches = JSON.parse(
  readFileSync(`${projectRoot}/.understand-anything/intermediate/batches.json`, "utf8"),
);
const batch = batches.batches.find((b) => b.batchIndex === batchIndex);
if (!batch) throw new Error(`Batch ${batchIndex} not found`);

const inputPath = `${projectRoot}/.understand-anything/tmp/ua-file-analyzer-input-${batchIndex}.json`;
const extractPath = `${projectRoot}/.understand-anything/tmp/ua-file-extract-results-${batchIndex}.json`;
const outputPath = `${projectRoot}/.understand-anything/intermediate/batch-${batchIndex}.json`;

writeFileSync(
  inputPath,
  JSON.stringify({
    projectRoot,
    batchFiles: batch.files,
    batchImportData: batch.batchImportData,
  }),
);

execFileSync("node", [ `${skillDir}/extract-structure.mjs`, inputPath, extractPath ], {
  stdio: ["ignore", "pipe", "pipe"],
});

const extract = JSON.parse(readFileSync(extractPath, "utf8"));
const nodes = [];
const edges = [];
const nodeIds = new Set();

function fileNodeType(fileCategory, filePath) {
  if (fileCategory === "config") return "config";
  if (fileCategory === "docs") return "document";
  if (fileCategory === "infra") {
    if (/cloudformation|\.tf$|terraform/i.test(filePath)) return "resource";
    if (/workflow|gitlab-ci|jenkins/i.test(filePath)) return "pipeline";
    return "service";
  }
  if (fileCategory === "data") return "schema";
  return "file";
}

function nodePrefix(type) {
  const map = {
    file: "file:",
    config: "config:",
    document: "document:",
    service: "service:",
    pipeline: "pipeline:",
    resource: "resource:",
    schema: "schema:",
    table: "table:",
    endpoint: "endpoint:",
    function: "function:",
    class: "class:",
  };
  return map[type] || "file:";
}

function summarize(path, fileCategory, metrics = {}) {
  const name = basename(path);
  if (fileCategory === "docs") return `Documentation file (${name}) describing project features or setup.`;
  if (fileCategory === "config") return `Configuration file (${name}) controlling build, tooling, or runtime settings.`;
  if (fileCategory === "infra") return `Infrastructure definition (${name}) for deployment or cloud resources.`;
  if (/\.spec\.|\.test\./.test(path)) return `Automated test suite (${name}) validating application behavior.`;
  if (path.includes("/pages/")) return `Route page component (${name}) rendering a primary application screen.`;
  if (path.includes("/components/")) return `Reusable UI component (${name}) used across application views.`;
  if (path.includes("/handlers/")) return `AWS Lambda handler (${name}) processing API requests.`;
  if (path.includes("/services/")) return `Domain service module (${name}) implementing business logic and data access.`;
  if (path.includes("/lib/")) return `Shared library module (${name}) providing utilities or API clients.`;
  if (path.includes("/store/")) return `Application state module (${name}) managing client-side data and actions.`;
  if (path.includes("/routes/")) return `Routing configuration (${name}) defining application navigation paths.`;
  if (name === "App.tsx") return "Root React application component wiring routes and global providers.";
  if (name === "main.tsx") return "Frontend bootstrap entry point mounting the React application.";
  if (metrics.exportCount > 3) return `Module (${name}) exporting multiple symbols for use across the codebase.`;
  return `Source file (${name}) contributing to the Teevo golf management platform.`;
}

function tagsFor(path, fileCategory) {
  const tags = [];
  if (fileCategory === "docs") tags.push("documentation");
  if (fileCategory === "config") tags.push("configuration");
  if (fileCategory === "infra") tags.push("infrastructure", "deployment");
  if (/\.spec\.|\.test\./.test(path)) tags.push("test");
  if (path.includes("/pages/")) tags.push("component", "routing");
  if (path.includes("/components/")) tags.push("component", "ui");
  if (path.includes("/handlers/")) tags.push("api-handler", "lambda");
  if (path.includes("/services/")) tags.push("service", "domain");
  if (path.includes("/lib/api")) tags.push("api-client", "service");
  if (path.includes("/store/")) tags.push("state-management");
  if (nameIs(path, "App.tsx")) tags.push("entry-point");
  if (nameIs(path, "main.tsx")) tags.push("entry-point");
  if (tags.length < 3) tags.push("typescript", "teevo");
  return [...new Set(tags)].slice(0, 5);
}

function nameIs(path, name) {
  return basename(path) === name;
}

function complexityFrom(metrics, totalLines = 0) {
  const lines = metrics?.nonEmptyLines ?? totalLines;
  if (lines > 200) return "complex";
  if (lines > 50) return "moderate";
  return "simple";
}

function addNode(node) {
  if (nodeIds.has(node.id)) return;
  nodeIds.add(node.id);
  nodes.push(node);
}

function addEdge(edge) {
  edges.push(edge);
}

for (const file of batch.files) {
  const type = fileNodeType(file.fileCategory, file.path);
  const fileId = `${nodePrefix(type)}${file.path}`;
  const result = extract.results?.find((r) => r.path === file.path);
  const metrics = result?.metrics || {};

  addNode({
    id: fileId,
    type,
    name: basename(file.path),
    filePath: file.path,
    summary: summarize(file.path, file.fileCategory, metrics),
    tags: tagsFor(file.path, file.fileCategory),
    complexity: complexityFrom(metrics, file.sizeLines),
  });

  if (type === "file" && batch.batchImportData?.[file.path]) {
    for (const imp of batch.batchImportData[file.path]) {
      const targetType = imp.includes(".") ? "file" : "file";
      addEdge({
        source: fileId,
        target: `file:${imp}`,
        type: "imports",
        direction: "forward",
        weight: 0.7,
      });
    }
  }

  if (result?.functions) {
    for (const fn of result.functions) {
      const lineCount = (fn.endLine || 0) - (fn.startLine || 0) + 1;
      const isExported = result.exports?.some((e) => e.name === fn.name);
      if (!isExported && lineCount < 10) continue;
      const fnId = `function:${file.path}:${fn.name}`;
      addNode({
        id: fnId,
        type: "function",
        name: fn.name,
        filePath: file.path,
        summary: `Function ${fn.name} in ${basename(file.path)}.`,
        tags: isExported ? ["exported", "function"] : ["function"],
        complexity: lineCount > 50 ? "moderate" : "simple",
      });
      addEdge({ source: fileId, target: fnId, type: "contains", direction: "forward", weight: 1.0 });
      if (isExported) {
        addEdge({ source: fileId, target: fnId, type: "exports", direction: "forward", weight: 0.8 });
      }
    }
  }

  if (result?.classes) {
    for (const cls of result.classes) {
      const lineCount = (cls.endLine || 0) - (cls.startLine || 0) + 1;
      const methodCount = cls.methods?.length || 0;
      const isExported = result.exports?.some((e) => e.name === cls.name);
      if (!isExported && methodCount < 2 && lineCount < 20) continue;
      const clsId = `class:${file.path}:${cls.name}`;
      addNode({
        id: clsId,
        type: "class",
        name: cls.name,
        filePath: file.path,
        summary: `Class ${cls.name} in ${basename(file.path)}.`,
        tags: isExported ? ["exported", "class"] : ["class"],
        complexity: lineCount > 100 ? "complex" : "moderate",
      });
      addEdge({ source: fileId, target: clsId, type: "contains", direction: "forward", weight: 1.0 });
      if (isExported) {
        addEdge({ source: fileId, target: clsId, type: "exports", direction: "forward", weight: 0.8 });
      }
    }
  }

  if (/\.spec\.|\.test\./.test(file.path) && batch.batchImportData?.[file.path]) {
    for (const imp of batch.batchImportData[file.path]) {
      if (!/\.spec\.|\.test\./.test(imp)) {
        addEdge({
          source: `file:${imp}`,
          target: fileId,
          type: "tested_by",
          direction: "forward",
          weight: 0.5,
        });
      }
    }
  }

  if (file.path.includes("cloudformation") || file.path.endsWith("Dockerfile")) {
    addEdge({
      source: fileId,
      target: "file:backend/src/handlers/api.ts",
      type: "deploys",
      direction: "forward",
      weight: 0.7,
    });
  }
  if (basename(file.path) === "README.md") {
    addEdge({
      source: fileId,
      target: "file:Frontend/src/main.tsx",
      type: "documents",
      direction: "forward",
      weight: 0.5,
    });
  }
  if (basename(file.path) === "package.json" && file.path.includes("Frontend")) {
    addEdge({
      source: fileId,
      target: "file:Frontend/src/main.tsx",
      type: "configures",
      direction: "forward",
      weight: 0.6,
    });
  }
}

writeFileSync(outputPath, JSON.stringify({ nodes, edges }, null, 2));
process.stdout.write(`batch-${batchIndex}: ${nodes.length} nodes, ${edges.length} edges\n`);
