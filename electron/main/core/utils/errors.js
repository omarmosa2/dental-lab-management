"use strict";
// Custom Error Classes for Domain Logic
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = exports.DatabaseError = exports.NotFoundError = exports.ValidationError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
class ValidationError extends DomainError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends DomainError {
    constructor(resource, id) {
        super(`${resource} with id ${id} not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class DatabaseError extends DomainError {
    constructor(message, details) {
        super(message, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class BusinessRuleError extends DomainError {
    constructor(message, details) {
        super(message, 'BUSINESS_RULE_ERROR', details);
        this.name = 'BusinessRuleError';
    }
}
exports.BusinessRuleError = BusinessRuleError;
