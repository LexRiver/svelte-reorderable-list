<script lang="ts">
    import ReorderableList from '$lib/components/ReorderableList.svelte';
    import ReorderableTree, { type TreeNode } from '$lib/components/ReorderableTree.svelte';

    // Simple string array example
    let simpleItems = $state(['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry']);

    // Complex object example
    interface TodoItem {
        id: string;
        text: string;
        completed: boolean;
        priority: 'low' | 'medium' | 'high';
    }

    let todoItems = $state<TodoItem[]>([
        { id: '1', text: 'Learn Svelte 5', completed: false, priority: 'high' },
        { id: '2', text: 'Build reorderable component', completed: true, priority: 'medium' },
        { id: '3', text: 'Write documentation', completed: false, priority: 'low' },
        { id: '4', text: 'Add tests', completed: false, priority: 'medium' },
        { id: '5', text: 'Deploy to production', completed: false, priority: 'high' }
    ]);

    // Horizontal layout example
    let horizontalItems = $state(['🍎', '🍌', '🍒', '🥝', '🍓', '🥭', '🍊', '🍇']);

    // Add tree example
    interface Category {
        categoryId: string;
        name: string;
    }

    // Small tree with drag handles
    interface Project {
        projectId: string;
        name: string;
        status: 'active' | 'completed' | 'on-hold';
        completed: boolean;
    }

    let categories = $state<TreeNode<Category>[]>([
        {
            item: { categoryId: '1', name: 'Fruits' },
            children: [
                { 
                    item: { categoryId: '2', name: 'Apples' },
                    children: [
                        { item: { categoryId: '21', name: 'Red Apples' } },
                        { item: { categoryId: '22', name: 'Green Apples' } }
                    ]
                },
                { 
                    item: { categoryId: '3', name: 'Citrus' },
                    children: [
                        { item: { categoryId: '31', name: 'Oranges' } },
                        { item: { categoryId: '32', name: 'Lemons' } },
                        { item: { categoryId: '33', name: 'Limes' } }
                    ]
                },
                { item: { categoryId: '4', name: 'Berries' } },
                { item: { categoryId: '5', name: 'Tropical Fruits' } }
            ]
        },
        {
            item: { categoryId: '6', name: 'Vegetables' },
            children: [
                { 
                    item: { categoryId: '7', name: 'Leafy Greens' },
                    children: [
                        { item: { categoryId: '71', name: 'Spinach' } },
                        { item: { categoryId: '72', name: 'Lettuce' } },
                        { item: { categoryId: '73', name: 'Kale' } }
                    ]
                },
                { 
                    item: { categoryId: '8', name: 'Root Vegetables' },
                    children: [
                        { item: { categoryId: '81', name: 'Carrots' } },
                        { item: { categoryId: '82', name: 'Potatoes' } },
                        { item: { categoryId: '83', name: 'Onions' } }
                    ]
                },
                { item: { categoryId: '9', name: 'Bell Peppers' } },
                { item: { categoryId: '10', name: 'Tomatoes' } }
            ]
        },
        {
            item: { categoryId: '11', name: 'Grains' },
            children: [
                { item: { categoryId: '12', name: 'Rice' } },
                { item: { categoryId: '13', name: 'Wheat' } },
                { item: { categoryId: '14', name: 'Quinoa' } },
                { item: { categoryId: '15', name: 'Oats' } }
            ]
        },
        {
            item: { categoryId: '16', name: 'Dairy' },
            children: [
                { item: { categoryId: '17', name: 'Milk' } },
                { 
                    item: { categoryId: '18', name: 'Cheese' },
                    children: [
                        { item: { categoryId: '181', name: 'Cheddar' } },
                        { item: { categoryId: '182', name: 'Mozzarella' } },
                        { item: { categoryId: '183', name: 'Parmesan' } }
                    ]
                },
                { item: { categoryId: '19', name: 'Yogurt' } }
            ]
        }
    ]);

    let projects = $state<TreeNode<Project>[]>([
        {
            item: { projectId: '1', name: 'Website Redesign', status: 'active', completed: false },
            children: [
                { item: { projectId: '11', name: 'UI Design', status: 'completed', completed: true } },
                { item: { projectId: '12', name: 'Frontend Development', status: 'active', completed: false } },
                { item: { projectId: '13', name: 'Testing', status: 'on-hold', completed: false } }
            ]
        },
        {
            item: { projectId: '2', name: 'Mobile App', status: 'on-hold', completed: false },
            children: [
                { item: { projectId: '21', name: 'Research', status: 'completed', completed: true } },
                { item: { projectId: '22', name: 'Prototyping', status: 'on-hold', completed: false } }
            ]
        },
        {
            item: { projectId: '3', name: 'Documentation', status: 'active', completed: false }
        }
    ]);

    function handleSimpleUpdate(newItems: string[]) {
        simpleItems = newItems;
        console.log('Simple items updated:', newItems);
    }

    function handleTodoUpdate(newItems: TodoItem[]) {
        todoItems = newItems;
        console.log('Todo items updated:', newItems);
    }

    function handleHorizontalUpdate(newItems: string[]) {
        horizontalItems = newItems;
        console.log('Horizontal items updated:', newItems);
    }

    function handleCategoryUpdate(newCategories: TreeNode<Category>[]) {
        categories = newCategories;
        console.log('Categories updated:', newCategories);
    }

    function handleProjectUpdate(newProjects: TreeNode<Project>[]) {
        projects = newProjects;
        console.log('Projects updated:', newProjects);
    }

    function toggleTodoCompleted(todo: TodoItem) {
        todo.completed = !todo.completed;
    }

    function getPriorityColor(priority: 'low' | 'medium' | 'high') {
        switch (priority) {
            case 'high': return '#ff4444';
            case 'medium': return '#ffaa00';
            case 'low': return '#44ff44';
        }
    }

    function getStatusColor(status: 'active' | 'completed' | 'on-hold') {
        switch (status) {
            case 'active': return '#2196F3';
            case 'completed': return '#4CAF50';
            case 'on-hold': return '#FF9800';
        }
    }

    function toggleProjectCompleted(project: Project) {
        project.completed = !project.completed;
    }
</script>

<div class="demo-container">
    <h1>Reorderable List Component Demo</h1>
    
    <section class="demo-section">
        <h2>Simple String List</h2>
        <p>Drag items to reorder them. Uses overlap-based swapping: the dragged item must cover at least 80% of another item's area to trigger a swap.</p>

        <ReorderableList
            items={simpleItems}
            getKey={(item) => item}
            onUpdate={handleSimpleUpdate}
            direction="vertical"
        >
            {#snippet itemSnippet(item, index)}
                <div class="simple-item">
                    <span class="item-index">{index + 1}.</span>
                    <span class="item-text">{item}</span>
                </div>
            {/snippet}
        </ReorderableList>
    </section>

    <section class="demo-section">
        <h2>Todo List with Complex Objects</h2>
        <p>A more complex example with interactive elements inside draggable items.</p>
        
        <ReorderableList
            items={todoItems}
            getKey={(item) => item.id}
            onUpdate={handleTodoUpdate}
            direction="vertical"
            cssSelectorHandle=".drag-handle"
        >
            {#snippet itemSnippet(todo, index)}
                <div class="todo-item" class:completed={todo.completed}>
                    <div class="drag-handle">
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M9 5h2v2H9zm0 8h2v2H9zm0-4h2v2H9zm0 8h2v2H9zm4-12h2v2h-2zm0 8h2v2h-2zm0-4h2v2h-2zm0 8h2v2h-2z"
                            />
                        </svg>
                    </div>
                    
                    <input 
                        type="checkbox" 
                        checked={todo.completed}
                        onchange={() => toggleTodoCompleted(todo)}
                    />
                    
                    <span class="todo-text" class:completed={todo.completed}>
                        {todo.text}
                    </span>
                    
                    <div 
                        class="priority-badge" 
                        style="background-color: {getPriorityColor(todo.priority)}"
                    >
                        {todo.priority}
                    </div>
                </div>
            {/snippet}
        </ReorderableList>
    </section>

    <section class="demo-section">
        <h2>Horizontal Layout</h2>
        <p>Emoji fruits in a horizontal arrangement.</p>


        
        <ReorderableList
            items={horizontalItems}
            getKey={(item) => item}
            onUpdate={handleHorizontalUpdate}
            direction="horizontal"
        >
            {#snippet itemSnippet(item, index)}
                <div class="emoji-item">
                    {item}
                </div>
            {/snippet}
        </ReorderableList>

    </section>


    <section class="demo-section">
        <h2>Disabled State</h2>
        <p>This list is disabled and cannot be reordered.</p>
        
        <ReorderableList
            items={['Item 1', 'Item 2', 'Item 3']}
            getKey={(item) => item}
            onUpdate={() => {}}
            direction="vertical"
            disabled={true}
        >
            {#snippet itemSnippet(item, index)}
                <div class="simple-item disabled">
                    <span class="item-index">{index + 1}.</span>
                    <span class="item-text">{item}</span>
                </div>
            {/snippet}
        </ReorderableList>
    </section>

    <section class="demo-section">
        <h2>ReorderableTree Component</h2>
        <p>Drag items to reorder or nest them under other categories.</p>
        
        <ReorderableTree
            nodes={categories}
            getKey={(item) => item.categoryId}
            onUpdate={handleCategoryUpdate}
            levelPadding="20px"
        >
            {#snippet itemSnippet(category, index)}
                <div class="category-item">
                    <span class="category-name">{category.name}</span>
                </div>
            {/snippet}
        </ReorderableTree>
    </section>

    <section class="demo-section">
        <h2>ReorderableTree with Drag Handles</h2>
        <p>A project hierarchy with drag handles and status indicators.</p>
        
        <ReorderableTree
            nodes={projects}
            getKey={(item) => item.projectId}
            onUpdate={handleProjectUpdate}
            levelPadding="25px"
            cssSelectorHandle=".drag-handle"
        >
            {#snippet itemSnippet(project, index)}
                <div class="project-item">
                    <div class="drag-handle">
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M9 5h2v2H9zm0 8h2v2H9zm0-4h2v2H9zm0 8h2v2H9zm4-12h2v2h-2zm0 8h2v2h-2zm0-4h2v2h-2zm0 8h2v2h-2z"
                            />
                        </svg>
                    </div>
                    
                    <input 
                        type="checkbox" 
                        checked={project.completed}
                                                 onchange={() => toggleProjectCompleted(project)}
                    />
                    
                    <span class="project-name" class:completed={project.completed}>{project.name}</span>
                    
                    <div 
                        class="status-badge" 
                        style="background-color: {getStatusColor(project.status)}"
                    >
                        {project.status}
                    </div>
                </div>
            {/snippet}
        </ReorderableTree>
    </section>
    
</div>

<style lang="scss">
    .demo-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .demo-section {
        margin-bottom: 3rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #fafafa;

        h2 {
            color: #333;
        }

        p {
            color: #666;
            margin-bottom: 1rem;
        }
    }

    .simple-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        &.disabled {
            background: #f5f5f5;
            color: #999;
        }

        .item-index {
            font-weight: bold;
            margin-right: 0.5rem;
            color: #666;
        }

        .item-text {
            flex: 1;
        }

        .threshold-info {
            font-size: 0.75rem;
            color: #666;
            background: #f0f0f0;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            margin-left: 0.5rem;
        }

        &.stable {
            border-left: 4px solid #4CAF50;
            
            .threshold-info {
                background: #E8F5E8;
                color: #2E7D32;
            }
        }

        &.sensitive {
            border-left: 4px solid #FF9800;
            
            .threshold-info {
                background: #FFF3E0;
                color: #F57C00;
            }
        }
    }

    .todo-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        gap: 0.75rem;

        &.completed {
            background: #f8f9fa;
        }

        .drag-handle {
            color: #999;
            cursor: grab;
            padding: 0.25rem;

            &:hover {
                color: #666;
            }

            &:active {
                cursor: grabbing;
            }
        }

        .todo-text {
            flex: 1;
            font-size: 0.95rem;

            &.completed {
                text-decoration: line-through;
                color: #999;
            }
        }

        .priority-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
        }
    }

    .emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: grab;

        &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &:active {
            cursor: grabbing;
        }
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 2rem;
    }

    // Add tree-specific styles
    .category-item {
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        cursor: grab;
        
        &:active {
            cursor: grabbing;
        }
    }

    .category-name {
        font-weight: bold;
    }

    .project-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        gap: 0.75rem;

        .drag-handle {
            color: #999;
            cursor: grab;
            padding: 0.25rem;

            &:hover {
                color: #666;
            }

            &:active {
                cursor: grabbing;
            }
        }

        .project-name {
            flex: 1;
            font-weight: 500;
            
            &.completed {
                text-decoration: line-through;
                color: #999;
            }
        }

        .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: bold;
            color: white;
            text-transform: capitalize;
        }
    }
</style> 