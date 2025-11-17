export interface Point {
  node: Node;
  offset: number;
}

export interface SelectionRange {
  startNode: Node;
  startOffset: number;
  endNode: Node;
  endOffset: number;
}