import sys
import json
import struct

FILES = ['surf_reg_model_both_inflate_high.json',
         'surf_reg_model_both_inflate_middle.json',
         'surf_reg_model_both_inflate_low.json',
         'surf_reg_model_both_normal.json']

def bin():
  for name in FILES:
    with open(name, 'r') as f:
      obj = json.loads(f.read())

      with open(name + '.bin', 'w') as f:
        ncomp = len(obj[0])
        
        dat = struct.pack('f', float(ncomp))
        f.write(dat)
        
        for vertex in obj[0]:
          f.write(struct.pack('f', float(vertex)))

        for normal in obj[1]:
          f.write(struct.pack('f', float(normal)))

        for index in obj[2]:
          f.write(struct.pack('I', int(index)))


if __name__ == '__main__':
  bin()
