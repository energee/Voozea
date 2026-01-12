# Voozea - Project Specification

## Overview

Voozea is a social rating platform that combines beer/brewery ratings (Untappd-style) with food/restaurant ratings using a unified data model.

## Business Strategy

Two-sided marketplace approach:
1. **Users add businesses & products** - Crowdsourced data entry
2. **Users rate products** - 1-10 scale with 0.1 increments
3. **Businesses claim & organize** - Later phase: menu builder for owners

## Tech Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Database | PostgreSQL with RLS policies |

## Core Data Model

**Hierarchy: Business → Products → Ratings**

Unified model supports any business type (breweries, restaurants, etc.) and any product type (beers, dishes, etc.).

## Rating Scale

- Range: 1.0 to 10.0
- Increments: 0.1
- Display: Single decimal (e.g., 7.5, 8.3, 9.0)

## Project Status

- Phase 1 (Foundation): Complete
- Phase 2 (Core Data Entry): Complete
- Phase 3 (Social Features): Pending
- Phase 4 (Menu Builder): Pending
- Phase 5 (Business Analytics): Pending
- Phase 6 (Polish & Launch): Pending

## Current Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page |
| `/businesses` | Search/browse businesses |
| `/businesses/new` | Add new business |
| `/business/[slug]` | Business detail + products |
| `/business/[slug]/add-product` | Add product to business |
| `/product/[id]` | Product detail + ratings |
| `/login` | Sign in |
| `/register` | Sign up |
| `/forgot-password` | Password reset |
