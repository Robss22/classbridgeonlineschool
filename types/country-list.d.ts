declare module 'country-list' {
  export function getNames(): string[];
  export function getCode(name: string): string | undefined;
  export function getName(code: string): string | undefined;
  export function getData(): Array<{ code: string; name: string }>;
}
