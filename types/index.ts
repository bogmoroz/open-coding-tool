import {
  Source as PrismaSource,
  Coding as PrismaCoding,
  Code as PrismaCode
} from '@prisma/client';

export interface Code extends PrismaCode {
  codings: Coding[];
  parent?: Code;
  children?: Code[];
}

export interface Coding extends PrismaCoding {
  code: Code;
  source: ISource;
}

export interface ISource extends PrismaSource {
  codings?: Coding[];
}
