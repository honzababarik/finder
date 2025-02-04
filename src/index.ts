import * as cssesc from 'cssesc'

type Node = {
  name: string
  penalty: number
  level?: number
}

type Path = Node[]

enum Limit {
  All,
  Two,
  One,
}

export type Options = {
  root: Element
  idName: (name: string, input: Element, index: number) => boolean
  className: (name: string, input: Element, index: number) => boolean
  tagName: (name: string, input: Element, index: number) => boolean
  attr: (name: string, value: string, input: Element, index: number) => boolean,
  seedMinLength: number
  optimizedMinLength: number
  threshold: number,
  priorityList: String[],
  penalties: any,
}

let config: Options
let rootDocument: Document | Element
let fnNameToPriorityName = {
  'id': id,
  'attr': attr,
  'className': classNames,
  'tagName': tagName,
  'any': any,
}

export default function (input: Element, options?: Partial<Options>) {
  if (input.nodeType !== Node.ELEMENT_NODE) {
    throw new Error(`Can't generate CSS selector for non-element node type.`)
  }

  if ('html' === input.tagName.toLowerCase()) {
    return 'html'
  }

  const defaults: Options = {
    root: document.body,
    idName: (name: string, input: Element, index: number) => true,
    className: (name: string, input: Element, index: number) => true,
    tagName: (name: string, input: Element, index: number) => true,
    attr: (name: string, value: string, input: Element, index: number) => false,
    seedMinLength: 1,
    optimizedMinLength: 2,
    threshold: 1000,
    priorityList: ['id', 'attr', 'className', 'tagName'],
    penalties: {
      id: 0,
      attr: 0.5,
      className: 1,
      tagName: 2,
      any: 3
    }
  }

  config = {...defaults, ...options}

  rootDocument = findRootDocument(config.root, defaults)

  let path =
    bottomUpSearch(input, Limit.All, () =>
      bottomUpSearch(input, Limit.Two, () =>
        bottomUpSearch(input, Limit.One)))

  if (path) {
    const optimized = sort(optimize(path, input))

    if (optimized.length > 0) {
      path = optimized[0]
    }

    return selector(path)
  } else {
    throw new Error(`Selector was not found.`)
  }
}

function findRootDocument(rootNode: Element | Document, defaults: Options) {
  if (rootNode.nodeType === Node.DOCUMENT_NODE) {
    return rootNode
  }
  if (rootNode === defaults.root) {
    return rootNode.ownerDocument as Document
  }
  return rootNode
}

function getNodeLevel(input: Element, index: number): Node[] {
  let fnName;
  let result;
  let filteredResult;
  for (let i = 0; i < config.priorityList.length; i++) {
    fnName = config.priorityList[i];
    result = fnNameToPriorityName[fnName](input, index);
    filteredResult = fnName === 'id' || fnName === 'tagName' ? maybe(result) : maybe(...result);
    if (filteredResult) {
      return filteredResult;
    }
  }
  return [any()];
}

function bottomUpSearch(input: Element, limit: Limit, fallback?: () => Path | null): Path | null {
  let path: Path | null = null
  let stack: Node[][] = []
  let current: Element | null = input
  let i = 0

  while (current && current !== config.root.parentElement) {
    let level: Node[] = getNodeLevel(current, i);

    const nth = index(current)

    if (limit === Limit.All) {
      if (nth) {
        level = level.concat(level.filter(dispensableNth).map(node => nthChild(node, nth)))
      }
    } else if (limit === Limit.Two) {
      level = level.slice(0, 1)

      if (nth) {
        level = level.concat(level.filter(dispensableNth).map(node => nthChild(node, nth)))
      }
    } else if (limit === Limit.One) {
      const [node] = level = level.slice(0, 1)

      if (nth && dispensableNth(node)) {
        level = [nthChild(node, nth)]
      }
    }

    for (let node of level) {
      node.level = i
    }

    stack.push(level)

    if (stack.length >= config.seedMinLength) {
      path = findUniquePath(stack, fallback)
      if (path) {
        break
      }
    }

    current = current.parentElement
    i++
  }

  if (!path) {
    path = findUniquePath(stack, fallback)
  }

  return path
}

function findUniquePath(stack: Node[][], fallback?: () => Path | null): Path | null {
  const paths = sort(combinations(stack))

  if (paths.length > config.threshold) {
    return fallback ? fallback() : null
  }

  for (let candidate of paths) {
    if (unique(candidate)) {
      return candidate
    }
  }

  return null
}

function selector(path: Path): string {
  let node = path[0]
  let query = node.name
  for (let i = 1; i < path.length; i++) {
    const level = path[i].level || 0

    if (node.level === level - 1) {
      query = `${path[i].name} > ${query}`
    } else {
      query = `${path[i].name} ${query}`
    }

    node = path[i]
  }
  return query
}

function penalty(path: Path): number {
  return path.map(node => node.penalty).reduce((acc, i) => acc + i, 0)
}

function unique(path: Path) {
  switch (rootDocument.querySelectorAll(selector(path)).length) {
    case 0:
      throw new Error(`Can't select any node with this selector: ${selector(path)}`)
    case 1:
      return true
    default:
      return false
  }
}

function id(input: Element, index: number): Node | null {
  const elementId = input.getAttribute('id')
  if (elementId && config.idName(elementId, input, index)) {
    return {
      name: '#' + cssesc(elementId, {isIdentifier: true}),
      penalty: config.penalties.id
    }
  }
  return null
}

function attr(input: Element, index: number): Node[] {
  const attrs = Array.from(input.attributes).filter((attr) => config.attr(attr.name, attr.value, input, index))

  return attrs.map((attr): Node => ({
    name: '[' + cssesc(attr.name, {isIdentifier: true}) + '="' + cssesc(attr.value) + '"]',
    penalty: config.penalties.attr
  }))
}

function classNames(input: Element, index: number): Node[] {
  const names = Array.from(input.classList)
    .filter(name => config.className(name, input, index))

  return names.map((name): Node => ({
    name: '.' + cssesc(name, {isIdentifier: true}),
    penalty: config.penalties.className
  }))
}

function tagName(input: Element, index: number): Node | null {
  const name = input.tagName.toLowerCase()
  if (config.tagName(name, input, index)) {
    return {
      name,
      penalty: config.penalties.tagName
    }
  }
  return null
}

function any(): Node {
  return {
    name: '*',
    penalty: config.penalties.any
  }
}

function index(input: Element): number | null {
  const parent = input.parentNode
  if (!parent) {
    return null
  }

  let child = parent.firstChild
  if (!child) {
    return null
  }

  let i = 0
  while (child) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      i++
    }

    if (child === input) {
      break
    }

    child = child.nextSibling
  }

  return i
}

function nthChild(node: Node, i: number): Node {
  return {
    name: node.name + `:nth-child(${i})`,
    penalty: node.penalty + 1
  }
}

function dispensableNth(node: Node) {
  return node.name !== 'html' && !node.name.startsWith('#')
}

function maybe(...level: (Node | null)[]): Node[] | null {
  const list = level.filter(notEmpty)
  if (list.length > 0) {
    return list
  }
  return null
}

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

function* combinations(stack: Node[][], path: Node[] = []) {
  if (stack.length > 0) {
    for (let node of stack[0]) {
      yield* combinations(stack.slice(1, stack.length), path.concat(node))
    }
  } else {
    yield path
  }
}

function sort(paths: Iterable<Path>): Path[] {
  return Array.from(paths).sort((a, b) => penalty(a) - penalty(b))
}

function* optimize(path: Path, input: Element) {
  if (path.length > 2 && path.length > config.optimizedMinLength) {
    for (let i = 1; i < path.length - 1; i++) {
      const newPath = [...path]
      newPath.splice(i, 1)

      if (unique(newPath) && same(newPath, input)) {
        yield newPath
        yield* optimize(newPath, input)
      }
    }
  }
}

function same(path: Path, input: Element) {
  return rootDocument.querySelector(selector(path)) === input
}
