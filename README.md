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
        margin-bottom: 0.5rem;
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

The library also includes a `ReorderableTree` component for hierarchical data:

```svelte
<script>
    import { ReorderableTree, type TreeNode } from 'svelte-reorderable-list';

    let treeNodes = [
        {
            item: { id: '1', text: 'Parent 1' },
            children: [
                { item: { id: '1-1', text: 'Child 1.1' } },
                { item: { id: '1-2', text: 'Child 1.2' } }
            ]
        },
        {
            item: { id: '2', text: 'Parent 2' },
            children: [
                { item: { id: '2-1', text: 'Child 2.1' } }
            ]
        }
    ] satisfies TreeNode<{ id: number; name: string; }>[]

    const getKey = (item) => item.id;

    function handleTreeUpdate(updatedNodes) {
        treeNodes = updatedNodes;
    }
</script>

{#snippet item(item, index)}
    <div class="tree-item">
        <span>{item.text}</span>
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

### Tree Component Props

| Prop                | Type                                       | Required | Default     | Description                                                                                             |
| ------------------- | ------------------------------------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `nodes`             | `TreeNode<ItemType>[]`                     | Yes      | `undefined` | The array of tree nodes to be displayed.                                                               |
| `getKey`            | `(item: ItemType) => string`               | Yes      | `undefined` | A function that returns a unique key for each item.                                                     |
| `item`              | `Snippet<[ItemType, number]>`              | Yes      | `undefined` | A Svelte 5 snippet for rendering each item. It receives the item and its index.                         |
| `onUpdate`          | `(nodes: TreeNode<ItemType>[]) => void`    | Yes      | `undefined` | Callback function that is called with the new tree structure after a change.                           |
| `disabled`          | `boolean`                                  | No       | `false`     | When `true`, the reordering functionality is disabled.                                                  |
| `cssSelectorHandle` | `string`                                   | No       | `undefined` | A CSS selector for the drag handle. If not provided, the entire item is draggable.                      |
| `levelPadding`      | `string`                                   | No       | `"20px"`    | CSS padding value for each nesting level.                                                              |

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