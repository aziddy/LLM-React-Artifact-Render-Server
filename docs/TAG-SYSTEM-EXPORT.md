# Hierarchical Tag System — Full Specification

A complete, self-contained reference for reimplementing the hierarchical tag system from the Topos project. Covers database schema, validation, API routes, TypeScript types, data fetching, and UI/UX components.

**Tech stack used in the original**: Next.js (App Router), TypeScript, Prisma (PostgreSQL), Zod, SWR, shadcn/ui, Tailwind CSS, lucide-react icons.

---

## 1. Database Schema (Prisma)

### Tag Model

Self-referential adjacency list — each tag optionally points to a parent tag.

```prisma
model Tag {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  name      String
  color     String?                // Hex color, e.g. "#3B82F6"
  parentId  String?                // Self-FK for hierarchy (null = root tag)
  parent    Tag?      @relation("TagHierarchy", fields: [parentId], references: [id])
  children  Tag[]     @relation("TagHierarchy")
  sortOrder Int       @default(0)  // Custom ordering within same level
  items     ItemTag[]              // M:M junction with Item
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([userId])    // Fast user-scoped queries
  @@index([parentId])  // Fast parent lookups for tree building
}
```

### ItemTag Junction Model

Many-to-many between Item and Tag. Composite primary key prevents duplicates. Cascade deletes on both sides — deleting an item or tag automatically removes the junction record.

```prisma
model ItemTag {
  itemId String
  item   Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])  // Composite PK = unique item-tag pair
}
```

### Why Adjacency List

- **Simple**: One `parentId` column, no extra tables or computed paths
- **Easy writes**: Moving a tag = update one `parentId` field
- **Good enough reads**: For shallow hierarchies (2-3 levels typical), nested Prisma includes work fine without recursive CTEs
- **Trade-off**: Deep recursive queries require client-side traversal or raw SQL CTEs

---

## 2. TypeScript Types

```typescript
interface Tag {
  id: string
  userId: string
  name: string
  color: string | null       // Hex color or null
  parentId: string | null    // null = root tag
  sortOrder: number
  children?: Tag[]           // Populated by API includes
  _count?: { items: number } // Prisma aggregate count
}
```

Items reference tags through the junction table. The API returns the unwrapped shape:

```typescript
interface Item {
  id: string
  name: string
  // ... other fields ...
  tags: { tag: Tag }[]  // Junction unwrap: each entry has a .tag object
}
```

Helper type for flattening the tree into a list (used in tag picker UIs):

```typescript
interface FlatTag {
  id: string
  name: string
  color: string | null
  depth: number  // 0 = root, 1 = child, 2 = grandchild, etc.
}
```

---

## 3. Validation Schemas (Zod)

```typescript
import { z } from 'zod/v4'

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const updateTagSchema = createTagSchema.partial()
```

**Rules**:
- `name`: Required, 1–100 characters
- `color`: Optional, must be 6-digit hex with `#` prefix (e.g. `#3B82F6`)
- `parentId`: Optional UUID; `null` means root tag; absent means "don't change" on update
- `sortOrder`: Optional non-negative integer for ordering within the same parent level

---

## 4. API Routes

All routes are protected by a `withAuth` wrapper that extracts `userId` from the session and returns 401 if unauthenticated. All tag queries are scoped to `userId` for multi-tenant isolation.

### Auth wrapper pattern

```typescript
export async function withAuth(
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return errorResponse('Unauthorized', 401)
  return await handler(session.user.id)
}
```

---

### `GET /api/tags` — List all tags (hierarchical)

Returns root tags (parentId = null) with 2 levels of nested children. Each level includes item counts.

```typescript
const tags = await prisma.tag.findMany({
  where: { userId, parentId: null },
  orderBy: { sortOrder: 'asc' },
  include: {
    children: {
      orderBy: { sortOrder: 'asc' },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { items: true } },
      },
    },
    _count: { select: { items: true } },
  },
})
```

**Response shape**: `Tag[]` where each tag has `.children` (array) and `._count.items` (number).

---

### `POST /api/tags` — Create a tag

**Request body**: Validated with `createTagSchema`.

**Behavior**:
1. Parse and validate body
2. If `parentId` is provided, verify the parent tag exists and belongs to the user (404 if not)
3. Create the tag with `userId` and `sortOrder` (defaults to 0)
4. Return the created tag with status 201

```typescript
if (data.parentId) {
  const parent = await prisma.tag.findFirst({
    where: { id: data.parentId, userId },
  })
  if (!parent) return errorResponse('Parent tag not found', 404)
}

const tag = await prisma.tag.create({
  data: { ...data, userId, sortOrder: data.sortOrder ?? 0 },
})
```

**Error responses**: 422 for Zod validation errors, 404 if parent not found.

---

### `GET /api/tags/[id]` — Get a single tag with details

Returns the tag with its direct children (including their item counts) **and** all items assigned to this tag with their full placement hierarchy.

```typescript
const tag = await prisma.tag.findFirst({
  where: { id, userId },
  include: {
    children: {
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    },
    items: {
      include: {
        item: {
          include: {
            location: true,
            room: true,
            area: true,
            container: true,
          },
        },
      },
    },
    _count: { select: { items: true } },
  },
})
```

---

### `PATCH /api/tags/[id]` — Update a tag

**Request body**: Validated with `updateTagSchema` (all fields optional).

Uses `updateMany` with `{ id, userId }` filter for user-scoped protection, then fetches the updated record.

```typescript
const result = await prisma.tag.updateMany({
  where: { id, userId },
  data,
})
if (result.count === 0) return errorResponse('Tag not found', 404)
const updated = await prisma.tag.findUnique({ where: { id } })
```

---

### `DELETE /api/tags/[id]` — Delete a tag

```typescript
const result = await prisma.tag.deleteMany({ where: { id, userId } })
if (result.count === 0) return errorResponse('Tag not found', 404)
```

ItemTag junction records are automatically cascade-deleted by the Prisma schema.

---

### `POST /api/items/[id]/tags` — Add a tag to an item

Idempotent — uses upsert so adding an already-assigned tag is a no-op.

```typescript
const tagActionSchema = z.object({ tagId: z.string().uuid() })

// Validate both item and tag exist and belong to user
const item = await prisma.item.findFirst({ where: { id, userId } })
const tag = await prisma.tag.findFirst({ where: { id: tagId, userId } })

await prisma.itemTag.upsert({
  where: { itemId_tagId: { itemId: id, tagId } },
  create: { itemId: id, tagId },
  update: {},  // No-op if already exists
})
```

Returns `{ itemId, tagId }` with status 201.

---

### `DELETE /api/items/[id]/tags` — Remove a tag from an item

```typescript
await prisma.itemTag.deleteMany({
  where: { itemId: id, tagId },
})
```

---

### Item CRUD — Tag integration

When creating or updating an item, the client sends a `tagIds: string[]` array.

**On create** (POST /api/items):
```typescript
const tag = await prisma.item.create({
  data: {
    ...itemData,
    tags: { create: tagIds.map(tagId => ({ tagId })) },
  },
})
```

**On update** (PATCH /api/items/[id]) — **replace-all strategy**:
```typescript
await prisma.item.update({
  where: { id },
  data: {
    ...itemData,
    tags: {
      deleteMany: {},  // Remove all existing tag associations
      create: tagIds.map(tagId => ({ tagId })),  // Re-create from new list
    },
  },
})
```

If `tagIds` is not provided in the PATCH body, tags are left unchanged.

---

## 5. Data Fetching (SWR Hooks)

```typescript
import useSWR from 'swr'
import type { Tag } from '@/types'

// Fetch full tag tree (root tags with nested children)
export function useTags() {
  return useSWR<Tag[]>('/api/tags')
}

// Fetch single tag with children + items (conditional: null id = no fetch)
export function useTag(id: string | null) {
  return useSWR(id ? `/api/tags/${id}` : null)
}
```

Both return `{ data, error, isLoading, mutate }`. Call `mutate()` after any create/update/delete to refresh.

---

## 6. UI/UX Components

### TagBadge — Display component

Simple colored outline badge for showing a tag anywhere in the UI.

```tsx
export function TagBadge({ tag, onClick }: { tag: Tag; onClick?: () => void }) {
  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent transition-colors"
      style={{
        borderColor: tag.color || undefined,
        color: tag.color || undefined,
      }}
      onClick={onClick}
    >
      {tag.name}
    </Badge>
  )
}
```

**Visual**: Outline badge where border color and text color match the tag's hex color.

---

### TagTree — Hierarchical management view

Recursive tree display used on the `/tags` management page.

**TagNode** (recursive inner component):
- Expand/collapse chevron (ChevronDown/ChevronRight) if has children
- TagBadge with the tag's color
- Item count text (e.g. "3 items")
- Hover-reveal action menu (MoreHorizontal icon) with Edit and Delete options
- Children rendered in an indented `ml-5 border-l pl-2` container

```tsx
interface TagTreeProps {
  tags: Tag[]
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
}
```

**Empty state**: "No tags yet. Create one to organize your items."

---

### TagForm — Create/Edit dialog

A modal dialog with three inputs:

#### 1. Name input
Standard text input, required, 1–100 chars.

#### 2. Color picker
**38 preset colors** arranged in a flex-wrap grid of circular buttons, grouped by hue family:
- Red (4 shades), Pink (4), Orange (4), Amber (4), Lime (2), Emerald (3), Teal (4), Blue (4), Sky (2), Violet (4), Indigo (1), Slate (3), Gray (3), plus Gold, Mauve, Tan, Sky Blue
- Each shade goes from saturated to pastel (e.g. `#3B82F6` → `#60A5FA` → `#93C5FD` → `#BFDBFE`)
- Selected preset shows a white checkmark overlay

**Custom color option**: A final circle button with a conic-gradient rainbow background. Clicking reveals the native HTML5 `<input type="color">` picker. The button background changes to the custom color when selected.

```typescript
const PRESET_COLORS = [
  { color: '#EF4444', label: 'Red' },
  { color: '#F87171', label: 'Red Light' },
  { color: '#FCA5A5', label: 'Red Lighter' },
  { color: '#FECACA', label: 'Red Lightest' },
  // ... 34 more presets ...
  { color: '#87CEEB', label: 'Sky Blue' },
]
```

#### 3. Parent tag picker (optional)
A Popover with a scrollable tree of all tags. Features:

- **"None (root tag)"** option at top
- Expandable/collapsible tree nodes (TagPickerNode recursive component)
- Color dots next to each tag name
- Item count for each tag
- Checkmark on selected parent
- Depth-based left padding: `paddingLeft: depth * 16 + 8`
- Nested children shown inside a `border-l` container

**Circular reference prevention**: When editing a tag, the picker excludes the tag itself and all its descendants so you can't make a tag its own ancestor.

```typescript
// Collect all descendant IDs (to prevent circular parent references)
function collectDescendantIds(tag: Tag): Set<string> {
  const ids = new Set<string>()
  function walk(t: Tag) {
    ids.add(t.id)
    t.children?.forEach(walk)
  }
  walk(tag)
  return ids
}

// Find a tag by ID in a nested tree (for displaying selected parent name)
function findTagById(tags: Tag[], id: string): Tag | undefined {
  for (const tag of tags) {
    if (tag.id === id) return tag
    if (tag.children) {
      const found = findTagById(tag.children, id)
      if (found) return found
    }
  }
}
```

**Form submission**: POST to `/api/tags` (create) or PATCH to `/api/tags/[id]` (edit). Sends `{ name, color, parentId }` where parentId is `null` for root tags.

**State reset**: Tracks `prevTagId` to detect when a different tag is being edited and resets `parentId` + `color` state accordingly.

---

### Item Form — Tag assignment section

Located inside the item create/edit dialog, below the placement picker.

#### Selected tags display
Colored badges with a remove (X) button. Each badge has:
- Semi-transparent background: `backgroundColor: tag.color + "20"` (hex with alpha)
- Colored border and text matching the tag color
- Small color dot before the name
- X button to remove

#### Tag picker popover
- Trigger: "Add tags..." button with Tags icon
- Content: Flat list of all tags with depth-based indentation
- Click to toggle selection (add/remove from `Set<string>`)
- Checkmark on selected tags
- Empty state: "No tags yet"

**Flattening helper** — converts the nested tree into a flat list with depth tracking:

```typescript
function flattenTags(tags: Tag[], depth = 0): FlatTag[] {
  const result: FlatTag[] = []
  for (const tag of tags) {
    result.push({ id: tag.id, name: tag.name, color: tag.color, depth })
    if (tag.children?.length) {
      result.push(...flattenTags(tag.children, depth + 1))
    }
  }
  return result
}
```

**State management**: Uses `Set<string>` for selected tag IDs. On form submit, converts to array: `tagIds: Array.from(selectedTagIds)`.

---

## 7. Key Patterns & Design Decisions

### Adjacency list hierarchy
Each tag has an optional `parentId` pointing to another tag. This is the simplest hierarchy pattern:
- One parent per tag (not DAG — strict tree)
- Moving a tag = update one field
- No denormalized paths to maintain
- Trade-off: no efficient "get all descendants" without recursion

### User scoping
Every query filters by `userId`. Tags are fully isolated between users. Both `findFirst({ where: { id, userId } })` and `deleteMany({ where: { id, userId } })` patterns ensure a user can never access another user's tags.

### Sort order
Integer `sortOrder` field on each tag allows custom ordering within the same parent. Default is 0. All queries order by `sortOrder: 'asc'`.

### 2-level eager loading
The `GET /api/tags` endpoint eagerly loads root → children → grandchildren (2 levels deep). For deeper hierarchies, the client must recursively fetch or the API must be extended with recursive CTEs.

### Cascade deletes
- Deleting a **Tag** → all ItemTag records for that tag are cascade-deleted (schema-level)
- Deleting an **Item** → all ItemTag records for that item are cascade-deleted (schema-level)
- Deleting a **parent tag** does NOT cascade to child tags — child tags become orphaned (parentId still references deleted ID). Handle this at the application level if needed.

### Replace-all tag strategy on item update
When updating an item's tags, the API deletes all existing ItemTag records and re-creates from the new list. This is simpler than diffing and handles all add/remove cases atomically.

### Color system
Tags use hex colors throughout. The preset palette provides 38 curated colors across 14 hue families, each with 2–4 shades from saturated to pastel. Parent tags typically use bold colors; child tags use lighter variants for visual hierarchy. A custom color picker (native HTML5 input) is available as fallback.
