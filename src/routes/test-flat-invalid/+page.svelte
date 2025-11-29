<script lang="ts">
    import ReorderableTree, { type FlatTreeNode } from '$lib/components/ReorderableTree.svelte';

    interface NavItem {
        id: number;
        itemType: string;
        name: string;
        parentId: number;
        sortId: number;
        url: string;
        visibleForDevice: string[];
        visibleForUserType: string[];
    }

    let flatNodes = $state<FlatTreeNode<NavItem>[]>([
        {"item":{"id":3,"itemType":"url","name":"HOME","parentId":0,"sortId":1,"url":"/","visibleForDevice":["desktop"],"visibleForUserType":["admin","retail","wholesale","sp","anonymous"]},"key":"3"},
        {"item":{"id":20,"itemType":"url","name":"PERSONAL ACCOUNT","parentId":14,"sortId":2,"url":"/profile","visibleForDevice":["desktop","mobile"],"visibleForUserType":["admin","retail","wholesale","sp"]},"key":"20","parentKey":"3"},
        {"item":{"id":23,"itemType":"url","name":"REGISTRATION","parentId":9,"sortId":3,"url":"/register","visibleForDevice":["desktop"],"visibleForUserType":["anonymous"]},"key":"23","parentKey":"9"},
        {"item":{"id":1,"itemType":"url","name":"FAQ","parentId":9,"sortId":4,"url":"/for-sellers/faq","visibleForDevice":["desktop"],"visibleForUserType":["admin","retail","wholesale","sp","anonymous"]},"key":"1","parentKey":"9"},
        {"item":{"id":15,"itemType":"url","name":"FREQUENTLY ASKED QUESTIONS","parentId":1,"sortId":5,"url":"/for-sellers/faq","visibleForDevice":["desktop"],"visibleForUserType":["admin","retail","wholesale","sp","anonymous","smm"]},"key":"15","parentKey":"20"},
        {"item":{"id":29,"itemType":"search","name":"Search","parentId":0,"sortId":26,"url":"/about","visibleForDevice":["desktop"],"visibleForUserType":["admin","anonymous","retail","smm","sp","wholesale"]},"key":"29"},
    ]);

    function handleUpdate(newFlatNodes: FlatTreeNode<NavItem>[]) {
        flatNodes = newFlatNodes;
        console.log('Nav flat nodes updated:', newFlatNodes);
    }
</script>

<div class="demo-container">
    <h1>Flat Nav Tree Test</h1>

    <ReorderableTree
        flatNodes={flatNodes}
        onUpdate={handleUpdate}
        levelPadding="20px"
    >
        {#snippet item(navItem, index)}
            <div class="nav-item">
                <span class="nav-name">{navItem.name}</span>
                <span class="nav-meta">#{index + 1} · {navItem.itemType} · {navItem.url} · id:{navItem.id} · parentId:{navItem.parentId}</span>
            </div>
        {/snippet}
    </ReorderableTree>
</div>

<style lang="scss">
    .demo-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
    }

    .nav-item {
        display: flex;
        flex-direction: column;
        padding: 0.75rem 1rem;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .nav-name {
        font-weight: 600;
    }

    .nav-meta {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.25rem;
    }
</style>

