<script module lang="ts">
    import type { Snippet } from "svelte";

    export interface Props<ItemType> {
        items: ItemType[];
        getKey: (item: ItemType) => string;
        itemSnippet: Snippet<[ItemType, number]>;
        onUpdate: (items: ItemType[]) => void;
        direction?: "horizontal" | "vertical";
        disabled?: boolean;
        cssSelectorHandle?: string; // CSS selector for drag handle, if not provided whole item is draggable
    }
</script>

<script lang="ts" generics="ItemType">
    import { flip } from "svelte/animate";

    const props: Props<ItemType> = $props();

    let containerRef: HTMLElement|undefined;
    let itemRefs: Record<string, HTMLElement> = $state({});

    const animationDuration = 100;
    let isAnimating = false;

    const mainState = $state({
        isKeyboardUser: true,
        focusedItemKey: null as string | null,
        items: props.items,
        dragClone: null as HTMLElement | null, // Visual clone that follows cursor (the "handle")
        currentPosition: { x: 0, y: 0 },
        draggedElementOffset: { x: 0, y: 0 },
        isDragging: false,
        draggedItemKey: null as string | null,
    });

    function updateDraggedElementPosition() {
        if (!mainState.isDragging || !mainState.dragClone) return;

        // Position the clone to follow the cursor
        const x =
            mainState.currentPosition.x - mainState.draggedElementOffset.x;
        const y =
            mainState.currentPosition.y - mainState.draggedElementOffset.y;

        mainState.dragClone.style.left = `${x}px`;
        mainState.dragClone.style.top = `${y}px`;
    }

    function getDraggedElementCenter() {
        const element = mainState.dragClone;
        if (!element) return { x: 0, y: 0 };
        return {
            y:
                element.getBoundingClientRect().top +
                element.getBoundingClientRect().height / 2,
            x:
                element.getBoundingClientRect().left +
                element.getBoundingClientRect().width / 2,
        };
    }

    function getHoveredItemKey() {
        for (const item of props.items) {
            const itemElement = itemRefs[props.getKey(item)];
            if (!itemElement) continue;
            const itemRect = itemElement.getBoundingClientRect();
            const handleCenter = getDraggedElementCenter();
            if (
                itemRect.top <= handleCenter.y &&
                itemRect.bottom >= handleCenter.y &&
                itemRect.left <= handleCenter.x &&
                itemRect.right >= handleCenter.x
            ) {
                return props.getKey(item);
            }
        }
        return null;
    }

    function createDragClone(
        originalElement: HTMLElement,
        clientX: number,
        clientY: number,
    ) {
        const rect = originalElement.getBoundingClientRect();

        // Create a clone of the element
        const clone = originalElement.cloneNode(true) as HTMLElement;
        clone.classList.add("drag-clone");

        // Position the clone
        const x = clientX - mainState.draggedElementOffset.x;
        const y = clientY - mainState.draggedElementOffset.y;

        clone.style.position = "fixed";
        clone.style.left = `${x}px`;
        clone.style.top = `${y}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.pointerEvents = "none";
        clone.style.zIndex = "1000";
        clone.style.transition = "none";

        document.body.appendChild(clone);
        mainState.dragClone = clone;
    }

    function getItemElement(target: HTMLElement): HTMLElement | null {
        return target.closest("[data-reorderable-item]") as HTMLElement;
    }

    function shouldAllowDrag(target: HTMLElement): boolean {
        if (props.disabled) return false;

        if (props.cssSelectorHandle) {
            return !!target.closest(props.cssSelectorHandle);
        }

        // Don't start drag on interactive elements unless they have the handle class
        const interactiveElements = [
            "input",
            "textarea",
            "select",
            "button",
            "a",
        ];
        if (interactiveElements.includes(target.tagName.toLowerCase())) {
            return false;
        }

        return true;
    }

    function getItemKeyFromElement(element: HTMLElement): string | null {
        const itemKey = element.getAttribute("data-item-key");
        return itemKey || null;
    }

    function handleFocus(itemKey: string) {
        mainState.focusedItemKey = itemKey;
    }

    function handleBlur() {
        mainState.focusedItemKey = null;
    }

    function handleMouseDown(event: MouseEvent) {
        mainState.isKeyboardUser = false;
        const target = event.target as HTMLElement;
        if (!shouldAllowDrag(target)) return;

        const itemElement = getItemElement(target);
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        event.preventDefault();

        mainState.isDragging = true;
        mainState.draggedItemKey = itemKey;

        mainState.currentPosition = { x: event.clientX, y: event.clientY };

        // Calculate offset from cursor to element origin
        const rect = itemElement.getBoundingClientRect();
        mainState.draggedElementOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };

        // Create visual clone (the "handle")
        createDragClone(itemElement, event.clientX, event.clientY);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    function handleTouchMove(event: TouchEvent) {
        if (!mainState.isDragging) return;

        event.preventDefault();

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            mainState.currentPosition = { x: touch.clientX, y: touch.clientY };
            updateDraggedElementPosition();

            const hoveredItemKey = getHoveredItemKey();
            if (
                hoveredItemKey !== mainState.draggedItemKey &&
                hoveredItemKey !== null &&
                mainState.draggedItemKey !== null
            ) {
                moveItem({
                    itemKeyToMoveFrom: mainState.draggedItemKey,
                    itemKeyToMoveTo: hoveredItemKey,
                });
            }
        }
    }

    function finalizeDrop() {
        // Clean up drag clone
        if (mainState.dragClone) {
            document.body.removeChild(mainState.dragClone);
            mainState.dragClone = null;
        }

        // Reset state
        mainState.isDragging = false;
        mainState.draggedItemKey = null;
    }

    function handleTouchEnd() {
        if (!mainState.isDragging) return;

        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.removeEventListener("touchcancel", handleTouchEnd);

        finalizeDrop();
    }

    function handleTouchStart(event: TouchEvent) {
        mainState.isKeyboardUser = false;
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        const target = touch.target as HTMLElement;
        if (!shouldAllowDrag(target)) return;

        const itemElement = getItemElement(target);
        if (!itemElement) return;

        const itemKey = getItemKeyFromElement(itemElement);
        if (!itemKey) return;

        mainState.isDragging = true;
        mainState.draggedItemKey = itemKey;

        mainState.currentPosition = { x: touch.clientX, y: touch.clientY };

        const rect = itemElement.getBoundingClientRect();
        mainState.draggedElementOffset = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };

        createDragClone(itemElement, touch.clientX, touch.clientY);

        document.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", handleTouchEnd);
        document.addEventListener("touchcancel", handleTouchEnd);
    }

    function handleMouseMove(event: MouseEvent) {
        if (!mainState.isDragging) return;

        mainState.currentPosition = { x: event.clientX, y: event.clientY };
        updateDraggedElementPosition();
        const hoveredItemKey = getHoveredItemKey();

        if (
            hoveredItemKey !== mainState.draggedItemKey &&
            hoveredItemKey !== null &&
            mainState.draggedItemKey !== null
        ) {
            moveItem({
                itemKeyToMoveFrom: mainState.draggedItemKey,
                itemKeyToMoveTo: hoveredItemKey,
            });
        }
        // checkForSwap();
    }

    function moveItem(p: {
        itemKeyToMoveFrom: string;
        itemKeyToMoveTo: string;
    }) {
        if (isAnimating) return;

        // console.log('moveItem', p.itemKeyToMoveFrom, '=>', p.itemKeyToMoveTo)
        // move
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
        if (!mainState.isDragging) return;

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        finalizeDrop();
    }

    function handleKeyDown(event: KeyboardEvent) {
        mainState.isKeyboardUser = true;
        if (props.disabled) return;

        const target = event.target as HTMLElement;
        const itemElement = getItemElement(target);
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
    class="reorderable-container"
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
            class="reorderable-item"
            class:focused={mainState.focusedItemKey === props.getKey(item)}
            class:space={mainState.isDragging &&
                props.getKey(item) === mainState.draggedItemKey}
            data-reorderable-item
            data-item-key={props.getKey(item)}
            role="button"
            aria-grabbed={mainState.draggedItemKey === props.getKey(item)
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
            {@render props.itemSnippet(item, index)}
            {#if mainState.focusedItemKey === props.getKey(item) && mainState.isKeyboardUser}
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
    .reorderable-container {
        display: flex;
        gap: 0.5rem;
        position: relative;

        &.vertical {
            flex-direction: column;
        }

        &.horizontal {
            flex-direction: row;
            flex-wrap: wrap;
        }

        &.disabled {
            pointer-events: none;
            opacity: 0.6;
        }
    }

    .reorderable-container.has-handle .reorderable-item {
        cursor: auto;

        &:active {
            cursor: auto;
        }
    }

    .reorderable-item {
        position: relative;
        cursor: grab;
        outline: none;
        /* transition is now applied dynamically in JS */

        &:focus {
            outline: 2px solid #007acc;
            outline-offset: 2px;
            border-radius: 3px;
        }

        &.space {
            visibility: hidden;
        }

        &.focused {
            z-index: 1;
        }

        // Handle drag states
        &:active {
            cursor: grabbing;
        }
    }

    .keyboard-tip {
        position: absolute;
        bottom: -1.75rem;
        left: 50%;
        transform: translateX(-50%);
        // background: #222;
        background: #016DB6;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        z-index: 10;
        white-space: nowrap;
        pointer-events: none;
    }

    // Drag clone styles
    :global(.drag-clone) {
        opacity: 0.9;
        transform: scale(1.05);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        cursor: grabbing;
    }

    // Ghost styles (can be customized via props)
    :global(.reorderable-ghost) {
        opacity: 0.4;
        background: #f0f0f0;
    }

    // Responsive touch support
    @media (hover: none) and (pointer: coarse) {
        .reorderable-item {
            cursor: grab;

            &:active {
                cursor: grabbing;
            }
        }
    }
</style>
