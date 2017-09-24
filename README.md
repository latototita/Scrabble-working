# Scrabble
A two-player online Scrabble clone written with JavaScript and Python in Node. Intended as a way to learn JavaScript.  

<img width="709" alt="screen shot 2017-09-24 at 2 39 27 pm" src="https://user-images.githubusercontent.com/22259451/30785555-44baff0e-a136-11e7-8afb-d7f2008dad6a.png">

Client connection is powered by MongoDB and Socket.io. Users can connect to someone's game, provided they have the target game's unique ID.

There is an algorithm for determining the best possible word for the current turn, implemented in Python. Currently it is bottlenecked by the module handling the python and node interaction. That said, further optimizations will be implemented, including tries and memoization.
