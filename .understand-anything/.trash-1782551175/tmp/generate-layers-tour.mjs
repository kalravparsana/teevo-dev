#!/usr/bin/env node
/**
 * Generate architecture layers and guided tour from assembled graph.
 */
import { readFileSync, writeFileSync } from "node:fs";

const projectRoot = process.argv[2];
const graph = JSON.parse(
  readFileSync(`${projectRoot}/.understand-anything/intermediate/assembled-graph.json`, "utf8"),
);
const scan = JSON.parse(
  readFileSync(`${projectRoot}/.understand-anything/intermediate/scan-result.json`, "utf8"),
);

const fileLevelTypes = new Set([
  "file", "config", "document", "service", "pipeline", "table", "schema", "resource", "endpoint",
]);
const nodeIdSet = new Set(graph.nodes.map((n) => n.id));

function classifyLayer(filePath, type) {
  if (type === "document") return "documentation";
  if (type === "config") return "configuration";
  if (filePath.startsWith("backend/")) {
    if (filePath.includes("/handlers/")) return "backend-api";
    if (filePath.includes("/services/")) return "backend-domain";
    if (filePath.includes("/lib/")) return "backend-core";
    if (filePath.includes("cloudformation")) return "infrastructure";
    return "backend";
  }
  if (filePath.startsWith("Frontend/") || filePath.startsWith("launchpad-frontend/")) {
    if (filePath.includes("/pages/")) return "frontend-pages";
    if (filePath.includes("/components/")) return "frontend-components";
    if (filePath.includes("/lib/api")) return "frontend-api-client";
    if (filePath.includes("/lib/")) return "frontend-utilities";
    if (filePath.includes("/store/")) return "frontend-state";
    if (filePath.includes("/routes/")) return "frontend-routing";
    if (filePath.includes("automation-tests/")) return "e2e-tests";
    if (filePath.includes("cloudformation")) return "infrastructure";
    return "frontend-core";
  }
  if (filePath.includes(".understand-anything")) return "tooling";
  return "project-root";
}

const layerDefs = {
  "layer:documentation": {
    id: "layer:documentation",
    name: "Documentation",
    description: "README files, plans, and project documentation.",
    nodeIds: [],
  },
  "layer:configuration": {
    id: "layer:configuration",
    name: "Configuration",
    description: "Package manifests, TypeScript configs, and environment settings.",
    nodeIds: [],
  },
  "layer:frontend-core": {
    id: "layer:frontend-core",
    name: "Frontend Core",
    description: "React application entry points, routing shell, and global styles.",
    nodeIds: [],
  },
  "layer:frontend-pages": {
    id: "layer:frontend-pages",
    name: "Frontend Pages",
    description: "Route-level page components for dashboard, clubs, tournaments, bookings, and admin.",
    nodeIds: [],
  },
  "layer:frontend-components": {
    id: "layer:frontend-components",
    name: "Frontend Components",
    description: "Reusable UI components including layout, auth gates, and feature panels.",
    nodeIds: [],
  },
  "layer:frontend-state": {
    id: "layer:frontend-state",
    name: "Frontend State",
    description: "React context and store modules managing application state and actions.",
    nodeIds: [],
  },
  "layer:frontend-api-client": {
    id: "layer:frontend-api-client",
    name: "API Client Layer",
    description: "HTTP client modules connecting the frontend to the Teevo backend API.",
    nodeIds: [],
  },
  "layer:frontend-utilities": {
    id: "layer:frontend-utilities",
    name: "Frontend Utilities",
    description: "Shared helpers for dates, validation, permissions, tournaments, and copy text.",
    nodeIds: [],
  },
  "layer:backend-api": {
    id: "layer:backend-api",
    name: "Backend API Handlers",
    description: "AWS Lambda entry points and request routing for REST API endpoints.",
    nodeIds: [],
  },
  "layer:backend-domain": {
    id: "layer:backend-domain",
    name: "Backend Domain Services",
    description: "Business logic and repository layer for users, clubs, tournaments, and bookings.",
    nodeIds: [],
  },
  "layer:backend-core": {
    id: "layer:backend-core",
    name: "Backend Core Libraries",
    description: "Auth, DynamoDB access, configuration, error handling, and response utilities.",
    nodeIds: [],
  },
  "layer:infrastructure": {
    id: "layer:infrastructure",
    name: "Infrastructure",
    description: "CloudFormation templates and deployment configuration for AWS resources.",
    nodeIds: [],
  },
  "layer:e2e-tests": {
    id: "layer:e2e-tests",
    name: "E2E Tests",
    description: "Playwright end-to-end test suites covering major application flows.",
    nodeIds: [],
  },
  "layer:project-root": {
    id: "layer:project-root",
    name: "Project Root",
    description: "Top-level repository metadata and shared configuration.",
    nodeIds: [],
  },
  "layer:tooling": {
    id: "layer:tooling",
    name: "Analysis Tooling",
    description: "Understand-Anything graph artifacts and ignore configuration.",
    nodeIds: [],
  },
};

const layerKeyMap = {
  documentation: "layer:documentation",
  configuration: "layer:configuration",
  "frontend-core": "layer:frontend-core",
  "frontend-pages": "layer:frontend-pages",
  "frontend-components": "layer:frontend-components",
  "frontend-state": "layer:frontend-state",
  "frontend-api-client": "layer:frontend-api-client",
  "frontend-utilities": "layer:frontend-utilities",
  "backend-api": "layer:backend-api",
  "backend-domain": "layer:backend-domain",
  "backend-core": "layer:backend-core",
  infrastructure: "layer:infrastructure",
  "e2e-tests": "layer:e2e-tests",
  "project-root": "layer:project-root",
  tooling: "layer:tooling",
  backend: "layer:backend-core",
  "frontend-routing": "layer:frontend-core",
};

for (const node of graph.nodes) {
  if (!fileLevelTypes.has(node.type)) continue;
  const fp = node.filePath || node.id.replace(/^[^:]+:/, "");
  const layerName = classifyLayer(fp, node.type);
  const layerId = layerKeyMap[layerName];
  if (layerDefs[layerId] && nodeIdSet.has(node.id)) {
    layerDefs[layerId].nodeIds.push(node.id);
  }
}

const layers = Object.values(layerDefs).filter((l) => l.nodeIds.length > 0);

function findNode(...patterns) {
  for (const p of patterns) {
    const n = graph.nodes.find(
      (x) => fileLevelTypes.has(x.type) && (x.filePath === p || x.id === `file:${p}` || x.id === `document:${p}` || x.id === `config:${p}` || x.id === `resource:${p}`),
    );
    if (n) return n.id;
  }
  return null;
}

const tourSteps = [
  {
    order: 1,
    title: "Project Overview",
    description: "Start with the README to understand Teevo's purpose as a golf club management platform.",
    nodeIds: [findNode("README.md")].filter(Boolean),
  },
  {
    order: 2,
    title: "Frontend Bootstrap",
    description: "The React app boots from main.tsx, mounts App.tsx, and wires client-side routing.",
    nodeIds: [findNode("Frontend/src/main.tsx"), findNode("Frontend/src/App.tsx")].filter(Boolean),
  },
  {
    order: 3,
    title: "Application Routes",
    description: "AppRoutes defines navigation between dashboard, clubs, tournaments, bookings, and admin pages.",
    nodeIds: [findNode("Frontend/src/routes/AppRoutes.tsx")].filter(Boolean),
  },
  {
    order: 4,
    title: "State Management",
    description: "TeevoContext and store actions manage authenticated user state and domain mutations.",
    nodeIds: [findNode("Frontend/src/store/TeevoContext.tsx"), findNode("Frontend/src/store/actions.ts")].filter(Boolean),
  },
  {
    order: 5,
    title: "API Client Layer",
    description: "The teevoApi client module sends HTTP requests to the backend Lambda API.",
    nodeIds: [findNode("Frontend/src/lib/api/teevoApi.ts"), findNode("Frontend/src/lib/api/client.ts")].filter(Boolean),
  },
  {
    order: 6,
    title: "Backend API Entry",
    description: "Lambda handler and router dispatch incoming API requests to domain services.",
    nodeIds: [findNode("backend/src/handlers/api.ts"), findNode("backend/src/handlers/router.ts")].filter(Boolean),
  },
  {
    order: 7,
    title: "Domain Services",
    description: "Repository and domain modules implement data access and business rules for Teevo entities.",
    nodeIds: [findNode("backend/src/services/repository.ts"), findNode("backend/src/services/domain.ts")].filter(Boolean),
  },
  {
    order: 8,
    title: "Authentication",
    description: "Auth library verifies bearer tokens and handles OAuth login flows.",
    nodeIds: [findNode("backend/src/lib/auth.ts")].filter(Boolean),
  },
  {
    order: 9,
    title: "Infrastructure",
    description: "CloudFormation templates provision AWS resources for the backend and frontend stacks.",
    nodeIds: [findNode("backend/cloudformation-template.yaml"), findNode("Frontend/cloudformation-template.yaml")].filter(Boolean),
  },
  {
    order: 10,
    title: "E2E Test Coverage",
    description: "Playwright specs validate critical user flows across pages and API interactions.",
    nodeIds: graph.nodes
      .filter((n) => n.filePath?.includes("automation-tests/") && n.filePath?.endsWith(".smoke.spec.ts"))
      .slice(0, 4)
      .map((n) => n.id),
  },
].filter((s) => s.nodeIds.length > 0);

writeFileSync(`${projectRoot}/.understand-anything/intermediate/layers.json`, JSON.stringify(layers, null, 2));
writeFileSync(`${projectRoot}/.understand-anything/intermediate/tour.json`, JSON.stringify(tourSteps, null, 2));
console.log(`Generated ${layers.length} layers and ${tourSteps.length} tour steps`);
