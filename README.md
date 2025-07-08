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

Here is a basic example of how to use the `ReordableList` component.

```svelte
<script>
    import ReordableList from 'svelte-reorderable-list';

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

{#snippet itemSnippet(item, index)}
    <div class="item">
        <span>{item.text}</span>
    </div>
{/snippet}

<ReordableList
    items={items}
    getKey={getKey}
    onUpdate={handleUpdate}
    itemSnippet={itemSnippet}
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
| `itemSnippet`       | `Snippet<[ItemType, number]>`              | Yes      | `undefined` | A Svelte 5 snippet for rendering each item. It receives the item and its index.                         |
| `onUpdate`          | `(items: ItemType[]) => void`              | Yes      | `undefined` | Callback function that is called with the new item order after a change.                                |
| `direction`         | `"horizontal" \| "vertical"`               | No       | `"vertical"`  | The direction of the list.                                                                              |
| `disabled`          | `boolean`                                  | No       | `false`     | When `true`, the reordering functionality is disabled.                                                  |
| `cssSelectorHandle` | `string`                                   | No       | `undefined` | A CSS selector for the drag handle. If not provided, the entire item is draggable.                      |

## Accessibility

### Keyboard Navigation

-   Use `Tab` to focus on an item.
-   Once an item is focused, use `Ctrl + ArrowUp/ArrowDown` for vertical lists or `Ctrl + ArrowLeft/ArrowRight` for horizontal lists to move the item. 