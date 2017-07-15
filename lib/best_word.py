import sys, os, json
from itertools import takewhile, dropwhile, filterfalse


# Constants-----
SPACE = ' '
#---------------

def getPermutations(word):
  def recurse(word, perms, retPerm = []):
    if not word:
      toAdd = ""
      for char in retPerm:
        toAdd += char
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


def hasCharacter(word):
  for char in word[3:]:
    if char is not SPACE:
      return True
  return False


def isConnected(line):
  charCount = 0
  for char in line:
    if char is not SPACE:
      charCount += 1 
  removedLeadingSpaces = [i for i in dropwhile(lambda x: x is SPACE, line)]
  charString = [x for x in takewhile(lambda x: x is not SPACE, removedLeadingSpaces)]
  if charCount is not len(charString):
    return False
  return True


# Yield (start, list[start:end])
def subLists(length, line):
  start = 0
  end = 0
  spaceCount = 0
  
  while spaceCount is not length and end < len(line):
    if line[end] is SPACE:
      spaceCount += 1
    end += 1
  
  while line[end] is SPACE:
    start += 1
    end += 1
  
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


sys.argv[:] = [word for word in sys.argv if hasCharacter(word)]
sys.argv = sys.argv[1:] #Gets rid of unnecessary first arg
trayTiles = sys.argv[0];
allPerms = [getPermutations(x) for x in powerSet(trayTiles)] 
allPerms = [perm for sets in allPerms for perm in sets]

for word in sys.argv:
  chars = list(word)
  # Permute line

for i in range(len(sys.argv)):
  if i is 0: 
    continue

  print(sys.argv[i])

sys.exit(0);