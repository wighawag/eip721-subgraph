## First step, have a ethereum node running
ensure you have ganache running on 8545
```
ganache-cli -h 0.0.0.0
```

## then ensure you have a graph node running
setup a graph-node
```
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
docker-compose up
```

## finally setup your subgraph 

make sure you are in the subgraph repo folder, then
```
yarn
```

and deploy contracts
```
yarn deploy-test-contracts
```

then generate code for graph
```
yarn codegen-graph
```

create graph
```
yarn create-local-graph
```

deploy graph
```
yarn deploy-local-graph
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
