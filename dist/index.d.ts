export declare type Options = {
    root: Element;
    idName: (name: string, input: Element, index: number) => boolean;
    className: (name: string, input: Element, index: number) => boolean;
    tagName: (name: string, input: Element, index: number) => boolean;
    attr: (name: string, value: string, input: Element, index: number) => boolean;
    seedMinLength: number;
    optimizedMinLength: number;
    threshold: number;
    priorityList: String[];
    penalties: any;
};
export default function (input: Element, options?: Partial<Options>): string;
