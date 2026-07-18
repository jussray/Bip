# RLS Policies

## Purpose

This file documents required Row Level Security expectations for teen-facing and parent-facing data.

## Minimum standards

- Every teen-data table must enable RLS.
- Every table must document who can `select`, `insert`, `update`, and `delete`.
- Parent-facing access must be explicitly modeled, never implied.
- Service-role access must be isolated to server-side or Worker-mediated operations.
