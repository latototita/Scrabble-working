import sys
import os

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

a = getPermutations('abc')
print(a)

sys.exit(0);