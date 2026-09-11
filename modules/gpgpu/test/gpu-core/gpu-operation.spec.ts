// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {GPUCompositeOperation, type GPUOperation} from '../../src/gpu-core/gpu-operation';

function operation(id: string): GPUOperation {
  return {id,type:'test',addToGraph:()=>{}};
}

describe('GPU operation IR',()=>{
  it('preserves composite semantic hierarchy',()=>{
    const composite=new GPUCompositeOperation({id:'iteration',operations:[operation('spmv'),operation('dot')]});
    expect(composite.id).toBe('iteration');
    expect(composite.type).toBe('composite');
    expect(composite.operations.map(child=>(child as GPUOperation).id)).toEqual(['spmv','dot']);
  });

  it('supports shorthand composite construction',()=>{
    const composite=new GPUCompositeOperation([operation('a'),operation('b')]);
    expect(composite.operations).toHaveLength(2);
  });
});
