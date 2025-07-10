export interface DragState {
    isKeyboardUser: boolean;
    focusedItemKey?: string | null;
    dragClone?: HTMLElement | null;
    currentPosition: { x: number; y: number };
    draggedElementOffset: { x: number; y: number };
    isDragging: boolean;
    draggedItemKey?: string | null;
}

export interface DragConfig {
    disabled?: boolean;
    cssSelectorHandle?: string;
    animationDuration?: number;
}

/**
 * Creates a visual clone of an element for drag operations
 */
export function createDragClone(
    originalElement: HTMLElement,
    clientX: number,
    clientY: number,
    offset: { x: number; y: number }
): HTMLElement {
    const rect = originalElement.getBoundingClientRect();
    const clone = originalElement.cloneNode(true) as HTMLElement;
    clone.classList.add("drag-clone");

    // Get the computed margin-left to preserve tree indentation
    // const computedStyle = window.getComputedStyle(originalElement);
    // const marginLeft = computedStyle.marginLeft;

    const x = clientX - offset.x;
    const y = clientY - offset.y;

    // console.log("clone", "x,y", x, y, "offset", offset);
    // console.log("marginLeft", marginLeft);

    clone.style.position = "fixed";
    clone.style.left = `${x}px`;
    clone.style.top = `${y}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    // clone.style.marginLeft = marginLeft; // Preserve the original margin-left
    clone.style.margin = "0px";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "1000";
    clone.style.transition = "none";

    document.body.appendChild(clone);
    return clone;
}

/**
 * Updates the position of a drag clone element
 */
export function updateDragClonePosition(
    dragClone: HTMLElement,
    currentPosition: { x: number; y: number },
    offset: { x: number; y: number }
): void {
    const x = currentPosition.x - offset.x;
    const y = currentPosition.y - offset.y;
    dragClone.style.left = `${x}px`;
    dragClone.style.top = `${y}px`;
}

/**
 * Gets the center point of a drag clone element
 */
export function getDragCloneCenter(dragClone: HTMLElement): { x: number; y: number } {
    const rect = dragClone.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

/**
 * Finds the closest item element from a target
 */
export function getItemElement(
    target: HTMLElement,
    itemSelector: string = "[data-reorderable-item], [data-tree-item]"
): HTMLElement | null {
    return target.closest(itemSelector) as HTMLElement;
}

/**
 * Extracts item key from an element's data attribute
 */
export function getItemKeyFromElement(element: HTMLElement): string | null {
    return element.getAttribute("data-item-key");
}

/**
 * Determines if a drag operation should be allowed based on target and config
 */
export function shouldAllowDrag(target: HTMLElement, config: DragConfig): boolean {
    if (config.disabled) return false;

    if (config.cssSelectorHandle) {
        return !!target.closest(config.cssSelectorHandle);
    }

    // Don't start drag on interactive elements unless they have the handle class
    const interactiveElements = ["input", "textarea", "select", "button", "a"];
    if (interactiveElements.includes(target.tagName.toLowerCase())) {
        return false;
    }

    return true;
}

/**
 * Calculates the offset from cursor to element origin
 */
export function calculateDragOffset(
    clientX: number,
    clientY: number,
    element: HTMLElement
): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
}

/**
 * Cleans up drag operation by removing clone and resetting state
 */
export function finalizeDragOperation(dragState: DragState): void {
    if (dragState.dragClone) {
        document.body.removeChild(dragState.dragClone);
        dragState.dragClone = null;
    }
    dragState.isDragging = false;
    dragState.draggedItemKey = null;
}

/**
 * Common focus management functions
 */
export const focusManager = {
    handleFocus: (itemKey: string, state: DragState) => {
        state.focusedItemKey = itemKey;
    },
    handleBlur: (state: DragState) => {
        state.focusedItemKey = null;
    },
    setKeyboardUser: (state: DragState, isKeyboard: boolean) => {
        state.isKeyboardUser = isKeyboard;
    }
};

/**
 * Utility to check if an element is within the bounds of another element
 */
export function isPointInElement(
    point: { x: number; y: number },
    element: HTMLElement
): boolean {
    const rect = element.getBoundingClientRect();
    return (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
    );
}

/**
 * Debounce utility for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
} 