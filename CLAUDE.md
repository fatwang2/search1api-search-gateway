# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.Linear Project: Search1API

## Development Commands

- `npm run dev` - Start development server with wrangler
- `npm run deploy` - Deploy to Cloudflare Workers with minification

## Architecture Overview

This is a Cloudflare Workers application built with Hono framework that serves as a search API gateway with built-in failover capabilities.

### Core Components

**Entry Point (`src/index.ts`)**: Main Hono application with CORS, logging middleware, health check endpoint, and global error handling.

**Configuration (`src/config.ts`)**: Centralized configuration for API endpoints with multiple failover URLs, timeout settings, and cache configuration.

**Search Router (`src/routes/search.ts`)**: Main search endpoint that forwards requests to external search APIs using failover logic. Includes caching middleware and parameter normalization.

**Failover System (`src/utils/failover.ts`)**: Advanced failover utility supporting both endpoint-level and page-level failover strategies. Attempts different page numbers before switching endpoints.

**Cache System (`src/middleware/cache.ts`)**: In-memory cache middleware that caches successful responses for configurable TTL (default 1 minute). Supports automatic cleanup of expired entries.

**Request Utilities (`src/utils/request.ts`)**: HTTP request forwarding utilities for proxying requests to external APIs.

**Logger (`src/utils/logger.ts`)**: Structured logging utility for debugging and monitoring.

### Request Flow

1. Request hits search endpoint with query parameters
2. Cache middleware checks for existing cached response
3. If not cached, failover system attempts multiple endpoints in priority order
4. For each endpoint, tries different page numbers if results are empty
5. Successful response is cached and returned to client
6. Failed requests trigger failover to next endpoint

### Configuration

- Uses `wrangler.jsonc` for Cloudflare Workers deployment configuration
- TypeScript configuration targets ESNext with Cloudflare Workers types
- Search endpoints configured in priority order with automatic failover
- Default request timeout: 10 seconds
- Default cache TTL: 1 minute
