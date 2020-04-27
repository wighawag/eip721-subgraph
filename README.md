## Install

```
yarn add eip721-subgraph
```

## use

it provide you with a npm scripts "eip721-subgraph" that embed graph-cli


Assuming you have a graph-node running locally you can use it as follow :

### to create graph
localhost example:
```
eip721-subgraph create test/subgraphName --node http://127.0.0.1:8020
```

### to deploy graph
localhost example:
```
eip721-subgraph deploy test/subgraphName --ipfs http://localhost:5001 --node http://127.0.0.1:8020
```

## example graphQL query
```
{
  eip721Tokens {
    contractAddress
    tokenID
    owner
    tokenURI
  }
}
```


or

```
{
  eip721Tokens(orderBy: mintTime) {
    contractAddress
    tokenID
    owner
    tokenURI
    mintTime
  }
  
  contracts {
    id
  }
}
```
