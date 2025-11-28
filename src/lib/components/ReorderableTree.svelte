<script module lang="ts">
    import type { Snippet } from "svelte";

    export interface TreeNode<ItemType> {
        item: ItemType;
        children?: TreeNode<ItemType>[];
    }

    export interface FlatTreeNode<ItemType> {
        item: ItemType;
        key: string;
        parentKey?: string;
    }

    type TreeInputMode<ItemType> = {
        treeNodes: TreeNode<ItemType>[];
        getKey: (item: ItemType) => string;
        onUpdate: (nodes: TreeNode<ItemType>[]) => void;
        flatNodes?: never; // Ensure flatItems is not present in tree mode
    } | {
        flatNodes: FlatTreeNode<ItemType>[];
        onUpdate: (flatNodes: FlatTreeNode<ItemType>[]) => void;
        treeNodes?: never; // Ensure treeNodes is not present in flat mode
        getKey?: never; // Ensure getKey is not present in flat mode
    };

    interface BaseProps<ItemType> {
        item: Snippet<[ItemType, number]>;
        disabled?: boolean;
        cssSelectorHandle?: string;
        levelPadding?: string;
    }

    // Two possible input modes as union type
    export type ReorderableTreeProps<ItemType> = BaseProps<ItemType> & TreeInputMode<ItemType>;

    interface InternalFlatItem<ItemType> {
        node: TreeNode<ItemType>;
        level: number;
        index: number;
        parentKey: string | null;
        flatIndex: number;
        originalKey?: string; // Used in flat mode to store the original key
    }

    type Position = 'above' | 'below' | 'child';
    type DropTarget = { nodeId: string; position: Position };


    

</script>

<script lang="ts" generics="ItemType">
    import { flip } from "svelte/animate";
    import {
        type DragConfig,
        type DragState,
        calculateDragOffset,
        createDragClone,
        finalizeDragOperation,
        focusManager,
        getDragCloneCenter,
        getItemElement,
        getItemKeyFromElement,
        shouldAllowDrag,
        updateDragClonePosition
    } from "../drag-utils.js";


    
    

    const props: ReorderableTreeProps<ItemType> = $props();
    const defaultLevelPadding = props.levelPadding || '20px';
    const animationDuration = 100;

    // Type guard to check if we're in flat mode
    function isFlatMode(props: ReorderableTreeProps<ItemType>): props is BaseProps<ItemType> & { flatNodes: FlatTreeNode<ItemType>[]; onUpdate: (flatNodes: FlatTreeNode<ItemType>[]) => void; } {
        return 'flatNodes' in props;
    }

    // Helper function to get key from item depending on mode
    function getItemKey(item: ItemType, flatItem?: InternalFlatItem<ItemType>): string {
        if (isFlatMode(props)) {
            // In flat mode, use the originalKey if available
            if (flatItem && flatItem.originalKey) {
                return flatItem.originalKey;
            }
            // Fallback: find by item reference
            const foundFlatNode = props.flatNodes.find(fn => fn.item === item);
            if (foundFlatNode) {
                return foundFlatNode.key;
            }
            throw new Error('Could not find key for item in flat mode');
        }
        return props.getKey(item);
    }

    // Helper function to calculate level from flat item
    function calculateLevelFromParent(node: FlatTreeNode<ItemType>, allItems: FlatTreeNode<ItemType>[]): number {
        let level = 0;
        let currentParent = node.parentKey;
        const visited = new Set<string>();
        
        while (currentParent && !visited.has(currentParent)) {
            visited.add(currentParent);
            level++;
            const parent = allItems.find(item => item.key === currentParent);
            currentParent = parent?.parentKey;
        }
        return level;
    }

    // Helper function to trigger update based on mode
    function triggerUpdate(newFlatItems: InternalFlatItem<ItemType>[]) {
        if (isFlatMode(props)) {
            // Convert back to FlatTreeNode format
            props.onUpdate(convertInternalItemsToFlatTree(newFlatItems));
        } else {
            // Tree mode - rebuild tree structure
            props.onUpdate(convertInternalItemsToTree(newFlatItems));
        }
    }

    function convertInternalItemsToFlatTree(internalItems: InternalFlatItem<ItemType>[]): FlatTreeNode<ItemType>[] {
        return internalItems.map(item => ({
                item: item.node.item,
                key: item.originalKey || getItemKey(item.node.item, item),
                parentKey: item.parentKey || undefined
            }));
    }

    // Validate that all keys are unique across the entire tree before Svelte processes them
    const validationError = $derived.by(() => {
        let keys: string[] = [];
        
        if (isFlatMode(props)) {
            // Flat mode validation
            keys = props.flatNodes.map(item => item.key);
        } else {
            // Tree mode validation
            const allItems: ItemType[] = [];
            
            function collectAllItems(nodes: TreeNode<ItemType>[]) {
                for (const node of nodes) {
                    allItems.push(node.item);
                    if (node.children) {
                        collectAllItems(node.children);
                    }
                }
            }
            
            collectAllItems(props.treeNodes);
            keys = allItems.map(item => props.getKey(item));
        }
        
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
            const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
            return `Duplicate keys found: ${duplicates.join(', ')}`;
        }
        return null;
    });

    let containerRef: HTMLElement | undefined;
    let itemRefs: Record<string, HTMLElement> = $state({});
    let isAnimating = $state(false);

    const dragState: DragState = $state({
        isKeyboardUser: true,
        focusedItemKey: null,
        dragClone: null,
        currentPosition: { x: 0, y: 0 },
        draggedElementOffset: { x: 0, y: 0 },
        isDragging: false,
        draggedItemKey: null,
    });

    let dropTarget = $state<DropTarget | null>(null);

    const dragConfig: DragConfig = $derived({
        disabled: props.disabled,
        cssSelectorHandle: props.cssSelectorHandle,
        animationDuration
    });

    // Flatten tree for easier manipulation
    function convertTreeToInternalItems(nodes: TreeNode<ItemType>[], level = 0, parentKey: string | null = null): InternalFlatItem<ItemType>[] {
        let flatIndex = 0;
        const result: InternalFlatItem<ItemType>[] = [];
        
        function traverse(nodes: TreeNode<ItemType>[], level: number, parentKey: string | null) {
            nodes.forEach((node, index) => {
                result.push({ node, level, index, parentKey, flatIndex: flatIndex++ });
                if (node.children) {
                    traverse(node.children, level + 1, getItemKey(node.item));
                }
            });
        }
        
        traverse(nodes, level, parentKey);
        return result;
    }

    // Rebuild tree from flat structure
    function convertInternalItemsToTree(internalItems: InternalFlatItem<ItemType>[]): TreeNode<ItemType>[] {
        const nodeMap = new Map<string, TreeNode<ItemType>>();
        const rootNodes: TreeNode<ItemType>[] = [];

        // First pass: create all nodes
        internalItems.forEach(({ node }) => {
            nodeMap.set(getItemKey(node.item), { ...node, children: [] });
        });

        // Second pass: build hierarchy
        internalItems.forEach(({ node, parentKey }) => {
            const nodeKey = getItemKey(node.item);
            const newNode = nodeMap.get(nodeKey)!;
            if (parentKey && nodeMap.has(parentKey)) {
                const parent = nodeMap.get(parentKey)!;
                if (!parent.children) parent.children = [];
                parent.children.push(newNode);
            } else {
                rootNodes.push(newNode);
            }
        });

        return rootNodes;
    }

    // Convert input to internal flat structure
    const internalItems = $derived.by((): InternalFlatItem<ItemType>[] => {
        if (isFlatMode(props)) {
            // Convert FlatTreeNode to internal format
            return convertFlatTreeToInternalItems(props.flatNodes);
        } else {
            // Tree mode - flatten the tree structure
            return convertTreeToInternalItems(props.treeNodes);
        }
    });

    function convertFlatTreeToInternalItems(flatItems: FlatTreeNode<ItemType>[]): InternalFlatItem<ItemType>[] {
        const existingKeys = new Set(flatItems.map((item) => item.key));
        const internal: InternalFlatItem<ItemType>[] = [];

        flatItems.forEach((flatNode, index) => {
            if (flatNode.parentKey && !existingKeys.has(flatNode.parentKey)) {
                console.error(
                    `ReorderableTree: parentKey "${flatNode.parentKey}" not found for item with key "${flatNode.key}". Item will be skipped.`,
                );
                return; // Skip rendering this item
            }

            const level = calculateLevelFromParent(flatNode, flatItems);

            internal.push({
                node: { item: flatNode.item, children: [] },
                level,
                index,
                parentKey: flatNode.parentKey || null,
                flatIndex: index,
                originalKey: flatNode.key, // Store the original key for easy access
            } satisfies InternalFlatItem<ItemType>);
        });

        return internal;
    }
    function updateDraggedElementPosition() {
        if (!dragState.isDragging || !dragState.dragClone) return;
        updateDragClonePosition(dragState.dragClone, dragState.currentPosition, dragState.draggedElementOffset);
    }

    function getHoveredItem() {
        if (!dragState.dragClone) return null;
        
        const handleCenter = getDragCloneCenter(dragState.dragClone);
        
        for (const flatItem of internalItems) {
            const nodeKey = getItemKey(flatItem.node.item);
            const itemElement = itemRefs[nodeKey];
            if (!itemElement) continue;
            
            const itemRect = itemElement.getBoundingClientRect();
            
            if (itemRect.left <= handleCenter.x && itemRect.right >= handleCenter.x &&
                itemRect.top <= handleCenter.y && itemRect.bottom >= handleCenter.y) {
                
                const relativeY = (handleCenter.y - itemRect.top) / itemRect.height;
                
                if (relativeY < 0.25) {
                    return { nodeId: nodeKey, position: 'above' } satisfies DropTarget;
                } else if (relativeY > 0.75) {
                    return { nodeId: nodeKey, position: 'below' } satisfies DropTarget;
                } else {
                    return { nodeId: nodeKey, position: 'child' } satisfies DropTarget;
                }
            }
        }
        return null;
    }

    function handleFocus(itemKey: string) {
        focusManager.handleFocus(itemKey, dragState);
    }

    function handleBlur() {
        focusManager.handleBlur(dragState);
    }

    function handleMouseDown(event: MouseEvent) {
        focusManager.setKeyboardUser(dragState, false);
        const target = event.target as HTMLElement;
        if (!shouldAllowDrag(target, dragConfig)) return;

        const itemElement = getItemElement(target, "[data-tree-item]");
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        event.preventDefault();

        dragState.isDragging = true;
        dragState.draggedItemKey = itemKey;
        dragState.currentPosition = { x: event.clientX, y: event.clientY };
        dragState.draggedElementOffset = calculateDragOffset(event.clientX, event.clientY, itemElement);

        dragState.dragClone = createDragClone(
            itemElement, 
            event.clientX, 
            event.clientY, 
            dragState.draggedElementOffset
        );

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!dragState.isDragging) return;

        dragState.currentPosition = { x: event.clientX, y: event.clientY };
        updateDraggedElementPosition();

        const hoveredItem = getHoveredItem();
        dropTarget = hoveredItem;
    }

    function handleMouseUp(event: MouseEvent) {
        if (!dragState.isDragging) return;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        if (dropTarget && dragState.draggedItemKey) {
            performMove(dragState.draggedItemKey, dropTarget);
        }

        finalizeDrop();
    }

    function finalizeDrop() {
        finalizeDragOperation(dragState);
        dropTarget = null;
    }

    function performMove(draggedId: string, target: DropTarget) {
        if (isAnimating || draggedId === target.nodeId) return;

        const currentFlatItems = internalItems;
        const draggedIndex = currentFlatItems.findIndex(item => getItemKey(item.node.item) === draggedId);
        const targetIndex = currentFlatItems.findIndex(item => getItemKey(item.node.item) === target.nodeId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const draggedItem = currentFlatItems[draggedIndex];
        const targetItem = currentFlatItems[targetIndex];
        
        // Remove dragged item and its children
        const draggedWithChildren = currentFlatItems.filter(item => 
            getItemKey(item.node.item) === draggedId || isDescendant(getItemKey(item.node.item), draggedId, currentFlatItems)
        );
        
        const newFlatItems = currentFlatItems.filter(item => 
            !draggedWithChildren.some(d => getItemKey(d.node.item) === getItemKey(item.node.item))
        );

        // Calculate new position and level
        let insertIndex = newFlatItems.findIndex(item => getItemKey(item.node.item) === target.nodeId);
        let newLevel = draggedItem.level;
        let newParentKey = draggedItem.parentKey;

        if (target.position === 'above') {
            // Insert before target at same level as target
            newLevel = targetItem.level;
            newParentKey = targetItem.parentKey;
        } else if (target.position === 'below') {
            // Insert after target's entire subtree at same level as target
            const targetKey = getItemKey(targetItem.node.item);
            const targetWithChildren = newFlatItems.filter(item => 
                getItemKey(item.node.item) === targetKey || isDescendant(getItemKey(item.node.item), targetKey, newFlatItems)
            );
            insertIndex = insertIndex + targetWithChildren.length;
            newLevel = targetItem.level;
            newParentKey = targetItem.parentKey;
        } else if (target.position === 'child') {
            // Insert as child of target
            insertIndex++;
            newLevel = targetItem.level + 1;
            newParentKey = target.nodeId;
        }

        // Update levels for all moved items
        const levelDiff = newLevel - draggedItem.level;
        draggedWithChildren.forEach(item => {
            item.level += levelDiff;
            if (getItemKey(item.node.item) === draggedId) {
                item.parentKey = newParentKey;
            }
        });

        // Insert at new position
        newFlatItems.splice(insertIndex, 0, ...draggedWithChildren);

        // Update the tree structure and trigger reactivity
        isAnimating = true;
        triggerUpdate(newFlatItems);
        setTimeout(() => (isAnimating = false), animationDuration);
    }

    function isDescendant(nodeKey: string, ancestorKey: string, searchFlatItems: InternalFlatItem<ItemType>[] = internalItems): boolean {
        let currentKey: string | null = nodeKey;
        const visited = new Set<string>();
        
        while (currentKey && !visited.has(currentKey)) {
            visited.add(currentKey);
            const item = searchFlatItems.find(item => getItemKey(item.node.item, item) === currentKey);
            if (!item || !item.parentKey) return false;
            if (item.parentKey === ancestorKey) return true;
            currentKey = item.parentKey;
        }
        return false;
    }

    function handleKeyDown(event: KeyboardEvent) {
        focusManager.setKeyboardUser(dragState, true);
        if (props.disabled) return;

        const target = event.target as HTMLElement;
        const itemElement = getItemElement(target, "[data-tree-item]");
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        const currentIndex = internalItems.findIndex(item => getItemKey(item.node.item) === itemKey);
        if (currentIndex === -1) return;

        const currentItem = internalItems[currentIndex];

        if (event.key === "ArrowUp" && event.ctrlKey) {
            event.preventDefault();
            
            // Find the previous sibling at the same level
            let targetIndex = -1;
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (internalItems[i].level === currentItem.level) {
                    // Found a sibling - place above it
                    targetIndex = i;
                    break;
                } else if (internalItems[i].level < currentItem.level) {
                    // Reached a higher level, can't move up
                    break;
                }
            }
            
            if (targetIndex !== -1) {
                performKeyboardMove(itemKey, targetIndex, 'above');
            }
        } else if (event.key === "ArrowDown" && event.ctrlKey) {
            event.preventDefault();
            
            // Get all items that are part of this subtree (including children)
            const itemWithChildren = internalItems.filter(item => 
                getItemKey(item.node.item) === itemKey || isDescendant(getItemKey(item.node.item), itemKey)
            );
            
            // Find the next sibling at the same level after this subtree
            let targetSiblingIndex = -1;
            const afterSubtreeIndex = currentIndex + itemWithChildren.length;
            
            // Look for the next item at the same level as the current item
            for (let i = afterSubtreeIndex; i < internalItems.length; i++) {
                if (internalItems[i].level === currentItem.level) {
                    // Found the next sibling
                    targetSiblingIndex = i;
                    break;
                } else if (internalItems[i].level < currentItem.level) {
                    // Reached a higher level, can't move down
                    break;
                }
            }
            
            if (targetSiblingIndex !== -1) {
                // Move after the sibling (which will place it after the sibling's entire subtree)
                performKeyboardMove(itemKey, targetSiblingIndex, 'below');
            }
        } else if (event.key === "ArrowRight" && event.ctrlKey) {
            event.preventDefault();
            
            // Make this item a child of the previous item
            if (currentIndex > 0) {
                const previousItem = internalItems[currentIndex - 1];
                performKeyboardMove(itemKey, currentIndex - 1, 'child');
            }
        } else if (event.key === "ArrowLeft" && event.ctrlKey) {
            event.preventDefault();
            
            // Move this item up one level (make it sibling of its parent)
            if (currentItem.level > 0 && currentItem.parentKey) {
                const parentIndex = internalItems.findIndex(item => getItemKey(item.node.item) === currentItem.parentKey);
                if (parentIndex !== -1) {
                    performKeyboardMove(itemKey, parentIndex, 'below');
                }
            }
        }
    }

    function performKeyboardMove(draggedId: string, targetIndex: number, position: Position) {
        const targetItem = internalItems[targetIndex];
        if (!targetItem) return;

        const target = {
            nodeId: getItemKey(targetItem.node.item),
            position: position as Position
        };

        performMove(draggedId, target);

        // Refocus the moved item after animation
        setTimeout(() => {
            const movedElement = itemRefs[draggedId];
            if (movedElement) {
                movedElement.focus();
            }
        }, animationDuration);
    }

    // Touch handlers (simplified)
    function handleTouchStart(event: TouchEvent) {
        focusManager.setKeyboardUser(dragState, false);
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const target = touch.target as HTMLElement;
        if (!shouldAllowDrag(target, dragConfig)) return;

        const itemElement = getItemElement(target, "[data-tree-item]");
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        dragState.isDragging = true;
        dragState.draggedItemKey = itemKey;
        dragState.currentPosition = { x: touch.clientX, y: touch.clientY };
        dragState.draggedElementOffset = calculateDragOffset(touch.clientX, touch.clientY, itemElement);

        dragState.dragClone = createDragClone(
            itemElement, 
            touch.clientX, 
            touch.clientY, 
            dragState.draggedElementOffset
        );

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
    }

    function handleTouchMove(event: TouchEvent) {
        if (!dragState.isDragging) return;
        event.preventDefault();

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            dragState.currentPosition = { x: touch.clientX, y: touch.clientY };
            updateDraggedElementPosition();

            const hoveredItem = getHoveredItem();
            dropTarget = hoveredItem;
        }
    }

    function handleTouchEnd() {
        if (!dragState.isDragging) return;

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);

        if (dropTarget && dragState.draggedItemKey) {
            performMove(dragState.draggedItemKey, dropTarget);
        }

        finalizeDrop();
    }
</script>

{#if validationError}
    <div class="reorderable-error" role="alert">
        <strong>Error:</strong> {validationError}
    </div>

{:else}
<div
    class="reorderable-tree reorderable-container-base"
    class:disabled={props.disabled}
    bind:this={containerRef}
    role="tree"
>
    {#each internalItems as flatItem, index (getItemKey(flatItem.node.item, flatItem))}
        {@const nodeKey = getItemKey(flatItem.node.item, flatItem)}
        <div
            animate:flip={{ duration: animationDuration }}
            class="tree-item reorderable-item-base drop-indicator"
            class:focused={dragState.focusedItemKey === nodeKey}
            class:dragging={dragState.isDragging && (nodeKey === dragState.draggedItemKey || (dragState.draggedItemKey && isDescendant(nodeKey, dragState.draggedItemKey)))}
            class:drop-above={dropTarget?.nodeId === nodeKey && dropTarget?.position === 'above'}
            class:drop-below={dropTarget?.nodeId === nodeKey && dropTarget?.position === 'below'}
            class:drop-child={dropTarget?.nodeId === nodeKey && dropTarget?.position === 'child'}
            class:has-handle={!!props.cssSelectorHandle}
            class:animating={isAnimating}
            data-tree-item
            data-item-key={nodeKey}
            role="treeitem"
            aria-expanded={flatItem.node.children && flatItem.node.children.length > 0 ? "true" : "false"}
            aria-selected={dragState.focusedItemKey === nodeKey}
            bind:this={itemRefs[nodeKey]}
            tabindex={props.disabled ? -1 : 0}
            style={`margin-left: calc(${defaultLevelPadding} * ${flatItem.level}); --drop-line-padding: 0; --cursor-grab: ${props.cssSelectorHandle ? 'default' : 'grab'}; --cursor-grabbing: ${props.cssSelectorHandle ? 'default' : 'grabbing'}`}
            onmousedown={handleMouseDown}
            ontouchstart={handleTouchStart}
            onkeydown={handleKeyDown}
            onfocus={() => handleFocus(nodeKey)}
            onblur={handleBlur}
        >
            {@render props.item(flatItem.node.item, index)}
            
            {#if dragState.focusedItemKey === nodeKey && dragState.isKeyboardUser}
                <div class="keyboard-tip">
                    Ctrl + ↑ · ↓ · ← · → 
                </div>
            {/if}
        </div>
    {/each}
</div>
{/if}

<style lang="scss">
    @use "../styles/reorderable.scss";

    .reorderable-tree {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .tree-item {
        transition: margin-left 0.2s ease, transform 0.2s ease;

        // Override cursor when cssSelectorHandle is provided
        &:not(.has-handle) {
            cursor: var(--cursor-grab, grab);

            &:active {
                cursor: var(--cursor-grabbing, grabbing);
            }
        }

        &.has-handle {
            cursor: default;

            &:active {
                cursor: default;
            }
        }
    }
</style>
