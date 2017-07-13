import sys, os, json

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
    if char is not ' ':
      return True
  return False


sys.argv[:] = [word for word in sys.argv if hasCharacter(word)]

for i in range(len(sys.argv)):
  if i is 0: 
    continue

  print(sys.argv[i])

sys.exit(0);