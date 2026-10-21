/** The element that actually scrolls the page, also through HA's shadow DOM. */
export function scrollParent(el: Element): Element {
  let node: Node | null = el.parentNode;
  while (node) {
    if (node instanceof ShadowRoot) {
      node = node.host;
      continue;
    }
    if (node instanceof Element) {
      const { overflowY } = getComputedStyle(node);
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    }
    node = node.parentNode;
  }
  return document.scrollingElement ?? document.documentElement;
}
