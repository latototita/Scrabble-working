import sys, os, json
from itertools import filterfalse, takewhile, dropwhile

SPACE = ' '
NUM_TRAY_TILES = 7
print("TEST")


dictionairy = set()
with open("lib/word-list.txt", mode='r') as wordList:
  for word in wordList:
    dictionairy.add(word[:-1])

def isWord(word):
  if word in dictionairy:
    return True

def hasCharacter(word):
  for char in word[3:]:
    if char is not SPACE:
      return True
  return False

def getPermutations(word):
  def recurse(word, perms, retPerm = []):
    if not word:
      toAdd = ''.join(char for char in retPerm)
      if toAdd is not '':
        perms.add(toAdd)
    for i in range(len(word)):
      retPerm += word[i]
      recurse(word[:i] + word[i+1:], perms)
      retPerm.pop()
  perms = set()  
  recurse(word, perms)
  return perms
   

def powerSet(word):
  ans = set()
  if (len(word) == 0):
    ans.add("")
  else:
    char = word[0]
    rest = word[1:]
    psetRest = powerSet(rest)
    ans = set(x + char for x in psetRest)
    return ans.union(psetRest)
  return ans


def subLists(length, lines):
  for line in lines:
    line = list(line)[3:]

    start = 0
    end = -1
    spaceCount = 0
    firstCharReached = False
    while spaceCount is not length and end < len(line) - 1:
      end += 1
      if line[end] is SPACE:
        spaceCount += 1
      else:
        firstCharReached = True
      
    while not firstCharReached:
      end += 1
      if (line[end] is not SPACE):
        firstCharReached = True
      else:
        start += 1

    while end < len(line) - 1 and line[end + 1] is not SPACE:
      end += 1
    
    if spaceCount is length:
      yield line[start:end + 1]
      end += 1
      while end < len(line):
        while end < len(line) - 1 and line[end + 1] is not SPACE:
          end += 1
        if line[start] is SPACE:
          start += 1
        else:
          while line[start] is not SPACE:
            start += 1
          start += 1
        noSpaces = [i for i in filterfalse(lambda x: x is SPACE, line[start:end + 1])]
        if len(noSpaces) is not 0:
          yield line[start:end + 1]
        end += 1

def mergedLines(permutations, lines):
  for perm in permutations:
    for sliced in subLists(len(perm), lines):
      index = 0
      for i in range(len(sliced)):
        if sliced[i] is SPACE:
          sliced[i] = perm[index]
          index += 1
      word = ''.join(char for char in sliced)
      if isWord(word.lower()):
        yield word


sys.argv[:] = [word for word in sys.argv if hasCharacter(word)]
# First element in sys.argv is junk
trayTiles = sys.argv[1];
allPerms = (getPermutations(x) for x in powerSet(trayTiles))
allPerms = (perm for sets in allPerms for perm in sets)

for line in mergedLines(allPerms, sys.argv[2:]):
  print (line)


sys.exit(0);
