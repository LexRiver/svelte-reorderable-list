# Svelte Reorderable List

A simple and accessible reorderable list component for Svelte 5.

## Features

-   Drag and drop to reorder items.
-   Touch support for mobile devices.
-   Accessibility support: keyboard navigation with Ctrl + Arrow keys.
-   Horizontal and vertical lists.
-   Customizable drag handle.
-   Built with Svelte 5 runes.

## Installation

```bash
pnpm install svelte-reorderable-list
```

## Demo

### Basic List Reordering

![Simple List Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/simple-list.gif)

### Horizontal Layout

![Horizontal Layout Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/horizontal-layout.gif)

### Custom Drag Handle

![Drag Handle Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/drag-handle.gif)

### Keyboard Navigation

Use `Tab` key to focus element and then `Ctrl`+`Arrows` to move.

**Vertical Lists:**

![Keyboard Vertical Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/keyboard-vertical.gif)

**Horizontal Lists:**

![Keyboard Horizontal Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/keyboard-horizontal.gif)

## Usage

Here is a basic example of how to use the `ReorderableList` component.

```svelte
<script>
    import ReorderableList from 'svelte-reorderable-list';


    let items = [
        { id: '1', text: 'Item 1' },
        { id: '2', text: 'Item 2' },
        { id: '3', text: 'Item 3' },
        { id: '4', text: 'Item 4' },
    ];
    // or items = $state([...])

    const getKey = (item) => item.id;

    function handleUpdate(updatedItems) {
        items = updatedItems;
    }
</script>

{#snippet item(item, index)}
    <div class="item">
        <span>{item.text}</span>
    </div>
{/snippet}

<ReorderableList
    items={items}
    getKey={getKey}
    onUpdate={handleUpdate}
    item={item}
/>

<style>
    .item {
        padding: 1rem;
        border: 1px solid #ccc;
        background-color: #f9f9f9;
    }
</style>
```

## Props

| Prop                | Type                                       | Required | Default     | Description                                                                                             |
| ------------------- | ------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `items`             | `ItemType[]`                               | Yes      | `undefined` | The array of items to be displayed.                                                                     |
| `getKey`            | `(item: ItemType) => string`               | Yes      | `undefined` | A function that returns a unique key for each item.                                                     |
| `item`              | `Snippet<[ItemType, number]>`              | Yes      | `undefined` | A Svelte 5 snippet for rendering each item. It receives the item and its index.                         |
| `onUpdate`          | `(items: ItemType[]) => void`              | Yes      | `undefined` | Callback function that is called with the new item order after a change.                                |
| `direction`         | `"horizontal" \| "vertical"`               | No       | `"vertical"`  | The direction of the list.                                                                              |
| `disabled`          | `boolean`                                  | No       | `false`     | When `true`, the reordering functionality is disabled.                                                  |
| `cssSelectorHandle` | `string`                                   | No       | `undefined` | A CSS selector for the drag handle. If not provided, the entire item is draggable.                      |

## Theming and Customization

The components use CSS custom properties for theming. You can customize the appearance by overriding these variables in your CSS:

```css
:root {
    /* Focus and interaction colors */
    --reorderable-focus-color: #007acc;
    --reorderable-focus-offset: 2px;
    --reorderable-focus-radius: 3px;
    
    /* Drag clone appearance */
    --reorderable-drag-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    --reorderable-drag-opacity: 0.6;
    --reorderable-drag-scale: 1.02;
    
    /* Keyboard tip styling */
    --reorderable-keyboard-tip-bg: #016DB6;
    --reorderable-keyboard-tip-color: white;
    --reorderable-keyboard-tip-radius: 4px;
    
    /* Drop indicators (for tree component) */
    --reorderable-drop-indicator-color: #007acc;
    --reorderable-drop-indicator-radius: 2px;
    --reorderable-drop-child-bg: rgba(0, 122, 204, 0.2);
}
```

### Example: Dark Theme

```css
:root {
    --reorderable-focus-color: #4fc3f7;
    --reorderable-keyboard-tip-bg: #2196f3;
    --reorderable-drop-indicator-color: #4fc3f7;
    --reorderable-drag-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
```

### Example: Custom Brand Colors

```css
:root {
    --reorderable-focus-color: #6366f1;
    --reorderable-keyboard-tip-bg: #4f46e5;
    --reorderable-drop-indicator-color: #6366f1;
    --reorderable-drop-child-bg: rgba(99, 102, 241, 0.1);
}
```

## Tree Component

### Tree Demo

![Tree Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/tree.gif)

### Tree Keyboard Navigation

Use `Tab` key to focus element and then `Ctrl`+`Arrows` to move.

![Tree Keyboard Demo](https://raw.githubusercontent.com/LexRiver/svelte-reorderable-list/main/static/img/tree-keyboard.gif)

The library also includes a `ReorderableTree` component for hierarchical data. It supports two input modes:

### Tree Mode (Hierarchical Structure)

```svelte
<script>
    import { ReorderableTree, type TreeNode } from 'svelte-reorderable-list';

    let treeNodes: TreeNode<{ id: string; name: string; }>[] = [
        {
            item: { id: '1', name: 'Parent 1' },
            children: [
                { item: { id: '1-1', name: 'Child 1.1' } },
                { item: { id: '1-2', name: 'Child 1.2' } }
            ]
        },
        {
            item: { id: '2', name: 'Parent 2' },
            children: [
                { item: { id: '2-1', name: 'Child 2.1' } }
            ]
        }
    ];

    const getKey = (item) => item.id;

    function handleTreeUpdate(updatedNodes) {
        treeNodes = updatedNodes;
    }
</script>

{#snippet item(item, index)}
    <div class="tree-item">
        <span>{item.name}</span>
    </div>
{/snippet}

<ReorderableTree
    nodes={treeNodes}
    getKey={getKey}
    onUpdate={handleTreeUpdate}
    item={item}
    levelPadding="20px"
/>
```

### Flat Mode (Parent-Child References)

For easier data management, you can also use a flat structure where hierarchy is defined by `parentKey` references:

```svelte
<script>
    import { ReorderableTree, type FlatTreeNode } from 'svelte-reorderable-list';

    let flatNodes: FlatTreeNode<{ id: string; name: string; }>[] = [
        { item: { id: '1', name: 'Parent 1' }, key: '1' },
        { item: { id: '1-1', name: 'Child 1.1' }, key: '1-1', parentKey: '1' },
        { item: { id: '1-2', name: 'Child 1.2' }, key: '1-2', parentKey: '1' },
        { item: { id: '2', name: 'Parent 2' }, key: '2' },
        { item: { id: '2-1', name: 'Child 2.1' }, key: '2-1', parentKey: '2' }
    ];

    function handleFlatTreeUpdate(updatedNodes) {
        flatNodes = updatedNodes;
    }
</script>

{#snippet item(item, index)}
    <div class="tree-item">
        <span>{item.name}</span>
    </div>
{/snippet}

<ReorderableTree
    flatItems={flatNodes}
    onUpdate={handleFlatTreeUpdate}
    item={item}
    levelPadding="20px"
/>
```

### Tree Component Props

The `ReorderableTree` component automatically detects the input mode based on the props provided.

#### Tree Mode Props

| Prop                | Type                                       | Required | Default     | Description                                                                                             |
| ------------------- | ------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `nodes`             | `TreeNode<ItemType>[]`                     | Yes      | `undefined` | The array of tree nodes to be displayed.                                                               |
| `getKey`            | `(item: ItemType) => string`               | Yes      | `undefined` | A function that returns a unique key for each item.                                                     |
| `onUpdate`          | `(nodes: TreeNode<ItemType>[]) => void`    | Yes      | `undefined` | Callback function that is called with the new tree structure after a change.                           |

#### Flat Mode Props  

| Prop                | Type                                            | Required | Default     | Description                                                                                             |
| ------------------- | ----------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `flatItems`         | `FlatTreeNode<ItemType>[]`                      | Yes      | `undefined` | The array of flat tree nodes with parentKey references.                                                |
| `onUpdate`          | `(flatItems: FlatTreeNode<ItemType>[]) => void` | Yes      | `undefined` | Callback function that is called with the new flat structure after a change.                          |

#### Common Props

| Prop                | Type                                       | Required | Default     | Description                                                                                             |
| ------------------- | ------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `item`              | `Snippet<[ItemType, number]>`              | Yes      | `undefined` | A Svelte 5 snippet for rendering each item. It receives the item and its index.                         |
| `disabled`          | `boolean`                                  | No       | `false`     | When `true`, the reordering functionality is disabled.                                                  |
| `cssSelectorHandle` | `string`                                   | No       | `undefined` | A CSS selector for the drag handle. If not provided, the entire item is draggable.                      |
| `levelPadding`      | `string`                                   | No       | `"20px"`    | CSS padding value for each nesting level.                                                              |

#### Type Definitions

```typescript
interface TreeNode<ItemType> {
    item: ItemType;
    children?: TreeNode<ItemType>[];
}

interface FlatTreeNode<ItemType> {
    item: ItemType;
    key: string;
    parentKey?: string;
}
```

### Choosing Between Tree and Flat Mode

#### Use Tree Mode When:
- Your data is naturally hierarchical (e.g., file systems, nested categories)
- You prefer working with nested object structures
- You need to maintain the tree structure in your existing data model

#### Use Flat Mode When:
- Your data comes from a database with parent-child relationships
- You need easier state management and updates
- You want to avoid deep nesting complexity
- You're working with dynamic hierarchies that change frequently

Both modes provide identical functionality and user experience - the choice is purely about data structure preference.

### Tree Keyboard Navigation

-   Use `Tab` to focus on an item.
-   `Ctrl + ↑/↓`: Move item up/down within the same level
-   `Ctrl + ←`: Move item up one level (make it sibling of its parent)
-   `Ctrl + →`: Make item a child of the previous item

## Accessibility

### General Accessibility Features

-   Full keyboard navigation support
-   ARIA attributes for screen readers
-   Focus management with visible focus indicators
-   Reduced motion support for users with vestibular disorders
-   High contrast mode support

### Keyboard Navigation

#### List Component
-   Use `Tab` to focus on an item.
-   Once an item is focused, use `Ctrl + ArrowUp/ArrowDown` for vertical lists or `Ctrl + ArrowLeft/ArrowRight` for horizontal lists to move the item.

#### Tree Component
-   Use `Tab` to focus on an item.
-   Once an item is focused, use the keyboard shortcuts described above for tree navigation. 