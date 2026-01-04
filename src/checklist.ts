import { App, ListItemCache } from 'obsidian';

export interface ListItemNode {
  item: ListItemCache;
  line: number;
  task: string | undefined;
  childrenTable: Map<string, ListItemNode>;
}

export class ChecklistAnalyzer {
  constructor(private app: App) {}

  getListItemsInRange(startLine?: number, endLine?: number): ListItemCache[] {
    const currentFile = this.app.workspace.getActiveFile();

    const fileCache = currentFile
      ? this.app.metadataCache.getFileCache(currentFile)
      : null;

    const listItems = fileCache?.listItems;

    const itemsInRange = listItems?.filter((li) => {
      const line = li.position.start.line;
      return this.isNumberInRange(line, startLine, endLine);
    });

    return itemsInRange ?? [];
  }

  getCompletionRate(itemsInRange: ListItemCache[]): number {
    const listItemTable = this.getListItemTable(itemsInRange);
    const topLevelTotal = listItemTable.size;

    if (topLevelTotal === 0) {
      return 0;
    }

    const topLevelSum = [...listItemTable.values()].reduce(
      (sum, node) => sum + this.calcCompletion(node),
      0
    );

    return topLevelSum / topLevelTotal;
  }

  private isNumberInRange(
    target: number,
    start?: number,
    end?: number
  ): boolean {
    const afterStart = start === undefined || target >= start;
    const beforeEnd = end === undefined || target < end;
    return afterStart && beforeEnd;
  }

  private getListItemTable(
    listItems: ListItemCache[]
  ): Map<string, ListItemNode> {
    const rootItemNodeTable = new Map<string, ListItemNode>();
    const allItemNodeTable = new Map<string, ListItemNode>();

    for (const item of listItems) {
      const line = item.position.start.line;

      const parent = item.parent;

      const node: ListItemNode = {
        item,
        line,
        task: item.task,
        childrenTable: new Map<string, ListItemNode>(),
      };

      const parentIsRoot =
        allItemNodeTable.get(parent.toString()) === undefined;

      if (parentIsRoot) {
        const newRootNode: ListItemNode = {
          item,
          line,
          task: undefined,
          childrenTable: new Map<string, ListItemNode>(),
        };

        rootItemNodeTable.set(parent.toString(), newRootNode);
        allItemNodeTable.set(parent.toString(), newRootNode);
      }

      allItemNodeTable
        .get(parent.toString())
        ?.childrenTable.set(line.toString(), node);
      allItemNodeTable.set(line.toString(), node);
    }

    return rootItemNodeTable;
  }

  private calcCompletion(node: ListItemNode): number {
    const total = node.childrenTable.size;
    if (total === 0) {
      return node.task === 'x' ? 1 : 0;
    }

    const sum = [...node.childrenTable.values()].reduce(
      (sum, child) => sum + this.calcCompletion(child),
      0
    );
    return sum / total;
  }
}
