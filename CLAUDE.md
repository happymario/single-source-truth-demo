# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Work Instructions (Must Follow)

1. **Language**: All chat responses must be in Korean
2. **Task Management**: Break down work into Epic/Story/Task format in `docs/tasks.md`
3. **Git Workflow**: 
   - Use git flow for branch management
   - Create feature branches per story using: `git flow feature start story-name`
   - Make commits at task level granularity (one commit per task)
   - Finish feature branches using: `git flow feature finish story-name`
4. **Story Completion**:
   - Mark story as complete in `docs/tasks.md`
   - Delete associated tasks from the file
   - Complete the feature branch with git flow (merges to develop automatically)

## Project Overview

This is a Zod-centric data management architecture demo using NestJS + MongoDB + Zod to implement a centralized schema management system. The project demonstrates Single Source of Truth pattern where all types are derived from Zod schemas.

## Core Development Principles

### 1. Single Source of Truth (Highest Priority)
- ALL types must be inferred from Zod schemas using `z.infer<typeof Schema>`
- NEVER create separate interface/type definitions
- Master schemas in `schemas/master/` are the only source of truth
- All DTOs must be derived from master schemas using `.omit()` and `.partial()`

### 2. No "any" Type Usage
- Use of `any` type is strictly forbidden
- Use `unknown` with Zod parsing when dealing with untyped data
- All functions must have explicit type signatures

### 3. MongoDB ObjectId Handling
- Zod schemas use `id: z.string().regex(/^[0-9a-fA-F]{24}$/)`
- Mongoose models use `_id` internally
- BaseModel handles automatic `_id` ↔ `id` conversion
- Always use `versionKey: false` in Mongoose schemas

### 4. Validation Functions
- ALWAYS use `validator` library functions when available
- Only create custom validation functions when validator doesn't provide the needed functionality
- Example: Use `validator.isEmail` instead of custom regex

## Commands

### Initial Setup (when project is initialized)
```bash
# Create NestJS project
nest new . --package-manager npm

# Install core dependencies
npm install zod mongoose @nestjs/mongoose validator
npm install -D @types/validator

# Generate initial modules
nest g module common
nest g module database
nest g module users
nest g module posts
nest g module comments
nest g module categories
nest g module auth
```

### Development Commands (after setup)
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Development server
npm run start:dev

# Build
npm run build
```

## Architecture Structure

### Directory Layout
```
src/
├── schemas/          # Zod schemas (Single Source of Truth)
│   ├── master/      # Master schemas - ALL types originate here
│   ├── dto/         # Derived DTO schemas (.omit, .partial)
│   ├── query/       # Query parameter schemas
│   └── response/    # API response schemas
├── types/           # Type inference only (z.infer)
├── models/          # Mongoose models implementing Zod types
├── common/          # Shared utilities and decorators
│   ├── decorators/  # @ZodBody, @ZodQuery, @ZodParam
│   ├── pipes/       # ZodValidationPipe
│   ├── filters/     # ZodExceptionFilter
│   └── mappers/     # Type-safe entity mappers
└── modules/         # Feature modules
```

### Key Architectural Components

1. **Master Schemas**: Define complete entity structure with all fields and validations
2. **DTO Schemas**: Always derived from master schemas using Zod methods
3. **Type Files**: Only contain `z.infer` statements, no manual type definitions
4. **Mongoose Models**: Implement Zod types with BaseModel for ID conversion
5. **Mappers**: Handle Document → Entity conversion with type safety

## Implementation Order (Must Follow)

### Phase 0: Infrastructure
1. Project setup with dependencies
2. BaseSchema and common utilities
3. ZodValidationPipe and decorators

### Phase 1: User Collection
1. UserMasterSchema definition
2. User DTOs and types
3. UserModel and UserMapper
4. UsersModule with full CRUD

### Phase 2: Category Collection
1. CategoryMasterSchema
2. Category implementation

### Phase 3: Post Collection (with relations)
1. PostMasterSchema with authorId, categoryIds
2. Population logic implementation

### Phase 4: Comment Collection (complex relations)
1. CommentMasterSchema with nested relations
2. Tree structure handling

### Phase 5: Auth Module
1. Authentication DTOs and logic
2. JWT integration

## Critical Implementation Rules

### Schema Definition
```typescript
// ✅ CORRECT: Master schema with validator
export const UserMasterSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  email: z.string().refine(validator.isEmail, 'Invalid email'),
  name: z.string().refine(
    (val) => validator.isLength(val, { min: 1, max: 50 }),
    'Name must be 1-50 characters'
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ✅ CORRECT: DTO derived from master
export const CreateUserSchema = UserMasterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// ❌ WRONG: Independent DTO definition
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string()
});
```

### Type Inference
```typescript
// ✅ CORRECT: Type inference only
export type User = z.infer<typeof UserMasterSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ❌ WRONG: Manual type definition
export interface User {
  id: string;
  email: string;
  name: string;
}
```

### Mongoose Model
```typescript
// ✅ CORRECT: Implements Zod type
@Schema({ 
  collection: 'users',
  versionKey: false,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toHexString();
      delete ret._id;
      return ret;
    }
  }
})
export class UserModel extends BaseModel implements User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;
}
```

## Validation Checklist for Each Entity

Before moving to the next entity:
- [ ] Master schema uses validator library where possible
- [ ] All DTOs derived from master using Zod methods
- [ ] Types only use z.infer (no manual definitions)
- [ ] Mongoose model implements Zod type exactly
- [ ] Model configured with versionKey: false
- [ ] Mapper handles _id → id conversion
- [ ] No `any` types in entire module
- [ ] npm run type-check passes
- [ ] All tests pass

## Common Gotchas

1. **MongoDB ObjectId**: Always use string in Zod schemas, handle conversion in BaseModel
2. **Timestamps**: Include in master schema, omit in Create DTOs
3. **Relations**: Use ObjectId string references, not embedded documents
4. **Validation**: Prefer validator library over custom regex
5. **Response DTOs**: Remember to exclude sensitive fields like passwords