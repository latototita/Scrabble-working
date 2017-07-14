import sys, os, json
from itertools import takewhile, dropwhile


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