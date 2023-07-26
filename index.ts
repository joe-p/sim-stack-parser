import fs from 'fs';
import algosdk from 'algosdk';
import response from './response.json';

type FullTrace = {
    teal: string
    pc: number
    scratchDelta?: {[slot: number]: string | number}
    stack: (string | number)[]
}[]

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
  fullTrace.forEach((t) => {
    const teal = adjustWidth(t.teal.trim(), width);
    const pc = t.pc.toString().padEnd(4);
    console.log(`${teal} | ${pc} | [${t.stack}]`);
  });
}

async function main() {
  const trace = response['txn-groups'][0]['txn-results'][0]['exec-trace']['approval-program-trace'];
  const teal = fs.readFileSync('approval.teal', 'utf8');

  const algodClient = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
  const fullTrace = await getFullTrace(trace, teal, algodClient);
  printFullTrace(fullTrace);
}

main();
