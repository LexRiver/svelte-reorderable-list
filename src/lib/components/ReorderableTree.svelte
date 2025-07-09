<script module lang="ts">
    import type { Snippet } from "svelte";

    export interface TreeNode<ItemType> {
        item: ItemType;
        children?: TreeNode<ItemType>[];
    }

    export interface Props<ItemType> {
        nodes: TreeNode<ItemType>[];
        getKey: (item: ItemType) => string;
        itemSnippet: Snippet<[ItemType, number]>;
        onUpdate: (nodes: TreeNode<ItemType>[]) => void;
        disabled?: boolean;
        cssSelectorHandle?: string;
        levelPadding?: string;
    }
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

    type Position = 'above' | 'below' | 'child';
    type DropTarget = { nodeId: string; position: Position };

    const props: Props<ItemType> = $props();
    const defaultLevelPadding = props.levelPadding || '20px';
    const animationDuration = 100;

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
    function flattenTree(nodes: TreeNode<ItemType>[], level = 0, parentKey: string | null = null): { node: TreeNode<ItemType>; level: number; index: number; parentKey: string | null; flatIndex: number }[] {
        let flatIndex = 0;
        const result: { node: TreeNode<ItemType>; level: number; index: number; parentKey: string | null; flatIndex: number }[] = [];
        
        function traverse(nodes: TreeNode<ItemType>[], level: number, parentKey: string | null) {
            nodes.forEach((node, index) => {
                result.push({ node, level, index, parentKey, flatIndex: flatIndex++ });
                if (node.children) {
                    traverse(node.children, level + 1, props.getKey(node.item));
                }
            });
        }
        
        traverse(nodes, level, parentKey);
        return result;
    }

    // Rebuild tree from flat structure
    function rebuildTreeFromFlat(flatItems: ReturnType<typeof flattenTree>): TreeNode<ItemType>[] {
        const nodeMap = new Map<string, TreeNode<ItemType>>();
        const rootNodes: TreeNode<ItemType>[] = [];

        // First pass: create all nodes
        flatItems.forEach(({ node }) => {
            nodeMap.set(props.getKey(node.item), { ...node, children: [] });
        });

        // Second pass: build hierarchy
        flatItems.forEach(({ node, parentKey }) => {
            const nodeKey = props.getKey(node.item);
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

    let flatItems = $state(flattenTree(props.nodes));

    // Update flatItems when props.nodes changes
    $effect(() => {
        if (!isAnimating) {
            flatItems = flattenTree(props.nodes);
        }
    });

    function updateDraggedElementPosition() {
        if (!dragState.isDragging || !dragState.dragClone) return;
        updateDragClonePosition(dragState.dragClone, dragState.currentPosition, dragState.draggedElementOffset);
    }

    function getHoveredItem() {
        if (!dragState.dragClone) return null;
        
        const handleCenter = getDragCloneCenter(dragState.dragClone);
        
        for (const flatItem of flatItems) {
            const nodeKey = props.getKey(flatItem.node.item);
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

        const draggedIndex = flatItems.findIndex(item => props.getKey(item.node.item) === draggedId);
        const targetIndex = flatItems.findIndex(item => props.getKey(item.node.item) === target.nodeId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;

        const draggedItem = flatItems[draggedIndex];
        const targetItem = flatItems[targetIndex];
        
        // Remove dragged item and its children
        const draggedWithChildren = flatItems.filter(item => 
            props.getKey(item.node.item) === draggedId || isDescendant(props.getKey(item.node.item), draggedId)
        );
        
        const newFlatItems = flatItems.filter(item => 
            !draggedWithChildren.some(d => props.getKey(d.node.item) === props.getKey(item.node.item))
        );

        // Calculate new position and level
        let insertIndex = newFlatItems.findIndex(item => props.getKey(item.node.item) === target.nodeId);
        let newLevel = draggedItem.level;
        let newParentKey = draggedItem.parentKey;

        if (target.position === 'above') {
            // Insert before target at same level as target
            newLevel = targetItem.level;
            newParentKey = targetItem.parentKey;
        } else if (target.position === 'below') {
            // Insert after target's entire subtree at same level as target
            const targetKey = props.getKey(targetItem.node.item);
            const targetWithChildren = newFlatItems.filter(item => 
                props.getKey(item.node.item) === targetKey || isDescendant(props.getKey(item.node.item), targetKey)
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
            if (props.getKey(item.node.item) === draggedId) {
                item.parentKey = newParentKey;
            }
        });

        // Insert at new position
        newFlatItems.splice(insertIndex, 0, ...draggedWithChildren);

        // Update flatItems directly to trigger reactivity and animations
        isAnimating = true;
        flatItems = newFlatItems;
        props.onUpdate(rebuildTreeFromFlat(flatItems));
        setTimeout(() => (isAnimating = false), animationDuration);
    }

    function isDescendant(nodeKey: string, ancestorKey: string): boolean {
        let currentKey: string | null = nodeKey;
        const visited = new Set<string>();
        
        while (currentKey && !visited.has(currentKey)) {
            visited.add(currentKey);
            const item = flatItems.find(item => props.getKey(item.node.item) === currentKey);
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

        const currentIndex = flatItems.findIndex(item => props.getKey(item.node.item) === itemKey);
        if (currentIndex === -1) return;

        const currentItem = flatItems[currentIndex];

        if (event.key === "ArrowUp" && event.ctrlKey) {
            event.preventDefault();
            
            // Find the previous sibling at the same level
            let targetIndex = -1;
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (flatItems[i].level === currentItem.level) {
                    // Found a sibling - place above it
                    targetIndex = i;
                    break;
                } else if (flatItems[i].level < currentItem.level) {
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
            const itemWithChildren = flatItems.filter(item => 
                props.getKey(item.node.item) === itemKey || isDescendant(props.getKey(item.node.item), itemKey)
            );
            
            // Find the next sibling at the same level after this subtree
            let targetSiblingIndex = -1;
            const afterSubtreeIndex = currentIndex + itemWithChildren.length;
            
            // Look for the next item at the same level as the current item
            for (let i = afterSubtreeIndex; i < flatItems.length; i++) {
                if (flatItems[i].level === currentItem.level) {
                    // Found the next sibling
                    targetSiblingIndex = i;
                    break;
                } else if (flatItems[i].level < currentItem.level) {
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
                const previousItem = flatItems[currentIndex - 1];
                performKeyboardMove(itemKey, currentIndex - 1, 'child');
            }
        } else if (event.key === "ArrowLeft" && event.ctrlKey) {
            event.preventDefault();
            
            // Move this item up one level (make it sibling of its parent)
            if (currentItem.level > 0 && currentItem.parentKey) {
                const parentIndex = flatItems.findIndex(item => props.getKey(item.node.item) === currentItem.parentKey);
                if (parentIndex !== -1) {
                    performKeyboardMove(itemKey, parentIndex, 'below');
                }
            }
        }
    }

    function performKeyboardMove(draggedId: string, targetIndex: number, position: Position) {
        const targetItem = flatItems[targetIndex];
        if (!targetItem) return;

        const target = {
            nodeId: props.getKey(targetItem.node.item),
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

<div
    class="reorderable-tree reorderable-container-base"
    class:disabled={props.disabled}
    bind:this={containerRef}
    role="tree"
>
    {#each flatItems as { node, level }, index (props.getKey(node.item))}
        {@const nodeKey = props.getKey(node.item)}
        <div
            animate:flip={{ duration: animationDuration }}
            class="tree-item reorderable-item-base drop-indicator"
            class:focused={dragState.focusedItemKey === nodeKey}
            class:dragging={dragState.isDragging && (nodeKey === dragState.draggedItemKey || (dragState.draggedItemKey && isDescendant(nodeKey, dragState.draggedItemKey)))}
            class:drop-above={dropTarget?.nodeId === nodeKey && dropTarget.position === 'above'}
            class:drop-below={dropTarget?.nodeId === nodeKey && dropTarget.position === 'below'}
            class:drop-child={dropTarget?.nodeId === nodeKey && dropTarget.position === 'child'}
            class:has-handle={!!props.cssSelectorHandle}
            class:animating={isAnimating}
            data-tree-item
            data-item-key={nodeKey}
            role="treeitem"
            aria-expanded={node.children && node.children.length > 0 ? "true" : "false"}
            aria-selected={dragState.focusedItemKey === nodeKey}
            bind:this={itemRefs[nodeKey]}
            tabindex={props.disabled ? -1 : 0}
            style={`margin-left: calc(${defaultLevelPadding} * ${level}); --drop-line-padding: 0; --cursor-grab: ${props.cssSelectorHandle ? 'default' : 'grab'}; --cursor-grabbing: ${props.cssSelectorHandle ? 'default' : 'grabbing'}`}
            onmousedown={handleMouseDown}
            ontouchstart={handleTouchStart}
            onkeydown={handleKeyDown}
            onfocus={() => handleFocus(nodeKey)}
            onblur={handleBlur}
        >
            {@render props.itemSnippet(node.item, index)}
            
            {#if dragState.focusedItemKey === nodeKey && dragState.isKeyboardUser}
                <div class="keyboard-tip">
                    Ctrl + ↑ · ↓ · ← · → 
                </div>
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
    @import "../styles/reorderable.scss";

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
