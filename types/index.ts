import {
  Source as PrismaSource,
  Coding as PrismaCoding,
  Code
} from '@prisma/client';

export interface Coding extends PrismaCoding {
  code: Code;
  source: Source;
}

export interface Source extends PrismaSource {
  codings: Coding[];
}
