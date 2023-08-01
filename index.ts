/* eslint-disable no-console */
import fs from 'fs';
import algosdk from 'algosdk';
import response from './response.json';

type FullTrace = {
    teal: string
    pc: number
    scratchDelta?: {[slot: number]: string | number}
    stack: (string | number)[]
}[]

type PytealMapping = {
    [pc: number]: {
      pyteal: string
      line: number
      file: string
    }
}

async function getFullTrace(
  simTrace: any[],
  teal: string,
  algod: algosdk.Algodv2,
): Promise<FullTrace> {
  const result = await algod.compile(teal).sourcemap(true).do();

  const srcMap = new algosdk.SourceMap(result.sourcemap);

  let stack: (string | number)[] = [];

  const fullTrace: FullTrace = [];

  simTrace.forEach((t) => {
    let newStack: (string | number)[] = [...stack];

    if (t['stack-pop-count']) {
      newStack = newStack.slice(0, -t['stack-pop-count']);
    }

    t['stack-additions']?.forEach((s: any) => {
      if (s.bytes) {
        newStack.push(`0x${Buffer.from(s.bytes, 'base64').toString('hex')}`);
      } else newStack.push(s.uint || 0);
    });

    const scratchDelta = t['scratch-changes']?.map((s) => {
      const delta = {};

      const value = s['new-value'];

      if (s.bytes) {
        delta[s.slot] = `0x${Buffer.from(value.bytes, 'base64').toString('hex')}`;
      } else delta[s.slot] = value.uint || 0;

      return delta;
    });

    fullTrace.push({
      teal: teal.split('\n')[srcMap.pcToLine[t.pc as number]],
      pc: t.pc,
      stack: newStack,
      scratchDelta,
    });

    stack = newStack;
  });

  return fullTrace;
}

function adjustWidth(line: string, width: number) {
  if (line.length > width) {
    return `${line.slice(0, width - 3)}...`;
  } if (line.length < width) {
    return line.padEnd(width);
  } return line;
}

function printFullTrace(fullTrace: FullTrace, width: number = 30) {
  console.log(`${'TEAL'.padEnd(width)} | PC   | STACK`);
  console.log(`${'-'.repeat(width)}-|------|${'-'.repeat(7)}`);
  fullTrace.forEach((t) => {
    const teal = adjustWidth(t.teal.trim(), width);
    const pc = t.pc.toString().padEnd(4);
    console.log(`${teal} | ${pc} | [${t.stack}]`);
  });
}

function printFullPyTealTrace(
  fullTrace: FullTrace,
  pytealMapping: PytealMapping,
  tealWidth: number = 15,
  pytealWidth: number = 40,
) {
  console.log(`${'TEAL'.padEnd(tealWidth)} | PC   | ${'FILE'.padEnd(10)} | LINE | ${'PyTeal'.padEnd(pytealWidth)} | STACK`);
  console.log(`${'-'.repeat(tealWidth)}-|------|-${'-'.repeat(10)}-|------|-${'-'.repeat(pytealWidth)}-|${'-'.repeat(7)}`);
  fullTrace.forEach((t) => {
    const teal = adjustWidth(t.teal.trim(), tealWidth);
    const pyteal = adjustWidth(pytealMapping[t.pc]?.pyteal || '', pytealWidth);
    const pc = t.pc.toString().padEnd(4);
    const file = adjustWidth(pytealMapping[t.pc]?.file || '', 10);
    const line = (pytealMapping[t.pc]?.line || '').toString().padEnd(4);

    console.log(`${teal} | ${pc} | ${file} | ${line} | ${pyteal} | [${t.stack}]`);
  });
}

function getPcToPyteal(annotatedTeal: string) {
  const annotatedTealLines = annotatedTeal.toString().split('\n');
  const annotationStart = annotatedTealLines[0].indexOf('//    PC');
  const pytealPathStart = annotatedTealLines[0].indexOf('PYTEAL PATH');
  const pytealLineStart = annotatedTealLines[0].indexOf('LINE');
  const pytealStart = annotatedTealLines[0].match(/PYTEAL$/)!.index;

  const mapping: PytealMapping = {};
  let lastFile = '';
  annotatedTealLines.slice(1).forEach((line) => {
    const annotation = line.slice(annotationStart);
    if (annotation.slice(2) === '') return;

    const pcStr = line.slice(annotationStart + 2, pytealPathStart).trim();

    if (pcStr === '') return;

    const pc = Number(pcStr.slice(1, -1));

    let file = line.slice(pytealPathStart, pytealLineStart).trim();
    if (file === '') {
      file = lastFile;
    } else {
      lastFile = file;
    }

    const lineNumber = Number(line.slice(pytealLineStart, pytealStart).trim());

    const pyteal = line.slice(pytealStart).trim();
    mapping[pc] = {
      pyteal,
      file,
      line: lineNumber,
    };
  });

  return mapping;
}

async function main() {
  const trace = response['txn-groups'][0]['txn-results'][0]['exec-trace']['approval-program-trace'];
  const teal = fs.readFileSync('approval.teal', 'utf8');

  const algodClient = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
  const fullTrace = await getFullTrace(trace, teal, algodClient);
  printFullTrace(fullTrace);

  const pytealMapping = getPcToPyteal(fs.readFileSync('./approval.teal').toString());

  printFullPyTealTrace(fullTrace, pytealMapping);
}

main();
