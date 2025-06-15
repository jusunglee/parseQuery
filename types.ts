export type Book = {
  title: string;
  author: string;
  year: number;
};

export interface Logger {
  info: LoggerMethod;
  debug: LoggerMethod;
}
type LoggerMethod = {
  (message: string, ...meta: any[]): Logger;
  (message: any): Logger;
  (infoObject: object): Logger;
};
