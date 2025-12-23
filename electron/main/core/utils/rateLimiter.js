"use strict";
// rateLimiter.ts
// Rate limiting utility to prevent WhatsApp spam/blocking
// Created: 2025-01-11
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor(config) {
        this.requests = new Map();
        this.blockedUntil = new Map();
        this.config = {
            maxRequests: config.maxRequests,
            windowMs: config.windowMs,
            blockDurationMs: config.blockDurationMs || config.windowMs * 2
        };
        // Cleanup old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }
    /**
     * Check if a request is allowed
     */
    check(key) {
        const now = Date.now();
        // Check if currently blocked
        const blockedUntil = this.blockedUntil.get(key);
        if (blockedUntil && blockedUntil > now) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: blockedUntil,
                retryAfter: Math.ceil((blockedUntil - now) / 1000)
            };
        }
        // Remove block if expired
        if (blockedUntil && blockedUntil <= now) {
            this.blockedUntil.delete(key);
        }
        // Get request history
        let requestTimes = this.requests.get(key) || [];
        // Remove requests outside the time window
        const windowStart = now - this.config.windowMs;
        requestTimes = requestTimes.filter(time => time > windowStart);
        // Check if limit exceeded
        if (requestTimes.length >= this.config.maxRequests) {
            // Block the key
            const blockUntil = now + this.config.blockDurationMs;
            this.blockedUntil.set(key, blockUntil);
            return {
                allowed: false,
                remaining: 0,
                resetAt: blockUntil,
                retryAfter: Math.ceil(this.config.blockDurationMs / 1000)
            };
        }
        // Request is allowed
        const remaining = this.config.maxRequests - requestTimes.length - 1;
        const resetAt = requestTimes.length > 0
            ? requestTimes[0] + this.config.windowMs
            : now + this.config.windowMs;
        return {
            allowed: true,
            remaining,
            resetAt
        };
    }
    /**
     * Record a request
     */
    record(key) {
        const now = Date.now();
        let requestTimes = this.requests.get(key) || [];
        // Add current request
        requestTimes.push(now);
        // Remove old requests
        const windowStart = now - this.config.windowMs;
        requestTimes = requestTimes.filter(time => time > windowStart);
        this.requests.set(key, requestTimes);
    }
    /**
     * Reset rate limit for a key
     */
    reset(key) {
        this.requests.delete(key);
        this.blockedUntil.delete(key);
    }
    /**
     * Reset all rate limits
     */
    resetAll() {
        this.requests.clear();
        this.blockedUntil.clear();
    }
    /**
     * Cleanup old entries
     */
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        // Cleanup requests
        for (const [key, times] of this.requests.entries()) {
            const filtered = times.filter(time => time > windowStart);
            if (filtered.length === 0) {
                this.requests.delete(key);
            }
            else {
                this.requests.set(key, filtered);
            }
        }
        // Cleanup blocks
        for (const [key, until] of this.blockedUntil.entries()) {
            if (until <= now) {
                this.blockedUntil.delete(key);
            }
        }
    }
    /**
     * Get current stats
     */
    getStats() {
        const now = Date.now();
        let activeRequests = 0;
        for (const times of this.requests.values()) {
            activeRequests += times.length;
        }
        let blockedKeys = 0;
        for (const until of this.blockedUntil.values()) {
            if (until > now) {
                blockedKeys++;
            }
        }
        return {
            totalKeys: this.requests.size,
            blockedKeys,
            activeRequests
        };
    }
}
exports.RateLimiter = RateLimiter;
