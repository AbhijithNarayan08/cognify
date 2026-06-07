import os

def patch_reanimated():
    proxy_path = "/Users/abhijith.narayan/Downloads/cognify/node_modules/react-native-reanimated/Common/cpp/reanimated/LayoutAnimations/LayoutAnimationsProxy.cpp"
    utils_path = "/Users/abhijith.narayan/Downloads/cognify/node_modules/react-native-reanimated/Common/cpp/reanimated/LayoutAnimations/LayoutAnimationsUtils.cpp"

    print("Patching LayoutAnimationsUtils.cpp...")
    with open(utils_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace line 34: tag != mutation.parentShadowView.tag -> tag != mutation.parentTag
    content = content.replace("tag != mutation.parentShadowView.tag", "tag != mutation.parentTag")
    
    with open(utils_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched LayoutAnimationsUtils.cpp!")

    print("Patching LayoutAnimationsProxy.cpp...")
    with open(proxy_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. auto parentTag = mutation.parentShadowView.tag; -> auto parentTag = mutation.parentTag;
    content = content.replace(
        "auto parentTag = mutation.parentShadowView.tag;",
        "auto parentTag = mutation.parentTag;"
    )

    # 2. nodeForTag_.contains(mutation.parentShadowView.tag) -> nodeForTag_.contains(mutation.parentTag)
    content = content.replace(
        "nodeForTag_.contains(mutation.parentShadowView.tag)",
        "nodeForTag_.contains(mutation.parentTag)"
    )

    # 3. nodeForTag_[mutation.parentShadowView.tag]->applyMutationToIndices(mutation);
    # -> nodeForTag_[mutation.parentTag]->applyMutationToIndices(mutation);
    content = content.replace(
        "nodeForTag_[mutation.parentShadowView.tag]->applyMutationToIndices(",
        "nodeForTag_[mutation.parentTag]->applyMutationToIndices("
    )

    # 4. InsertMutation(mutation.parentShadowView, ...
    # -> InsertMutation(mutation.parentTag, ...
    content = content.replace(
        "ShadowViewMutation::InsertMutation(\n                  mutation.parentShadowView,",
        "ShadowViewMutation::InsertMutation(\n                  mutation.parentTag,"
    )
    content = content.replace(
        "ShadowViewMutation::InsertMutation(\n              mutation.parentShadowView,",
        "ShadowViewMutation::InsertMutation(\n              mutation.parentTag,"
    )

    # 5. UpdateMutation(mutation.newChildShadowView, *newView, mutation.parentShadowView)
    # -> UpdateMutation(mutation.newChildShadowView, *newView, mutation.parentTag)
    content = content.replace(
        "ShadowViewMutation::UpdateMutation(\n            mutation.newChildShadowView, *newView, mutation.parentShadowView)",
        "ShadowViewMutation::UpdateMutation(\n            mutation.newChildShadowView, *newView, mutation.parentTag)"
    )

    # 6. nodeForTag_.contains(mutation.parentShadowView.tag) -> nodeForTag_.contains(mutation.parentTag)
    # 7. nodeForTag_[mutation.parentShadowView.tag] -> nodeForTag_[mutation.parentTag]
    content = content.replace(
        "!nodeForTag_.contains(mutation.parentShadowView.tag)",
        "!nodeForTag_.contains(mutation.parentTag)"
    )
    content = content.replace(
        "nodeForTag_[mutation.parentShadowView.tag]",
        "nodeForTag_[mutation.parentTag]"
    )

    # 8. << mutation.parentShadowView.tag << -> << mutation.parentTag <<
    content = content.replace(
        "<< mutation.parentShadowView.tag <<",
        "<< mutation.parentTag <<"
    )

    # 9. auto parentView = std::make_shared<ShadowView>(mutation.parentShadowView);
    # ->
    # auto parentView = std::make_shared<ShadowView>();
    # parentView->tag = mutation.parentTag;
    content = content.replace(
        "auto parentView = std::make_shared<ShadowView>(mutation.parentShadowView);",
        "auto parentView = std::make_shared<ShadowView>();\n  parentView->tag = mutation.parentTag;"
    )

    # 10. auto parent = std::make_shared<ShadowView>(mutation.parentShadowView);
    # ->
    # auto parent = std::make_shared<ShadowView>();
    # parent->tag = mutation.parentTag;
    content = content.replace(
        "auto parent = std::make_shared<ShadowView>(mutation.parentShadowView);",
        "auto parent = std::make_shared<ShadowView>();\n  parent->tag = mutation.parentTag;"
    )

    # 11. updateWindow dimension using child frame instead of parent
    old_update_block = """  if (mutation.parentShadowView.tag == surfaceId) {
    surfaceManager.updateWindow(
        surfaceId,
        mutation.parentShadowView.layoutMetrics.frame.size.width,
        mutation.parentShadowView.layoutMetrics.frame.size.height);
  }"""

    new_update_block = """  if (mutation.parentTag == surfaceId) {
    auto childFrame = mutation.type == ShadowViewMutation::Type::Remove
        ? mutation.oldChildShadowView.layoutMetrics.frame
        : mutation.newChildShadowView.layoutMetrics.frame;
    surfaceManager.updateWindow(
        surfaceId,
        childFrame.size.width,
        childFrame.size.height);
  }"""

    content = content.replace(old_update_block, new_update_block)

    with open(proxy_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched LayoutAnimationsProxy.cpp!")

if __name__ == "__main__":
    patch_reanimated()
