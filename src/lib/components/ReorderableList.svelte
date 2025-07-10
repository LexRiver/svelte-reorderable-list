<script module lang="ts">
    import type { Snippet } from "svelte";

    export interface Props<ItemType> {
        items: ItemType[];
        getKey: (item: ItemType) => string;
        item: Snippet<[ItemType, number]>;
        onUpdate: (items: ItemType[]) => void;
        direction?: "horizontal" | "vertical";
        disabled?: boolean;
        cssSelectorHandle?: string; // CSS selector for drag handle, if not provided whole item is draggable
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
        isPointInElement,
        shouldAllowDrag,
        updateDragClonePosition
    } from "../drag-utils.js";

    const props: Props<ItemType> = $props();

    let containerRef: HTMLElement|undefined;
    let itemRefs: Record<string, HTMLElement> = $state({});

    const animationDuration = 100;
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

    const dragConfig: DragConfig = $derived({
        disabled: props.disabled,
        cssSelectorHandle: props.cssSelectorHandle,
        animationDuration
    });

    const mainState = $state({
        items: props.items,
    });

    function updateDraggedElementPosition() {
        if (!dragState.isDragging || !dragState.dragClone) return;
        updateDragClonePosition(dragState.dragClone, dragState.currentPosition, dragState.draggedElementOffset);
    }

    function getHoveredItemKey() {
        if (!dragState.dragClone) return null;
        
        const handleCenter = getDragCloneCenter(dragState.dragClone);
        
        for (const item of props.items) {
            const itemElement = itemRefs[props.getKey(item)];
            if (!itemElement) continue;
            
            if (isPointInElement(handleCenter, itemElement)) {
                return props.getKey(item);
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

        const itemElement = getItemElement(target, "[data-reorderable-item]");
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        event.preventDefault();

        dragState.isDragging = true;
        dragState.draggedItemKey = itemKey;
        dragState.currentPosition = { x: event.clientX, y: event.clientY };
        dragState.draggedElementOffset = calculateDragOffset(event.clientX, event.clientY, itemElement);

        // Create visual clone using shared function
        dragState.dragClone = createDragClone(
            itemElement, 
            event.clientX, 
            event.clientY, 
            dragState.draggedElementOffset
        );

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    function handleTouchMove(event: TouchEvent) {
        if (!dragState.isDragging) return;

        event.preventDefault();

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            dragState.currentPosition = { x: touch.clientX, y: touch.clientY };
            updateDraggedElementPosition();

            const hoveredItemKey = getHoveredItemKey();
            if (
                hoveredItemKey !== dragState.draggedItemKey &&
                hoveredItemKey !== null &&
                dragState.draggedItemKey !== null
            ) {
                moveItem({
                    itemKeyToMoveFrom: dragState.draggedItemKey!,
                    itemKeyToMoveTo: hoveredItemKey,
                });
            }
        }
    }

    function finalizeDrop() {
        finalizeDragOperation(dragState);
    }

    function handleTouchEnd() {
        if (!dragState.isDragging) return;

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);

        finalizeDrop();
    }

    function handleTouchStart(event: TouchEvent) {
        focusManager.setKeyboardUser(dragState, false);
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const target = touch.target as HTMLElement;
        if (!shouldAllowDrag(target, dragConfig)) return;

        const itemElement = getItemElement(target, "[data-reorderable-item]");
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

        document.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!dragState.isDragging) return;

        dragState.currentPosition = { x: event.clientX, y: event.clientY };
        updateDraggedElementPosition();
        const hoveredItemKey = getHoveredItemKey();

        if (
            hoveredItemKey !== dragState.draggedItemKey &&
            hoveredItemKey !== null &&
            dragState.draggedItemKey !== null
        ) {
            moveItem({
                itemKeyToMoveFrom: dragState.draggedItemKey!,
                itemKeyToMoveTo: hoveredItemKey,
            });
        }
    }

    function moveItem(p: {
        itemKeyToMoveFrom: string;
        itemKeyToMoveTo: string;
    }) {
        if (isAnimating) return;

        const itemToMoveFrom = mainState.items.find(
            (item) => props.getKey(item) === p.itemKeyToMoveFrom,
        );
        const itemToMoveTo = mainState.items.find(
            (item) => props.getKey(item) === p.itemKeyToMoveTo,
        );
        if (!itemToMoveFrom || !itemToMoveTo) return;
        const indexToMoveFrom = mainState.items.indexOf(itemToMoveFrom);
        const indexToMoveTo = mainState.items.indexOf(itemToMoveTo);

        isAnimating = true;
        mainState.items.splice(indexToMoveFrom, 1);
        mainState.items.splice(indexToMoveTo, 0, itemToMoveFrom);
        setTimeout(() => (isAnimating = false), animationDuration);
    }

    function handleMouseUp(event: MouseEvent) {
        if (!dragState.isDragging) return;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        finalizeDrop();
    }

    function handleKeyDown(event: KeyboardEvent) {
        focusManager.setKeyboardUser(dragState, true);
        if (props.disabled) return;

        const target = event.target as HTMLElement;
        const itemElement = getItemElement(target, "[data-reorderable-item]");
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        const currentIndex = mainState.items.findIndex(
            (item) => props.getKey(item) === itemKey,
        );
        if (currentIndex === -1) return;

        let newIndex = currentIndex;

        const isVertical =
            props.direction === "vertical" || props.direction === undefined;

        if (isVertical) {
            if (event.key === "ArrowUp" && event.ctrlKey) {
                event.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
            } else if (event.key === "ArrowDown" && event.ctrlKey) {
                event.preventDefault();
                newIndex = Math.min(
                    mainState.items.length - 1,
                    currentIndex + 1,
                );
            }
        } else {
            // horizontal
            if (event.key === "ArrowLeft" && event.ctrlKey) {
                event.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
            } else if (event.key === "ArrowRight" && event.ctrlKey) {
                event.preventDefault();
                newIndex = Math.min(
                    mainState.items.length - 1,
                    currentIndex + 1,
                );
            }
        }

        if (newIndex !== currentIndex) {
            const newItems = [...mainState.items];
            const [movedItem] = newItems.splice(currentIndex, 1);
            newItems.splice(newIndex, 0, movedItem);
            mainState.items = newItems;
            props.onUpdate(newItems);

            setTimeout(() => {
                const movedElement = itemRefs[props.getKey(movedItem)];
                if (movedElement) {
                    movedElement.focus();
                }
            }, 0);
        }
    }
</script>

<div
    class="reorderable-container reorderable-container-base"
    class:vertical={props.direction === "vertical"}
    class:horizontal={props.direction === "horizontal"}
    class:disabled={props.disabled}
    class:has-handle={!!props.cssSelectorHandle}
    bind:this={containerRef}
    role="list"
>
    {#each mainState.items as item, index (props.getKey(item))}
        <div
            animate:flip={{ duration: animationDuration }}
            class="reorderable-item reorderable-item-base"
            class:focused={dragState.focusedItemKey === props.getKey(item)}
            class:dragging={dragState.isDragging &&
                props.getKey(item) === dragState.draggedItemKey}
            class:has-handle={!!props.cssSelectorHandle}
            class:animating={isAnimating}
            data-reorderable-item
            data-item-key={props.getKey(item)}
            role="button"
            aria-grabbed={dragState.draggedItemKey === props.getKey(item)
                ? "true"
                : "false"}
            bind:this={itemRefs[props.getKey(item)]}
            tabindex={props.disabled ? -1 : 0}
            onmousedown={handleMouseDown}
            ontouchstart={handleTouchStart}
            onkeydown={handleKeyDown}
            onfocus={() => handleFocus(props.getKey(item))}
            onblur={handleBlur}
        >
            {@render props.item(item, index)}
            {#if dragState.focusedItemKey === props.getKey(item) && dragState.isKeyboardUser}
                <div class="keyboard-tip">
                    Ctrl + {props.direction === "vertical" ||
                    props.direction === undefined
                        ? "↑ · ↓"
                        : "← · →"}
                </div>
            {/if}
        </div>
    {/each}
</div>

<style lang="scss">
    @use "../styles/reorderable.scss";

</style>
